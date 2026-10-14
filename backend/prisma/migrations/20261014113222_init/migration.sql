-- CreateTable
CREATE TABLE `Media` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `path` VARCHAR(500) NOT NULL,
    `alt` VARCHAR(300) NOT NULL,
    `width` INTEGER NULL,
    `height` INTEGER NULL,
    `mimeType` VARCHAR(100) NOT NULL,
    `sizeBytes` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Media_path_key`(`path`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SiteSettings` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `siteName` VARCHAR(200) NOT NULL,
    `brandName` VARCHAR(200) NOT NULL,
    `brandSub` VARCHAR(200) NOT NULL,
    `legalName` VARCHAR(250) NOT NULL,
    `tagline` VARCHAR(300) NOT NULL,
    `logoId` INTEGER NULL,
    `footerLogoId` INTEGER NULL,
    `faviconId` INTEGER NULL,
    `contactEmail` VARCHAR(200) NOT NULL,
    `notificationEmail` VARCHAR(200) NOT NULL,
    `footerText` TEXT NOT NULL,
    `headerButtonLabel` VARCHAR(100) NOT NULL,
    `headerButtonUrl` VARCHAR(300) NOT NULL,
    `defaultMetaTitleSuffix` VARCHAR(200) NOT NULL,
    `defaultMetaDescription` VARCHAR(400) NOT NULL,
    `defaultOgImageId` INTEGER NULL,
    `keywords` VARCHAR(500) NOT NULL,
    `author` VARCHAR(200) NOT NULL,
    `themeColor` VARCHAR(20) NOT NULL,
    `foundingYear` VARCHAR(10) NOT NULL,
    `orgDescription` VARCHAR(500) NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Office` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(200) NOT NULL,
    `shortName` VARCHAR(100) NOT NULL,
    `addressLines` TEXT NOT NULL,
    `contactAddressLines` TEXT NULL,
    `city` VARCHAR(100) NOT NULL,
    `region` VARCHAR(100) NULL,
    `postalCode` VARCHAR(20) NULL,
    `countryCode` VARCHAR(2) NOT NULL,
    `country` VARCHAR(100) NOT NULL,
    `streetAddress` VARCHAR(300) NOT NULL,
    `phone` VARCHAR(50) NOT NULL,
    `phoneRaw` VARCHAR(30) NOT NULL,
    `email` VARCHAR(200) NULL,
    `isHeadOffice` BOOLEAN NOT NULL DEFAULT false,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SocialLink` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `platform` VARCHAR(50) NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `visible` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MenuItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `location` ENUM('HEADER', 'FOOTER') NOT NULL,
    `label` VARCHAR(100) NOT NULL,
    `url` VARCHAR(300) NOT NULL,
    `visible` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Page` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(50) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `metaTitle` VARCHAR(200) NULL,
    `metaDescription` VARCHAR(400) NULL,
    `ogImageId` INTEGER NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Page_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ContentBlock` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pageKey` VARCHAR(50) NOT NULL,
    `blockKey` VARCHAR(100) NOT NULL,
    `label` VARCHAR(200) NOT NULL,
    `type` ENUM('TEXT', 'TEXTAREA', 'RICHTEXT', 'IMAGE', 'LINK') NOT NULL DEFAULT 'TEXT',
    `value` LONGTEXT NOT NULL DEFAULT '',
    `mediaId` INTEGER NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ContentBlock_pageKey_blockKey_key`(`pageKey`, `blockKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HeroSlide` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `heading` VARCHAR(300) NOT NULL,
    `accentText` VARCHAR(200) NULL,
    `lead` VARCHAR(500) NOT NULL,
    `body` TEXT NOT NULL,
    `imageId` INTEGER NULL,
    `cta1Label` VARCHAR(100) NULL,
    `cta1Url` VARCHAR(300) NULL,
    `cta2Label` VARCHAR(100) NULL,
    `cta2Url` VARCHAR(300) NULL,
    `status` ENUM('DRAFT', 'PUBLISHED') NOT NULL DEFAULT 'PUBLISHED',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Stat` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `group` ENUM('HOME', 'ABOUT') NOT NULL,
    `label` VARCHAR(150) NOT NULL,
    `value` INTEGER NULL,
    `suffix` VARCHAR(10) NOT NULL DEFAULT '',
    `textValue` VARCHAR(100) NULL,
    `description` TEXT NULL,
    `iconId` INTEGER NULL,
    `status` ENUM('DRAFT', 'PUBLISHED') NOT NULL DEFAULT 'PUBLISHED',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FeatureItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `group` ENUM('HOME_PROCESS', 'ENGAGEMENT_STEP', 'WHY_CHOOSE', 'ABOUT_PILLAR', 'TEAM_DISCIPLINE', 'CAREER_PERK', 'CAREER_AREA', 'HOME_TRUST') NOT NULL,
    `icon` VARCHAR(80) NOT NULL DEFAULT '',
    `title` VARCHAR(200) NOT NULL,
    `subtitle` VARCHAR(200) NULL,
    `body` TEXT NOT NULL,
    `status` ENUM('DRAFT', 'PUBLISHED') NOT NULL DEFAULT 'PUBLISHED',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TeamMember` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `role` VARCHAR(200) NOT NULL,
    `bio` TEXT NOT NULL,
    `icon` VARCHAR(80) NOT NULL DEFAULT 'fas fa-user-tie',
    `photoId` INTEGER NULL,
    `status` ENUM('DRAFT', 'PUBLISHED') NOT NULL DEFAULT 'PUBLISHED',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ServiceCategory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(150) NOT NULL,
    `slug` VARCHAR(160) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `ServiceCategory_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Service` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `categoryId` INTEGER NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `slug` VARCHAR(220) NOT NULL,
    `icon` VARCHAR(80) NOT NULL DEFAULT '',
    `summary` TEXT NOT NULL,
    `homeSummary` TEXT NULL,
    `homeSortOrder` INTEGER NOT NULL DEFAULT 0,
    `body` LONGTEXT NOT NULL,
    `showOnHome` BOOLEAN NOT NULL DEFAULT false,
    `status` ENUM('DRAFT', 'PUBLISHED') NOT NULL DEFAULT 'PUBLISHED',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `metaTitle` VARCHAR(200) NULL,
    `metaDescription` VARCHAR(400) NULL,
    `ogImageId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Service_slug_key`(`slug`),
    INDEX `Service_categoryId_idx`(`categoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PostCategory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(120) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `PostCategory_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Post` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `categoryId` INTEGER NOT NULL,
    `title` VARCHAR(250) NOT NULL,
    `slug` VARCHAR(270) NOT NULL,
    `excerpt` TEXT NOT NULL,
    `homeSummary` TEXT NULL,
    `body` LONGTEXT NOT NULL,
    `coverId` INTEGER NULL,
    `authorName` VARCHAR(150) NOT NULL,
    `status` ENUM('DRAFT', 'PUBLISHED') NOT NULL DEFAULT 'DRAFT',
    `publishedAt` DATETIME(3) NULL,
    `showOnHome` BOOLEAN NOT NULL DEFAULT false,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `metaTitle` VARCHAR(200) NULL,
    `metaDescription` VARCHAR(400) NULL,
    `ogImageId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Post_slug_key`(`slug`),
    INDEX `Post_status_publishedAt_idx`(`status`, `publishedAt`),
    INDEX `Post_categoryId_idx`(`categoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Job` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(200) NOT NULL,
    `slug` VARCHAR(220) NOT NULL,
    `location` VARCHAR(150) NOT NULL,
    `employmentType` VARCHAR(80) NOT NULL,
    `department` VARCHAR(120) NULL,
    `description` LONGTEXT NOT NULL,
    `status` ENUM('DRAFT', 'PUBLISHED') NOT NULL DEFAULT 'DRAFT',
    `closingDate` DATETIME(3) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `metaTitle` VARCHAR(200) NULL,
    `metaDescription` VARCHAR(400) NULL,
    `ogImageId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Job_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `JobApplication` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `jobId` INTEGER NULL,
    `name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(200) NOT NULL,
    `phone` VARCHAR(50) NULL,
    `message` TEXT NULL,
    `cvFile` VARCHAR(300) NOT NULL,
    `cvOriginalName` VARCHAR(300) NOT NULL,
    `cvMimeType` VARCHAR(100) NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `JobApplication_isRead_createdAt_idx`(`isRead`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ContactMessage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(200) NOT NULL,
    `phone` VARCHAR(50) NULL,
    `company` VARCHAR(200) NULL,
    `subject` VARCHAR(250) NOT NULL,
    `message` TEXT NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ContactMessage_isRead_createdAt_idx`(`isRead`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdminUser` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(200) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `passwordHash` VARCHAR(200) NOT NULL,
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `AdminUser_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SiteSettings` ADD CONSTRAINT `SiteSettings_logoId_fkey` FOREIGN KEY (`logoId`) REFERENCES `Media`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SiteSettings` ADD CONSTRAINT `SiteSettings_footerLogoId_fkey` FOREIGN KEY (`footerLogoId`) REFERENCES `Media`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SiteSettings` ADD CONSTRAINT `SiteSettings_faviconId_fkey` FOREIGN KEY (`faviconId`) REFERENCES `Media`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SiteSettings` ADD CONSTRAINT `SiteSettings_defaultOgImageId_fkey` FOREIGN KEY (`defaultOgImageId`) REFERENCES `Media`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Page` ADD CONSTRAINT `Page_ogImageId_fkey` FOREIGN KEY (`ogImageId`) REFERENCES `Media`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContentBlock` ADD CONSTRAINT `ContentBlock_mediaId_fkey` FOREIGN KEY (`mediaId`) REFERENCES `Media`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HeroSlide` ADD CONSTRAINT `HeroSlide_imageId_fkey` FOREIGN KEY (`imageId`) REFERENCES `Media`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Stat` ADD CONSTRAINT `Stat_iconId_fkey` FOREIGN KEY (`iconId`) REFERENCES `Media`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeamMember` ADD CONSTRAINT `TeamMember_photoId_fkey` FOREIGN KEY (`photoId`) REFERENCES `Media`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Service` ADD CONSTRAINT `Service_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `ServiceCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Service` ADD CONSTRAINT `Service_ogImageId_fkey` FOREIGN KEY (`ogImageId`) REFERENCES `Media`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Post` ADD CONSTRAINT `Post_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `PostCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Post` ADD CONSTRAINT `Post_coverId_fkey` FOREIGN KEY (`coverId`) REFERENCES `Media`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Post` ADD CONSTRAINT `Post_ogImageId_fkey` FOREIGN KEY (`ogImageId`) REFERENCES `Media`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Job` ADD CONSTRAINT `Job_ogImageId_fkey` FOREIGN KEY (`ogImageId`) REFERENCES `Media`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JobApplication` ADD CONSTRAINT `JobApplication_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `Job`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
