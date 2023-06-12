# Install

```bash
npm install

export CDK_DEFAULT_ACCOUNT=(AWS Account ID)
export CDK_DEFAULT_ARCH=arm64
export CDK_DEFAULT_REGION=us-east-1
export CDK_DEFAULT_AMI=$(aws ec2 describe-images --region $CDK_DEFAULT_REGION --owners amazon --filters "Name=name,Values=ubuntu/images/hvm-ssd/ubuntu-*-20.04-${CDK_DEFAULT_ARCH}-server-*" 'Name=state,Values=available' --query 'reverse(sort_by(Images, &CreationDate))[:1].ImageId' --output text) 
export CDK_DEFAULT_PROJECT_NAME=id00026
export CDK_DEFAULT_INSTANCE_CLASS=c7g
export CDK_DEFAULT_INSTANCE_SIZE=xlarge
export CDK_DEFAULT_VOL_SIZE=500


npx cdk bootstrap # If needed.
npx cdk deploy
```

# Welcome to your CDK TypeScript project

You should explore the contents of this project. It demonstrates a CDK app with an instance of a stack (`GpuStack`)
which contains an Amazon SQS queue that is subscribed to an Amazon SNS topic.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template
