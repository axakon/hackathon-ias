import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";

export const APP_NAME = "nyman";

export interface HelloAppStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  cluster: ecs.Cluster;
  loadBalancer: elbv2.ApplicationLoadBalancer;
  loadBalancerSecurityGroup: ec2.SecurityGroup;
}

export class HelloAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: HelloAppStackProps) {
    super(scope, id, props);

    // Reference the main stack resources
    const vpc = props!.vpc;
    const cluster = props!.cluster;
    const loadBalancer = props!.loadBalancer;
    const loadBalancerSecurityGroup = props!.loadBalancerSecurityGroup;

    // Create a new security group for the ECS service
    const serviceSecurityGroup = new ec2.SecurityGroup(
      this,
      `${APP_NAME}ServiceSecurityGroup`,
      {
        vpc,
        allowAllOutbound: true,
        description: "Security group for ECS Fargate service",
      }
    );

    // Create the ECS Fargate service
    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      `${APP_NAME}TaskDefinition`,
      {
        memoryLimitMiB: 512,
        cpu: 256,
      }
    );

    // Add a container to the task definition (you'll need to replace 'your-docker-image' with the actual image)
    const container = taskDefinition.addContainer(`${APP_NAME}AppContainer`, {
      image: ecs.ContainerImage.fromRegistry("nginxdemos/hello"),
      portMappings: [{ containerPort: 80 }],
    });

    const fargateService = new ecs.FargateService(
      this,
      `${APP_NAME}FargateService`,
      {
        cluster,
        taskDefinition,
        desiredCount: 1,
        assignPublicIp: true,
        securityGroups: [serviceSecurityGroup],
      }
    );

    // Add the service to the load balancer
    const listener = loadBalancer.addListener(`${APP_NAME}Listener`, {
      port: 80,
    });
    listener.addTargets(`${APP_NAME}ECS`, {
      port: 80,
      targets: [fargateService],
      healthCheck: { path: "/" },
    });
  }
}
