import { ProjectionType } from '@aws-cdk/aws-dynamodb';
import * as apigw from '@aws-cdk/aws-apigateway';
import * as cdk from '@aws-cdk/core';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as lambda from '@aws-cdk/aws-lambda';

export class VortexStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

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
    new apigw.LambdaRestApi(this, 'Endpoint', {
      handler: lambdaHandler,
      defaultCorsPreflightOptions: {
        allowOrigins: ['http://localhost'],
        allowMethods: ['GET', 'PUT', 'POST'],
      },
    });
  }
}
