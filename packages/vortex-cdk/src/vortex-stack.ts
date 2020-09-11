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
const API_DOMAIN = `api.${SITE_DOMAIN}`;
const SITE_URL = `https://${SITE_DOMAIN}`;
const API_URL = `https://${API_DOMAIN}`;

export class VortexStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const zone = route53.HostedZone.fromLookup(this, 'Zone', { domainName: SITE_DOMAIN });
    new cdk.CfnOutput(this, 'Site', { value: SITE_URL });

    // Content bucket
    const siteBucket = new s3.Bucket(this, 'SiteBucket', {
      bucketName: SITE_DOMAIN,
      websiteIndexDocument: 'index.html',
      publicReadAccess: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT recommended for production code
    });
    new cdk.CfnOutput(this, 'Bucket', { value: siteBucket.bucketName });

    // TLS certificate
    const certificateArn = new acm.DnsValidatedCertificate(this, 'SiteCertificate', {
      domainName: SITE_DOMAIN,
      hostedZone: zone,
      region: 'us-east-1', // Cloudfront only checks this region for certificates.
      subjectAlternativeNames: [`www.${SITE_DOMAIN}`, `api.${SITE_DOMAIN}`],
      validationDomains: {
        [SITE_DOMAIN]: SITE_DOMAIN,
        ['www.${SITE_DOMAIN}']: SITE_DOMAIN,
        ['api.${SITE_DOMAIN}']: SITE_DOMAIN,
      },
    }).certificateArn;
    const certificate = acm.Certificate.fromCertificateArn(this, 'certificate', certificateArn);
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

    // Bucket for storing uploaded images
    const imagesBucket = new s3.Bucket(this, 'VortexImagesBucket', {
      bucketName: 'vortex-image-uploads',
      publicReadAccess: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET],
          allowedOrigins: apigw.Cors.ALL_ORIGINS,
        },
      ],
    });
    new cdk.CfnOutput(this, 'ImagesBucket', { value: imagesBucket.bucketName });

    // https://vortex-image-uploads.s3.amazonaws.com/bw00hul
    // Express request handler
    const lambdaHandler = new lambda.Function(this, 'VortexServiceHandler', {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: lambda.Code.fromAsset('../vortex-server/build'),
      handler: 'handler.handler',
      environment: {
        PUBLIC_URL: SITE_URL,
        SERVER_URL: API_URL,
        UPLOADS_TMP_DIR: '/tmp/vortex',
        JWT_SECRET: process.env.JWT_SECRET || '',
        GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || '',
        GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || '',
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
        AWS_DDB_TABLE_DOCUMENTS: documents.tableName,
        AWS_DDB_TABLE_COUNTERS: counters.tableName,
        STORAGE_BUCKET_IMAGES: imagesBucket.bucketName,
      },
    });

    // Grant permissions needed.
    documents.grantReadWriteData(lambdaHandler);
    counters.grantReadWriteData(lambdaHandler);
    imagesBucket.grantReadWrite(lambdaHandler);

    // defines an API Gateway REST API resource backed by our app handler.
    const api = new apigw.LambdaRestApi(this, 'VortexServiceEndpoint', {
      handler: lambdaHandler,
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS, // ['http://localhost', ],
        allowMethods: ['GET', 'PUT', 'POST'],
      },
      domainName: {
        domainName: API_DOMAIN,
        endpointType: apigw.EndpointType.REGIONAL,
        certificate,
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

    // Route53 alias record for the API endpoint
    new route53.ARecord(this, 'APISiteAliasRecord', {
      recordName: API_DOMAIN,
      target: route53.RecordTarget.fromAlias(new targets.ApiGateway(api)),
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
