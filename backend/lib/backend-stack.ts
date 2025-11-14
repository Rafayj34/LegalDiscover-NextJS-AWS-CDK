import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";
import {
  UserPool,
  UserPoolClient,
  OAuthScope,
  UserPoolDomain,
  CfnUserPoolGroup,
} from "aws-cdk-lib/aws-cognito";

export class BackendStack extends cdk.Stack {
  public readonly userPool: UserPool;
  public readonly userPoolClient: UserPoolClient;
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create User Pool
    this.userPool = new UserPool(this, "LegalDiscoverUserPool", {
      userPoolName: "legal-discover-users",
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true, mutable: true },
      },
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
      "LegalDiscoverUserPoolClient",
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

    // Hosted UI Domain
    new UserPoolDomain(this, "LegalDiscoverDomain", {
      userPool: this.userPool,
      cognitoDomain: {
        domainPrefix: "legaldiscover-" + id.toLowerCase(), // unique
      },
    });
  }
}
