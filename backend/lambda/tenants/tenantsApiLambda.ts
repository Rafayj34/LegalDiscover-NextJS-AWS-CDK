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
  const tenantId = event.pathParameters?.tenantId;

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
              tenantId: { S: tenantId || uuid() },
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
        return lambdaResponse(500, { message: "Could not create tenant" });
      }

      return lambdaResponse(201, { message: "Tenant created successfully" });

    case "GET":
      try {
        // 2️⃣ Get item from DynamoDB
        const result = await client.send(
          new GetItemCommand({
            TableName: tableName,
            Key: {
              tenantId: { S: tenantId },
            },
          })
        );
        const item = result.Item;
        if (!item) {
          return lambdaResponse(404, { message: "Tenant not found" });
        }
        return lambdaResponse(200, unmarshall(item));
      } catch (error) {
        return lambdaResponse(500, { message: "Could not retrieve tenant" });
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
      return lambdaResponse(200, { message: "Tenant updated successfully" });
   

    case "DELETE":
      return lambdaResponse(200, { message: "Tenant deleted successfully" });

    default:
      return lambdaResponse(405, { message: "Method not allowed" });
  }
};
