# gatsby demo on lightsail deployed by codepipeline

gatsby demo for AWS Cloud Development Kit

This constructs below.

![codebuild_lightsail_cdk](https://user-images.githubusercontent.com/50583728/178142356-7874a7d5-aadf-490e-9254-fc2ff0994f2a.png)

# Deploy

Run `cdk deploy`. And you'll see outputs like below.

![screenshot](https://user-images.githubusercontent.com/50583728/164890060-f178a52a-4c9f-473c-b46c-a3ec707c9590.png)

Next, run commands following the outputs.

1. `aws deploy register-on-premises-instance ~`
1. `aws deploy add-tags-to-on-premises-instances ~`
1. `aws codepipeline start-pipeline-execution ~`

Finally, access the URL on browser. You'll see deployed page.

# Destroy

1. `aws deploy deregister --instance-name cdk-lightsail --region ap-northeast-1`
1. `aws deploy remove-tags-from-on-premises-instances --tags Key=Name,Value=CodeLightsailTest --instance-names cdk-lightsail`

# Reference
- https://aws.amazon.com/jp/blogs/compute/using-aws-codedeploy-and-aws-codepipeline-to-deploy-applications-to-amazon-lightsail/
