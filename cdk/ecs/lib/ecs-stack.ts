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
    const webRepoName: string = "web";
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
        [`${region}`]: imageID,
      }),
      minCapacity: 1,
      maxCapacity: 2,
    });

    const capacityProvider = new ecs.AsgCapacityProvider(this, "CapacityProvider", {
      autoScalingGroup: autoScalingGroup,
      capacityProviderName: "capacity-provider",
      enableManagedScaling: true,
      targetCapacityPercent: 100,
      enableManagedTerminationProtection: false,
    });
    cluster.addAsgCapacityProvider(capacityProvider);

    const modelLogging = new ecs.AwsLogDriver({ streamPrefix: "model-server" });
    const webLogging = new ecs.AwsLogDriver({ streamPrefix: "web-server" });

    const modelImage = ecs.ContainerImage.fromEcrRepository(
      ecr.Repository.fromRepositoryName(this, "ModelImage", modeRepoName),
    );
    const webImage = ecs.ContainerImage.fromEcrRepository(
      ecr.Repository.fromRepositoryName(this, "webImage", webRepoName),
    );

    const taskDefinition = new ecs.Ec2TaskDefinition(this, "TaskDef", {
      networkMode: ecs.NetworkMode.AWS_VPC,
    });
    const linuxParameters = new ecs.LinuxParameters(this, 'LinuxParameters');
    linuxParameters.addDevices({
      containerPath: "/dev/neuron0",
      hostPath: "/dev/neuron0",
      permissions: [ecs.DevicePermission.READ, ecs.DevicePermission.WRITE],
    });
    linuxParameters.addCapabilities(ecs.Capability.IPC_LOCK);

    const modelContainer = taskDefinition.addContainer("model", {
      // https://docs.aws.amazon.com/cdk/api/v1/docs/@aws-cdk_aws-ecs.ContainerDefinitionOptions.html
      image: modelImage,
      memoryLimitMiB: 2048,
      cpu: 0,
      essential: true,
      logging: modelLogging,
      environment: {
        ECS_IMAGE_PULL_BEHAVIOR: "default",
        PORT: "8080",
        VERSION: "1"
      },
      memoryReservationMiB: 1000,
      linuxParameters: linuxParameters,
    });

    const webContainer = taskDefinition.addContainer("web", {
      // https://docs.aws.amazon.com/cdk/api/v1/docs/@aws-cdk_aws-ecs.ContainerDefinitionOptions.html
      image: webImage,
      memoryLimitMiB: 2048,
      cpu: 0,
      essential: true,
      logging: webLogging,
      environment: {
        ECS_IMAGE_PULL_BEHAVIOR: "default",
        ENDPOINT_URL: "http://localhost:8080/inferences",
        VERSION: "1"
      },
      memoryReservationMiB: 1000,
    });

    webContainer.addPortMappings({
      containerPort: 80,
      hostPort: 80,
      protocol: ecs.Protocol.TCP
    });

    modelContainer.addPortMappings({
      containerPort: 8080,
      hostPort: 8080,
      protocol: ecs.Protocol.TCP
    });

    taskDefinition.defaultContainer = webContainer

    const service = new ecs.Ec2Service(this, "Service", {
      cluster: cluster,
      taskDefinition: taskDefinition,
      capacityProviderStrategies: [
        { capacityProvider: capacityProvider.capacityProviderName, weight: 1 }
      ],
      maxHealthyPercent: 200,
      minHealthyPercent: 100,
    });

    service.addPlacementConstraints(
      ecs.PlacementConstraint.distinctInstances(),
    )

    const lb = new elbv2.ApplicationLoadBalancer(this, "LB", {
      vpc,
      internetFacing: true,
      securityGroup: securityGroup,
    });
    const listener = lb.addListener("PublicListener", {port: 80, open: true});

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