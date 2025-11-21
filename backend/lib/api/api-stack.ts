import { StackProps, Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { LambdaIntegration, RestApi, Stage, Deployment } from "aws-cdk-lib/aws-apigateway";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";

interface ApiStackProps extends StackProps {
  stage: string;
  userTable: Table;
  mattersTable: Table;
  tenantsTable: Table;
}

export class ApiStack extends Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const { userTable, mattersTable, tenantsTable, stage } = props;

    // API Gateway and Lambda setup would go here, utilizing userTable and mattersTable as needed.

    // --------------------------- For Users ----------------------------
    const UsersApi = new RestApi(this, `LegalDiscover-UsersApi-${stage}`, {
      restApiName: "CRUD for Users",
      deploy: false,
    });

    const userApiLambda = new NodejsFunction(this, `UserApiLambda-${stage}`, {
      entry: "lambda/users/userApiLambda.ts",
      functionName: `UserApiLambda-${stage}`,
      handler: "handler",
      environment: {
        TABLE_NAME: userTable.tableName,
      },
      bundling: {
        externalModules: ["@aws-sdk/client-dynamodb"],
      },
    });

    userTable.grantReadWriteData(userApiLambda);

    const users = UsersApi.root.addResource("users");
    users.addMethod("POST", new LambdaIntegration(userApiLambda));
    const user = users.addResource("{id}");
    user.addMethod("GET", new LambdaIntegration(userApiLambda));
    user.addMethod("PUT", new LambdaIntegration(userApiLambda));
    user.addMethod("DELETE", new LambdaIntegration(userApiLambda));

    // --------------------------- For Matters ----------------------------
    const MattersApi = new RestApi(this, `LegalDiscover-MattersApi-${stage}`, {
      restApiName: "CRUD for Matters",
      deploy: false,
    });

    const matterApiLambda = new NodejsFunction(
      this,
      `MatterApiLambda-${stage}`,
      {
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

    const matters = MattersApi.root.addResource("matters");
    matters.addMethod("POST", new LambdaIntegration(matterApiLambda));
    const matter = matters.addResource("{id}");
    matter.addMethod("GET", new LambdaIntegration(matterApiLambda));
    matter.addMethod("PUT", new LambdaIntegration(matterApiLambda));
    matter.addMethod("DELETE", new LambdaIntegration(matterApiLambda));

    // --------------------------- For Tenants ----------------------------

    const TenantsApi = new RestApi(this, `LegalDiscover-TenantsApi-${stage}`, {
      restApiName: "CRUD for Tenants",
      deploy: false,
    });

    const tenantApiLambda = new NodejsFunction(
      this,
      `TenantApiLambda-${stage}`,
      {
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

    const tenants = TenantsApi.root.addResource("tenants");
    tenants.addMethod("POST", new LambdaIntegration(tenantApiLambda));
    const tenant = tenants.addResource("{id}");
    tenant.addMethod("GET", new LambdaIntegration(tenantApiLambda));
    tenant.addMethod("PUT", new LambdaIntegration(tenantApiLambda));
    tenant.addMethod("DELETE", new LambdaIntegration(tenantApiLambda));

    // Create deployments with custom stage names
    const usersDeployment = new Deployment(this, `UsersApiDeployment-${stage}`, {
      api: UsersApi,
    });
    new Stage(this, `UsersApiStage-${stage}`, {
      deployment: usersDeployment,
      stageName: stage,
    });

    const mattersDeployment = new Deployment(this, `MattersApiDeployment-${stage}`, {
      api: MattersApi,
    });
    new Stage(this, `MattersApiStage-${stage}`, {
      deployment: mattersDeployment,
      stageName: stage,
    });

    const tenantsDeployment = new Deployment(this, `TenantsApiDeployment-${stage}`, {
      api: TenantsApi,
    });
    new Stage(this, `TenantsApiStage-${stage}`, {
      deployment: tenantsDeployment,
      stageName: stage,
    });
  }
}