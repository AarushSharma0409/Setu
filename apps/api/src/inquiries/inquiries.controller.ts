import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";

import {
  CreateInquiryDto,
  InquiryActionDto,
  InquiryListQueryDto,
  InquiryMessageDto,
  InquiryStatusDto,
} from "./dto/inquiry.dto";
import { InquiriesService } from "./inquiries.service";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { RateLimit } from "../common/decorators/rate-limit.decorator";
import type { AuthenticatedPrincipal } from "../common/guards/authenticated-request";
import { PublicUserAuthGuard } from "../common/guards/public-user-auth.guard";

@Controller()
@UseGuards(PublicUserAuthGuard)
export class InquiriesController {
  constructor(private readonly inquiries: InquiriesService) {}

  @Post("inquiries")
  @RateLimit({ key: "inquiry-create", limit: 10, windowSeconds: 300 })
  create(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Body() dto: CreateInquiryDto,
    @Headers("idempotency-key") idempotencyKey?: string,
  ) {
    return this.inquiries.create(user, dto, idempotencyKey);
  }

  @Get("inquiries")
  userList(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Query() query: InquiryListQueryDto,
  ) {
    return this.inquiries.userList(user, query);
  }

  @Get("inquiries/:inquiryId")
  userDetail(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Param("inquiryId", ParseUUIDPipe) id: string,
  ) {
    return this.inquiries.userDetail(user, id);
  }

  @Post("inquiries/:inquiryId/messages")
  @RateLimit({ key: "inquiry-message", limit: 30, windowSeconds: 60 })
  userMessage(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Param("inquiryId", ParseUUIDPipe) id: string,
    @Body() dto: InquiryMessageDto,
  ) {
    return this.inquiries.userMessage(user, id, dto);
  }

  @Post("inquiries/:inquiryId/withdraw")
  @RateLimit({ key: "inquiry-transition", limit: 20, windowSeconds: 60 })
  withdraw(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Param("inquiryId", ParseUUIDPipe) id: string,
    @Body() body: InquiryActionDto,
  ) {
    return this.inquiries.userWithdraw(user, id, body?.reason);
  }

  @Post("inquiries/:inquiryId/close")
  @RateLimit({ key: "inquiry-transition", limit: 20, windowSeconds: 60 })
  close(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Param("inquiryId", ParseUUIDPipe) id: string,
    @Body() body: InquiryActionDto,
  ) {
    return this.inquiries.userClose(user, id, body?.reason);
  }

  @Get("vendors/me/inquiries")
  vendorList(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Query() query: InquiryListQueryDto,
  ) {
    return this.inquiries.vendorList(user, query);
  }

  @Get("vendors/me/inquiries/:inquiryId")
  vendorDetail(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Param("inquiryId", ParseUUIDPipe) id: string,
  ) {
    return this.inquiries.vendorDetail(user, id);
  }

  @Post("vendors/me/inquiries/:inquiryId/messages")
  @RateLimit({ key: "vendor-message", limit: 30, windowSeconds: 60 })
  vendorMessage(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Param("inquiryId", ParseUUIDPipe) id: string,
    @Body() dto: InquiryMessageDto,
  ) {
    return this.inquiries.vendorMessage(user, id, dto);
  }

  @Post("vendors/me/inquiries/:inquiryId/status")
  @RateLimit({ key: "vendor-status", limit: 20, windowSeconds: 60 })
  vendorStatus(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Param("inquiryId", ParseUUIDPipe) id: string,
    @Body() dto: InquiryStatusDto,
  ) {
    return this.inquiries.vendorStatus(user, id, dto);
  }
}
