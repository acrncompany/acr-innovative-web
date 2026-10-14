import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { PagesService } from './pages.service';

/**
 * Renders the custom 404 page for unknown public URLs. /api and /admin keep JSON errors.
 * Unexpected errors on public pages render the same simple page (status 500) instead of a stack trace.
 */
@Catch()
export class PublicErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger('PublicErrorFilter');
  constructor(private readonly pages: PagesService) {}

  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();
    const isApi = req.path.startsWith('/api') || req.path.startsWith('/admin');
    const status = exception instanceof HttpException ? exception.getStatus() : 500;
    if (status >= 500) this.logger.error(exception);

    if (isApi) {
      const body = exception instanceof HttpException
        ? exception.getResponse()
        : { statusCode: 500, message: 'Internal server error' };
      return res.status(status).json(body);
    }
    if (status !== 404 && status < 500) {
      return res.status(status).send(exception instanceof HttpException ? exception.message : 'Error');
    }

    const code = status === 404 ? 404 : 500;
    try {
      const [site, b] = await Promise.all([this.pages.site(), this.pages.blocks('404')]);
      const seo = this.pages.seo(site, { title: `Page Not Found - ${site.defaultMetaTitleSuffix}`, path: req.path });
      return res.status(code).render('pages/404', { site, b, seo, bare: true, noindex: true, code });
    } catch {
      return res.status(code).send(code === 404 ? 'Page not found' : 'Server error');
    }
  }
}
