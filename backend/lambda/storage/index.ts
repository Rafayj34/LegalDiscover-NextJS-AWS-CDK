import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
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

  // HTTP API path: generate presigned URLs (existing behavior)
  const { fileName, clientId, matterId, type } = JSON.parse(event.body);
  const bucket = process.env.STORAGE_BUCKET_NAME;
  const tenantId = event.pathParameters?.tenantId;

  if (!tenantId || !fileName || !matterId || !type) {
    return lambdaResponse(400, {
      message: "tenantId, fileName, and type are required",
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
