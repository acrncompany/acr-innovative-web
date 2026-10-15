import { sanitizeRichText } from '../common/sanitize';
import { crudController } from './crud';
import * as d from './dto';

/**
 * One line of configuration per content type. Each becomes a full admin controller at /api/admin/<path>
 * (list, get, create, update, delete, reorder). See crud.ts for what the options mean.
 * The Angular admin screens map 1:1 to these resources.
 */
const seoNullable = ['metaTitle', 'metaDescription'];

export const OfficesController = crudController({
  path: 'offices', model: 'office', createDto: d.OfficeDto, updateDto: d.UpdateOfficeDto, sortable: true,
  nullable: ['region', 'postalCode', 'email', 'contactAddressLines'],
});

export const SocialLinksController = crudController({
  path: 'social-links', model: 'socialLink', createDto: d.SocialLinkDto, updateDto: d.UpdateSocialLinkDto, sortable: true,
});

export const MenuItemsController = crudController({
  path: 'menu-items', model: 'menuItem', createDto: d.MenuItemDto, updateDto: d.UpdateMenuItemDto, sortable: true,
  filters: ['location'], orderBy: [{ location: 'asc' }, { sortOrder: 'asc' }],
});

// Fixed pages: edit title + SEO only (their URLs are part of the site's structure).
export const PagesController = crudController({
  path: 'pages', model: 'page', updateDto: d.UpdatePageDto, allowDelete: false, include: { ogImage: true },
  nullable: seoNullable, orderBy: { id: 'asc' }, viewUrl: (r) => (r.slug ? `/${r.slug}` : '/'),
});

// Every one-off text/image on a page. Filter with ?pageKey=about. Rich-text blocks are sanitised on save.
export const ContentBlocksController = crudController({
  path: 'content-blocks', model: 'contentBlock', updateDto: d.UpdateBlockDto, allowDelete: false,
  include: { media: true }, filters: ['pageKey'], orderBy: [{ pageKey: 'asc' }, { sortOrder: 'asc' }],
  beforeSave: (data, existing) => {
    if (existing?.type === 'RICHTEXT' && typeof data.value === 'string') {
      data.value = sanitizeRichText(data.value);
    }
    return data;
  },
});

export const HeroSlidesController = crudController({
  path: 'hero-slides', model: 'heroSlide', createDto: d.HeroSlideDto, updateDto: d.UpdateHeroSlideDto, sortable: true,
  include: { image: true }, nullable: ['accentText', 'cta1Label', 'cta1Url', 'cta2Label', 'cta2Url'],
});

export const StatsController = crudController({
  path: 'stats', model: 'stat', createDto: d.StatDto, updateDto: d.UpdateStatDto, sortable: true,
  include: { icon: true }, filters: ['group'], orderBy: [{ group: 'asc' }, { sortOrder: 'asc' }],
  nullable: ['textValue', 'description'],
});

export const FeatureItemsController = crudController({
  path: 'feature-items', model: 'featureItem', createDto: d.FeatureItemDto, updateDto: d.UpdateFeatureItemDto, sortable: true,
  filters: ['group'], orderBy: [{ group: 'asc' }, { sortOrder: 'asc' }], nullable: ['subtitle'],
});

export const TeamMembersController = crudController({
  path: 'team-members', model: 'teamMember', createDto: d.TeamMemberDto, updateDto: d.UpdateTeamMemberDto, sortable: true,
  include: { photo: true },
});

export const ServiceCategoriesController = crudController({
  path: 'service-categories', model: 'serviceCategory', createDto: d.ServiceCategoryDto, updateDto: d.UpdateServiceCategoryDto,
  sortable: true, slugFrom: 'title',
});

export const ServicesController = crudController({
  path: 'services', model: 'service', createDto: d.ServiceDto, updateDto: d.UpdateServiceDto, sortable: true,
  include: { category: true, ogImage: true }, filters: ['categoryId', 'status'], slugFrom: 'title', sanitize: ['body'],
  nullable: [...seoNullable, 'homeSummary'], orderBy: [{ categoryId: 'asc' }, { sortOrder: 'asc' }],
  viewUrl: (r) => `/services/${r.slug}`,
});

export const PostCategoriesController = crudController({
  path: 'post-categories', model: 'postCategory', createDto: d.PostCategoryDto, updateDto: d.UpdatePostCategoryDto,
  sortable: true, slugFrom: 'name',
});

export const PostsController = crudController({
  path: 'posts', model: 'post', createDto: d.PostDto, updateDto: d.UpdatePostDto, sortable: true,
  include: { category: true, cover: true, ogImage: true }, filters: ['categoryId', 'status'], slugFrom: 'title',
  sanitize: ['body'], nullable: [...seoNullable, 'homeSummary'],
  orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }], viewUrl: (r) => `/insights/${r.slug}`,
  // Publishing without a date publishes "now"; a future date schedules the post (it appears on that date).
  beforeSave: (data, existing) => {
    const status = data.status ?? existing?.status;
    if (status === 'PUBLISHED' && !data.publishedAt && !existing?.publishedAt) data.publishedAt = new Date().toISOString();
    return data;
  },
});

export const JobsController = crudController({
  path: 'jobs', model: 'job', createDto: d.JobDto, updateDto: d.UpdateJobDto, sortable: true,
  include: { ogImage: true }, filters: ['status'], slugFrom: 'title', sanitize: ['description'],
  nullable: [...seoNullable, 'department', 'closingDate'], viewUrl: (r) => `/careers/${r.slug}`,
});

export const resourceControllers = [
  OfficesController, SocialLinksController, MenuItemsController, PagesController, ContentBlocksController,
  HeroSlidesController, StatsController, FeatureItemsController, TeamMembersController,
  ServiceCategoriesController, ServicesController, PostCategoriesController, PostsController, JobsController,
];
