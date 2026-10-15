import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AdminUser } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

export type AdminSession = { id: number; email: string; name: string };

// Compared against when the email is unknown, so response time doesn't reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);

/** Short fingerprint of the password hash: changing the password invalidates all existing login cookies. */
const fingerprint = (u: AdminUser) => createHash('sha256').update(u.passwordHash).digest('hex').slice(0, 16);

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}

  async login(email: string, password: string): Promise<{ token: string; admin: AdminSession }> {
    const user = await this.prisma.adminUser.findUnique({ where: { email: email.trim().toLowerCase() } });
    const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !ok) throw new UnauthorizedException('Incorrect email or password');

    await this.prisma.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const token = await this.jwt.signAsync({ sub: user.id, pf: fingerprint(user) });
    return { token, admin: { id: user.id, email: user.email, name: user.name } };
  }

  /** @returns the admin for a valid, current token, otherwise null */
  async verify(token: string | undefined): Promise<AdminSession | null> {
    if (!token) return null;
    try {
      const payload = await this.jwt.verifyAsync<{ sub: number; pf: string }>(token);
      const user = await this.prisma.adminUser.findUnique({ where: { id: payload.sub } });
      if (!user || fingerprint(user) !== payload.pf) return null;
      return { id: user.id, email: user.email, name: user.name };
    } catch {
      return null;
    }
  }

  async changePassword(adminId: number, current: string, next: string): Promise<string> {
    const user = await this.prisma.adminUser.findUniqueOrThrow({ where: { id: adminId } });
    if (!(await bcrypt.compare(current, user.passwordHash))) throw new UnauthorizedException('Current password is incorrect');
    const updated = await this.prisma.adminUser.update({
      where: { id: adminId }, data: { passwordHash: await bcrypt.hash(next, 12) },
    });
    // Other sessions are now invalid; hand back a fresh token for this one.
    return this.jwt.signAsync({ sub: updated.id, pf: fingerprint(updated) });
  }
}
