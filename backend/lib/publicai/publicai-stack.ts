import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { RemovalPolicy, Duration } from "aws-cdk-lib";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { IntegrationType } from "aws-cdk-lib/aws-apigateway";

interface PublicAIStackProps extends cdk.StackProps {
  stage: string;
}

export class PublicAIStack extends cdk.Stack {
  public readonly publicAILambda: NodejsFunction;
  public readonly publicAILambdaApi: apigwv2.WebSocketApi;
  constructor(scope: Construct, id: string, props: PublicAIStackProps) {
    super(scope, id, props);
    const { stage } = props;
    // ---------------------------- SSM Parameter for Public AI API Key ----------------------------

    const openAiSecret = new secretsmanager.Secret(this, "OpenAIKeySecret", {
      secretName: `openai-key-${stage}`, // optional
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // -------------------------- Lambda Function for Public AI ----------------------------
    this.publicAILambda = new NodejsFunction(this, `publicAILambda-${stage}`, {
      entry: "lambda/publicai/publicaiLambda.ts",
      handler: "handler",
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(30),
      bundling: {
        externalModules: ["@aws-sdk/client-dynamodb"],
      },
    });
    openAiSecret.grantRead(this.publicAILambda);
    this.publicAILambda.addEnvironment(
      "OPENAI_SECRET_NAME",
      openAiSecret.secretName
    );

    this.publicAILambdaApi = new apigwv2.WebSocketApi(
      this,
      `PublicAILambdaApi-${stage}`,
      {
        apiName: `PublicAILambdaApi-${stage}`,
        connectRouteOptions: {
          integration: new integrations.WebSocketLambdaIntegration(
            `PublicAILambdaIntegration-${stage}`,
            this.publicAILambda
          ),
        },
        disconnectRouteOptions: {
          integration: new integrations.WebSocketLambdaIntegration(
            `PublicAILambdaIntegration-${stage}`,
            this.publicAILambda
          ),
        },
        defaultRouteOptions: {
          integration: new integrations.WebSocketLambdaIntegration(
            `PublicAILambdaIntegration-${stage}`,
            this.publicAILambda
          ),
        },
      }
    );

    new apigwv2.WebSocketStage(this, `PublicAILambdaStage-${stage}`, {
      webSocketApi: this.publicAILambdaApi,
      stageName: stage,
    });
     // Output the WebSocket endpoint URL
    new cdk.CfnOutput(this, "WebSocketEndpoint", {
      value: this.publicAILambdaApi.apiEndpoint,
      description: "The WebSocket API endpoint URL",
    });
  }
}
