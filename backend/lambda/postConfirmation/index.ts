import { DynamoDB } from "aws-sdk";

const db = new DynamoDB.DocumentClient();

export const handler = async (event: any) => {
  console.log("PostConfirmation event:", event);

  const { userName, request } = event;

  const email = request.userAttributes.email;

  await db
    .put({
      TableName: process.env.USER_TABLE_NAME!,
      Item: {
        userId: userName,
        email,
        createdAt: new Date().toISOString(),
      },
    })
    .promise();

  return event;
};