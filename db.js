const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'COLE_AQUI_A_SUA_EXTERNAL_DATABASE_URL_DO_RENDER',
    ssl: {
        rejectUnauthorized: false
    }
});

module.exports = { pool };