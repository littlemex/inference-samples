import { Stack, StackProps } from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam"
import * as path from "path";
import { Asset } from "aws-cdk-lib/aws-s3-assets";
import { Construct } from "constructs";
import { KeyPair } from "cdk-ec2-key-pair";


export class EC2Stack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const region: string = process.env.CDK_DEFAULT_REGION || "us-east-1";
    const imageId: string = process.env.CDK_DEFAULT_AMI || "ami-0dc2e3e2f9cca7c15";
    type Az = string | undefined;
    const az: Az = process.env.CDK_DEFAULT_AZ || undefined;
    const projectName: string = process.env.CDK_DEFAULT_PROJECT_NAME || "id00000";

    const volSize = process.env.CDK_DEFAULT_VOL_SIZE !== undefined
      ? parseInt(process.env.CDK_DEFAULT_VOL_SIZE, 10)
      : 500;

    const instanceClassString: string = process.env.CDK_DEFAULT_INSTANCE_CLASS || "g4dn";
    const instanceClass = Object.values(ec2.InstanceClass).find(
      //(key) => ec2.InstanceClass[key as keyof typeof ec2.InstanceClass] === instanceClassString
      (value) => value === instanceClassString
    ) || ec2.InstanceClass.G4DN;
    
    const instanceSizeString: string = process.env.CDK_DEFAULT_INSTANCE_SIZE || "xlarge";
    const instanceSize = Object.values(ec2.InstanceSize).find(
      //(key) => ec2.InstanceSize[key as keyof typeof ec2.InstanceSize] === instanceSizeString
      (value) => value === instanceSizeString
    ) || ec2.InstanceSize.XLARGE;

    //workaround: ec2.InstanceClass で enum 使うのやめろ・・、enum に追記できないから union 使ってほしい
    let instancetype: ec2.InstanceType;
    if (instanceClassString == 'trn1' || instanceClassString == 'trainium1' ) {
      const instancetypestr: string = `trn1.${instanceSize}`;
      console.log("instancetype:", instancetypestr);
      instancetype = new ec2.InstanceType(instancetypestr);
    } else {
      instancetype = ec2.InstanceType.of(instanceClass, instanceSize);
      console.log("instancetype:", `${instanceClass}.${instanceSize}`);
    }

    const key = new KeyPair(this, "KeyPair", {
      name: "cdk-keypair-"+projectName,
      description: "Key Pair created with CDK Deployment",
      storePublicKey: true,
    });

    const vpc = ec2.Vpc.fromLookup(this, "VPC", {
      isDefault: true
    });

    const securityGroup = new ec2.SecurityGroup(this, "SecurityGroup", {
      vpc,
      description: "Allow SSH (TCP port 22) and HTTP (TCP port 80) in",
      allowAllOutbound: true,
    });
    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      "Allow SSH Access"
    );
    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      "Allow HTTP Access"
    );

    const role = new iam.Role(this, "ec2Role", {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com")
    });

    role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore")
    );

    // Use Deep Learning AMI(Ubuntu 18.04), Arch: x86_64
    const ami = new ec2.GenericLinuxImage({
      [region]: imageId,
    });

    const ec2Instance = new ec2.Instance(this, "ec2Instance", {
      vpc,
      instanceType: instancetype,
      machineImage: ami,
      securityGroup: securityGroup,
      keyName: key.keyPairName,
      availabilityZone: az,
      role: role,
      blockDevices: [
        {
          deviceName: "/dev/sda1",
          volume: ec2.BlockDeviceVolume.ebs(volSize),
        },
      ],
    });

    const asset = new Asset(this, "Asset", { path: path.join(__dirname, "../src/config.sh") });
    const localPath = ec2Instance.userData.addS3DownloadCommand({
      bucket: asset.bucket,
      bucketKey: asset.s3ObjectKey,
    });

    ec2Instance.userData.addExecuteFileCommand({
      filePath: localPath,
      arguments: "--verbose -y"
    });
    asset.grantRead(ec2Instance.role);

    new cdk.CfnOutput(this, "EC2 IP Address", { value: ec2Instance.instancePublicIp });
    new cdk.CfnOutput(this, "Key Name", { value: key.keyPairName })
    new cdk.CfnOutput(this, "Download Key Command", { value: "aws secretsmanager get-secret-value --secret-id ec2-ssh-key/cdk-keypair-"+projectName+"/private --query SecretString --output text > ~/.ssh/cdk-keypair-"+projectName+".pem && chmod 400 ~/.ssh/cdk-keypair-"+projectName+".pem" })
    new cdk.CfnOutput(this, "Ubuntu SSH Command", { value: "ssh -i ~/.ssh/cdk-keypair-"+projectName+".pem -o IdentitiesOnly=yes ubuntu@" + ec2Instance.instancePublicIp })
    new cdk.CfnOutput(this, "Amazon Linux2 SSH Command", { value: "ssh -i ~/.ssh/cdk-keypair-"+projectName+".pem -o IdentitiesOnly=yes ec2-user@" + ec2Instance.instancePublicIp })
  }    
}
function indexOf(arg0: ec2.InstanceClass[]) {
  throw new Error("Function not implemented.");
}

