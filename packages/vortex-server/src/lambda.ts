import DocumentStoreDynamoDB from './db/DocumentStoreDynamoDB';
import awsServerlessExpress from 'aws-serverless-express';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { addAuthRoutes } from './routes/auth';
import { addDocRoutes } from './routes/documents';
import { addErrorRoutes } from './routes/errors';
import { app } from './app';

addAuthRoutes(app);
addDocRoutes(app, new DocumentStoreDynamoDB());
addErrorRoutes(app);

// if (process.env.STORAGE_BUCKET_IMAGES) {
//   imageStore = new S3Store();
// }

const server = awsServerlessExpress.createServer(app);

export const handler = (event: APIGatewayProxyEvent, context: Context) => {
  awsServerlessExpress.proxy(server, event, context);
};
