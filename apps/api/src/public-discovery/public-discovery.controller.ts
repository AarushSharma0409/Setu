import { Controller, Get, Param, Query } from "@nestjs/common";

import {
  PublicCategorySlugDto,
  PublicCitySlugDto,
  PublicVendorQueryDto,
  PublicVendorSlugDto,
} from "./dto/public-discovery.dto";
import { PublicDiscoveryService } from "./public-discovery.service";
import { RateLimit } from "../common/decorators/rate-limit.decorator";

@Controller("public")
@RateLimit({ key: "public-discovery", limit: 120, windowSeconds: 60 })
export class PublicDiscoveryController {
  constructor(private readonly discovery: PublicDiscoveryService) {}

  @Get("categories")
  listCategories() {
    return this.discovery.listCategories();
  }

  @Get("categories/:categorySlug")
  category(
    @Param() params: PublicCategorySlugDto,
    @Query() query: PublicVendorQueryDto,
  ) {
    return this.discovery.category(params.categorySlug, query);
  }

  @Get("cities")
  listCities() {
    return this.discovery.listCities();
  }

  @Get("cities/:stateSlug/:citySlug")
  city(
    @Param() params: PublicCitySlugDto,
    @Query() query: PublicVendorQueryDto,
  ) {
    return this.discovery.city(params.stateSlug, params.citySlug, query);
  }

  @Get("vendors")
  vendors(@Query() query: PublicVendorQueryDto) {
    return this.discovery.listVendors(query);
  }

  @Get("vendors/:vendorSlug")
  vendor(@Param() params: PublicVendorSlugDto) {
    return this.discovery.vendor(params.vendorSlug);
  }
}
