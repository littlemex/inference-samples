#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { EC2Stack } from '../lib/ec2-stack';


const projectName: string = process.env.CDK_DEFAULT_PROJECT_NAME || "id00000";

const app = new cdk.App();
new EC2Stack(app, projectName, {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION
    },
});
