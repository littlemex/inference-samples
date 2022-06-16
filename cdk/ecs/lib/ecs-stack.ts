import { Stack, StackProps, Tag } from "aws-cdk-lib";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as autoscaling from "aws-cdk-lib/aws-autoscaling";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { Construct } from "constructs";


export class EcsStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const region: string = process.env.CDK_DEFAULT_REGION || "ap-northeast-1";
    const modeRepoName: string = "model";
    const healthCheckPath: string = "/";
    // https://docs.amazonaws.cn/en_us/AmazonECS/latest/developerguide/ecs-inference.html#ecs-inference-requirements
    const imageID: string = "ami-07fd409cba79d3a25"; // for ap-northeast-1

    const vpc = ec2.Vpc.fromLookup(this, "VPC", {
      isDefault: true
    });

    const securityGroup = new ec2.SecurityGroup(this, "SecurityGroup", {
      vpc,
      description: "Allow (TCP port 8080 and HTTP (TCP port 80) in",
      allowAllOutbound: true,
    });

    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(8080),
      "Allow TCP 8080 Access"
    );

    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      "Allow HTTP Access"
    );

    const cluster = new ecs.Cluster(this, "EcsCluster", {
      vpc: vpc,
      containerInsights: true,
    });

    const instanceType = ec2.InstanceType.of(
      ec2.InstanceClass.INFERENCE1,
      ec2.InstanceSize.XLARGE
    );

    const autoScalingGroup = new autoscaling.AutoScalingGroup(this, "ASG", {
      vpc,
      instanceType: instanceType,
      machineImage: new ec2.GenericLinuxImage({
        [region]: imageID,
      }),
      securityGroup: securityGroup,
    });

    const capacityProvider = new ecs.AsgCapacityProvider(this, "CapacityProvider", {
      autoScalingGroup: autoScalingGroup,
      capacityProviderName: "capacity-provider",
      // https://github.com/aws/aws-cdk/issues/14732
      enableManagedTerminationProtection: false,
    });
    cluster.addAsgCapacityProvider(capacityProvider);

    const logging = new ecs.AwsLogDriver({ streamPrefix: "model-server" });

    const image = ecs.ContainerImage.fromEcrRepository(
      ecr.Repository.fromRepositoryName(this, "ModelImage", modeRepoName),
    );

    const taskDefinition = new ecs.Ec2TaskDefinition(this, "TaskDef");
    const linuxParameters = new ecs.LinuxParameters(this, 'LinuxParameters', {
      initProcessEnabled: false,
      sharedMemorySize: 123,

    });
    linuxParameters.addDevices({
      containerPath: "/dev/neuron0",
      hostPath: "/dev/neuron0",
      permissions: [ecs.DevicePermission.READ, ecs.DevicePermission.WRITE],
    });
    linuxParameters.addCapabilities(ecs.Capability.IPC_LOCK);

    const container = taskDefinition.addContainer("web", {
      // https://docs.aws.amazon.com/cdk/api/v1/docs/@aws-cdk_aws-ecs.ContainerDefinitionOptions.html
      image: image,
      memoryLimitMiB: 2048,
      cpu: 0,
      essential: true,
      logging,
      environment: {
        ECS_IMAGE_PULL_BEHAVIOR: "default",
      },
      memoryReservationMiB: 1000,
      linuxParameters: linuxParameters,
    });

    container.addPortMappings({
      containerPort: 80,
      hostPort: 8080,
      protocol: ecs.Protocol.TCP
    });

    const service = new ecs.Ec2Service(this, "Service", {
      cluster,
      taskDefinition,
      maxHealthyPercent: 200,
      minHealthyPercent: 100,
    });

    service.addPlacementStrategies(
      ecs.PlacementStrategy.packedBy(ecs.BinPackResource.MEMORY),
      ecs.PlacementStrategy.spreadAcross(ecs.BuiltInAttributes.AVAILABILITY_ZONE));

    const lb = new elbv2.ApplicationLoadBalancer(this, "LB", {
      vpc,
      internetFacing: true,
      securityGroup: securityGroup,
    });
    const listener = lb.addListener("PublicListener", { port: 80, open: true });

    listener.addTargets("ECS", {
      port: 80,
      targets: [service.loadBalancerTarget({
        containerName: "web",
        containerPort: 80,
      })],
      healthCheck: {
        interval: cdk.Duration.seconds(60),
        path: healthCheckPath,
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
      },
      deregistrationDelay: cdk.Duration.seconds(5),
    });

    new cdk.CfnOutput(this, "LoadBalancerDNS", { value: lb.loadBalancerDnsName, });

  }
}