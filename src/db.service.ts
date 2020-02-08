import { Client } from 'pg';

import environment from './environment';

export default new Client({
  connectionString: environment.POSTGRESQL_URI
});
