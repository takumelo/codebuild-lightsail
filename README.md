# codebuild-lightsail

demo for AWS Cloud Development Kit

This constructs below.

![codebuild_lightsail_cdk](https://user-images.githubusercontent.com/50583728/164890057-b58fad1f-826e-4c45-8c60-f1f94019515d.png)

# Deploy

Run `cdk deploy`. And you'll see outputs like below.

![screenshot](https://user-images.githubusercontent.com/50583728/164890060-f178a52a-4c9f-473c-b46c-a3ec707c9590.png)

Next, run commands following the outputs.

1. aws deploy register-on-premises-instance ~
1. aws deploy add-tags-to-on-premises-instances ~
1. aws codepipeline start-pipeline-execution ~

Finally, access the URL on browser. You'll see deployed page.

# Reference
https://aws.amazon.com/jp/blogs/compute/using-aws-codedeploy-and-aws-codepipeline-to-deploy-applications-to-amazon-lightsail/
https://github.com/mikegcoleman/codedeploygithubdemo

This repo includes above source code as `CodeDeployDemo.zip`. Thanks.
