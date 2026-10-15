import {
  BadRequestException, Body, ConflictException, Controller, Delete, Get, HttpCode, MethodNotAllowedException,
  NotFoundException, Param, ParseIntPipe, Patch, Post, Put, Query, Type, ValidationPipe,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsInt } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { sanitizeRichText } from '../common/sanitize';
import { slugify, uniqueSlug } from '../common/slug';

export class ReorderDto {
  @IsArray() @ArrayNotEmpty() @ArrayMaxSize(500) @IsInt({ each: true }) ids: number[];
}

export type CrudOptions = {
  /** URL segment: 'offices' -> /api/admin/offices */
  path: string;
  /** Prisma delegate name on PrismaService: 'office', 'service', ... */
  model: string;
  /** Validation classes (class-validator). Omit createDto for resources that can't be created in admin. */
  createDto?: Type<any>;
  updateDto: Type<any>;
  /** false = no DELETE endpoint (e.g. fixed pages). Default true. */
  allowDelete?: boolean;
  orderBy?: any;
  /** Table has sortOrder: enables PUT /reorder and auto-numbering of new items. */
  sortable?: boolean;
  include?: any;
  /** Query-string filters allowed on the list: ['group', 'categoryId']. Names ending in "Id" are parsed as numbers. */
  filters?: string[];
  /** Generate/clean a unique `slug` from this field (e.g. 'title'). The slug stays editable. */
  slugFrom?: string;
  /** Rich-text (HTML) fields to sanitise before saving. */
  sanitize?: string[];
  /** Optional fields where an empty string should be stored as NULL. */
  nullable?: string[];
  /** Link for the "View on site" button. */
  viewUrl?: (row: any) => string | null;
  /** Last-chance hook to adjust data before it is written. `existing` is undefined when creating. */
  beforeSave?: (data: any, existing?: any) => any;
};

/**
 * Builds a standard admin controller (list, get, create, update, delete, reorder) for one table.
 * All of them live under /api/admin and are protected by the global AdminGuard.
 * Validation uses the DTO classes in dto.ts (whitelist = unknown fields are dropped).
 */
export function crudController(o: CrudOptions) {
  const pipe = (dto?: Type<any>) => new ValidationPipe({ expectedType: dto, whitelist: true, transform: true });
  const orderBy = o.orderBy ?? (o.sortable ? { sortOrder: 'asc' } : { id: 'asc' });

  @Controller(`api/admin/${o.path}`)
  class CrudController {
    constructor(readonly prisma: PrismaService) {}

    private get db(): any {
      return (this.prisma as any)[o.model];
    }

    private view(row: any) {
      return o.viewUrl ? { ...row, viewUrl: o.viewUrl(row) } : row;
    }

    /** Turn database errors into messages the founder can understand. */
    private fail(e: unknown, action: 'save' | 'delete'): never {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2002') throw new ConflictException('Another item already uses this value (it must be unique).');
        if (e.code === 'P2003') {
          throw action === 'delete'
            ? new ConflictException('This item is still used somewhere else, so it cannot be deleted.')
            : new BadRequestException('A linked item (image, category...) does not exist.');
        }
        if (e.code === 'P2025') throw new NotFoundException();
      }
      if (e instanceof Prisma.PrismaClientValidationError) throw new BadRequestException('Invalid value.');
      throw e;
    }

    private async prepare(input: any, existing?: any) {
      const data = { ...input };
      for (const f of o.sanitize ?? []) if (typeof data[f] === 'string') data[f] = sanitizeRichText(data[f]);
      for (const f of o.nullable ?? []) if (typeof data[f] === 'string' && data[f].trim() === '') data[f] = null;

      if (o.slugFrom) {
        const wanted = typeof data.slug === 'string' && data.slug.trim() ? slugify(data.slug) : !existing ? slugify(data[o.slugFrom] ?? '') : null;
        if (wanted !== null) data.slug = await uniqueSlug(this.db, wanted, existing?.id);
        else delete data.slug; // empty slug on edit: keep the current one
      }
      if (o.sortable && !existing && (data.sortOrder === undefined || data.sortOrder === null)) {
        const last = await this.db.aggregate({ _max: { sortOrder: true } });
        data.sortOrder = (last._max.sortOrder ?? 0) + 1;
      }
      return o.beforeSave ? o.beforeSave(data, existing) : data;
    }

    @Get()
    async list(@Query() query: Record<string, string>) {
      const where: any = {};
      for (const key of o.filters ?? []) {
        const v = query[key];
        if (v === undefined || v === '') continue;
        where[key] = /Id$/.test(key) ? parseInt(v, 10) : v;
        if (Number.isNaN(where[key])) throw new BadRequestException(`Invalid ${key}`);
      }
      try {
        const rows = await this.db.findMany({ where, orderBy, include: o.include });
        return rows.map((r: any) => this.view(r));
      } catch (e) {
        return this.fail(e, 'save');
      }
    }

    // NB: declared before ':id' routes. Different HTTP method, but kept first for clarity.
    @Put('reorder')
    @HttpCode(204)
    async reorder(@Body(pipe(ReorderDto)) dto: ReorderDto) {
      if (!o.sortable) throw new MethodNotAllowedException();
      await this.prisma.$transaction(
        dto.ids.map((id, i) => this.db.update({ where: { id }, data: { sortOrder: i + 1 } })),
      ).catch((e) => this.fail(e, 'save'));
    }

    @Get(':id')
    async get(@Param('id', ParseIntPipe) id: number) {
      const row = await this.db.findUnique({ where: { id }, include: o.include });
      if (!row) throw new NotFoundException();
      return this.view(row);
    }

    @Post()
    async create(@Body(pipe(o.createDto)) dto: any) {
      if (!o.createDto) throw new MethodNotAllowedException();
      try {
        const row = await this.db.create({ data: await this.prepare(dto), include: o.include });
        return this.view(row);
      } catch (e) {
        return this.fail(e, 'save');
      }
    }

    @Patch(':id')
    async update(@Param('id', ParseIntPipe) id: number, @Body(pipe(o.updateDto)) dto: any) {
      const existing = await this.db.findUnique({ where: { id } });
      if (!existing) throw new NotFoundException();
      try {
        const row = await this.db.update({ where: { id }, data: await this.prepare(dto, existing), include: o.include });
        return this.view(row);
      } catch (e) {
        return this.fail(e, 'save');
      }
    }

    @Delete(':id')
    @HttpCode(204)
    async remove(@Param('id', ParseIntPipe) id: number) {
      if (o.allowDelete === false) throw new MethodNotAllowedException();
      try {
        await this.db.delete({ where: { id } });
      } catch (e) {
        this.fail(e, 'delete');
      }
    }
  }

  // Unique class name per resource (shows up in Nest logs / error messages).
  Object.defineProperty(CrudController, 'name', { value: `${o.model[0].toUpperCase()}${o.model.slice(1)}AdminController` });
  return CrudController;
}
