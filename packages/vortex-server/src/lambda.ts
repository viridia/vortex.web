import DocumentStoreDynamoDB from './db/DocumentStoreDynamoDB';
import awsServerlessExpress from 'aws-serverless-express';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { addAuthRoutes } from './routes/auth';
import { addDocRoutes } from './routes/documents';
import { addErrorRoutes } from './routes/errors';
import { app } from './app';
import { ImageStoreS3 } from './db/ImageStoreS3';
import { addImageRoutes } from './routes/images';
import 'source-map-support/register';

addAuthRoutes(app);
addDocRoutes(app, new DocumentStoreDynamoDB());
addImageRoutes(app, new ImageStoreS3());
addErrorRoutes(app);

const server = awsServerlessExpress.createServer(app);

export const handler = (event: APIGatewayProxyEvent, context: Context) => {
  awsServerlessExpress.proxy(server, event, context);
};
