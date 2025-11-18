#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AuthStack } from '../lib/auth/auth-stack';
import { DatabaseStack } from '../lib/database/database-stack';

const app = new cdk.App();

const stage = app.node.tryGetContext("stage") || "dev";
const env = { region: "us-east-1" };

// Auth Stack (Cognito)
new AuthStack(app, `AuthStack-${stage}`, {
  env,
  stage,
});

// Database Stack (DynamoDB)
new DatabaseStack(app, `DatabaseStack-${stage}`, {
  env,
  stage,
});