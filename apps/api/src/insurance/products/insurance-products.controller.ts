import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";

import {
  CreateProductDto,
  CatalogueUpdateDto,
  ProductListDto,
  RejectVersionDto,
  UpdateProductVersionDto,
  UploadProductDocumentDto,
  WithdrawProductDto,
} from "./dto/product.dto";
import { InsuranceProductsService } from "./insurance-products.service";
import { InsuranceProductCatalogueFeatureGuard } from "./product-catalogue-feature.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import {
  AdminPermission,
  Permissions,
} from "../../common/decorators/permissions.decorator";
import { RateLimit } from "../../common/decorators/rate-limit.decorator";
import { AdminAuthGuard } from "../../common/guards/admin-auth.guard";
import type { AuthenticatedPrincipal } from "../../common/guards/authenticated-request";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { InsuranceFeatureGuard } from "../insurance-feature.guard";

@Controller("admin/insurance/products")
@UseGuards(
  AdminAuthGuard,
  InsuranceFeatureGuard,
  InsuranceProductCatalogueFeatureGuard,
  PermissionsGuard,
)
export class InsuranceProductsController {
  constructor(private readonly products: InsuranceProductsService) {}

  @Get()
  @Permissions(AdminPermission.INSURANCE_PRODUCT_VIEW)
  list(@Query() query: ProductListDto) {
    return this.products.list(query);
  }

  @Post()
  @RateLimit({ key: "insurance-product-create", limit: 10, windowSeconds: 300 })
  @Permissions(AdminPermission.INSURANCE_PRODUCT_CREATE)
  create(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Body() dto: CreateProductDto,
  ) {
    return this.products.create(admin.sub, dto);
  }

  @Get(":productId")
  @Permissions(AdminPermission.INSURANCE_PRODUCT_VIEW)
  detail(@Param("productId", ParseUUIDPipe) productId: string) {
    return this.products.detail(productId);
  }

  @Post(":productId/versions")
  @Permissions(AdminPermission.INSURANCE_PRODUCT_VERSION_CREATE)
  createVersion(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Param("productId", ParseUUIDPipe) productId: string,
  ) {
    return this.products.createVersion(admin.sub, productId);
  }

  @Patch(":productId/versions/:versionId")
  @Permissions(AdminPermission.INSURANCE_PRODUCT_EDIT)
  updateVersion(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Param("productId", ParseUUIDPipe) productId: string,
    @Param("versionId", ParseUUIDPipe) versionId: string,
    @Body() dto: UpdateProductVersionDto,
  ) {
    return this.products.updateVersion(admin.sub, productId, versionId, dto);
  }

  @Put(":productId/versions/:versionId/catalogue")
  @Permissions(AdminPermission.INSURANCE_PRODUCT_EDIT)
  replaceCatalogue(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Param("productId", ParseUUIDPipe) productId: string,
    @Param("versionId", ParseUUIDPipe) versionId: string,
    @Body() dto: CatalogueUpdateDto,
  ) {
    return this.products.replaceCatalogue(admin.sub, productId, versionId, dto);
  }

  @Post(":productId/versions/:versionId/submit")
  @Permissions(AdminPermission.INSURANCE_PRODUCT_SUBMIT)
  submit(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Param("productId", ParseUUIDPipe) productId: string,
    @Param("versionId", ParseUUIDPipe) versionId: string,
  ) {
    return this.products.submit(admin.sub, productId, versionId);
  }

  @Post(":productId/versions/:versionId/approve")
  @Permissions(AdminPermission.INSURANCE_PRODUCT_APPROVE)
  approve(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Param("productId", ParseUUIDPipe) productId: string,
    @Param("versionId", ParseUUIDPipe) versionId: string,
  ) {
    return this.products.approve(admin.sub, productId, versionId);
  }

  @Post(":productId/versions/:versionId/reject")
  @Permissions(AdminPermission.INSURANCE_PRODUCT_REJECT)
  reject(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Param("productId", ParseUUIDPipe) productId: string,
    @Param("versionId", ParseUUIDPipe) versionId: string,
    @Body() dto: RejectVersionDto,
  ) {
    return this.products.reject(admin.sub, productId, versionId, dto.reason);
  }

  @Post(":productId/withdraw")
  @Permissions(AdminPermission.INSURANCE_PRODUCT_WITHDRAW)
  withdraw(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Param("productId", ParseUUIDPipe) productId: string,
    @Body() dto: WithdrawProductDto,
  ) {
    return this.products.withdraw(admin.sub, productId, dto.reason);
  }

  @Post(":productId/versions/:versionId/documents")
  @RateLimit({
    key: "insurance-product-document-upload",
    limit: 5,
    windowSeconds: 300,
  })
  @Permissions(AdminPermission.INSURANCE_PRODUCT_DOCUMENT_UPLOAD)
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 8 },
    }),
  )
  uploadDocument(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Param("productId", ParseUUIDPipe) productId: string,
    @Param("versionId", ParseUUIDPipe) versionId: string,
    @Body() dto: UploadProductDocumentDto,
    @UploadedFile()
    file:
      | { buffer: Buffer; originalname: string; mimetype: string; size: number }
      | undefined,
  ) {
    return this.products.uploadDocument(
      admin.sub,
      productId,
      versionId,
      dto,
      file,
    );
  }

  @Post(":productId/documents/:documentId/access")
  @Permissions(AdminPermission.INSURANCE_PRODUCT_DOCUMENT_VIEW)
  documentAccess(
    @Param("productId", ParseUUIDPipe) productId: string,
    @Param("documentId", ParseUUIDPipe) documentId: string,
  ) {
    return this.products.documentAccess(productId, documentId);
  }
}
