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
  CreateConsentTemplateDto,
  CreateDisclosureDto,
  CreateLicenceDto,
  CreateOperatingModelDto,
  CreateOrganizationDto,
  CreatePolicyTypeDto,
  DecisionDto,
  OrganizationListDto,
  PaginationDto,
  UpdateConsentTemplateDto,
  UpdateDisclosureDto,
  UpdateLicenceDto,
  UpdateOperatingModelDto,
  UpdateOrganizationDto,
  UpdatePolicyTypeDto,
  UploadInsuranceDocumentDto,
} from "./dto/insurance.dto";
import { InsuranceFeatureGuard } from "./insurance-feature.guard";
import {
  InsuranceService,
  type UploadedInsuranceDocument,
} from "./insurance.service";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import {
  AdminPermission,
  Permissions,
} from "../common/decorators/permissions.decorator";
import { RateLimit } from "../common/decorators/rate-limit.decorator";
import { AdminAuthGuard } from "../common/guards/admin-auth.guard";
import type { AuthenticatedPrincipal } from "../common/guards/authenticated-request";
import { PermissionsGuard } from "../common/guards/permissions.guard";

@Controller("admin/insurance")
@UseGuards(AdminAuthGuard, InsuranceFeatureGuard, PermissionsGuard)
export class InsuranceController {
  constructor(private readonly insurance: InsuranceService) {}

  @Get()
  @Permissions(AdminPermission.INSURANCE_OPERATING_MODEL_VIEW)
  dashboard() {
    return this.insurance.dashboard();
  }

  @Get("operating-model")
  @Permissions(AdminPermission.INSURANCE_OPERATING_MODEL_VIEW)
  operatingModels() {
    return this.insurance.listOperatingModels();
  }

  @Post("operating-model")
  @RateLimit({
    key: "insurance-operating-model-mutation",
    limit: 5,
    windowSeconds: 300,
  })
  @Permissions(AdminPermission.INSURANCE_OPERATING_MODEL_MANAGE)
  createOperatingModel(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Body() dto: CreateOperatingModelDto,
  ) {
    return this.insurance.createOperatingModel(admin.sub, dto);
  }

  @Put("operating-model/:id")
  @RateLimit({
    key: "insurance-operating-model-mutation",
    limit: 5,
    windowSeconds: 300,
  })
  @Permissions(AdminPermission.INSURANCE_OPERATING_MODEL_MANAGE)
  updateOperatingModel(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateOperatingModelDto,
  ) {
    return this.insurance.updateOperatingModel(admin.sub, id, dto);
  }

  @Post("operating-model/:id/activate")
  @RateLimit({
    key: "insurance-operating-model-activation",
    limit: 3,
    windowSeconds: 300,
  })
  @Permissions(AdminPermission.INSURANCE_OPERATING_MODEL_MANAGE)
  activateOperatingModel(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.insurance.activateOperatingModel(admin.sub, id);
  }

  @Post("operating-model/:id/retire")
  @RateLimit({
    key: "insurance-operating-model-retire",
    limit: 3,
    windowSeconds: 300,
  })
  @Permissions(AdminPermission.INSURANCE_OPERATING_MODEL_MANAGE)
  retireOperatingModel(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.insurance.retireOperatingModel(admin.sub, id);
  }

  @Get("organizations")
  @Permissions(AdminPermission.INSURANCE_ORGANIZATION_VIEW)
  organizations(@Query() query: OrganizationListDto) {
    return this.insurance.listOrganizations(query);
  }

  @Post("organizations")
  @RateLimit({
    key: "insurance-organization-create",
    limit: 10,
    windowSeconds: 300,
  })
  @Permissions(AdminPermission.INSURANCE_ORGANIZATION_CREATE)
  createOrganization(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Body() dto: CreateOrganizationDto,
  ) {
    return this.insurance.createOrganization(admin.sub, dto);
  }

  @Get("organizations/:organizationId")
  @Permissions(AdminPermission.INSURANCE_ORGANIZATION_VIEW)
  organizationDetail(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
  ) {
    return this.insurance.organizationDetail(admin.sub, organizationId);
  }

  @Patch("organizations/:organizationId")
  @Permissions(AdminPermission.INSURANCE_ORGANIZATION_CREATE)
  updateOrganization(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.insurance.updateOrganization(admin.sub, organizationId, dto);
  }

  @Post("organizations/:organizationId/submit")
  @RateLimit({
    key: "insurance-organization-submit",
    limit: 5,
    windowSeconds: 300,
  })
  @Permissions(AdminPermission.INSURANCE_ORGANIZATION_REVIEW)
  submitOrganization(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
  ) {
    return this.insurance.submitOrganization(admin.sub, organizationId);
  }

  @Post("organizations/:organizationId/approve")
  @RateLimit({
    key: "insurance-organization-decision",
    limit: 5,
    windowSeconds: 300,
  })
  @Permissions(AdminPermission.INSURANCE_ORGANIZATION_APPROVE)
  approveOrganization(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
  ) {
    return this.insurance.approveOrganization(admin.sub, organizationId);
  }

  @Post("organizations/:organizationId/reject")
  @RateLimit({
    key: "insurance-organization-decision",
    limit: 5,
    windowSeconds: 300,
  })
  @Permissions(AdminPermission.INSURANCE_ORGANIZATION_REVIEW)
  rejectOrganization(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
    @Body() dto: DecisionDto,
  ) {
    return this.insurance.rejectOrganization(admin.sub, organizationId, dto);
  }

  @Post("organizations/:organizationId/suspend")
  @RateLimit({
    key: "insurance-organization-decision",
    limit: 5,
    windowSeconds: 300,
  })
  @Permissions(AdminPermission.INSURANCE_ORGANIZATION_SUSPEND)
  suspendOrganization(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
    @Body() dto: DecisionDto,
  ) {
    return this.insurance.suspendOrganization(admin.sub, organizationId, dto);
  }

  @Post("organizations/:organizationId/reactivate")
  @RateLimit({
    key: "insurance-organization-decision",
    limit: 5,
    windowSeconds: 300,
  })
  @Permissions(AdminPermission.INSURANCE_ORGANIZATION_SUSPEND)
  reactivateOrganization(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
  ) {
    return this.insurance.reactivateOrganization(admin.sub, organizationId);
  }

  @Get("organizations/:organizationId/licences")
  @Permissions(AdminPermission.INSURANCE_ORGANIZATION_VIEW)
  licences(@Param("organizationId", ParseUUIDPipe) organizationId: string) {
    return this.insurance.listLicences(organizationId);
  }

  @Post("organizations/:organizationId/licences")
  @Permissions(AdminPermission.INSURANCE_ORGANIZATION_CREATE)
  createLicence(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
    @Body() dto: CreateLicenceDto,
  ) {
    return this.insurance.createLicence(admin.sub, organizationId, dto);
  }

  @Patch("organizations/:organizationId/licences/:licenceId")
  @Permissions(AdminPermission.INSURANCE_ORGANIZATION_CREATE)
  updateLicence(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
    @Param("licenceId", ParseUUIDPipe) licenceId: string,
    @Body() dto: UpdateLicenceDto,
  ) {
    return this.insurance.updateLicence(
      admin.sub,
      organizationId,
      licenceId,
      dto,
    );
  }

  @Get("organizations/:organizationId/documents")
  @Permissions(AdminPermission.INSURANCE_DOCUMENT_VIEW)
  documents(@Param("organizationId", ParseUUIDPipe) organizationId: string) {
    return this.insurance.listDocuments(organizationId);
  }

  @Post("organizations/:organizationId/documents")
  @UseInterceptors(FileInterceptor("file"))
  @RateLimit({ key: "insurance-document-upload", limit: 5, windowSeconds: 300 })
  @Permissions(AdminPermission.INSURANCE_ORGANIZATION_CREATE)
  uploadDocument(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
    @Body() dto: UploadInsuranceDocumentDto,
    @UploadedFile() file: UploadedInsuranceDocument | undefined,
  ) {
    return this.insurance.uploadDocument(
      admin.sub,
      organizationId,
      dto.type,
      dto.licenceId,
      file,
    );
  }

  @Post("organizations/:organizationId/documents/:documentId/access")
  @RateLimit({
    key: "insurance-document-access",
    limit: 20,
    windowSeconds: 300,
  })
  @Permissions(AdminPermission.INSURANCE_DOCUMENT_VIEW)
  documentAccess(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
    @Param("documentId", ParseUUIDPipe) documentId: string,
  ) {
    return this.insurance.documentAccess(admin.sub, organizationId, documentId);
  }

  @Post("organizations/:organizationId/documents/:documentId/approve")
  @Permissions(AdminPermission.INSURANCE_DOCUMENT_REVIEW)
  approveDocument(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
    @Param("documentId", ParseUUIDPipe) documentId: string,
  ) {
    return this.insurance.reviewDocument(
      admin.sub,
      organizationId,
      documentId,
      true,
      {},
    );
  }

  @Post("organizations/:organizationId/documents/:documentId/reject")
  @Permissions(AdminPermission.INSURANCE_DOCUMENT_REVIEW)
  rejectDocument(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
    @Param("documentId", ParseUUIDPipe) documentId: string,
    @Body() dto: DecisionDto,
  ) {
    return this.insurance.reviewDocument(
      admin.sub,
      organizationId,
      documentId,
      false,
      dto,
    );
  }

  @Get("lines")
  @Permissions(AdminPermission.INSURANCE_POLICY_TYPE_VIEW)
  lines() {
    return this.insurance.lines();
  }

  @Get("policy-types")
  @Permissions(AdminPermission.INSURANCE_POLICY_TYPE_VIEW)
  policyTypes() {
    return this.insurance.listPolicyTypes();
  }

  @Post("policy-types")
  @Permissions(AdminPermission.INSURANCE_POLICY_TYPE_MANAGE)
  createPolicyType(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Body() dto: CreatePolicyTypeDto,
  ) {
    return this.insurance.createPolicyType(admin.sub, dto);
  }

  @Get("policy-types/:policyTypeId")
  @Permissions(AdminPermission.INSURANCE_POLICY_TYPE_VIEW)
  policyTypeDetail(@Param("policyTypeId", ParseUUIDPipe) policyTypeId: string) {
    return this.insurance.policyTypeDetail(policyTypeId);
  }

  @Patch("policy-types/:policyTypeId")
  @Permissions(AdminPermission.INSURANCE_POLICY_TYPE_MANAGE)
  updatePolicyType(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Param("policyTypeId", ParseUUIDPipe) policyTypeId: string,
    @Body() dto: UpdatePolicyTypeDto,
  ) {
    return this.insurance.updatePolicyType(admin.sub, policyTypeId, dto);
  }

  @Post("policy-types/:policyTypeId/activate")
  @Permissions(AdminPermission.INSURANCE_POLICY_TYPE_MANAGE)
  activatePolicyType(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Param("policyTypeId", ParseUUIDPipe) policyTypeId: string,
  ) {
    return this.insurance.setPolicyTypeStatus(admin.sub, policyTypeId, true);
  }

  @Post("policy-types/:policyTypeId/deactivate")
  @Permissions(AdminPermission.INSURANCE_POLICY_TYPE_MANAGE)
  deactivatePolicyType(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Param("policyTypeId", ParseUUIDPipe) policyTypeId: string,
  ) {
    return this.insurance.setPolicyTypeStatus(admin.sub, policyTypeId, false);
  }

  @Get("disclosures")
  @Permissions(AdminPermission.INSURANCE_DISCLOSURE_VIEW)
  disclosures() {
    return this.insurance.listDisclosures();
  }

  @Post("disclosures")
  @Permissions(AdminPermission.INSURANCE_DISCLOSURE_MANAGE)
  createDisclosure(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Body() dto: CreateDisclosureDto,
  ) {
    return this.insurance.createDisclosure(admin.sub, dto);
  }

  @Get("disclosures/:disclosureId")
  @Permissions(AdminPermission.INSURANCE_DISCLOSURE_VIEW)
  disclosureDetail(@Param("disclosureId", ParseUUIDPipe) disclosureId: string) {
    return this.insurance.disclosureDetail(disclosureId);
  }

  @Patch("disclosures/:disclosureId")
  @Permissions(AdminPermission.INSURANCE_DISCLOSURE_MANAGE)
  updateDisclosure(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Param("disclosureId", ParseUUIDPipe) disclosureId: string,
    @Body() dto: UpdateDisclosureDto,
  ) {
    return this.insurance.updateDisclosure(admin.sub, disclosureId, dto);
  }

  @Post("disclosures/:disclosureId/publish")
  @RateLimit({
    key: "insurance-disclosure-publish",
    limit: 5,
    windowSeconds: 300,
  })
  @Permissions(AdminPermission.INSURANCE_DISCLOSURE_MANAGE)
  publishDisclosure(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Param("disclosureId", ParseUUIDPipe) disclosureId: string,
  ) {
    return this.insurance.publishDisclosure(admin.sub, disclosureId);
  }

  @Post("disclosures/:disclosureId/retire")
  @Permissions(AdminPermission.INSURANCE_DISCLOSURE_MANAGE)
  retireDisclosure(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Param("disclosureId", ParseUUIDPipe) disclosureId: string,
  ) {
    return this.insurance.retireDisclosure(admin.sub, disclosureId);
  }

  @Get("consent-templates")
  @Permissions(AdminPermission.INSURANCE_CONSENT_TEMPLATE_VIEW)
  consentTemplates() {
    return this.insurance.listConsentTemplates();
  }

  @Post("consent-templates")
  @Permissions(AdminPermission.INSURANCE_CONSENT_TEMPLATE_MANAGE)
  createConsentTemplate(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Body() dto: CreateConsentTemplateDto,
  ) {
    return this.insurance.createConsentTemplate(admin.sub, dto);
  }

  @Get("consent-templates/:templateId")
  @Permissions(AdminPermission.INSURANCE_CONSENT_TEMPLATE_VIEW)
  consentTemplateDetail(
    @Param("templateId", ParseUUIDPipe) templateId: string,
  ) {
    return this.insurance.consentTemplateDetail(templateId);
  }

  @Patch("consent-templates/:templateId")
  @Permissions(AdminPermission.INSURANCE_CONSENT_TEMPLATE_MANAGE)
  updateConsentTemplate(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Param("templateId", ParseUUIDPipe) templateId: string,
    @Body() dto: UpdateConsentTemplateDto,
  ) {
    return this.insurance.updateConsentTemplate(admin.sub, templateId, dto);
  }

  @Post("consent-templates/:templateId/publish")
  @RateLimit({ key: "insurance-consent-publish", limit: 5, windowSeconds: 300 })
  @Permissions(AdminPermission.INSURANCE_CONSENT_TEMPLATE_MANAGE)
  publishConsentTemplate(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Param("templateId", ParseUUIDPipe) templateId: string,
  ) {
    return this.insurance.publishConsentTemplate(admin.sub, templateId);
  }

  @Post("consent-templates/:templateId/retire")
  @Permissions(AdminPermission.INSURANCE_CONSENT_TEMPLATE_MANAGE)
  retireConsentTemplate(
    @CurrentUser() admin: AuthenticatedPrincipal,
    @Param("templateId", ParseUUIDPipe) templateId: string,
  ) {
    return this.insurance.retireConsentTemplate(admin.sub, templateId);
  }

  @Get("audit-logs")
  @Permissions(AdminPermission.INSURANCE_AUDIT_VIEW)
  async auditLogs(@Query() query: PaginationDto) {
    const history = await this.insurance.insuranceAudit(
      query.page,
      query.pageSize,
    );
    return history;
  }
}
