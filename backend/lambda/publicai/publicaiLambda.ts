import OpenAI from "openai";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import {
  DynamoDBClient,
  PutItemCommand,
  QueryCommand,
} from "@aws-sdk/client-dynamodb";
import { v4 as uuid } from "uuid";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

const smClient = new SecretsManagerClient({});
const dynamoClient = new DynamoDBClient({});
const conversationsTableName = process.env.CONVERSATIONS_TABLE_NAME!;

const SYSTEM_PROMPT = `You are a professional legal advisor assistant. Your role is to provide helpful, accurate, and professional legal guidance. 

Important guidelines:
- Only respond to questions related to law, legal matters, regulations, or legal procedures
- If a question is not related to legal matters, politely decline and explain that you can only assist with legal questions
- Always maintain a professional and respectful tone
- Provide clear, well-structured responses
- If you're unsure about specific legal details, recommend consulting with a qualified attorney
- Do not provide specific legal advice that could be construed as attorney-client relationship
- Focus on general legal information and guidance

Remember: You are here to assist with legal inquiries in a professional manner.`;

async function getOpenAiKey(): Promise<string> {
  const secretName = process.env.OPENAI_SECRET_NAME;
  if (!secretName) {
    throw new Error("OPENAI_SECRET_NAME environment variable is not set");
  }

  try {
    const cmd = new GetSecretValueCommand({ SecretId: secretName });
    const res = await smClient.send(cmd);

    if (!res.SecretString) {
      throw new Error("Secret has no SecretString value");
    }

    return res.SecretString as string;
  } catch (error) {
    console.error("Failed to retrieve OpenAI API key from Secrets Manager:", error);
    throw error;
  }
}

async function getConversationHistory(
  tenantId: string,
  conversationId: string
): Promise<Array<{ role: string; content: string }>> {
  try {
    const result = await dynamoClient.send(
      new QueryCommand({
        TableName: conversationsTableName,
        IndexName: "conversationId-index",
        KeyConditionExpression: "tenantId = :tenantId AND conversationId = :conversationId",
        ExpressionAttributeValues: {
          ":tenantId": { S: tenantId },
          ":conversationId": { S: conversationId },
        },
        ScanIndexForward: true, // Sort by timestamp ascending
      })
    );

    if (!result.Items || result.Items.length === 0) {
      return [];
    }

    // Convert DynamoDB items to message format and sort by timestamp
    const messages = result.Items.map((item) => {
      const unmarshalled = unmarshall(item);
      return {
        role: unmarshalled.role,
        content: unmarshalled.content,
        timestamp: unmarshalled.timestamp,
      };
    });

    // Sort by timestamp to ensure chronological order
    messages.sort((a, b) => {
      const timeA = new Date(a.timestamp || 0).getTime();
      const timeB = new Date(b.timestamp || 0).getTime();
      return timeA - timeB;
    });

    // Return only role and content for OpenAI API
    return messages.map(({ role, content }) => ({ role, content }));
  } catch (error) {
    console.error("Error fetching conversation history:", error);
    return [];
  }
}

async function saveMessage(
  tenantId: string,
  conversationId: string,
  messageId: string,
  role: "user" | "assistant",
  content: string
): Promise<void> {
  try {
    await dynamoClient.send(
      new PutItemCommand({
        TableName: conversationsTableName,
        Item: marshall({
          tenantId,
          messageId,
          conversationId,
          role,
          content,
          timestamp: new Date().toISOString(),
        }),
      })
    );
  } catch (error) {
    console.error("Error saving message to database:", error);
    throw error;
  }
}

export async function handler(event: any) {
  try {
    console.log("Event received:", JSON.stringify(event, null, 2));

    // Extract tenantId from path parameters (REST API) or event (WebSocket)
    const tenantId = event.pathParameters?.tenantId;
    if (!tenantId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "tenantId is required in path" }),
      };
    }

    const openAiApiKey = await getOpenAiKey();
    const client = new OpenAI({
      apiKey: openAiApiKey,
    });

    let body;
    if (typeof event.body === "string") {
      body = JSON.parse(event.body);
    } else {
      body = event.body;
    }

    console.log("Parsed body:", body);

    const message = body.message;
    if (!message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Message is required" }),
      };
    }

    // Get or create conversationId
    const conversationId = body.conversationId || uuid();
    const userMessageId = uuid();

    // Save user message to database
    await saveMessage(tenantId, conversationId, userMessageId, "user", message);

    // Fetch conversation history from database
    const conversationHistory = await getConversationHistory(
      tenantId,
      conversationId
    );

    // Build messages array with system prompt and conversation history
    const messages: Array<{ role: string; content: string }> = [
      { role: "system", content: SYSTEM_PROMPT },
      ...conversationHistory,
    ];

    console.log("Sending message to OpenAI with context:", {
      conversationId,
      messageCount: messages.length,
    });

    // Call OpenAI with full conversation context
    const response = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages as any,
    });

    const assistantReply = response.choices[0].message?.content || "";
    const assistantMessageId = uuid();

    // Save assistant response to database
    await saveMessage(
      tenantId,
      conversationId,
      assistantMessageId,
      "assistant",
      assistantReply
    );

    console.log("OpenAI response saved to database");

    return {
      statusCode: 200,
      body: JSON.stringify({
        reply: assistantReply,
        conversationId: conversationId,
      }),
    };
  } catch (error) {
    console.error("Error in Public AI Lambda:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : String(error),
      }),
    };
  }
}