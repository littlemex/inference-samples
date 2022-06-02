import { Stack, StackProps } from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';


export class EcsStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const region: string = process.env.CDK_DEFAULT_REGION || 'ap-northeast-1';

    const vpc = ec2.Vpc.fromLookup(this, 'VPC', {
      isDefault: true
    });


    const cluster = new ecs.Cluster(this, 'EcsCluster', {
      vpc: vpc,
      containerInsights: true,
    });

    const instanceType = ec2.InstanceType.of(
      ec2.InstanceClass.INFERENCE1,
      ec2.InstanceSize.XLARGE
    );

    const autoScalingGroup = new autoscaling.AutoScalingGroup(this, 'ASG', {
      vpc,
      instanceType: instanceType,
      machineImage: ecs.EcsOptimizedImage.amazonLinux2(),
      desiredCapacity: 1,
    });

    const capacityProvider = new ecs.AsgCapacityProvider(this, 'CapacityProvider', {
      autoScalingGroup: autoScalingGroup,
      capacityProviderName: 'capacity-provider'
    });
    cluster.addAsgCapacityProvider(capacityProvider);

    const logging = new ecs.AwsLogDriver({ streamPrefix: 'model-server' })

    const taskDefinition = new ecs.Ec2TaskDefinition(this, 'TaskDef');
    const container = taskDefinition.addContainer('web', {
      image: ecs.ContainerImage.fromRegistry('amazon/amazon-ecs-sample'),
      memoryLimitMiB: 256,
      logging,
    });

    container.addPortMappings({
      containerPort: 80,
      hostPort: 8080,
      protocol: ecs.Protocol.TCP
    });

    const service = new ecs.Ec2Service(this, 'Service', {
      cluster,
      taskDefinition,
    });

    service.addPlacementStrategies(
      ecs.PlacementStrategy.packedBy(ecs.BinPackResource.MEMORY),
      ecs.PlacementStrategy.spreadAcross(ecs.BuiltInAttributes.AVAILABILITY_ZONE));

    const lb = new elbv2.ApplicationLoadBalancer(this, 'LB', {
      vpc,
      internetFacing: true
    });
    const listener = lb.addListener('PublicListener', { port: 80, open: true });

    listener.addTargets('ECS', {
      port: 80,
      targets: [service.loadBalancerTarget({
        containerName: 'web',
        containerPort: 80
      })],
      healthCheck: {
        interval: cdk.Duration.seconds(60),
        path: '/',
        timeout: cdk.Duration.seconds(5),
      }
    });

    new cdk.CfnOutput(this, 'LoadBalancerDNS', { value: lb.loadBalancerDnsName, });

  }
}