import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";

export const APP_NAME = "<insert-your-name-here>";

export class HelloIasStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly cluster: ecs.Cluster;
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly loadBalancerSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a VPC
    this.vpc = new ec2.Vpc(this, `${APP_NAME}HelloIasVpc`, {
      maxAzs: 2,
      natGateways: 0,
      ipAddresses: ec2.IpAddresses.cidr("10.0.0.0/16"),
      subnetConfiguration: [
        {
          mapPublicIpOnLaunch: true,
          cidrMask: 24,
          name: `${APP_NAME}Public`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });
    cdk.Tags.of(this.vpc).add("application", APP_NAME);

    // Create a load balancer in this VPC and add a Security Group to it
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(
      this,
      `${APP_NAME}HelloIasLoadBalancer`,
      {
        vpc: this.vpc,
        internetFacing: true,
      }
    );
    cdk.Tags.of(this.loadBalancer).add("application", APP_NAME);

    // Security Group for the Load Balancer
    this.loadBalancerSecurityGroup = new ec2.SecurityGroup(
      this,
      `${APP_NAME}HelloIasLoadBalancerSecurityGroup`,
      {
        vpc: this.vpc,
      }
    );
    cdk.Tags.of(this.loadBalancerSecurityGroup).add("application", APP_NAME);

    // A super permissive Security Group, allowing all traffic from the Load Balancer Security Group
    this.loadBalancer.connections.allowFrom(
      this.loadBalancerSecurityGroup,
      ec2.Port.allTraffic()
    );

    // Create a ECS cluster
    this.cluster = new ecs.Cluster(this, `${APP_NAME}HelloIasCluster`, {
      vpc: this.vpc,
    });

    // Output the DNS name of the Load Balancer
    new cdk.CfnOutput(this, `${APP_NAME}LoadBalancerDNS`, {
      value: this.loadBalancer.loadBalancerDnsName,
    });
  }
}
