const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://crm_user:root@127.0.0.1:5432/task?schema=public'
});
client.connect()
  .then(() => console.log('Connected directly to PG'))
  .catch(e => console.error('Error connecting', e))
  .finally(() => client.end());
