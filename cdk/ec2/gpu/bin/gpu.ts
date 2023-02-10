#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { GpuStack } from '../lib/gpu-stack';


const projectName: string = process.env.CDK_DEFAULT_PROJECT_NAME || "id00000";

const app = new cdk.App();
new GpuStack(app, projectName, {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION
    },
});
