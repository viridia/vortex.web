#!/usr/bin/env node
import { VortexStack } from './vortex-stack';
import * as cdk from '@aws-cdk/core';

const app = new cdk.App();
new VortexStack(app, 'VortexStack', {
  env: {
    account: process.env.AWS_ACCOUNT_ID,
    region: process.env.AWS_REGION,
  }
});
