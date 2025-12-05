import OpenAI from "openai";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";


const smClient = new SecretsManagerClient({});

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

export async function handler(event: any) {
  try {
    console.log("Event received:", JSON.stringify(event, null, 2));

    const openAiApiKey = await getOpenAiKey();
    console.log("Successfully retrieved OpenAI API key", openAiApiKey);
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

    console.log("Sending message to OpenAI:", message);

    const response = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [   
        { role: "user", content: message }
      ],
    });

    console.log("OpenAI response:", JSON.stringify(response, null, 2));

    return {
      statusCode: 200,
      body: JSON.stringify({ reply: response.choices[0].message?.content }),
    };
  } catch (error) {
    const key= await getOpenAiKey();

    console.error("Error in Public AI Lambda:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: "Internal Server Error",
        apikey: key,
        details: error instanceof Error ? error.message : String(error)
      }),
    };
  }
}