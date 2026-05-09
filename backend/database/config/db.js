import pkg from 'pg'
import dns from 'dns'
import 'dotenv/config'

dns.setDefaultResultOrder('ipv4first')

const { Pool, defaults } = pkg

defaults.family = 4

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 5,
  min: 1,
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 60000,
})

export async function query(text, params, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await pool.query(text, params)
    } catch (err) {
      const transient =
        ['ETIMEDOUT', 'ECONNRESET', 'ENETUNREACH'].includes(err.code)

      if (!transient || i === retries - 1) throw err

      await new Promise(r => setTimeout(r, 2000 * (i + 1)))
    }
  }
}

export default pool