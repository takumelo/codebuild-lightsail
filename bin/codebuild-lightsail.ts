#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CodebuildLightsailStack } from '../lib/codebuild-lightsail-stack';

const app = new cdk.App();
new CodebuildLightsailStack(app, 'CodebuildLightsailStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});
