import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";
import { v4 as uuid } from "uuid";

const client = new DynamoDBClient({});
const tableName = process.env.TABLE_NAME!;

export const handler = async (event: any) => {
  const id = event.pathParameters?.id;

  switch (event.httpMethod) {
    case "POST":
      // 1️⃣ Get the request body
      if (!event.body) {
        return { statusCode: 400, body: "Missing request body" };
      }
      let data;
      try {
        data = JSON.parse(event.body); // parse JSON string
      } catch (err) {
        return { statusCode: 400, body: "Invalid JSON" };
      }
      try {
        await client.send(
          new PutItemCommand({
            TableName: tableName,
            Item: {
              userId: { S: uuid() },
              name: { S: data.name || "" },
              email: { S: data.email },
              role: { S: data.role },
              createdAt: { S: new Date().toISOString() },
            },
          })
        );
      } catch (error) {
        return { statusCode: 500, body: "Could not create user" };
      }

      return {
        statusCode: 201,
        body: JSON.stringify({ message: "User created successfully" }),
      };

    case "GET":
      try {
        // 2️⃣ Get item from DynamoDB
        const result = await client.send(
          new GetItemCommand({
            TableName: tableName,
            Key: {
              userId: { S: id },
            },
          })
        );
        return {
          statusCode: 200,
          body: JSON.stringify(result.Item),
        };
      } catch (error) {
        return { statusCode: 500, body: "Could not retrieve user" };
      }

    case "PUT":
      //  update logic
      if (!event.body) {
        return { statusCode: 400, body: "Missing request body" };
      }
      let updateData;
      try {
        updateData = JSON.parse(event.body); // parse JSON string
      } catch (err) {
        return { statusCode: 400, body: "Invalid JSON" };
      }
      // Implement update logic here using UpdateItemCommand
      await client.send(
        new PutItemCommand({
          TableName: tableName,
          Item: {
            userId: { S: id },
            name: { S: updateData.name || "" },
            email: { S: updateData.email },
            role: { S: updateData.role },
            createdAt: { S: new Date().toISOString() },
          },
        })
      );
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "User updated successfully" }),
      };

    case "DELETE":
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "User deleted successfully" }),
      };

    default:
      return {
        statusCode: 405,
        body: "Method not allowed",
      };
  }
};
