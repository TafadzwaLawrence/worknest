import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  // Supabase / PostgreSQL connection string (takes priority)
  url: process.env.DATABASE_URL,
}));
