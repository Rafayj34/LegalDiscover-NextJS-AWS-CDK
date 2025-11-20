import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});

export const handler = async (event : any) => {
  const { userName, request } = event;
  
  const email = request.userAttributes.email;

  await client.send(
    new PutItemCommand({
      TableName: process.env.USER_TABLE_NAME!,
      Item: {
        userId: { S: userName },
        email: { S: email },
        role: { S: "admin" },
        createdAt: { S: new Date().toISOString() },
      },
    })
  );

  return event;
};