import dotenv from 'dotenv';
export default async () => {
  dotenv.config({ path: '.env.test' });

  const { default: initDb } = await import('@/config/init.js');
  await initDb();
  console.log('✅ Test DB initialized');
};
