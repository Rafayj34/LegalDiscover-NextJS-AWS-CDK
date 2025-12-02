import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import lambdaResponse from "../../utils/response";

const s3Client = new S3Client({});

export const handler = async (event: any) => {
  const { tenantId, fileName, type } = JSON.parse(event.body);
  const bucket = process.env.STORAGE_BUCKET_NAME;

  if (!tenantId || !fileName || !type) {
    return lambdaResponse(400, {
      message: "tenantId, fileName, and type are required",
    });
  }
  switch (type) {
    case "upload":
      try {
        const key = `tenants/${tenantId}/uploads/${fileName}`;
        const uploadUrl = await getSignedUrl(
          s3Client,
          new PutObjectCommand({
            Bucket: bucket,
            Key: key,
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
            Key: `tenants/${tenantId}/uploads/${fileName}`,
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
