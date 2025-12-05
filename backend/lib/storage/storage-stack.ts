import * as cdk from "aws-cdk-lib";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import { Bucket, BlockPublicAccess, EventType } from "aws-cdk-lib/aws-s3";
import { LambdaDestination } from "aws-cdk-lib/aws-s3-notifications";
import { NodejsFunction,  } from "aws-cdk-lib/aws-lambda-nodejs";
import {Runtime} from "aws-cdk-lib/aws-lambda";
interface StorageStackProps extends cdk.StackProps {
  stage: string;
  documentsTable: Table;
}
export class StorageStack extends cdk.Stack {
  public readonly storageBucket: Bucket;
  public readonly storageLambda: NodejsFunction;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

    const { stage, documentsTable } = props;

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
          allowedMethods: [
            cdk.aws_s3.HttpMethods.GET,
            cdk.aws_s3.HttpMethods.PUT,
          ],
          allowedOrigins: ["*"],
          allowedHeaders: ["*"],
        },
      ],
    });

    this.storageLambda = new NodejsFunction(this, `StorageHandler-${stage}`, {
      entry: "lambda/storage/index.ts",
      runtime: Runtime.NODEJS_22_X,
      handler: "handler",
      environment: {
        STORAGE_BUCKET_NAME: this.storageBucket.bucketName,
        DOCUMENTS_TABLE_NAME: documentsTable.tableName,
      },
      bundling: {
        externalModules: ["@aws-sdk/client-dynamodb", "@aws-sdk/client-s3"],
      },
    });

    this.storageBucket.grantReadWrite(this.storageLambda);
    documentsTable.grantReadWriteData(this.storageLambda);

    this.storageBucket.addEventNotification(
      EventType.OBJECT_CREATED_PUT,
      new LambdaDestination(this.storageLambda)
    );
  }
}
