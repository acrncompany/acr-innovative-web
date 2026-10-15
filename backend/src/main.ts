import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import compression from 'compression';
import { NextFunction, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import hbs from 'hbs';
import * as path from 'path';
import * as fs from 'fs';
import { AppModule } from './app.module';
import { env, paths } from './config/env';
import { registerHelpers } from './public/hbs-helpers';
import { noindexMiddleware, redirectMiddleware } from './seo/seo.middleware';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Behind Hostinger's proxy: trust it so req.ip / rate limits / logs see the real client IP.
  const tp = env.trustProxy;
  app.set('trust proxy', /^\d+$/.test(tp) ? parseInt(tp, 10) : tp === 'true' ? true : tp === 'false' ? false : tp);

  app.use(
    helmet({
      // UIkit sets inline styles; scripts are same-origin only. JSON-LD blocks aren't executed so need no allowance.
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:'],
          fontSrc: ["'self'", 'data:'],
          connectSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'self'"],
          upgradeInsecureRequests: env.isProd ? [] : null,
        },
      },
      crossOriginResourcePolicy: { policy: 'same-site' },
    }),
  );
  app.use(compression());
  app.use(cookieParser());
  app.useBodyParser('json', { limit: '2mb' }); // rich-text bodies can be large
  // Validate every request body against its DTO class; unknown fields are dropped.
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // SEO: noindex header for /admin and /api, 301s from old URLs (src/seo/redirects.ts), and revalidate HTML on every request.
  // (Static asset routes below set their own long cache headers, which override this default.)
  app.use(noindexMiddleware);
  app.use(redirectMiddleware);
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (!req.path.startsWith('/public/') && !req.path.startsWith('/uploads/')) res.setHeader('Cache-Control', 'no-cache');
    next();
  });

  // Static design assets (repo) and admin uploads (outside the app folder).
  fs.mkdirSync(paths.uploadDir, { recursive: true });
  app.useStaticAssets(paths.publicDir, { prefix: '/public/', maxAge: 7 * 24 * 3600 * 1000, index: false });
  app.useStaticAssets(paths.uploadDir, { prefix: '/uploads/', maxAge: 30 * 24 * 3600 * 1000, immutable: true, index: false });

  // Handlebars views: layouts/main.hbs wraps every page; partials live in views/partials.
  app.setBaseViewsDir(paths.views);
  app.setViewEngine('hbs');
  app.set('view options', { layout: 'layouts/main' });
  // Register partials ourselves so names keep their dashes ({{> seo-head}}); hbs.registerPartials turns them into underscores.
  const partialsDir = path.join(paths.views, 'partials');
  for (const file of fs.readdirSync(partialsDir)) {
    if (file.endsWith('.hbs')) hbs.registerPartial(file.slice(0, -4), fs.readFileSync(path.join(partialsDir, file), 'utf8'));
  }
  registerHelpers();

  await app.listen(env.port);
  console.log(`ACR site running on ${env.siteUrl} (port ${env.port})`);
}
bootstrap();
