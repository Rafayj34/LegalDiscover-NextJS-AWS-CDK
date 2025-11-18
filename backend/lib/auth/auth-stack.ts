import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  UserPool,
  UserPoolClient,
  OAuthScope,
  UserPoolDomain,
  CfnUserPoolGroup,
} from "aws-cdk-lib/aws-cognito";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as path from "path";

interface AuthStackProps extends StackProps {
  stage: string;
}

export class AuthStack extends Stack {
  public readonly userPool: UserPool;
  public readonly userPoolClient: UserPoolClient;

  constructor(scope: Construct, id: string, props: AuthStackProps) {
    super(scope, id, props);

    const { stage } = props;
    
     const postConfirmationLambda = new lambda.Function(
      this,
      "PostConfirmationLambda",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: "index.handler",
        code: lambda.Code.fromAsset(path.join(__dirname, "../../lambda/postConfirmation")), // your lambda folder
        environment: {
          USER_TABLE_NAME: "legaldiscover-users-" + stage, // so lambda knows which table
        },
      }
    );

    // Create User Pool
    this.userPool = new UserPool(this, `LegalDiscoverUserPool-${stage}`, {
      userPoolName: `legal-discover-users-${stage}`,
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true, mutable: true },
      },
      lambdaTriggers: { postConfirmation: postConfirmationLambda },
    });
    const groups = ["admin", "attorney", "paralegal", "client"];

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
          callbackUrls: [
            "http://localhost:3000/api/auth/callback", // YOUR NEXT.JS CALLBACK
          ],
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
