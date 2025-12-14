import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Table, AttributeType, BillingMode, ProjectionType } from "aws-cdk-lib/aws-dynamodb";

interface DatabaseStackProps extends cdk.StackProps {
  stage: string;
}

export class DatabaseStack extends cdk.Stack {
  public readonly userTable: Table;
  public readonly mattersTable: Table;
  public readonly tenantsTable: Table;
  public readonly documentsTable: Table;
  public readonly conversationsTable: Table;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    const { stage } = props;

    this.userTable = new Table(this, `UserTable-${stage}`, {
      tableName: `legaldiscover-users-${stage}`,
      partitionKey: { name: "tenantId", type: AttributeType.STRING },
      sortKey: { name: "userId", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.mattersTable = new Table(this, `MattersTable-${stage}`, {
      tableName: `legaldiscover-matters-${stage}`,
      partitionKey: { name: "tenantId", type: AttributeType.STRING },
      sortKey: { name: "matterId", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.tenantsTable = new Table(this, `TenantsTable-${stage}`, {
      tableName: `legaldiscover-tenants-${stage}`,
      partitionKey: { name: "tenantId", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.documentsTable = new Table(this, `DocumentsTable-${stage}`, {
      tableName: `legaldiscover-documents-${stage}`,
      partitionKey: { name: "tenantId", type: AttributeType.STRING },
      sortKey: { name: "documentId", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      
    });

    this.conversationsTable = new Table(this, `ConversationsTable-${stage}`, {
      tableName: `legaldiscover-conversations-v2-${stage}`,
      partitionKey: { name: "tenantId", type: AttributeType.STRING },
      sortKey: { name: "userId", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Global Secondary Index for querying messages by conversationId
    this.conversationsTable.addGlobalSecondaryIndex({
      indexName: "conversationId-index",
      partitionKey: { name: "tenantId", type: AttributeType.STRING },
      sortKey: { name: "conversationId", type: AttributeType.STRING },
      projectionType: ProjectionType.ALL,
    });
  }
}
