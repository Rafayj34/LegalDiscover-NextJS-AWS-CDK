import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Bucket, BlockPublicAccess } from "aws-cdk-lib/aws-s3";
interface StorageStackProps extends cdk.StackProps {
  stage: string;
}
export class StorageStack extends cdk.Stack {
  public readonly storageBucket: Bucket;
  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

    const { stage } = props;

    this.storageBucket = new Bucket(this, `StorageBucket-${stage}`, {
      bucketName: `legaldiscover-storage-${stage}`,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      encryption: cdk.aws_s3.BucketEncryption.S3_MANAGED,
      publicReadAccess: false,
      versioned: true,
      cors: [
        {
          allowedMethods: [ cdk.aws_s3.HttpMethods.GET, cdk.aws_s3.HttpMethods.PUT ],
          allowedOrigins: ["*"],
          allowedHeaders: ["*"],
        },
      ],
    });
  }
}
