import { DocumentStoreSQLite } from './db/DocumentStoreSQLite';
import { addAuthRoutes } from './routes/auth';
import { addDocRoutes } from './routes/documents';
import { addErrorRoutes } from './routes/errors';
import { app } from './app';
import { addImageRoutes } from './routes/images';
import { ImageStoreS3 } from './db/ImageStoreS3';

addAuthRoutes(app);
addDocRoutes(app, new DocumentStoreSQLite());
addImageRoutes(app, new ImageStoreS3());
addErrorRoutes(app);

app.listen(process.env.PORT);
console.info('Server listening on port:', process.env.PORT);
