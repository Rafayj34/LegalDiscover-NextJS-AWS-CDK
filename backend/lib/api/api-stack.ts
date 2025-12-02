import { StackProps, Stack, RemovalPolicy } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import {
  LambdaIntegration,
  RestApi,
  AuthorizationType,
  CognitoUserPoolsAuthorizer,
  Cors,
} from "aws-cdk-lib/aws-apigateway";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { UserPool } from "aws-cdk-lib/aws-cognito";
import { Bucket } from "aws-cdk-lib/aws-s3";

interface ApiStackProps extends StackProps {
  stage: string;
  userTable: Table;
  mattersTable: Table;
  tenantsTable: Table;
  userPoolId: string;
  storageBucket: Bucket;
}

export class ApiStack extends Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const { userTable, mattersTable, tenantsTable, stage, storageBucket } = props;

    const userPool = UserPool.fromUserPoolId(
      this,
      "ImportedUserPool",
      props.userPoolId
    );

    const authorizer = new CognitoUserPoolsAuthorizer(this, "ApiAuthorizer", {
      cognitoUserPools: [userPool],
      identitySource: "method.request.header.Authorization",
    });
    // // API Gateway and Lambda setup would go here, utilizing userTable and mattersTable as needed.
    const api = new RestApi(this, `LegalDiscoverApi-${stage}`, {
      restApiName: `LegalDiscoverApi-${stage}`,
      deployOptions: {
        stageName: stage,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS, // or your domain
        allowMethods: Cors.ALL_METHODS,
      },
      defaultMethodOptions: {
        authorizer: authorizer,
        authorizationType: AuthorizationType.COGNITO,
      },
    });

    // Rate Limiting
    // api.addUsagePlan('BasicUsagePlan', {
    //   name: `BasicUsagePlan-${stage}`,
    //   throttle: {
    //     rateLimit:10
    //   }
    // });

    authorizer._attachToApi(api);

    // // --------------------------- For Users ----------------------------

    const userApiLambda = new NodejsFunction(this, `UserApiLambda-${stage}`, {
      entry: "lambda/users/userApiLambda.ts",
      runtime: lambda.Runtime.NODEJS_20_X,

      functionName: `UserApiLambda-${stage}`,
      handler: "handler",
      environment: {
        TABLE_NAME: userTable.tableName,
      },
      bundling: {
        externalModules: ["@aws-sdk/client-dynamodb"],
      },

      // logRemovalPolicy: RemovalPolicy.DESTROY
    });

    userTable.grantReadWriteData(userApiLambda);

    const users = api.root.addResource("users");
    users.addMethod("POST", new LambdaIntegration(userApiLambda));
    const user = users.addResource("{id}");
    user.addMethod("GET", new LambdaIntegration(userApiLambda));
    user.addMethod("PUT", new LambdaIntegration(userApiLambda));
    user.addMethod("DELETE", new LambdaIntegration(userApiLambda));

    // // --------------------------- For Matters ----------------------------

    const matterApiLambda = new NodejsFunction(
      this,
      `MatterApiLambda-${stage}`,
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: "lambda/matters/matterApiLambda.ts",
        functionName: `MatterApiLambda-${stage}`,
        handler: "handler",
        environment: {
          TABLE_NAME: mattersTable.tableName,
        },
        bundling: {
          externalModules: ["@aws-sdk/client-dynamodb"],
        },
      }
    );
    mattersTable.grantReadWriteData(matterApiLambda);

    const matters = api.root.addResource("matters");
    matters.addMethod("GET", new LambdaIntegration(matterApiLambda));
    matters.addMethod("POST", new LambdaIntegration(matterApiLambda));
    const matter = matters.addResource("{id}");
    matter.addMethod("GET", new LambdaIntegration(matterApiLambda));
    matter.addMethod("PUT", new LambdaIntegration(matterApiLambda));
    matter.addMethod("DELETE", new LambdaIntegration(matterApiLambda));

    // // --------------------------- For Tenants ----------------------------

    const tenantApiLambda = new NodejsFunction(
      this,
      `TenantApiLambda-${stage}`,
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        functionName: `TennantApiLambda-${stage}`,
        entry: "lambda/tenants/tenantsApiLambda.ts",
        handler: "handler",
        environment: {
          TABLE_NAME: tenantsTable.tableName,
        },
        bundling: {
          externalModules: ["@aws-sdk/client-dynamodb"],
        },
      }
    );
    tenantsTable.grantReadWriteData(tenantApiLambda);

    const tenants = api.root.addResource("tenants");
    tenants.addMethod("POST", new LambdaIntegration(tenantApiLambda));
    const tenant = tenants.addResource("{id}");
    tenant.addMethod("GET", new LambdaIntegration(tenantApiLambda));
    tenant.addMethod("PUT", new LambdaIntegration(tenantApiLambda));
    tenant.addMethod("DELETE", new LambdaIntegration(tenantApiLambda));

    // -----------------------For Storage ----------------------------
    const storageLambda = new NodejsFunction(this, `StorageHandler-${stage}`, {
      // functionName: `LegalDiscoverStorageHandler-${stage}`,
      entry: "lambda/storage/index.ts",
      handler: "handler",
      environment: {
        STORAGE_BUCKET_NAME: storageBucket.bucketName,
      },
    });
    storageBucket.grantReadWrite(storageLambda);

    const storage = api.root.addResource("storage");
    storage.addMethod("POST", new LambdaIntegration(storageLambda));
  }
}
