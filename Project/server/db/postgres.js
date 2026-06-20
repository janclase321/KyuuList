import postgres from 'postgres'
import 'dotenv/config'

const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require'
})

async function testConnection() {
  try {
    await sql`SELECT 1`
    console.log('Database connection successful')
  } catch (error) {
    console.error('Database connection failed:', error)
  }
}

testConnection()

export default sql