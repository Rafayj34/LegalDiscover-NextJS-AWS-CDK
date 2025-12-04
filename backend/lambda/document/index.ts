import {
  S3Client,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import {
  DynamoDBClient,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";
import { v4 as uuid } from "uuid";

const dynamoClient = new DynamoDBClient({});
const s3 = new S3Client({});
const tableName = process.env.TABLE_NAME!;

export const handler = async (event: any) => {
  try {
    const record = event.Records[0];
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key);

    // Size from event (no need for head call)
    const size = record.s3.object.size;

    // HeadObject for metadata + content type
    const head = await s3.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );

    const meta = head.Metadata || {};

    // Metadata (lowercased by AWS)
    let tenantId = meta.tenantid || "";
    let clientId = meta.clientid || "";
    let matterId = meta.matterid || "";
    let fileName = meta.filename || key.split("/").pop() || "unknown";

    // Fallback parsing if metadata missing
    if (!tenantId || !clientId || !matterId) {
      const parts = key.split("/");
      // tenants/{tenantId}/clients/{clientId}/matters/{matterId}/{fileName}
      tenantId = parts[1] || "unknown";
      clientId = parts[3] || "unknown";
      matterId = parts[5] || "unknown";
      fileName = parts.slice(6).join("/") || "unknown";
    }

    const mimeType = head.ContentType || "application/octet-stream";

    // Save to DynamoDB
    await dynamoClient.send(
      new PutItemCommand({
        TableName: tableName,
        Item: {
          documentId: { S: uuid() },
          tenantId: { S: tenantId },
          clientId: { S: clientId },
          matterId: { S: matterId },
          fileName: { S: fileName },
          s3Key: { S: key },
          size: { N: size.toString() },
          mimeType: { S: mimeType },
          createdAt: { S: new Date().toISOString() },
        },
      })
    );

    console.log(`Document saved: ${fileName} (${size} bytes)`);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Record saved successfully", documentId: uuid() }),
    };
  } catch (err) {
    console.error("Error processing S3 event:", err);
    throw err;
  }
};
