import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import cookieParser from 'cookie-parser';


async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Serve static files from 'uploads' folder
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/', // URL prefix for accessing images
  });

  app.use(cookieParser());
  // Enable CORS
  app.enableCors({
    origin: ['http://localhost:3000', 'https://your-frontend-domain.com'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Raw body middleware for Stripe webhooks
  app.use('/payments/webhook', (req, res, next) => {
    if (req.originalUrl === '/payments/webhook') {
      next();
    } else {
      next();
    }
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      validationError: {
        target: false,
        value: false,
      },
    }),
  );

  const port = process.env.PORT ?? 9000;
  await app.listen(port);
  
  console.log(`🚀 Server running on http://localhost:${port}`);
  
}
bootstrap();
