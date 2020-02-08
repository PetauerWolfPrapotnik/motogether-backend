require('dotenv').config();
import Hapi from '@hapi/hapi';
import Inert from '@hapi/inert';
import Vision from '@hapi/vision';
import HapiSwagger from 'hapi-swagger';

import environment from './environment';
import db from './db.service';
import authModule from './modules/auth.module';
import emailService from './email.service';
import pathModule from './modules/path.module';

const server = new Hapi.Server({
  port: environment.PORT,
  uri: environment.BASE_URL,
  // Nginx
  compression: false,
  debug: {
    log: environment.DEBUG ? ['error', 'database', 'read'] : false,
    request: environment.DEBUG ? ['error', 'database', 'read'] : false
  }
});

//
// Handlers
//

const start = async () => {
  const swaggerOptions: HapiSwagger.RegisterOptions = {
    info: {
      title: 'API Documentation',
      version: 'v0.1',
    },
    grouping: 'tags',

    // Disable swagger UI
    // swaggerUI: false,
    // documentationPage: false,

    // Get host from BASE_URL
    //schemes: [environment.BASE_URL.split('://')[0]],
    //host: environment.BASE_URL.split('/')[2],
    //basePath: '/' + environment.BASE_URL.split('/').slice(3).join('/')
  };

  await server.register([
    Inert,
    Vision,
  ]);
  await server.register({
    plugin: HapiSwagger,
    options: swaggerOptions
  });

  console.log(`Registering modules: `);
  await authModule(server);
  await pathModule(server);
  // await mangaModule(server);

  console.log(`Connecting to DB`);
  await db.connect();
  console.log(`Connecting to SMTP`);
  await emailService.verify();

  console.log(`Starting server: `);
  await server.start();
  console.log(` - Listening on port ${server.settings.port}`);
  console.log(` - Connect on ${environment.BASE_URL}`);

  console.log(`Server started`);
  console.log(`Ctrl-C to exit`);
};
const stop = async () => {
  console.log(`Stopping server...`);

  await server.stop();
  // await mongoose.disconnect();

  process.exit();
};

//
// Environment
//

process.on('unhandledRejection', (err) => {
  console.log(err);
  stop();
});

process.on('SIGINT', () => {
  console.log('Caught interrupt signal');
  stop();
});

start();
