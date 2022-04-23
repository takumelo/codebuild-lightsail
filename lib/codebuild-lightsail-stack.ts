import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CfnOutput } from 'aws-cdk-lib';
import { aws_s3 as s3 } from 'aws-cdk-lib';
import { RemovalPolicy } from 'aws-cdk-lib';
import { aws_iam as iam } from 'aws-cdk-lib';
import { aws_lightsail as lightsail } from 'aws-cdk-lib';
import { aws_codedeploy as codedeploy } from 'aws-cdk-lib';
import { aws_codepipeline as codepipeline } from 'aws-cdk-lib';
import { aws_codepipeline_actions as codepipeline_actions } from 'aws-cdk-lib'
import { aws_codecommit as codecommit} from 'aws-cdk-lib'

import * as path from 'path';

export class CodebuildLightsailStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const deployRegion = 'ap-northeast-1'
    const lightsailAZ = 'ap-northeast-1a';
    const lightsailInsName = 'cdk-lightsail';

    // Create a service role
    const deployRole = new iam.Role(this, 'DeployRole', {
      assumedBy: new iam.ServicePrincipal('codedeploy.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSCodeDeployRole')
      ]
    });

    // Create an S3 bucket
    const artifactBacketName = "my-codedeploy-lightsail-bucket"
    const sourceBucket = new s3.Bucket(this, 'CdkBucket', {
      bucketName: artifactBacketName,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Create IAM policy
    const policy = new iam.Policy(this, 'CdkPolicy', {
      statements: [
        new iam.PolicyStatement({
          actions: ['s3:Get*', 's3:List*'],
          resources: [`arn:aws:s3:::${artifactBacketName}/*`],
        }),
      ],
    });

    // Create an IAM user
    const user = new iam.User(this, 'DeployUser');
    const cfnAccessKey = new iam.CfnAccessKey(this, 'MyCfnAccessKey', {
      userName: user.userName,
    });
    const accessKeyId = new CfnOutput(this, 'accessKeyId', { value: cfnAccessKey.ref });
    const secretAccessKey = new CfnOutput(this, 'secretAccessKey', { value: cfnAccessKey.attrSecretAccessKey });
    policy.attachToUser(user);

    // Create a Lightsail instance and install the CodeDeploy agent
    const cfninstance = new lightsail.CfnInstance(this, 'LightsailInstance', {
      blueprintId: 'amazon_linux_2',
      bundleId: 'nano_2_0',
      instanceName: lightsailInsName,
      availabilityZone: lightsailAZ,
      userData:
`sudo yum install -y ruby
mkdir /etc/codedeploy-agent/
mkdir /etc/codedeploy-agent/conf
cat <<EOT >> /etc/codedeploy-agent/conf/codedeploy.onpremises.yml
---
aws_access_key_id: ${accessKeyId.value}
aws_secret_access_key: ${secretAccessKey.value}
iam_user_arn: ${user.userArn}
region: ${deployRegion}
EOT
wget https://aws-codedeploy-us-west-2.s3.us-west-2.amazonaws.com/latest/install
chmod +x ./install
sudo ./install auto
`,
    });

    const deployAppName = 'CodeLightsailTest';
    const deploymentGroup = new codedeploy.ServerDeploymentGroup(this, 'CodeDeployGroup', {
      role: deployRole,
      application: new codedeploy.ServerApplication(this, 'CodeDeployApplication', {
        applicationName: deployAppName,
      }),
      deploymentGroupName: 'MyDeployGroup',
      deploymentConfig: codedeploy.ServerDeploymentConfig.ALL_AT_ONCE,
      onPremiseInstanceTags: new codedeploy.InstanceTagSet(
        {
          'Name': [deployAppName],
        }
      ),
    });
    
    // TODO: assign main to the default branch
    const repo = new codecommit.Repository(this, 'Repo', {
      repositoryName: 'DeployDemo',
      code: codecommit.Code.fromZipFile(path.join(__dirname, '../CodeDeployDemo.zip'), 'main'),
    });
    const deployPipelineName = 'TestPipeline';
    const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: deployPipelineName,
      artifactBucket: sourceBucket,
    });
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const sourceAction = new codepipeline_actions.CodeCommitSourceAction({
      actionName: 'CodeCommit',
      repository: repo,
      output: sourceOutput,
      branch: 'main',
    });
    pipeline.addStage({
      stageName: 'Source',
      actions: [sourceAction],
    });
    const deployAction = new codepipeline_actions.CodeDeployServerDeployAction({
      actionName: 'CodeDeploy',
      input: sourceOutput,
      deploymentGroup,
    });
    pipeline.addStage({
      stageName: 'Deploy',
      actions: [deployAction],
    });

    // if you run "cdk destroy", then need to run command below.
    // aws deploy deregister-on-premises-instance --instance-name cdk-lightsail
    const registerCmd = new CfnOutput(this, 'firstCmdRegister', { value: `aws deploy register-on-premises-instance --instance-name ${lightsailInsName} --iam-user-arn ${user.userArn} --region ${deployRegion}` });
    const tagToInsCmd = new CfnOutput(this, 'secondCmdTagToIns', { value: `aws deploy add-tags-to-on-premises-instances --instance-names ${lightsailInsName} --tags Key=Name,Value=${deployAppName} --region ${deployRegion}` })
    const releaseCmd = new CfnOutput(this, 'thirdReleaseCmd', { value: `aws codepipeline start-pipeline-execution --name ${deployPipelineName}` })
    const checkURL = new CfnOutput(this, 'CheckURL', { value: `http://${cfninstance.attrPublicIpAddress}`})
  }
}
