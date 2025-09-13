#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { LuvaStack } from '../lib/luva-stack';

const app = new App();

new LuvaStack(app, 'LuvaStack', {
  env: {
    // Set your default deploy env here or via CDK context
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
});

