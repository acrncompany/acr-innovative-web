import { CanActivate, createParamDecorator, ExecutionContext, Injectable, SetMetadata, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { AdminSession, AuthService } from './auth.service';

export const COOKIE_NAME = 'acr_admin';

/** Mark a route inside /api/admin as open to everyone (only login). */
export const Public = () => SetMetadata('isPublic', true);

/** Inject the logged-in admin into a handler: `me(@CurrentAdmin() admin: AdminSession)`. */
export const CurrentAdmin = createParamDecorator((_data: unknown, ctx: ExecutionContext): AdminSession =>
  ctx.switchToHttp().getRequest().admin);

/**
 * Global guard: EVERY route under /api/admin requires a valid login cookie unless marked @Public().
 * It is path-based on purpose, so a new admin controller can't be left unprotected by accident.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly auth: AuthService, private readonly reflector: Reflector) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<Request & { admin?: AdminSession }>();
    if (!req.path.startsWith('/api/admin')) return true;
    if (this.reflector.getAllAndOverride<boolean>('isPublic', [ctx.getHandler(), ctx.getClass()])) return true;

    const admin = await this.auth.verify(req.cookies?.[COOKIE_NAME]);
    if (!admin) throw new UnauthorizedException('Please log in');
    req.admin = admin;
    return true;
  }
}
