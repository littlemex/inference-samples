import cdk = require('aws-cdk-lib');
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { ECSCluster } from './resources/ecs-cluster';
import { ALB } from './resources/alb';

export class InfraStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    const ecsCluster = new ECSCluster();
    ecsCluster.createResources(this);
    const cluster = ecsCluster.getCluster()
    const Alb = new ALB(cluster.vpc);
    Alb.createResources(this);
  }
}