import { Stack, StackProps, RemovalPolicy } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  UserPool,
  UserPoolClient,
  OAuthScope,
  UserPoolDomain,
  CfnUserPoolGroup,
  StringAttribute,
} from "aws-cdk-lib/aws-cognito";
import * as path from "path";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Table } from "aws-cdk-lib/aws-dynamodb";

interface AuthStackProps extends StackProps {
  stage: string;
  userTable: Table;
}

export class AuthStack extends Stack {
  public readonly userPool: UserPool;
  public readonly userPoolClient: UserPoolClient;

  constructor(scope: Construct, id: string, props: AuthStackProps) {
    super(scope, id, props);

    const { stage } = props;

    const postConfirmationLambda = new NodejsFunction(
      this,
      "PostConfirmationLambda",
      {
        entry: path.join(__dirname, "../../lambda/postConfirmation/index.ts"), // your lambda folder
        handler: "handler",
        environment: {
          USER_TABLE_NAME: "legaldiscover-users-" + stage, // so lambda knows which table
        },
      }
    );
    props.userTable.grantReadWriteData(postConfirmationLambda);

    // Create User Pool
    this.userPool = new UserPool(this, `LegalDiscoverUserPool-${stage}`, {
      userPoolName: `legal-discover-users-${stage}`,
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true, mutable: true },
        fullname: { required: false, mutable: true },
        address: { required: false, mutable: true },
        phoneNumber: { required: false, mutable: true },
      },
      customAttributes: {
        company: new StringAttribute({ mutable: true }),
        tenantId: new StringAttribute({ mutable: false }),
      },
      lambdaTriggers: { postConfirmation: postConfirmationLambda },
      removalPolicy: RemovalPolicy.DESTROY,
    });
    const groups = [
      "admin",
      "client",
      "secretary",
      "paralegal",
      "associate",
      "partner",
    ];

    groups.forEach((group) => {
      new CfnUserPoolGroup(this, `${group}Group`, {
        userPoolId: this.userPool.userPoolId,
        groupName: group,
      });
    });
    // Create Hosted UI OAuth Client
    this.userPoolClient = new UserPoolClient(
      this,
      `LegalDiscoverUserPoolClient-${stage}`,
      {
        userPool: this.userPool,
        generateSecret: false, // frontend safe
        oAuth: {
          callbackUrls: ["http://localhost:3000/api/auth/callback"],
          logoutUrls: ["http://localhost:3000"],
          flows: {
            implicitCodeGrant: true,
          },
          scopes: [
            OAuthScope.EMAIL,
            OAuthScope.OPENID,
            OAuthScope.PROFILE,
            OAuthScope.COGNITO_ADMIN,
          ],
        },
      }
    );

    // this.userPool.addTrigger( postConfirmationLambda);

    // Hosted UI Domain
    new UserPoolDomain(this, `LegalDiscoverDomain-${stage}`, {
      userPool: this.userPool,
      cognitoDomain: {
        domainPrefix: `legaldiscover-${stage}`, // unique
      },
    });
  }
}
//  const postConfirmationLambda = new lambda.Function(
//   this,
//   "PostConfirmationLambda",
//   {
//     runtime: lambda.Runtime.NODEJS_18_X,
//     handler: "index.handler",
//     code: lambda.Code.fromAsset(path.join(__dirname, "../../lambda/postConfirmation")), // your lambda folder
//     environment: {
//       USER_TABLE_NAME: "legaldiscover-users-" + stage, // so lambda knows which table
//     },
//   }
// );
