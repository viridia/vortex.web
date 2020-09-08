import { DocumentStoreSQLite } from './db/DocumentStoreSQLite';
import { addAuthRoutes } from './routes/auth';
import { addDocRoutes } from './routes/documents';
import { addErrorRoutes } from './routes/errors';
import { app } from './app';

addAuthRoutes(app);
addDocRoutes(app, new DocumentStoreSQLite());
addErrorRoutes(app);

// if (process.env.STORAGE_BUCKET_IMAGES) {
//   imageStore = new S3Store();
// }

app.listen(process.env.PORT);
console.info('Server listening on port:', process.env.PORT);
