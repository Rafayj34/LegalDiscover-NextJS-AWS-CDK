#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AuthStack } from '../lib/auth/auth-stack';
import { DatabaseStack } from '../lib/database/database-stack';
import { ApiStack } from '../lib/api/api-stack';
const app = new cdk.App();

const stage = app.node.tryGetContext("stage") || "dev";
const env = { region: "us-east-1" };


// Database Stack (DynamoDB)
const database = new DatabaseStack(app, `DatabaseStack-${stage}`, {
  env,
  stage,
});

// Auth Stack (Cognito)
new AuthStack(app, `AuthStack-${stage}`, {
  env,
  stage,
  userTable: database.userTable,
});

// API Stack (API Gateway + Lambda)
new ApiStack(app, `ApiStack-${stage}`, {
  env,
  stage,
  userTable: database.userTable,
  mattersTable: database.mattersTable,
});