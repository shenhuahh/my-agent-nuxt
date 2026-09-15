// test-connection.mjs
import postgres from 'postgres';
import 'dotenv/config';

const sql = postgres(process.env.DATABASE_URL, {
  ssl: { rejectUnauthorized: false }
});

try {
  const result = await sql`SELECT 1 as connected`;
  console.log('数据库连接成功:', result);
  await sql.end();
} catch (error) {
  console.error('数据库连接失败:', error);
}