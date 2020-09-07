#!/usr/bin/env node
import { VortexStack } from './vortex-stack';
import * as cdk from '@aws-cdk/core';

const app = new cdk.App();
new VortexStack(app, 'VortexStack');
