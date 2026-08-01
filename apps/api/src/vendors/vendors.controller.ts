import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";

import { ReplaceVendorCategoriesDto } from "./dto/replace-vendor-categories.dto";
import { ReplaceVendorServiceAreasDto } from "./dto/replace-vendor-service-areas.dto";
import { UpdateVendorProfileDto } from "./dto/update-vendor-profile.dto";
import { UploadVendorDocumentDto } from "./dto/upload-vendor-document.dto";
import { VendorsService } from "./vendors.service";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { RateLimit } from "../common/decorators/rate-limit.decorator";
import type { AuthenticatedPrincipal } from "../common/guards/authenticated-request";
import { PublicUserAuthGuard } from "../common/guards/public-user-auth.guard";

@Controller("vendors")
@UseGuards(PublicUserAuthGuard)
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Post("onboarding/start")
  @RateLimit({ key: "onboarding-start", limit: 5, windowSeconds: 300 })
  startOnboarding(@CurrentUser() user: AuthenticatedPrincipal) {
    return this.vendorsService.startOnboarding(user);
  }

  @Get("me")
  getMine(@CurrentUser() user: AuthenticatedPrincipal) {
    return this.vendorsService.getMine(user);
  }

  @Patch("me/profile")
  updateProfile(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Body() dto: UpdateVendorProfileDto,
  ) {
    return this.vendorsService.updateProfile(user, dto);
  }

  @Put("me/categories")
  replaceCategories(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Body() dto: ReplaceVendorCategoriesDto,
  ) {
    return this.vendorsService.replaceCategories(user, dto);
  }

  @Put("me/service-areas")
  replaceServiceAreas(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Body() dto: ReplaceVendorServiceAreasDto,
  ) {
    return this.vendorsService.replaceServiceAreas(user, dto);
  }

  @Get("me/documents")
  listDocuments(@CurrentUser() user: AuthenticatedPrincipal) {
    return this.vendorsService.listDocuments(user);
  }

  @Post("me/documents")
  @RateLimit({ key: "document-upload", limit: 5, windowSeconds: 300 })
  @UseInterceptors(
    FileInterceptor("file", {
      limits: {
        fileSize: 10 * 1024 * 1024,
        files: 1,
        fields: 8,
      },
    }),
  )
  uploadDocument(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Body() dto: UploadVendorDocumentDto,
    @UploadedFile()
    file:
      | {
          buffer: Buffer;
          originalname: string;
          mimetype: string;
          size: number;
        }
      | undefined,
  ) {
    return this.vendorsService.uploadDocument(user, dto.type, file);
  }

  @Delete("me/documents/:documentId")
  deleteDocument(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Param("documentId", ParseUUIDPipe) documentId: string,
  ) {
    return this.vendorsService.deleteDocument(user, documentId);
  }

  @Post("me/submit")
  @RateLimit({ key: "onboarding-submit", limit: 5, windowSeconds: 300 })
  submit(@CurrentUser() user: AuthenticatedPrincipal) {
    return this.vendorsService.submit(user);
  }
}
