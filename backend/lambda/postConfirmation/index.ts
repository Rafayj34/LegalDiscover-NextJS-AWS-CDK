import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});

export const handler = async (event: any) => {
  const { request } = event;
  console.log("Post Confirmation Event:", JSON.stringify(event, null, 2));
  const address = request.userAttributes.address;
  const phone = request.userAttributes.phoneNumber;
  const company = request.userAttributes["custom:company"];
  const tenantIdAttr = request.userAttributes["custom:tenantId"];
  const name = request.userAttributes.fullname;
  const email = request.userAttributes.email;
  const userId = request.userAttributes.sub;
  

  await client.send(
    new PutItemCommand({
      TableName: process.env.USER_TABLE_NAME!,
      Item: {
        tenantId: { S: tenantIdAttr || "defaultTenant" },
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
