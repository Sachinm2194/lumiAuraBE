import * as dotenv from 'dotenv';
dotenv.config();

import { DataSource } from 'typeorm';
import * as path from 'path';

const env = process.env;

export default new DataSource({
  type: 'postgres',
  host: env.DB_HOST || 'localhost',
  port: parseInt(env.DB_PORT || '5432', 10),
  username: env.DB_USER || 'postgres',
  password: env.DB_PASSWORD || 'postgres',
  database: env.DB_NAME || 'lumiaura',

  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],

  synchronize: false,
  logging: true,
});