import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";
import { v4 as uuid } from "uuid";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import lambdaResponse from "../../utils/response";

const client = new DynamoDBClient({});
const tableName = process.env.TABLE_NAME!;

export const handler = async (event: any) => {
  const id = event.pathParameters?.id;

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
              tenantId: { S: "defaultTenant" },
              matterId: { S: uuid() },
              title: { S: data.title || "" },
              status: { S: data.status || "" },
              clientId: { S: data.clientId || "" },
              clientName: { S: data.clientName || "" },
              caseType: { S: data.caseType || "" },
              priority: { S: data.priority || "" },
              description: { S: data.description || "" },
              assignedAttorney: { S: data.assignedAttorney || "" },
              createdAt: { S: new Date().toISOString() },
              updatedAt: { S: new Date().toISOString() },
            },
          })
        );
      } catch (error) {
        return lambdaResponse(500, { message: "Could not create matter" });
      }

      return lambdaResponse(201, { message: "Matter created successfully" });

    case "GET":
      if (!id) {
        try {
          // const result = await client.send(
          //   new ScanCommand({
          //     TableName: tableName,
              
          //   })
          // );
          const result = await client.send(
            new QueryCommand({
              TableName: tableName,
              KeyConditionExpression: "tenantId = :tenantId",
              ExpressionAttributeValues: {
                ":tenantId": { S: "defaultTenant" },
              },
            })
          )
          return lambdaResponse(200, {
            items: result.Items?.map((item) => unmarshall(item)),
          });
        } catch (error) {
          return lambdaResponse(500, { message: "Could not retrieve matter" });
        }
      }
      try {
        // 2️⃣ Get item from DynamoDB
        const result = await client.send(
          new GetItemCommand({
            TableName: tableName,
            Key: {
              tenantId: { S: "defaultTenant" },
              matterId: { S: id }
            },
          })
        );
        const item = result.Item;
        if (!item) {
          return lambdaResponse(404, { message: "Matter not found" });
        }
        return lambdaResponse(200, unmarshall(item));
      } catch (error) {
        return lambdaResponse(500, { message: "Could not retrieve matter" });
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
            tenantId: { S: "defaultTenant" },
            matterId: { S: uuid() },
            title: { S: updateData.title || "" },
            status: { S: updateData.status },
            clientId: { S: updateData.clientId },
            clientName: { S: updateData.clientName },
            caseType: { S: updateData.caseType },
            priority: { S: updateData.priority },
            description: { S: updateData.description || "" },
            assignedAttorney: { S: updateData.assignedAttorney || "" },
            updatedAt: { S: new Date().toISOString() },
          },
        })
      );
      return lambdaResponse(200, { message: "Matter updated successfully" });

    case "DELETE":
      return lambdaResponse(200, { message: "Matter deleted successfully" });

    default:
      return lambdaResponse(405, { message: "Method not allowed" });
  }
};
