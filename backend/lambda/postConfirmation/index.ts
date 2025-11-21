import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});

export const handler = async (event: any) => {
  const { userName, request } = event;
  const address = request.userAttributes["custom:address"];
  const phone = request.userAttributes["custom:phone"];
  const company = request.userAttributes["custom:company"];

  const email = request.userAttributes.email;

  await client.send(
    new PutItemCommand({
      TableName: process.env.USER_TABLE_NAME!,
      Item: {
        userId: { S: userName },
        email: { S: email },
        role: { S: "admin" },
        address: { S: address },
        phone: { S: phone },
        company: { S: company },
        createdAt: { S: new Date().toISOString() },
      },
    })
  );

  return event;
};
