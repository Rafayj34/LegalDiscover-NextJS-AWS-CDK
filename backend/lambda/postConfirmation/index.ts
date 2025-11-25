import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { v4 as uuid } from "uuid";
import lambdaResponse from "../../utils/response";

const client = new DynamoDBClient({});

export const handler = async (event: any) => {
  const { request } = event;
  console.log("Post Confirmation Event:", JSON.stringify(event, null, 2));
  const address = request.userAttributes["custom:address"];
  const phone = request.userAttributes["custom:phone"];
  const company = request.userAttributes["custom:company"];
  const name = request.userAttributes["custom:name"];
  const email = request.userAttributes.email;
  const userId = request.userAttributes.sub;
  

  await client.send(
    new PutItemCommand({
      TableName: process.env.USER_TABLE_NAME!,
      Item: {
        tenantId: { S: "defaultTenant" },
        userId: { S: userId },
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
