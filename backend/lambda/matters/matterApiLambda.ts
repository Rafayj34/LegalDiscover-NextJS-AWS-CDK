import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";
import { v4 as uuid } from "uuid";
import { unmarshall } from "@aws-sdk/util-dynamodb";


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
              matterId: { S: uuid() },
              title: { S: data.title || "" },
              status: { S: data.status },
              clientId: { S: data.clientId },
              clientName: { S: data.clientName },
              caseType: { S: data.caseType },
              priority: { S: data.priority },
              description: { S: data.description || "" },
              assignedAttorney: { S: data.assignedAttorney || "" },
              createdAt: { S: new Date().toISOString() },
              updatedAt: { S: new Date().toISOString() },
            },
          })
        );
      } catch (error) {
        return { statusCode: 500, body: "Could not create matter" };
      }

      return {
        statusCode: 201,
        body: JSON.stringify({ message: "Matter created successfully" }),
      };

    case "GET":
      if (!id) {
        try {
          const result = await client.send(
            new ScanCommand({
              TableName: tableName,
            })
          );
          return {
            statusCode: 200,
            body: JSON.stringify(result.Items?.map(item => unmarshall(item))),
          };
        } catch (error) {
          return { statusCode: 500, body: "Could not retrieve matter" };
        }
      }
      try {
        // 2️⃣ Get item from DynamoDB
        const result = await client.send(
          new GetItemCommand({
            TableName: tableName,
            Key: {
              matterId: { S: id },
            },
          })
        );
        const item = result.Item;
        if (!item) {
          return { statusCode: 404, body: "Matter not found" };
        }
        return {
          statusCode: 200,
          body: JSON.stringify(unmarshall(item)),
        };
      } catch (error) {
        return { statusCode: 500, body: "Could not retrieve matter" };
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
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Matter updated successfully" }),
      };

    case "DELETE":
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Matter deleted successfully" }),
      };

    default:
      return {
        statusCode: 405,
        body: "Method not allowed",
      };
  }
};
