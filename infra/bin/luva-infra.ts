#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { LuvaStack } from '../lib/luva-stack';

const app = new App();
const stage = (process.env.LUVA_STAGE || 'prod').trim().toLowerCase();
const stackName = process.env.LUVA_STACK_NAME || (stage === 'prod' ? 'LuvaStack' : `Luva${stage[0].toUpperCase()}${stage.slice(1)}Stack`);

new LuvaStack(app, stackName, {
  stage,
  env: {
    // Set your default deploy env here or via CDK context
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
});
