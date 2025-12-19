import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import {
  DynamoDBClient,
  PutItemCommand,
  QueryCommand,
} from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import lambdaResponse from "../../utils/response";

const s3Client = new S3Client({});
const ddbClient = new DynamoDBClient({});
const documentsTableName = process.env.DOCUMENTS_TABLE_NAME as string;

export const handler = async (event: any) => {
  // S3 event path: triggered on PUT object
  if (event?.Records && Array.isArray(event.Records)) {
    try {
      for (const record of event.Records) {
        if (record.eventSource !== "aws:s3" || !record.s3) {
          continue;
        }

        const bucket = record.s3.bucket.name;
        const key = decodeURIComponent(
          record.s3.object.key.replace(/\+/g, " ")
        );

        const head = await s3Client.send(
          new HeadObjectCommand({
            Bucket: bucket,
            Key: key,
          })
        );

        const metadata = head.Metadata || {};

        // S3 lower-cases metadata keys
        const tenantId =
          metadata["tenantid"] || metadata["tenantId"] || metadata["tenant"];
        const clientId =
          metadata["clientid"] || metadata["clientId"] || metadata["client"];
        const matterId =
          metadata["matterid"] || metadata["matterId"] || metadata["matter"];
        const fileName =
          metadata["filename"] ||
          metadata["fileName"] ||
          key.split("/").pop() ||
          key;

        if (!tenantId) {
          console.warn(
            "S3 object missing tenantId metadata; skipping record for key: ",
            key
          );
          continue;
        }

        if (!documentsTableName) {
          console.error(
            "DOCUMENTS_TABLE_NAME is not set; cannot write document record"
          );
          continue;
        }

        await ddbClient.send(
          new PutItemCommand({
            TableName: documentsTableName,
            Item: {
              tenantId: { S: String(tenantId) },
              documentId: { S: key },
              clientId: clientId ? { S: String(clientId) } : { NULL: true },
              matterId: matterId ? { S: String(matterId) } : { NULL: true },
              fileName: { S: String(fileName) },
              s3Bucket: { S: bucket },
              s3Key: { S: key },
              createdAt: { S: new Date().toISOString() },
            },
          })
        );
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ message: "S3 event processed" }),
      };
    } catch (error) {
      console.error("Error processing S3 event:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "Error processing S3 event" }),
      };
    }
  }

  // Extract tenantId from path parameters
  const tenantId = event.pathParameters?.tenantId;
  const httpMethod =
    event.httpMethod || event.requestContext?.http?.method || "POST";

  // --------------------------- GET: Fetch documents from database ---------------------------
  if (httpMethod === "GET") {
    if (!tenantId) {
      return lambdaResponse(400, {
        error: "tenantId is required in path",
      });
    }

    // Extract query parameters
    const queryParams = event.queryStringParameters || {};
    const clientId = queryParams.clientId;
    const matterId = queryParams.matterId;

    if (!documentsTableName) {
      return lambdaResponse(500, {
        error: "DOCUMENTS_TABLE_NAME environment variable is not set",
      });
    }

    try {
      // Build query command - query by tenantId (partition key)
      const queryParams_dynamo: any = {
        TableName: documentsTableName,
        KeyConditionExpression: "tenantId = :tenantId",
        ExpressionAttributeValues: {
          ":tenantId": { S: tenantId },
        },
      };

      // Add filter expressions if clientId or matterId are provided
      const filterExpressions: string[] = [];
      if (clientId) {
        filterExpressions.push("clientId = :clientId");
        queryParams_dynamo.ExpressionAttributeValues[":clientId"] = {
          S: clientId,
        };
      }
      if (matterId) {
        filterExpressions.push("matterId = :matterId");
        queryParams_dynamo.ExpressionAttributeValues[":matterId"] = {
          S: matterId,
        };
      }

      if (filterExpressions.length > 0) {
        queryParams_dynamo.FilterExpression = filterExpressions.join(" AND ");
      }

      const result = await ddbClient.send(new QueryCommand(queryParams_dynamo));

      // Convert DynamoDB items to plain objects
      const documents =
        result.Items?.map((item) => {
          const unmarshalled = unmarshall(item);
          return {
            documentId: unmarshalled.documentId,
            tenantId: unmarshalled.tenantId,
            clientId: unmarshalled.clientId || null,
            matterId: unmarshalled.matterId || null,
            fileName: unmarshalled.fileName,
            s3Bucket: unmarshalled.s3Bucket,
            s3Key: unmarshalled.s3Key,
            createdAt: unmarshalled.createdAt,
          };
        }) || [];

      console.log(documents);

      return lambdaResponse(200, {
        tenantId,
        clientId: clientId || null,
        matterId: matterId || null,
        count: documents.length,
        items: documents,
      });
    } catch (error) {
      console.error("Error fetching documents:", error);
      return lambdaResponse(500, {
        error: "Failed to fetch documents",
        details:
          error instanceof Error ? error.message : String(error),
      });
    }
  }

  // --------------------------- POST: Generate presigned URLs ---------------------------
  // HTTP API path: generate presigned URLs (existing behavior)
  if (!event.body) {
    return lambdaResponse(400, {
      error: "Request body is required for POST requests",
    });
  }

  const { fileName, clientId, matterId, type } = JSON.parse(event.body);
  const bucket = process.env.STORAGE_BUCKET_NAME;

  if (!tenantId || !fileName || !matterId || !type) {
    return lambdaResponse(400, {
      message: "tenantId, fileName, matterId, and type are required",
    });
  }

  switch (type) {
    case "upload":
      try {
        const key = `tenants/${tenantId}/clients/${clientId}/matters/${matterId}/${fileName}`;
        const uploadUrl = await getSignedUrl(
          s3Client,
          new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Metadata: {
              tenantId,
              clientId,
              matterId,
              fileName,
            },
          }),
          { expiresIn: 3600 }
        );
        return lambdaResponse(200, { uploadUrl: uploadUrl });
      } catch (error) {
        console.error("Error generating upload URL:", error);
        return lambdaResponse(500, {
          message: "Could not generate upload URL",
        });
      }

    case "download":
      try {
        const downloadUrl = await getSignedUrl(
          s3Client,
          new GetObjectCommand({
            Bucket: bucket,
            Key: `tenants/${tenantId}/clients/${clientId}/matters/${matterId}/${fileName}`,
          }),
          { expiresIn: 3600 }
        );
        return lambdaResponse(200, { downloadUrl: downloadUrl });
      } catch (error) {
        console.error("Error generating download URL:", error);
        return lambdaResponse(500, {
          message: "Could not generate download URL",
        });
      }

    default:
      return lambdaResponse(400, {
        message: "Invalid type. Supported type is 'upload'",
      });
  }
};
