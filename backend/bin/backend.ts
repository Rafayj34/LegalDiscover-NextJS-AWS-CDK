#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AuthStack } from '../lib/auth/auth-stack';
import { DatabaseStack } from '../lib/database/database-stack';
import { ApiStack } from '../lib/api/api-stack';
import { StorageStack } from '../lib/storage/storage-stack';
const app = new cdk.App();

const stage = app.node.tryGetContext("stage") || "dev";
const env = { region: "us-east-1" };


// Database Stack (DynamoDB)
const database = new DatabaseStack(app, `DatabaseStack-${stage}`, {
  env,
  stage,
});

// Auth Stack (Cognito)
const auth = new AuthStack(app, `AuthStack-${stage}`, {
  env,
  stage,
  userTable: database.userTable,
});

// Storage Stack (S3 + Lambda)
const storage = new StorageStack(app, `StorageStack-${stage}`, {
  env,
  stage,
});
// API Stack (API Gateway + Lambda)
new ApiStack(app, `ApiStack-${stage}`, {
  env,
  stage,
  userTable: database.userTable,
  mattersTable: database.mattersTable,
  tenantsTable: database.tenantsTable,
  userPoolId: auth.userPool.userPoolId,
  storageBucket: storage.storageBucket,
});
