const url = require('url')
const { Pool } = require('pg')

const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 200000,
  connectionTimeoutMillis: 200000
  //long timeouts used for development mode
})

pool.on('error', (err, client) => {
    console.error("idle client error", err)
    process.exit(-1)
  })

module.exports = { pool }
