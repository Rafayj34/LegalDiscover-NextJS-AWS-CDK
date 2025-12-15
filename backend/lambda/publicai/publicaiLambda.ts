import OpenAI from "openai";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import {
  DynamoDBClient,
  PutItemCommand,
  QueryCommand,
  DeleteItemCommand,
} from "@aws-sdk/client-dynamodb";
import { v4 as uuid } from "uuid";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import lambdaResponse from "../../utils/response";
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
    console.log("OpenAI API key retrieved from Secrets Manager:", res.SecretString);

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

/**
 * Get all conversations/messages for a specific user
 * Uses the base table with tenantId (PK) and userId (SK with begins_with)
 */
async function getUserConversations(
  tenantId: string,
  userId: string
): Promise<
  Array<{
    messageId: string;
    conversationId: string;
    role: string;
    content: string;
    timestamp: string;
  }>
> {
  try {
    const result = await dynamoClient.send(
      new QueryCommand({
        TableName: conversationsTableName,
        KeyConditionExpression:
          "tenantId = :tenantId AND begins_with(userId, :userId)",
        ExpressionAttributeValues: {
          ":tenantId": { S: tenantId },
          ":userId": { S: userId },
        },
        ScanIndexForward: false, // Sort by timestamp descending (newest first)
      })
    );

    if (!result.Items || result.Items.length === 0) {
      return [];
    }

    // Convert DynamoDB items to message format
    const messages = result.Items.map((item) => {
      const unmarshalled = unmarshall(item);
      return {
        messageId: unmarshalled.messageId,
        conversationId: unmarshalled.conversationId,
        role: unmarshalled.role,
        content: unmarshalled.content,
        timestamp: unmarshalled.timestamp,
      };
    });

    // Sort by timestamp descending (newest first)
    messages.sort((a, b) => {
      const timeA = new Date(a.timestamp || 0).getTime();
      const timeB = new Date(b.timestamp || 0).getTime();
      return timeB - timeA;
    });

    return messages;
  } catch (error) {
    console.error("Error fetching user conversations:", error);
    return [];
  }
}

async function saveMessage(
  tenantId: string,
  userId: string,
  conversationId: string,
  messageId: string,
  role: "user" | "assistant",
  content: string
): Promise<void> {
  try {
    // Use composite sort key: userId#messageId to allow multiple messages per user
    const compositeUserId = `${userId}#${messageId}`;
    
    await dynamoClient.send(
      new PutItemCommand({
        TableName: conversationsTableName,
        Item: marshall({
          tenantId,
          userId: compositeUserId, // Composite key: userId#messageId
          messageId, // Keep as attribute for reference
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

/**
 * Delete a message from the database (for rollback on errors)
 */
async function deleteMessage(
  tenantId: string,
  userId: string,
  messageId: string
): Promise<void> {
  try {
    const compositeUserId = `${userId}#${messageId}`;
    await dynamoClient.send(
      new DeleteItemCommand({
        TableName: conversationsTableName,
        Key: marshall({
          tenantId,
          userId: compositeUserId,
        }),
      })
    );
    console.log("Message deleted (rollback):", { tenantId, userId, messageId });
  } catch (error) {
    console.error("Error deleting message during rollback:", error);
    // Don't throw - we're already in an error state
  }
}

export async function handler(event: any) {
  try {
    console.log("Event received:", JSON.stringify(event, null, 2));

    // Extract tenantId from path parameters (REST API) or event (WebSocket)
    const tenantId = event.pathParameters?.tenantId;
    if (!tenantId) {
      return lambdaResponse(400, { error: "tenantId is required in path" });
    }

    const httpMethod =
      event.httpMethod || event.requestContext?.http?.method || "POST";

    // --------------------------- GET: Fetch conversation history for user ---------------------------
    if (httpMethod === "GET") {
      const userId =
        event.queryStringParameters?.userId || event.pathParameters?.userId;

      if (!userId) {
        return lambdaResponse(400, { error: "userId is required" });
      }

      const messages = await getUserConversations(tenantId, userId);

      return lambdaResponse(200, {
        tenantId,
        userId,
        items: messages,
      });
    }

    // --------------------------- POST: Send message to Public AI ---------------------------

    const openAiApiKey = await getOpenAiKey();
    const client = new OpenAI({
      apiKey: openAiApiKey,
    });

    let body;
    if (typeof event.body === "string") {
      body = JSON.parse(event.body);
    } else {
      body = event.body || {};
    }

    console.log("Parsed body:", body);

    const message = body.message;
    const userId = body.userId;

    if (!message) {
      return lambdaResponse(400, { error: "Message is required" });
    }

    if (!userId) {
      return lambdaResponse(400, { error: "userId is required" });
    }

    // Get or create conversationId
    const conversationId = body.conversationId || uuid();
    const userMessageId = uuid();

    // Save user message to database
    await saveMessage(
      tenantId,
      userId,
      conversationId,
      userMessageId,
      "user",
      message
    );

    try {
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

      if (!assistantReply) {
        throw new Error("OpenAI returned an empty response");
      }

      const assistantMessageId = uuid();

      // Save assistant response to database
      await saveMessage(
        tenantId,
        userId,
        conversationId,
        assistantMessageId,
        "assistant",
        assistantReply
      );

      console.log("OpenAI response saved to database");

      // Build a rich message object suitable for chat UIs
      const assistantTimestamp = new Date().toISOString();

      return lambdaResponse(200, {
        messageId: assistantMessageId,
        conversationId,
        role: "assistant" as const,
        content: assistantReply,
        timestamp: assistantTimestamp,
        userId,
        tenantId,
      });
    } catch (openAiError) {
      // Rollback: Delete the user message if OpenAI fails
      console.error(
        "OpenAI error occurred, rolling back user message:",
        openAiError
      );
      await deleteMessage(tenantId, userId, userMessageId);

      // Re-throw the error to be handled by outer catch block
      throw openAiError;
    }
  } catch (error) {
    console.error("Error in Public AI Lambda:", error);
    return lambdaResponse(500, {
      error: "Internal Server Error",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}