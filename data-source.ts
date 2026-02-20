import { DataSource } from 'typeorm';
import * as path from 'path';

// Load environment variables from .env file
// This works with ts-node and doesn't require dotenv package
const env = process.env;

export default new DataSource({
  type: 'postgres',
  host: env.DB_HOST || 'localhost',
  port: parseInt(env.DB_PORT || '5432', 10),
  username: env.DB_USER || 'postgres',
  password: env.DB_PASSWORD || 'postgres',
  database: env.DB_NAME || 'lumiaura',
  entities: [path.join(__dirname, 'src/**/*.entity.ts')],
  migrations: [path.join(__dirname, 'src/migrations/*.ts')],
  synchronize: false,
  logging: true,
});

