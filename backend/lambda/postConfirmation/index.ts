import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { v4 as uuid } from "uuid";

const client = new DynamoDBClient({});

export const handler = async (event: any) => {
  const { request } = event;
  const address = request.userAttributes["custom:address"];
  const phone = request.userAttributes["custom:phone"];
  const company = request.userAttributes["custom:company"];
  const name = request.userAttributes["custom:name"];

  const email = request.userAttributes.email;

  await client.send(
    new PutItemCommand({
      TableName: process.env.USER_TABLE_NAME!,
      Item: {
        userId: { S: uuid() },
        name: { S: name ?? "" },
        email: { S: email ?? "" },
        address: { S: address ?? "" },
        phone: { S: phone ?? "" },
        company: { S: company ?? "" },
        role: { S: "admin" },
        createdAt: { S: new Date().toISOString() },
      },
    })
  );

  return event;
};
