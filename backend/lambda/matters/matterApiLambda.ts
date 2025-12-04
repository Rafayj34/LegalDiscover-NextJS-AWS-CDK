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
        const matterId = uuid();
        const createdAt = new Date().toISOString();
        const createdMatter = {
          tenantId,
          matterId,
          title: data.title || "",
          status: data.status || "",
          clientId: data.clientId || "",
          clientName: data.clientName || "",
          caseType: data.caseType || "",
          priority: data.priority || "",
          description: data.description || "",
          assignedAttorney: data.assignedAttorney || "",
          createdAt,
          updatedAt: createdAt,
        };

        await client.send(
          new PutItemCommand({
            TableName: tableName,
            Item: {
              tenantId: { S: tenantId },
              matterId: { S: matterId },
              title: { S: createdMatter.title },
              status: { S: createdMatter.status },
              clientId: { S: createdMatter.clientId },
              clientName: { S: createdMatter.clientName },
              caseType: { S: createdMatter.caseType },
              priority: { S: createdMatter.priority },
              description: { S: createdMatter.description },
              assignedAttorney: { S: createdMatter.assignedAttorney },
              createdAt: { S: createdMatter.createdAt },
              updatedAt: { S: createdMatter.updatedAt },
            },
          })
        );
        return lambdaResponse(201, createdMatter);
      } catch (error) {
        console.error("Error creating matter:", error);
        return lambdaResponse(500, { message: "Could not create matter" });
      }


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
                ":tenantId": { S: tenantId },
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
              tenantId: { S: tenantId },
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
      if (!id) {
        return lambdaResponse(400, { message: "matterId is required in path" });
      }
      if (!event.body) {
        return lambdaResponse(400, { message: "Missing request body" });
      }
      let updateData;
      try {
        updateData = JSON.parse(event.body); // parse JSON string
      } catch (err) {
        return lambdaResponse(400, { message: "Invalid JSON" });
      }
      
      // First, get the existing matter to preserve createdAt
      let existingMatter;
      try {
        const getResult = await client.send(
          new GetItemCommand({
            TableName: tableName,
            Key: {
              tenantId: { S: tenantId },
              matterId: { S: id },
            },
          })
        );
        if (!getResult.Item) {
          return lambdaResponse(404, { message: "Matter not found" });
        }
        existingMatter = unmarshall(getResult.Item);
      } catch (error) {
        return lambdaResponse(500, { message: "Could not retrieve existing matter" });
      }

      // Update the matter using the existing matterId
      const updatedMatter = {
        tenantId,
        matterId: id,
        title: updateData.title ?? existingMatter.title ?? "",
        status: updateData.status ?? existingMatter.status ?? "",
        clientId: updateData.clientId ?? existingMatter.clientId ?? "",
        clientName: updateData.clientName ?? existingMatter.clientName ?? "",
        caseType: updateData.caseType ?? existingMatter.caseType ?? "",
        priority: updateData.priority ?? existingMatter.priority ?? "",
        description: updateData.description ?? existingMatter.description ?? "",
        assignedAttorney: updateData.assignedAttorney ?? existingMatter.assignedAttorney ?? "",
        createdAt: existingMatter.createdAt,
        updatedAt: new Date().toISOString(),
      };

      await client.send(
        new PutItemCommand({
          TableName: tableName,
          Item: {
            tenantId: { S: updatedMatter.tenantId },
            matterId: { S: updatedMatter.matterId },
            title: { S: updatedMatter.title },
            status: { S: updatedMatter.status },
            clientId: { S: updatedMatter.clientId },
            clientName: { S: updatedMatter.clientName },
            caseType: { S: updatedMatter.caseType },
            priority: { S: updatedMatter.priority },
            description: { S: updatedMatter.description },
            assignedAttorney: { S: updatedMatter.assignedAttorney },
            createdAt: { S: updatedMatter.createdAt },
            updatedAt: { S: updatedMatter.updatedAt },
          },
        })
      );
      return lambdaResponse(200, updatedMatter);

    case "DELETE":
      return lambdaResponse(200, { message: "Matter deleted successfully" });

    default:
      return lambdaResponse(405, { message: "Method not allowed" });
  }
};
