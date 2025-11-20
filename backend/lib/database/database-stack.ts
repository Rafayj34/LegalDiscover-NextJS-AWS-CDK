import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Table, AttributeType, BillingMode } from "aws-cdk-lib/aws-dynamodb";

interface DatabaseStackProps extends cdk.StackProps {
  stage: string;
}

export class DatabaseStack extends cdk.Stack {
  public readonly userTable: Table;
  public readonly mattersTable: Table;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    const { stage } = props;

    this.userTable = new Table(this, `UserTable-${stage}`, {
      tableName: `legaldiscover-users-${stage}`,
      partitionKey: { name: "userId", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    this.mattersTable = new Table(this, `MattersTable-${stage}`, {
      tableName: `legaldiscover-matters-${stage}`,
      partitionKey: { name: "matterId", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,      
    });
  }
}
