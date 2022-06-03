import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { Construct } from 'constructs';

export class EcrStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    new ecr.Repository(this, 'ModelRepo', {
      imageScanOnPush: true,
      repositoryName: 'model'
    });

    new ecr.Repository(this, 'WebRepo', {
      imageScanOnPush: true,
      repositoryName: 'web'
    });
  }
}
