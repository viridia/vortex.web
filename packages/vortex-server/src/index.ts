import { DocumentStoreSQLite } from './db/DocumentStoreSQLite';
import { addAuthRoutes } from './routes/auth';
import { addDocRoutes } from './routes/documents';
import { app } from './app';

// Server setup for local development.
async function start() {
  addAuthRoutes(app);
  // if (process.env.STORAGE_BUCKET_IMAGES) {
  //   imageStore = new S3Store();
  // }

  // if (process.env.AWS_DOC_REGION) {
  //   docStore = new DynamoDbStore();
  //   await docStore.init();
  // } else if (process.env.RETHINKDB_URL) {
  //   docStore = new RethinkDBStore();
  //   await docStore.init();
  // }
  const docStore = new DocumentStoreSQLite();
  await docStore.init();
  addDocRoutes(app, docStore);

  app.listen(process.env.PORT);
  console.info('Server listening on port:', process.env.PORT);
}

start();
