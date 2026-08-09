import { randomBytes } from "node:crypto";

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  InsuranceCapability,
  InsuranceConsentPurpose,
  InsuranceConsentStatus,
  InsuranceDataClassification,
  InsuranceNeedAssessmentStatus,
  InsurancePolicyTypeStatus,
  InsuranceQuestionSchemaStatus,
  InsuranceTemplateStatus,
  Prisma,
} from "@prisma/client";

import { SaveAnswersDto, type CreateAssessmentDto } from "./dto/needs.dto";
import { isVisible, validateAnswer } from "./needs-policy";
import { SensitiveAnswerCryptoService } from "./sensitive-answer-crypto.service";
import { EnvService } from "../../common/env/env.service";
import { PrismaService } from "../../database/prisma.service";
import { InsuranceCapabilityServiceImpl } from "../insurance-capability.service";

const ACTIVE = [
  InsuranceNeedAssessmentStatus.DRAFT,
  InsuranceNeedAssessmentStatus.IN_PROGRESS,
  InsuranceNeedAssessmentStatus.READY_FOR_REVIEW,
];
const REQUIRED_CONSENTS = new Set<InsuranceConsentPurpose>([
  InsuranceConsentPurpose.QUOTE_REQUEST,
  InsuranceConsentPurpose.INSURER_DATA_SHARING,
  InsuranceConsentPurpose.SENSITIVE_DATA_PROCESSING,
]);

@Injectable()
export class InsuranceNeedsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly env: EnvService,
    private readonly capability: InsuranceCapabilityServiceImpl,
    private readonly crypto: SensitiveAnswerCryptoService,
  ) {}

  async policyTypes() {
    await this.assertCapability();
    const now = new Date();
    const types = await this.prisma.insurancePolicyType.findMany({
      where: {
        status: InsurancePolicyTypeStatus.ACTIVE,
        isEnabledForMvp: true,
        products: {
          some: {
            status: "ACTIVE",
            currentVersion: {
              is: {
                status: "APPROVED",
                effectiveFrom: { lte: now },
                OR: [{ effectiveUntil: null }, { effectiveUntil: { gt: now } }],
              },
            },
          },
        },
        questionSchemas: {
          some: {
            status: InsuranceQuestionSchemaStatus.PUBLISHED,
            effectiveFrom: { lte: now },
            OR: [{ effectiveUntil: null }, { effectiveUntil: { gt: now } }],
          },
        },
      },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        slug: true,
        description: true,
      },
    });
    return { items: types };
  }

  async policyType(slug: string) {
    const result = await this.policyTypes();
    const item = result.items.find((type) => type.slug === slug);
    if (!item) throw new NotFoundException("Policy type is unavailable");
    return item;
  }

  async create(userId: string, dto: CreateAssessmentDto) {
    await this.assertCapability();
    const policyType = await this.availablePolicyType(dto.policyTypeId);
    const existing = await this.prisma.insuranceNeedAssessment.findFirst({
      where: { userId, policyTypeId: dto.policyTypeId, status: { in: ACTIVE } },
      orderBy: { updatedAt: "desc" },
    });
    if (existing && !dto.abandonExisting)
      throw new ConflictException({
        code: "ACTIVE_ASSESSMENT_EXISTS",
        assessmentId: existing.id,
        message: "Resume your active assessment or explicitly abandon it",
      });
    const now = new Date();
    const schema = await this.currentSchema(policyType.id, now);
    return this.prisma.$transaction(async (tx) => {
      if (existing)
        await tx.insuranceNeedAssessment.update({
          where: { id: existing.id },
          data: {
            status: InsuranceNeedAssessmentStatus.WITHDRAWN,
            withdrawnAt: now,
          },
        });
      const assessment = await tx.insuranceNeedAssessment.create({
        data: {
          userId,
          policyTypeId: policyType.id,
          questionSchemaVersionId: schema.id,
          referenceNumber: referenceNumber(),
          status: InsuranceNeedAssessmentStatus.IN_PROGRESS,
          currentSectionKey: schema.sections[0]?.key,
          expiredAt: expiresAt(
            this.env.values.INSURANCE_NEED_ASSESSMENT_DRAFT_TTL_DAYS,
          ),
        },
      });
      return assessment;
    });
  }

  async list(userId: string) {
    await this.expireDrafts(userId);
    return {
      items: await this.prisma.insuranceNeedAssessment.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          referenceNumber: true,
          status: true,
          completionPercentage: true,
          currentSectionKey: true,
          lastSavedAt: true,
          submittedAt: true,
          policyType: { select: { name: true, slug: true } },
        },
      }),
    };
  }

  async detail(userId: string, assessmentId: string) {
    const assessment = await this.owned(userId, assessmentId);
    return this.redactAssessment(assessment);
  }

  async schema(userId: string, assessmentId: string) {
    const assessment = await this.owned(userId, assessmentId);
    return {
      assessment: this.summary(assessment),
      schema: assessment.questionSchema,
    };
  }

  async save(userId: string, assessmentId: string, dto: SaveAnswersDto) {
    const assessment = await this.owned(userId, assessmentId);
    this.assertMutable(assessment);
    if (dto.version && dto.version !== assessment.version)
      throw new ConflictException({
        code: "CONCURRENT_MODIFICATION",
        message:
          "This assessment changed on another device. Refresh and try again.",
      });
    const section = assessment.questionSchema.sections.find(
      (item) => item.key === dto.sectionKey,
    );
    if (!section)
      throw new BadRequestException({
        code: "INVALID_ANSWER",
        message: "Unknown assessment section",
      });
    const answersByQuestion = new Map(
      assessment.answers.map((answer) => [
        answer.questionId,
        this.answerValue(answer),
      ]),
    );
    const known = new Map(
      assessment.questionSchema.sections
        .flatMap((item) => item.questions)
        .map((question) => [question.id, question]),
    );
    for (const item of dto.answers) {
      const question = known.get(item.questionId);
      if (!question || question.sectionId !== section.id)
        throw new BadRequestException({
          code: "INVALID_ANSWER",
          message: "Question does not belong to this schema section",
        });
      const keyedAnswers = new Map(
        assessment.questionSchema.sections
          .flatMap((entry) => entry.questions)
          .map((question) => [
            question.key,
            answersByQuestion.get(question.id),
          ]),
      );
      if (!isVisible(question.visibilityConfig, keyedAnswers))
        throw new BadRequestException({
          code: "INVALID_ANSWER",
          message: "Question is not currently visible",
        });
      validateAnswer(
        question.fieldType,
        item.value,
        question.validationConfig,
        question.options
          .filter((option) => option.isActive)
          .map((option) => option.value),
      );
      answersByQuestion.set(question.id, item.value);
    }
    return this.prisma.$transaction(async (tx) => {
      for (const item of dto.answers) {
        const question = known.get(item.questionId);
        if (!question) continue;
        const sensitive =
          question.dataClassification ===
          InsuranceDataClassification.HEALTH_SENSITIVE;
        await tx.insuranceNeedAnswer.upsert({
          where: {
            assessmentId_questionId: {
              assessmentId,
              questionId: item.questionId,
            },
          },
          create: {
            assessmentId,
            questionId: item.questionId,
            dataClassification: question.dataClassification,
            createdByUserId: userId,
            valueJson: sensitive ? { protected: true } : jsonValue(item.value),
            encryptedValue: sensitive
              ? this.crypto.encrypt(JSON.stringify(item.value))
              : null,
          },
          update: {
            valueJson: sensitive ? { protected: true } : jsonValue(item.value),
            encryptedValue: sensitive
              ? this.crypto.encrypt(JSON.stringify(item.value))
              : null,
          },
        });
      }
      const fresh = await this.owned(userId, assessmentId, tx);
      const state = this.completion(fresh);
      const nextStatus = state.missingRequiredQuestions.length
        ? InsuranceNeedAssessmentStatus.IN_PROGRESS
        : InsuranceNeedAssessmentStatus.READY_FOR_REVIEW;
      const updated = await tx.insuranceNeedAssessment.update({
        where: { id: assessmentId },
        data: {
          status: nextStatus,
          currentSectionKey: dto.sectionKey,
          completionPercentage: state.completionPercentage,
          lastSavedAt: new Date(),
          version: { increment: 1 },
        },
      });
      return { assessment: this.summary(updated), ...state };
    });
  }

  async review(userId: string, assessmentId: string) {
    const assessment = await this.owned(userId, assessmentId);
    return {
      assessment: this.redactAssessment(assessment),
      completion: this.completion(assessment),
      disclosures: await this.disclosures(userId, assessmentId),
      consents: await this.consents(userId, assessmentId),
    };
  }

  async disclosures(userId: string, assessmentId: string) {
    await this.owned(userId, assessmentId);
    const now = new Date();
    const templates = await this.prisma.insuranceDisclosureTemplate.findMany({
      where: {
        status: InsuranceTemplateStatus.PUBLISHED,
        audience: "CUSTOMER",
        effectiveFrom: { lte: now },
        OR: [{ effectiveUntil: null }, { effectiveUntil: { gt: now } }],
      },
      select: {
        id: true,
        code: true,
        name: true,
        purpose: true,
        content: true,
        version: true,
        requiresAcknowledgement: true,
      },
    });
    const acknowledgements =
      await this.prisma.insuranceDisclosureAcknowledgement.findMany({
        where: { assessmentId },
        select: { disclosureTemplateId: true, acknowledgedAt: true },
      });
    const acknowledged = new Map(
      acknowledgements.map((entry) => [
        entry.disclosureTemplateId,
        entry.acknowledgedAt,
      ]),
    );
    return {
      items: templates.map((template) => ({
        ...template,
        acknowledgedAt: acknowledged.get(template.id) ?? null,
      })),
    };
  }

  async acknowledgeDisclosure(
    userId: string,
    assessmentId: string,
    templateId: string,
  ) {
    await this.owned(userId, assessmentId);
    const resolved = (await this.disclosures(userId, assessmentId)).items.find(
      (item) => item.id === templateId,
    );
    if (!resolved) throw new NotFoundException("Disclosure is not available");
    return this.prisma.insuranceDisclosureAcknowledgement.upsert({
      where: {
        assessmentId_disclosureTemplateId: {
          assessmentId,
          disclosureTemplateId: templateId,
        },
      },
      create: {
        userId,
        assessmentId,
        disclosureTemplateId: templateId,
        disclosureVersion: resolved.version,
        context: { purpose: resolved.purpose },
      },
      update: {},
    });
  }

  async consents(userId: string, assessmentId: string) {
    await this.owned(userId, assessmentId);
    const now = new Date();
    const templates = await this.prisma.insuranceConsentTemplate.findMany({
      where: {
        status: InsuranceTemplateStatus.PUBLISHED,
        effectiveFrom: { lte: now },
        OR: [{ effectiveUntil: null }, { effectiveUntil: { gt: now } }],
      },
      select: {
        id: true,
        code: true,
        name: true,
        content: true,
        version: true,
        purpose: true,
        description: true,
      },
    });
    const records = await this.prisma.insuranceConsentRecord.findMany({
      where: { assessmentId },
      select: {
        consentTemplateId: true,
        status: true,
        grantedAt: true,
        withdrawnAt: true,
      },
    });
    const state = new Map(
      records.map((record) => [record.consentTemplateId, record]),
    );
    return {
      items: templates.map((template) => ({
        ...template,
        required: REQUIRED_CONSENTS.has(template.purpose),
        record: state.get(template.id) ?? null,
      })),
    };
  }

  async grantConsent(userId: string, assessmentId: string, templateId: string) {
    await this.owned(userId, assessmentId);
    const consent = (await this.consents(userId, assessmentId)).items.find(
      (item) => item.id === templateId,
    );
    if (!consent)
      throw new NotFoundException("Consent template is not available");
    return this.prisma.insuranceConsentRecord.upsert({
      where: {
        assessmentId_consentTemplateId: {
          assessmentId,
          consentTemplateId: templateId,
        },
      },
      create: {
        userId,
        assessmentId,
        consentTemplateId: templateId,
        consentVersion: consent.version,
        purpose: consent.purpose,
        status: InsuranceConsentStatus.GRANTED,
        source: "WEB",
      },
      update: {
        status: InsuranceConsentStatus.GRANTED,
        grantedAt: new Date(),
        withdrawnAt: null,
      },
    });
  }

  async withdrawConsent(
    userId: string,
    assessmentId: string,
    templateId: string,
  ) {
    await this.owned(userId, assessmentId);
    const record = await this.prisma.insuranceConsentRecord.findFirst({
      where: { assessmentId, consentTemplateId: templateId },
    });
    if (!record) throw new NotFoundException("Consent record not found");
    return this.prisma.insuranceConsentRecord.update({
      where: { id: record.id },
      data: {
        status: InsuranceConsentStatus.WITHDRAWN,
        withdrawnAt: new Date(),
      },
    });
  }

  async submit(userId: string, assessmentId: string) {
    await this.assertCapability();
    const assessment = await this.owned(userId, assessmentId);
    if (assessment.status === InsuranceNeedAssessmentStatus.SUBMITTED)
      return { assessment: this.summary(assessment), alreadySubmitted: true };
    this.assertMutable(assessment);
    const completion = this.completion(assessment);
    if (completion.missingRequiredQuestions.length)
      throw new BadRequestException({
        code: "MISSING_REQUIRED_ANSWER",
        missingRequiredQuestions: completion.missingRequiredQuestions,
      });
    const disclosures = await this.disclosures(userId, assessmentId);
    if (
      disclosures.items.some(
        (item) => item.requiresAcknowledgement && !item.acknowledgedAt,
      )
    )
      throw new BadRequestException({
        code: "DISCLOSURE_ACKNOWLEDGEMENT_REQUIRED",
        message: "A required disclosure must be acknowledged",
      });
    const consents = await this.consents(userId, assessmentId);
    if (
      consents.items.some(
        (item) =>
          item.required &&
          item.record?.status !== InsuranceConsentStatus.GRANTED,
      )
    )
      throw new BadRequestException({
        code: "CONSENT_REQUIRED",
        message: "Required consent must be granted",
      });
    return this.prisma.$transaction(async (tx) => {
      const answers = assessment.answers.map((answer) => ({
        questionId: answer.questionId,
        questionKey: answer.question.key,
        classification: answer.dataClassification,
        value:
          answer.dataClassification ===
          InsuranceDataClassification.HEALTH_SENSITIVE
            ? { protected: true, encryptedValue: answer.encryptedValue }
            : answer.valueJson,
      }));
      await tx.insuranceNeedProfileSnapshot.create({
        data: {
          assessmentId,
          schemaVersion: assessment.questionSchema.version,
          policyTypeId: assessment.policyTypeId,
          answersSnapshot: answers,
          disclosureSnapshot: disclosures.items.map(
            ({ content: _content, ...item }) => item,
          ),
          consentSnapshot: consents.items.map(
            ({ content: _content, description: _description, ...item }) => item,
          ),
        },
      });
      const updated = await tx.insuranceNeedAssessment.update({
        where: { id: assessmentId },
        data: {
          status: InsuranceNeedAssessmentStatus.SUBMITTED,
          submittedAt: new Date(),
          completionPercentage: 100,
          version: { increment: 1 },
        },
      });
      return { assessment: this.summary(updated), alreadySubmitted: false };
    });
  }

  async withdraw(userId: string, assessmentId: string, _reason?: string) {
    const assessment = await this.owned(userId, assessmentId);
    this.assertMutable(assessment);
    return this.prisma.insuranceNeedAssessment.update({
      where: { id: assessmentId },
      data: {
        status: InsuranceNeedAssessmentStatus.WITHDRAWN,
        withdrawnAt: new Date(),
        version: { increment: 1 },
      },
    });
  }

  private async availablePolicyType(policyTypeId: string) {
    const item = (await this.policyTypes()).items.find(
      (type) => type.id === policyTypeId,
    );
    if (!item)
      throw new BadRequestException({
        code: "POLICY_TYPE_UNAVAILABLE",
        message: "Policy type is unavailable",
      });
    return item;
  }
  private async currentSchema(policyTypeId: string, now: Date) {
    const schema = await this.prisma.insuranceQuestionSchema.findFirst({
      where: {
        policyTypeId,
        status: InsuranceQuestionSchemaStatus.PUBLISHED,
        effectiveFrom: { lte: now },
        OR: [{ effectiveUntil: null }, { effectiveUntil: { gt: now } }],
      },
      orderBy: [{ effectiveFrom: "desc" }, { version: "desc" }],
      include: { sections: { orderBy: { sortOrder: "asc" } } },
    });
    if (!schema)
      throw new BadRequestException({
        code: "SCHEMA_NOT_AVAILABLE",
        message: "No active assessment schema is available",
      });
    return schema;
  }
  private async assertCapability() {
    await this.capability.assertEnabled(
      InsuranceCapability.COLLECT_CUSTOMER_NEEDS,
    );
  }
  private assertMutable(assessment: {
    status: InsuranceNeedAssessmentStatus;
    expiredAt: Date | null;
  }) {
    if (
      assessment.status !== InsuranceNeedAssessmentStatus.DRAFT &&
      assessment.status !== InsuranceNeedAssessmentStatus.IN_PROGRESS &&
      assessment.status !== InsuranceNeedAssessmentStatus.READY_FOR_REVIEW
    )
      throw new ForbiddenException({
        code:
          assessment.status === "SUBMITTED"
            ? "ASSESSMENT_ALREADY_SUBMITTED"
            : "ASSESSMENT_WITHDRAWN",
        message: "Assessment can no longer be changed",
      });
    if (assessment.expiredAt && assessment.expiredAt < new Date())
      throw new ForbiddenException({
        code: "ASSESSMENT_EXPIRED",
        message: "Assessment has expired",
      });
  }
  private async expireDrafts(userId: string) {
    await this.prisma.insuranceNeedAssessment.updateMany({
      where: { userId, status: { in: ACTIVE }, expiredAt: { lt: new Date() } },
      data: { status: InsuranceNeedAssessmentStatus.EXPIRED },
    });
  }
  private async owned(
    userId: string,
    id: string,
    client: PrismaService | Prisma.TransactionClient = this.prisma,
  ) {
    const assessment = await client.insuranceNeedAssessment.findFirst({
      where: { id, userId },
      include: {
        policyType: true,
        questionSchema: {
          include: {
            sections: {
              orderBy: { sortOrder: "asc" },
              include: {
                questions: {
                  orderBy: { sortOrder: "asc" },
                  include: { options: { orderBy: { sortOrder: "asc" } } },
                },
              },
            },
          },
        },
        answers: { include: { question: true } },
        disclosures: true,
        consents: true,
        snapshot: true,
      },
    });
    if (!assessment) {
      throw new NotFoundException({
        code: "ASSESSMENT_NOT_FOUND",
        message: "Assessment not found",
      });
    }
    return assessment;
  }
  private answerValue(answer: {
    valueJson: Prisma.JsonValue;
    encryptedValue: string | null;
    dataClassification: InsuranceDataClassification;
  }): unknown {
    return answer.dataClassification ===
      InsuranceDataClassification.HEALTH_SENSITIVE
      ? answer.encryptedValue
        ? parseProtectedAnswer(this.crypto.decrypt(answer.encryptedValue))
        : undefined
      : answer.valueJson;
  }
  private completion(
    assessment: Awaited<ReturnType<InsuranceNeedsService["owned"]>>,
  ) {
    const byKey = new Map(
      assessment.answers.map((answer) => [
        answer.question.key,
        this.answerValue(answer),
      ]),
    );
    const required = assessment.questionSchema.sections
      .flatMap((section) => section.questions)
      .filter(
        (question) =>
          question.isRequired && isVisible(question.visibilityConfig, byKey),
      );
    const answered = new Map(
      assessment.answers.map((answer) => [
        answer.questionId,
        this.answerValue(answer),
      ]),
    );
    const missing = required
      .filter((question) => {
        const value = answered.get(question.id);
        return (
          value === undefined ||
          value === null ||
          value === "" ||
          (Array.isArray(value) && !value.length)
        );
      })
      .map((question) => question.key);
    return {
      completionPercentage: required.length
        ? Math.round(
            ((required.length - missing.length) / required.length) * 100,
          )
        : 100,
      missingRequiredQuestions: missing,
      currentSection: assessment.currentSectionKey,
    };
  }
  private redactAssessment(
    assessment: Awaited<ReturnType<InsuranceNeedsService["owned"]>>,
  ) {
    return {
      ...this.summary(assessment),
      answers: assessment.answers.map((answer) => ({
        questionId: answer.questionId,
        questionKey: answer.question.key,
        dataClassification: answer.dataClassification,
        value: this.answerValue(answer),
      })),
    };
  }
  private summary(assessment: {
    id: string;
    referenceNumber: string;
    status: InsuranceNeedAssessmentStatus;
    completionPercentage: number;
    currentSectionKey: string | null;
    lastSavedAt: Date;
    submittedAt: Date | null;
    version: number;
    policyType?: { id: string; name: string; slug: string };
  }) {
    return {
      id: assessment.id,
      referenceNumber: assessment.referenceNumber,
      status: assessment.status,
      completionPercentage: assessment.completionPercentage,
      currentSectionKey: assessment.currentSectionKey,
      lastSavedAt: assessment.lastSavedAt,
      submittedAt: assessment.submittedAt,
      version: assessment.version,
      policyType: assessment.policyType,
    };
  }
}

function referenceNumber() {
  return `INS-${new Date().getUTCFullYear()}-${randomBytes(3).toString("hex").toUpperCase()}`;
}
function expiresAt(days: number) {
  const value = new Date();
  value.setUTCDate(value.getUTCDate() + days);
  return value;
}
function jsonValue(value: unknown): Prisma.InputJsonValue {
  if (value === null)
    throw new BadRequestException({
      code: "INVALID_ANSWER",
      message: "Null answer values are not supported",
    });
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  )
    return value;
  if (Array.isArray(value)) return value.map(jsonValue);
  if (typeof value === "object") return value;
  throw new BadRequestException({
    code: "INVALID_ANSWER",
    message: "Answer value is unsupported",
  });
}

function parseProtectedAnswer(value: string): unknown {
  return JSON.parse(value) as unknown;
}
