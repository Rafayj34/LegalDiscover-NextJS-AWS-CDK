import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";
import { Domain } from "domain";
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
              tenantId: { S: uuid() },
              name: { S: data.name || "" },
              domain: { S: data.domain },
              plan: { S: data.plan },
              status: { S: data.status },
              settings: { S: JSON.stringify(data.settings || {}) },
              billing: { S: JSON.stringify(data.billing || {}) },
              compliance: { S: JSON.stringify(data.compliance || {}) },
              createdAt: { S: new Date().toISOString() },
              updatedAt: { S: new Date().toISOString() },
            },
          })
        );
      } catch (error) {
        return { statusCode: 500, body: "Could not create tenant" };
      }

      return {
        statusCode: 201,
        body: JSON.stringify({ message: "Tenant created successfully" }),
      };

    case "GET":
      try {
        // 2️⃣ Get item from DynamoDB
        const result = await client.send(
          new GetItemCommand({
            TableName: tableName,
            Key: {
              tenantId: { S: id },
            },
          })
        );
        return {
          statusCode: 200,
          body: JSON.stringify(result.Item),
        };
      } catch (error) {
        return { statusCode: 500, body: "Could not retrieve tenant" };
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
            tenantId: { S: id },
            name: { S: updateData.name || "" },
            domain: { S: updateData.domain },
            plan: { S: updateData.plan },
            status: { S: updateData.status },
            settings: { S: JSON.stringify(updateData.settings || {}) },
            billing: { S: JSON.stringify(updateData.billing || {}) },
            compliance: { S: JSON.stringify(updateData.compliance || {}) },
            updatedAt: { S: new Date().toISOString() },
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
