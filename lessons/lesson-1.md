# Creating our basic infrastructure

We're going to create our "base infrastructure" using a VPC, Load Balancer and Security Group.
The idea is that we can use this base infrastructure to later deploy our application into, using a different stack that is dedicated to our application.

We've setup a const variable that we can use to tag all our resources, so we know what application they belong to. In our case, we use this to separate everyone's environment because we're multiple people working on this project.
```typescript
const APP_NAME = "<insert-your-name-here>";
```

### Networking

We need to setup a VPC, this is basically defining your network in AWS.
This is a very basic VPC, with a network spanning from 10.0.0.0/16. (10.0.0.0 -> 10.0.255.255)

We create 1 subnet, of type PUBLIC, which means that it will have a public IP address. If we did not set this subnet to PUBLIC, our application could not access the internet.
(It can, however, still access other AWS resources within the VPC, like the Load Balancer we're going to setup next)
```typescript
// Create a VPC
const vpc = new cdk.aws_ec2.Vpc(this, "HelloIasVpc", {
    maxAzs: 1,
    natGateways: 0,
    ipAddresses: cdk.aws_ec2.IpAddresses.cidr("10.0.0.0/16"),
    subnetConfiguration: [
    {
        mapPublicIpOnLaunch: true,
        cidrMask: 24,
        name: "Public",
        subnetType: cdk.aws_ec2.SubnetType.PUBLIC,
    },
    ],
});
cdk.Tags.of(vpc).add("application", APP_NAME);
```

### Load Balancer

We need to setup a Load Balancer, this is basically a proxy that will route traffic to our application.
```typescript
// Create a load balancer in this VPC and add a Security Group to it
const loadBalancer =
    new cdk.aws_elasticloadbalancingv2.ApplicationLoadBalancer(
    this,
    "HelloIasLoadBalancer",
    {
        vpc,
        internetFacing: true,
    }
    );
cdk.Tags.of(loadBalancer).add("application", APP_NAME);
```

### Security Group

Now, nothing will be able to access our Load Balancer yet, so we need to create a Security Group that will allow traffic from the outside world.
```typescript
// Security Group for the Load Balancer
const loadBalancerSecurityGroup = new cdk.aws_ec2.SecurityGroup(
    this,
    "HelloIasLoadBalancerSecurityGroup",
    {
        vpc,
    }
);
cdk.Tags.of(loadBalancerSecurityGroup).add("application", APP_NAME);

// A super permissive Security Group, allowing all traffic from the Load Balancer Security Group
loadBalancer.connections.allowFrom(
    loadBalancerSecurityGroup,
    cdk.aws_ec2.Port.allTraffic()
);
```

### ECS Cluster

ECS is a service that allows us to run Docker containers on AWS. It's a very basic version of what Kubernetes is, but it's enough for our purposes.

```typescript
// Create a ECS cluster
const cluster = new cdk.aws_ecs.Cluster(this, "HelloIasCluster", {
    vpc,
});
```

## Deploying our infrastructure

### Bootstrapping

We need to bootstrap our account and region so the CDK can deploy our infrastructure.
```bash
cdk bootstrap
```
This will create a CloudFormation stack in your account that will allow the CDK to deploy resources into this account and region.

### Diffing and Deploying

We're going to use the AWS CDK CLI to deploy our infrastructure.
```bash
cdk diff // This will show you the changes that are going to be applied
cdk deploy // This will apply the changes
```

You'll get a prompt if you wanna run the changes or not. If you are happy with them, you can type 'y' and press enter.
This will trigger a new deployment, please do not close the terminal until it's done.
