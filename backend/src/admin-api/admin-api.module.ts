import { Module } from '@nestjs/common';
import { ApplicationsController, ContactMessagesController } from './inbox.controller';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { DashboardController, SeoPreviewController } from './misc.controller';
import { resourceControllers } from './resources';
import { SettingsController } from './settings.controller';

/** REST API for the Angular admin. Everything here lives under /api/admin and is login-protected by the global AdminGuard. */
@Module({
  controllers: [
    ...resourceControllers,
    SettingsController, MediaController, ContactMessagesController, ApplicationsController,
    DashboardController, SeoPreviewController,
  ],
  providers: [MediaService],
})
export class AdminApiModule {}
