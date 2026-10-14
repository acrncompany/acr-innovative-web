import 'dotenv/config';
import * as path from 'path';

/**
 * Central place for environment settings and filesystem locations.
 * Relative paths in .env (e.g. UPLOAD_DIR=../../acr-data/uploads) are resolved from the backend/ folder.
 */
const backendRoot = path.resolve(__dirname, '..', '..'); // dist/config -> backend/

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required environment variable ${name} (see .env.example)`);
  return v;
}

export const env = {
  isProd: process.env.NODE_ENV === 'production',
  port: parseInt(process.env.PORT || '3000', 10),
  /** Public base URL without trailing slash, used for canonical/OG/sitemap. */
  siteUrl: (process.env.SITE_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/+$/, ''),
  trustProxy: process.env.TRUST_PROXY ?? '1',
  databaseUrl: required('DATABASE_URL'),
};

export const paths = {
  backendRoot,
  views: path.join(backendRoot, 'views'),
  publicDir: path.join(backendRoot, 'public'),
  /** Admin-uploaded images, served at /uploads. Must live outside the app folder in production. */
  uploadDir: path.resolve(backendRoot, process.env.UPLOAD_DIR || '../../acr-data/uploads'),
  /** Private files (CVs). Never served statically. */
  privateDir: path.resolve(backendRoot, process.env.PRIVATE_DIR || '../../acr-data/private'),
};
