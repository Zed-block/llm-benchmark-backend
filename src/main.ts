import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: {
      credentials: true,
      origin: ['http://localhost:3000', 'http://localhost:8080','https://llmbenchmarking-frontend-867300918389.asia-south2.run.app'],
    },
  });

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  const express = app.getHttpAdapter().getInstance();
  const configService: ConfigService = app.get(ConfigService);

  app.useGlobalPipes(new ValidationPipe({ skipMissingProperties: false }));

  app.use(compression());
  app.use(cookieParser());
  app.use(bodyParser.json({ limit: '150mb' }));
  app.use(bodyParser.urlencoded({ limit: '150mb', extended: true }));
  app.set('view engine', 'ejs');
  app.set('views', './views');
  const PORT = configService.get('PORT');

  await app.listen(PORT);
  console.log(`Server started at http://localhost:${PORT}`, PORT);
}
bootstrap();
