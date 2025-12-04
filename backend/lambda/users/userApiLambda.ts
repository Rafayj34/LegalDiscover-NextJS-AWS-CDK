import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";
import { v4 as uuid } from "uuid";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import lambdaResponse from "../../utils/response";

const client = new DynamoDBClient({});
const tableName = process.env.TABLE_NAME!;

export const handler = async (event: any) => {
  const id = event.pathParameters?.id;
  const tenantId = event.pathParameters?.tenantId;

  if (!tenantId) {
    return lambdaResponse(400, { message: "tenantId is required in path" });
  }

  switch (event.httpMethod) {
    case "POST":
      // 1️⃣ Get the request body
      if (!event.body) {
        return lambdaResponse(400, { message: "Missing request body" });
      }
      let data;
      try {
        data = JSON.parse(event.body); // parse JSON string
      } catch (err) {
        return lambdaResponse(400, { message: "Invalid JSON" });
      }
      try {
        await client.send(
          new PutItemCommand({
            TableName: tableName,
            Item: {
              tenantId: { S: tenantId },
              userId: { S: uuid() },
              name: { S: data.name || "" },
              email: { S: data.email },
              role: { S: data.role },
              createdAt: { S: new Date().toISOString() },
            },
          })
        );
      } catch (error) {
        return lambdaResponse(500, { message: "Could not create user" });
      }
      return lambdaResponse(201, { message: "User created successfully" });

    case "GET":
      try {
        // 2️⃣ Get item from DynamoDB
        const result = await client.send(
          new GetItemCommand({
            TableName: tableName,
            Key: {
              tenantId: { S: tenantId },
              userId: { S: id },
            },
          })
        );
        const item = result.Item;
        if (!item) {
          return { statusCode: 404, body: "User not found" };
        }

        return lambdaResponse(200, unmarshall(item));
      } catch (error) {
        return lambdaResponse(500, { message: "Could not retrieve user" });
      }

    case "PUT":
      //  update logic
      if (!event.body) {
        return lambdaResponse(400, { message: "Missing request body" });
      }
      let updateData;
      try {
        updateData = JSON.parse(event.body); // parse JSON string
      } catch (err) {
        return lambdaResponse(400, { message: "Invalid JSON" });
      }
      // Implement update logic here using UpdateItemCommand
      await client.send(
        new PutItemCommand({
          TableName: tableName,
          Item: {
            tenantId: { S: tenantId },
            userId: { S: id },
            name: { S: updateData.name || "" },
            email: { S: updateData.email },
            role: { S: updateData.role },
            createdAt: { S: new Date().toISOString() },
          },
        })
      );
      return lambdaResponse(200, { message: "User updated successfully" });

    case "DELETE":
      return lambdaResponse(200, { message: "User deleted successfully" });

    default:
      return lambdaResponse(405, { message: "Method not allowed" });
  }
};
