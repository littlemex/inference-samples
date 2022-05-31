import { Stack, StackProps } from 'aws-cdk-lib';
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam'
import * as path from 'path';
import { Asset } from 'aws-cdk-lib/aws-s3-assets';
import { Construct } from 'constructs';
import { KeyPair } from 'cdk-ec2-key-pair';


export class Ec2Stack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const region: string = process.env.CDK_DEFAULT_REGION || "ap-northeast-1";

    // Create the Key Pair
    const key = new KeyPair(this, 'KeyPair', {
      name: 'cdk-keypair',
      description: 'Key Pair created with CDK Deployment',
      // by default the public key will not be stored in Secrets Manager
      storePublicKey: true,
    });
    key.grantReadOnPublicKey;

    const vpc = ec2.Vpc.fromLookup(this, "VPC", {
      isDefault: true
    });

    const securityGroup = new ec2.SecurityGroup(this, 'SecurityGroup', {
      vpc,
      description: 'Allow SSH (TCP port 22) and HTTP (TCP port 80) in',
      allowAllOutbound: true,
    });
    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'Allow SSH Access'
    );
    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP Access'
    );

    const role = new iam.Role(this, 'ec2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com')
    });

    role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')
    );

    // Use Deep Learning AMI(Ubuntu 18.04), Arch: x86_64
    const ami = new ec2.GenericLinuxImage({
      [region]: "ami-0eeb79c0bc2f4ed75"
    });

    // Create the Inf1 instance
    const ec2Inf1Instance = new ec2.Instance(this, 'Inf1Instance', {
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.INFERENCE1, ec2.InstanceSize.XLARGE),
      machineImage: ami,
      securityGroup: securityGroup,
      keyName: key.keyPairName,
      role: role,
      blockDevices: [
        {
          deviceName: '/dev/sda1',
          volume: ec2.BlockDeviceVolume.ebs(300),
        },
      ],
    });

    const asset = new Asset(this, 'Asset', { path: path.join(__dirname, '../src/config.sh') });
    const localPath = ec2Inf1Instance.userData.addS3DownloadCommand({
      bucket: asset.bucket,
      bucketKey: asset.s3ObjectKey,
    });

    ec2Inf1Instance.userData.addExecuteFileCommand({
      filePath: localPath,
      arguments: '--verbose -y'
    });
    asset.grantRead(ec2Inf1Instance.role);

    // Create outputs for connecting
    new cdk.CfnOutput(this, 'EC2 IP Address', { value: ec2Inf1Instance.instancePublicIp });
    new cdk.CfnOutput(this, 'Key Name', { value: key.keyPairName })
    new cdk.CfnOutput(this, 'Download Key Command', { value: 'aws secretsmanager get-secret-value --secret-id ec2-ssh-key/cdk-keypair/private --query SecretString --output text > ~/.ssh/cdk-keypair.pem && chmod 400 ~/.ssh/cdk-keypair.pem' })
    new cdk.CfnOutput(this, 'SSH Command', { value: 'ssh -i ~/.ssh/cdk-keypair.pem -o IdentitiesOnly=yes ubuntu@' + ec2Inf1Instance.instancePublicIp })
  }    
}
