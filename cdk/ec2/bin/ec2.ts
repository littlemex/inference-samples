#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Ec2Stack } from '../lib/ec2-stack';


const app = new cdk.App();
const region: string = app.node.tryGetContext("region");
new Ec2Stack(app, 'Ec2Stack', {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION
    },
});
