import autoscaling = require('aws-cdk-lib/aws-autoscaling');
import ec2 = require('aws-cdk-lib/aws-ec2');
import ecs = require('aws-cdk-lib/aws-ecs');
import cdk = require('aws-cdk-lib');
import { Construct } from 'constructs';

export class ECSCluster {
  constructor() {}
    
  public createResources(scope: Construct) {
    const context = scope.node.tryGetContext('ecs-cluster');
    const vpc = ((context) => {
      const vpcId = context['vpcId']
      if (!vpcId) {
        return new ec2.Vpc(scope, 'Vpc', { maxAzs: context['maxAzs'] });
      } else {
        return ec2.Vpc.fromLookup(scope, 'Vpc', { vpcId: vpcId, region: context['region'] } );
      }
    })(context);

    const asg = new autoscaling.AutoScalingGroup(scope, 'Fleet', {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.INFERENCE1, ec2.InstanceSize.XLARGE),
      machineImage: ecs.EcsOptimizedImage.amazonLinux2(),
      desiredCapacity: context['desiredCapacity'],
      vpc,
    });

    const cluster = new ecs.Cluster(scope, 'EcsCluster', { vpc });
    const capacityProvider = new ecs.AsgCapacityProvider(scope, 'AsgCapacityProvider', { autoScalingGroup: asg });
    cluster.addAsgCapacityProvider(capacityProvider);
  }
}