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
import { CfnPermission } from "aws-cdk-lib/aws-lambda";
import { UserPool } from "aws-cdk-lib/aws-cognito";

interface ApiStackProps extends StackProps {
  stage: string;

  userTable: Table;
  mattersTable: Table;
  tenantsTable: Table;
  documentsTable: Table;
  conversationsTable: Table;

  userPoolId: string;
  storageLambdaArn: string;
  publicAILambdaArn: string;
}

export class ApiStack extends Stack {
  public readonly api: RestApi;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const { userTable, mattersTable, tenantsTable, documentsTable, stage } =
      props;

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
    this.api = new RestApi(this, `LegalDiscoverApi-${stage}`, {
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

    authorizer._attachToApi(this.api);

    // // --------------------------- For Users ----------------------------

    const userApiLambda = new NodejsFunction(this, `UserApiLambda-${stage}`, {
      entry: "lambda/users/userApiLambda.ts",
      runtime: lambda.Runtime.NODEJS_20_X,

      // functionName: `UserApiLambda-${stage}`,
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

    const tenantsRoot = this.api.root.addResource("tenants");
    const tenantResource = tenantsRoot.addResource("{tenantId}");

    // --------------------------- For Users (tenant-scoped) ----------------------------
    const tenantUsers = tenantResource.addResource("users");
    tenantUsers.addMethod("POST", new LambdaIntegration(userApiLambda));
    const tenantUser = tenantUsers.addResource("{id}");
    tenantUser.addMethod("GET", new LambdaIntegration(userApiLambda));
    tenantUser.addMethod("PUT", new LambdaIntegration(userApiLambda));
    tenantUser.addMethod("DELETE", new LambdaIntegration(userApiLambda));

    // // --------------------------- For Matters ----------------------------

    const matterApiLambda = new NodejsFunction(
      this,
      `MatterApiLambda-${stage}`,
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: "lambda/matters/matterApiLambda.ts",
        // functionName: `MatterApiLambda-${stage}`,
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

    // --------------------------- For Matters (tenant-scoped) ----------------------------
    const tenantMatters = tenantResource.addResource("matters");
    tenantMatters.addMethod("GET", new LambdaIntegration(matterApiLambda));
    tenantMatters.addMethod("POST", new LambdaIntegration(matterApiLambda));
    const tenantMatter = tenantMatters.addResource("{id}");
    tenantMatter.addMethod("GET", new LambdaIntegration(matterApiLambda));
    tenantMatter.addMethod("PUT", new LambdaIntegration(matterApiLambda));
    tenantMatter.addMethod("DELETE", new LambdaIntegration(matterApiLambda));

    // // --------------------------- For Tenants ----------------------------

    const tenantApiLambda = new NodejsFunction(
      this,
      `TenantApiLambda-${stage}`,
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        // functionName: `TennantApiLambda-${stage}`,
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

    // --------------------------- For Tenants ----------------------------
    tenantsRoot.addMethod("POST", new LambdaIntegration(tenantApiLambda));
    const tenant = tenantResource;
    tenant.addMethod("GET", new LambdaIntegration(tenantApiLambda));
    tenant.addMethod("PUT", new LambdaIntegration(tenantApiLambda));
    tenant.addMethod("DELETE", new LambdaIntegration(tenantApiLambda));

    // -----------------------For Storage ----------------------------
    const storageLambda = lambda.Function.fromFunctionAttributes(
      this,
      `ImportedStorageHandler-${stage}`,
      {
        functionArn: props.storageLambdaArn,
        sameEnvironment: true,
      }
    );

    // Grant API Gateway permission to invoke the imported Lambda (cross-stack)
    new CfnPermission(this, `StorageLambdaApiGatewayPermission-${stage}`, {
      functionName: props.storageLambdaArn,
      principal: "apigateway.amazonaws.com",
      action: "lambda:InvokeFunction",
      sourceArn: `arn:aws:execute-api:${this.region}:${this.account}:${this.api.restApiId}/*/*`,
    });

    // --------------------------- For Storage (tenant-scoped) ----------------------------
    const storage = tenantResource.addResource("storage");
    storage.addMethod("POST", new LambdaIntegration(storageLambda));
    storage.addMethod("GET", new LambdaIntegration(storageLambda));


    // --------------------------- For Public AI (tenant-scoped) ----------------------------
    const publicAILambda = lambda.Function.fromFunctionAttributes(
      this,
      `ImportedPublicAIHandler-${stage}`,
      {
        functionArn: props.publicAILambdaArn,
        sameEnvironment: true,
      }
    );

    // Grant API Gateway permission to invoke the imported Lambda (cross-stack)
    new CfnPermission(this, `PublicAILambdaApiGatewayPermission-${stage}`, {
      functionName: props.publicAILambdaArn,
      principal: "apigateway.amazonaws.com",
      action: "lambda:InvokeFunction",
      sourceArn: `arn:aws:execute-api:${this.region}:${this.account}:${this.api.restApiId}/*/*`,
    });

    const publicai = tenantResource.addResource("publicai");

    // POST /tenants/{tenantId}/publicai/send  -> send a new message to Public AI
    const sendMessage = publicai.addResource("send");
    sendMessage.addMethod("POST", new LambdaIntegration(publicAILambda));

    // GET /tenants/{tenantId}/publicai/conversations?userId={userId}
    // Returns all messages for the given userId (using composite userId sort key)
    const conversations = publicai.addResource("conversations");
    conversations.addMethod("GET", new LambdaIntegration(publicAILambda));
  }
}
