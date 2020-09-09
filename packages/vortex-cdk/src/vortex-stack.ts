import { ProjectionType } from '@aws-cdk/aws-dynamodb';
import * as acm from '@aws-cdk/aws-certificatemanager';
import * as apigw from '@aws-cdk/aws-apigateway';
import * as cdk from '@aws-cdk/core';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as lambda from '@aws-cdk/aws-lambda';
import * as route53 from '@aws-cdk/aws-route53';
import * as targets from '@aws-cdk/aws-route53-targets/lib';
import * as s3 from '@aws-cdk/aws-s3';
import * as s3deploy from '@aws-cdk/aws-s3-deployment';
import * as path from 'path';

const SITE_CONTENT_DIR = path.resolve(__dirname, '../../vortex-client/build');
const SITE_DOMAIN = process.env.SITE_DOMAIN || '';

export class VortexStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const zone = route53.HostedZone.fromLookup(this, 'Zone', { domainName: SITE_DOMAIN });
    new cdk.CfnOutput(this, 'Site', { value: 'https://' + SITE_DOMAIN });

    // Content bucket
    const siteBucket = new s3.Bucket(this, 'SiteBucket', {
      bucketName: SITE_DOMAIN,
      websiteIndexDocument: 'index.html',
      // websiteErrorDocument: 'error.html',
      publicReadAccess: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT recommended for production code
    });
    new cdk.CfnOutput(this, 'Bucket', { value: siteBucket.bucketName });

    // TLS certificate
    const certificateArn = new acm.DnsValidatedCertificate(this, 'SiteCertificate', {
      domainName: SITE_DOMAIN,
      hostedZone: zone,
      region: 'us-east-1', // Cloudfront only checks this region for certificates.
      subjectAlternativeNames: [`*.${SITE_DOMAIN}`],
      validationDomains: {
        [SITE_DOMAIN]: SITE_DOMAIN,
        [`*.${SITE_DOMAIN}`]: SITE_DOMAIN
      },
    }).certificateArn;
    new cdk.CfnOutput(this, 'Certificate', { value: certificateArn });

    // Counters table
    const counters = new dynamodb.Table(this, 'TableDocuments', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      tableName: 'Counters',
      readCapacity: 10,
      writeCapacity: 10,
    });

    // Documents table
    const documents = new dynamodb.Table(this, 'TableCounters', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      tableName: 'Documents',
      readCapacity: 10,
      writeCapacity: 10,
    });
    documents.addGlobalSecondaryIndex({
      indexName: 'creator_index',
      partitionKey: { name: 'creator', type: dynamodb.AttributeType.STRING },
      projectionType: ProjectionType.ALL,
      readCapacity: 10,
      writeCapacity: 10,
    });

    // Express handelr
    const lambdaHandler = new lambda.Function(this, 'VortexServiceHandler', {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: lambda.Code.fromAsset('../vortex-server/build'),
      handler: 'handler.handler',
      environment: {
        PUBLIC_URL: process.env.PUBLIC_URL || '',
        SERVER_URL: process.env.SERVER_URL || '',
        JWT_SECRET: process.env.JWT_SECRET || '',
        GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || '',
        GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || '',
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
        AWS_DDB_TABLE_DOCUMENTS: documents.tableName,
        AWS_DDB_TABLE_COUNTERS: counters.tableName,
      },
    });

    // Grant permissions needed.
    documents.grantReadWriteData(lambdaHandler);
    counters.grantReadWriteData(lambdaHandler);

    // defines an API Gateway REST API resource backed by our app handler.
    const api = new apigw.LambdaRestApi(this, 'Endpoint', {
      handler: lambdaHandler,
      defaultCorsPreflightOptions: {
        allowOrigins: ['http://localhost', 'https://vortex.run'],
        allowMethods: ['GET', 'PUT', 'POST'],
      },
    });

    // CloudFront distribution that provides HTTPS
    const distribution = new cloudfront.CloudFrontWebDistribution(this, 'SiteDistribution', {
      aliasConfiguration: {
        acmCertRef: certificateArn,
        names: [SITE_DOMAIN],
        sslMethod: cloudfront.SSLMethod.SNI,
        securityPolicy: cloudfront.SecurityPolicyProtocol.TLS_V1_1_2016,
      },
      errorConfigurations: [
        {
          errorCode: 403,
          responseCode: 200,
          responsePagePath: '/index.html',
        },
        {
          errorCode: 404,
          responseCode: 200,
          responsePagePath: '/index.html',
        },
      ],
      originConfigs: [
        {
          customOriginSource: {
            domainName: siteBucket.bucketWebsiteDomainName,
            originProtocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
          },
          behaviors: [{ isDefaultBehavior: true }],
        },
      ],
    });

    // distribution.

    // distribution.addBehavior('/images/*.jpg', new origins.S3Origin(myBucket), {
    //   viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    // });

    new cdk.CfnOutput(this, 'DistributionId', { value: distribution.distributionId });

    // Route53 alias record for the CloudFront distribution
    new route53.ARecord(this, 'SiteAliasRecord', {
      recordName: SITE_DOMAIN,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
      zone,
    });

    // Also alias for 'www.'.
    new route53.CnameRecord(this, 'WWWSiteCnameRecord', {
      recordName: `www.${SITE_DOMAIN}`,
      domainName: SITE_DOMAIN,
      zone,
    });

    // Deploy site contents to S3 bucket
    new s3deploy.BucketDeployment(this, 'DeployWithInvalidation', {
      sources: [s3deploy.Source.asset(SITE_CONTENT_DIR)],
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ['/*'],
    });
  }
}
