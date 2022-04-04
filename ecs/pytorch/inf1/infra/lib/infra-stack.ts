import cdk = require('aws-cdk-lib');
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { ECSCluster } from './resources/ecs-cluster';

export class InfraStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    const ecsCluster = new ECSCluster();
    ecsCluster.createResources(this);
  }
}