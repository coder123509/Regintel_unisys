import pkg from 'pg'
import dns from 'dns'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

// 1. DYNAMIC ROOT PATH RESOLUTION FOR .env
// Resolves the path from backend/database/config/db.js going up 3 levels to the root directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

// Debug prints to verify the environment successfully mounted
console.log("--- DEBUG: DB_HOST INJECTED ---", process.env.DATABASE_URL ? "FOUND ✅" : "NOT FOUND ❌");

// Force IPv4 resolution to prevent local loopback delays
dns.setDefaultResultOrder('ipv4first')

const { Pool, defaults } = pkg

// Ensure default connection sockets use standard IPv4 families
defaults.family = 4

// Strip out query parameters from the Neon URL string if present 
// (e.g. ?sslmode=require) to prevent them overriding our pool object options below
const cleanURI = process.env.DATABASE_URL ? process.env.DATABASE_URL.split('?')[0] : null;

const pool = new Pool({
  connectionString: cleanURI,
  // Force active encryption handshakes across the open internet to Neon Cloud
  ssl: {
    rejectUnauthorized: false, // Allows connection without requiring local root certificate installation
    require: true
  },
  max: 10, 
  min: 2,
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 60000,
})

// Connection diagnostic event bindings
pool.on('connect', () => {
  // Database client connected successfully
})

pool.on('error', (err) => {
  console.error('Unexpected database pool connection socket degradation:', err);
})

/**
 * Global Query Execution Wrapper with Transient Fault Mitigation
 */
export async function query(text, params, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await pool.query(text, params);
      return res;
    } catch (err) {
      // Track standard serverless network connection slip indicators
      const isTransient = 
        ['ETIMEDOUT', 'ECONNRESET', 'ENETUNREACH', 'PROTOCOL_CONNECTION_LOST'].includes(err.code) ||
        err.message?.includes('SSL'); 

      if (!isTransient || i === retries - 1) {
        throw err;
      }

      // Exponential Backoff Delay spacing out reconnection checks
      await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
    }
  }
}

export default pool;