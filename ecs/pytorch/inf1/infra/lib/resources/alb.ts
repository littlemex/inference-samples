import ec2 = require('aws-cdk-lib/aws-ec2');
import ecs = require('aws-cdk-lib/aws-ecs');
import elbv2 = require('aws-cdk-lib/aws-elasticloadbalancingv2');
import cdk = require('aws-cdk-lib');
import { Construct } from 'constructs';

export class ALB {
  vpc: ec2.IVpc;
  constructor(vpc: ec2.IVpc) {
    this.vpc = vpc
  }

  public createResources(scope: Construct) {
    const context = scope.node.tryGetContext('ecs-cluster');
    const securityGroup = new ec2.SecurityGroup(scope, 'SecurityGroup', {
      vpc: this.vpc,
      description: 'Allow ssh access to ec2 instances',
      allowAllOutbound: true,
    });
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'port 22');
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'port 80');
    const lb = new elbv2.ApplicationLoadBalancer(scope, 'LB', {
      vpc: this.vpc,
      internetFacing: true,
      securityGroup: securityGroup,
    });

    new cdk.CfnOutput(scope, 'LoadBalancerDNS', { value: lb.loadBalancerDnsName, });
  }
}