# Install

```bash
npm install

export CDK_DEFAULT_REGION=us-east-1
export CDK_DEFAULT_ACCOUNT=(AWS Account ID)
export CDK_DEFAULT_AMI=(AMI ID) # Note that the AMI ID is different for each region
export CDK_DEFAULT_PROJECT_NAME=id00000

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
