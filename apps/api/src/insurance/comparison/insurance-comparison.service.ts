import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  InsuranceCapability,
  InsuranceComparisonSortMode,
  InsuranceQuoteStatus,
} from "@prisma/client";

import { EnvService } from "../../common/env/env.service";
import { PrismaService } from "../../database/prisma.service";
import { InsuranceCapabilityServiceImpl } from "../insurance-capability.service";

const SORTS = new Set(Object.values(InsuranceComparisonSortMode));

@Injectable()
export class InsuranceComparisonService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly env: EnvService,
    private readonly capability: InsuranceCapabilityServiceImpl,
  ) {}

  async comparison(
    userId: string,
    quoteRequestId: string,
    input: { sort?: string; quoteIds?: string; rankingMode?: string },
  ) {
    await this.capability.assertEnabled(InsuranceCapability.COMPARE_QUOTES);
    const sort = this.sort(input.sort);
    if (input.rankingMode && input.rankingMode !== "preference_match")
      throw new BadRequestException("Unsupported ranking mode");
    if (input.rankingMode) {
      if (!this.env.values.INSURANCE_RANKING_ENABLED)
        throw new NotFoundException("Insurance ranking is unavailable");
      await this.capability.assertEnabled(InsuranceCapability.RANK_QUOTES);
    }
    const request = await this.prisma.insuranceQuoteRequest.findFirst({
      where: { id: quoteRequestId, userId },
      include: {
        policyType: true,
        quotes: {
          where: { status: InsuranceQuoteStatus.GENERATED },
          include: {
            organization: {
              select: { id: true, legalName: true, tradeName: true },
            },
            product: { select: { code: true } },
            productVersion: { select: { name: true } },
            savedByUsers: { where: { userId }, select: { id: true } },
          },
        },
      },
    });
    if (!request) throw new NotFoundException("Quote request not found");
    const selected = input.quoteIds?.split(",").filter(Boolean) ?? [];
    if (selected.length > 3)
      throw new BadRequestException("Compare up to three quotes at a time");
    if (
      selected.length &&
      selected.some((id) => !request.quotes.some((quote) => quote.id === id))
    )
      throw new BadRequestException(
        "Selected quotes must belong to this quote request",
      );
    const quotes = selected.length
      ? request.quotes.filter((quote) => selected.includes(quote.id))
      : request.quotes;
    const ranked = input.rankingMode
      ? await this.rank(request.id, request.policyTypeId, quotes)
      : undefined;
    return {
      quoteRequestId: request.id,
      policyType: {
        name: request.policyType.name,
        slug: request.policyType.slug,
      },
      sortMode: sort,
      rankingMode: input.rankingMode ?? null,
      items: this.sortItems(quotes, sort, ranked),
    };
  }

  async save(userId: string, quoteId: string) {
    if (!this.env.values.INSURANCE_SAVED_QUOTES_ENABLED)
      throw new NotFoundException("Saved quotes are unavailable");
    const quote = await this.prisma.insuranceQuote.findFirst({
      where: { id: quoteId, userId },
    });
    if (!quote) throw new NotFoundException("Quote not found");
    return this.prisma.insuranceSavedQuote.upsert({
      where: { userId_quoteId: { userId, quoteId } },
      create: { userId, quoteId },
      update: {},
    });
  }
  async unsave(userId: string, quoteId: string) {
    await this.prisma.insuranceSavedQuote.deleteMany({
      where: { userId, quoteId },
    });
    return { ok: true };
  }
  async saved(userId: string) {
    if (!this.env.values.INSURANCE_SAVED_QUOTES_ENABLED)
      throw new NotFoundException("Saved quotes are unavailable");
    return {
      items: await this.prisma.insuranceSavedQuote.findMany({
        where: { userId },
        orderBy: { savedAt: "desc" },
        include: {
          quote: {
            include: {
              organization: { select: { legalName: true, tradeName: true } },
              productVersion: { select: { name: true } },
            },
          },
        },
      }),
    };
  }

  private async rank(
    requestId: string,
    policyTypeId: string,
    quotes: Array<{
      id: string;
      totalPremium: { toNumber(): number } | null;
      sumInsured: { toNumber(): number } | null;
    }>,
  ) {
    const now = new Date();
    const methodology = await this.prisma.insuranceRankingMethodology.findFirst(
      {
        where: {
          policyTypeId,
          status: "PUBLISHED",
          effectiveFrom: { lte: now },
          OR: [{ effectiveUntil: null }, { effectiveUntil: { gte: now } }],
        },
        orderBy: [{ effectiveFrom: "desc" }, { version: "desc" }],
      },
    );
    if (!methodology)
      throw new ForbiddenException(
        "No approved ranking methodology is available",
      );
    const maxCover = Math.max(
      ...quotes.map((quote) => quote.sumInsured?.toNumber() ?? 0),
      1,
    );
    const minPremium = Math.min(
      ...quotes.map(
        (quote) => quote.totalPremium?.toNumber() ?? Number.MAX_SAFE_INTEGER,
      ),
    );
    const scored = quotes.map((quote) => ({
      id: quote.id,
      score:
        Math.round(
          (((quote.sumInsured?.toNumber() ?? 0) / maxCover) * 60 +
            (minPremium /
              Math.max(quote.totalPremium?.toNumber() ?? minPremium, 1)) *
              40) *
            100,
        ) / 100,
    }));
    scored.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
    await this.prisma.$transaction(
      scored.map((item, index) =>
        this.prisma.insuranceQuoteRanking.upsert({
          where: {
            quoteRequestId_quoteId_rankingMethodologyId: {
              quoteRequestId: requestId,
              quoteId: item.id,
              rankingMethodologyId: methodology.id,
            },
          },
          create: {
            quoteRequestId: requestId,
            quoteId: item.id,
            rankingMethodologyId: methodology.id,
            rankingMethodologyVersion: methodology.version,
            score: item.score,
            rank: index + 1,
            explanationJson: {
              factors: [
                "Uses published cover and premium-fit criteria only",
                "Does not include commercial arrangements",
              ],
            },
          },
          update: {},
        }),
      ),
    );
    return new Map(
      scored.map((item, index) => [
        item.id,
        {
          rank: index + 1,
          score: item.score,
          methodology: methodology.name,
          explanation: [
            "Uses published cover and premium-fit criteria only",
            "Does not include commercial arrangements",
          ],
        },
      ]),
    );
  }
  private sort(value?: string) {
    const sort = (value ??
      InsuranceComparisonSortMode.DEFAULT) as InsuranceComparisonSortMode;
    if (!SORTS.has(sort))
      throw new BadRequestException("Unsupported sort mode");
    return sort;
  }
  private sortItems(
    quotes: Array<{
      id: string;
      status: InsuranceQuoteStatus;
      currency: string | null;
      totalPremium: { toString(): string; toNumber(): number } | null;
      sumInsured: { toString(): string; toNumber(): number } | null;
      deductibleSummary: string | null;
      waitingPeriodSummary: string | null;
      coverageSummary: string | null;
      exclusionSummary: string | null;
      addonSummary: string | null;
      validUntil: Date | null;
      organization: { id: string; legalName: string; tradeName: string | null };
      product: { code: string };
      productVersion: { name: string };
      savedByUsers: { id: string }[];
    }>,
    sort: InsuranceComparisonSortMode,
    rankings?: Map<
      string,
      {
        rank: number;
        score: number;
        methodology: string;
        explanation: string[];
      }
    >,
  ) {
    const items = quotes.map((quote) => ({
      quoteId: quote.id,
      insurer: {
        id: quote.organization.id,
        name: quote.organization.tradeName ?? quote.organization.legalName,
      },
      product: { code: quote.product.code, name: quote.productVersion.name },
      premium: quote.totalPremium
        ? {
            currency: quote.currency ?? "INR",
            total: quote.totalPremium.toString(),
          }
        : null,
      sumInsured: quote.sumInsured?.toString() ?? null,
      deductible: quote.deductibleSummary,
      waitingPeriods: quote.waitingPeriodSummary,
      coreCoverage: quote.coverageSummary,
      exclusions: quote.exclusionSummary,
      addons: quote.addonSummary,
      validUntil: quote.validUntil,
      status: quote.status,
      saved: quote.savedByUsers.length > 0,
      ranking: rankings?.get(quote.id),
    }));
    return items.sort((a, b) =>
      sort === "LOWEST_PREMIUM"
        ? Number(a.premium?.total ?? Infinity) -
            Number(b.premium?.total ?? Infinity) ||
          a.insurer.name.localeCompare(b.insurer.name)
        : sort === "HIGHEST_COVER"
          ? Number(b.sumInsured ?? 0) - Number(a.sumInsured ?? 0) ||
            a.insurer.name.localeCompare(b.insurer.name)
          : sort === "INSURER_NAME"
            ? a.insurer.name.localeCompare(b.insurer.name)
            : sort === "PRODUCT_NAME"
              ? a.product.name.localeCompare(b.product.name)
              : a.insurer.name.localeCompare(b.insurer.name) ||
                a.product.name.localeCompare(b.product.name) ||
                a.quoteId.localeCompare(b.quoteId),
    );
  }
}
