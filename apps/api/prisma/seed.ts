import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  AccountStatus,
  AdminRole,
  InsuranceCapability,
  InsuranceOperatingModelStatus,
  PrismaClient,
  UserRole,
  VendorStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

loadLocalEnv();

const prisma = new PrismaClient();
const seedMode = process.argv.includes("--mode=prod")
  ? "production"
  : "development";

async function main() {
  if (seedMode === "production" && process.env.NODE_ENV !== "production") {
    throw new Error("Production seed requires NODE_ENV=production.");
  }
  if (seedMode === "development" && process.env.NODE_ENV === "production") {
    throw new Error(
      "Development seed is disabled in production. Use db:seed:prod.",
    );
  }
  if (seedMode === "production") {
    if (process.env.ADMIN_SEED_2FA_ENABLED !== "true") {
      throw new Error("Production seed requires ADMIN_SEED_2FA_ENABLED=true.");
    }
    if (!process.env.ADMIN_SEED_EMAIL || !process.env.ADMIN_SEED_PASSWORD) {
      throw new Error(
        "Production seed requires ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD.",
      );
    }
  }

  await seedReferenceData();
  if (
    seedMode === "development" &&
    process.env.SEED_PUBLIC_FIXTURES !== "false"
  ) {
    await seedPublicFixtures();
  }
  await seedDevelopmentAdmin();
  if (seedMode === "development") {
    await seedInsuranceFoundation();
  }
}

async function seedPublicFixtures() {
  const categoryRows = await prisma.category.findMany({
    where: {
      slug: { in: ["home-services", "automotive", "professional-services"] },
    },
    select: { id: true, slug: true },
  });
  const cityRows = await prisma.city.findMany({
    where: { slug: { in: ["mumbai", "bengaluru", "new-delhi"] } },
    select: { id: true, slug: true },
  });
  const categoryBySlug = new Map(
    categoryRows.map((item) => [item.slug, item.id]),
  );
  const cityBySlug = new Map(cityRows.map((item) => [item.slug, item.id]));
  const fixtures = [
    {
      slug: "aamchi-home-care",
      name: "Aamchi Home Care",
      category: "home-services",
      city: "mumbai",
      email: "hello@aamchi-home-care.example.com",
      phone: "+91 90000 00001",
      description:
        "A development-only home maintenance provider serving Mumbai.",
    },
    {
      slug: "nandi-auto-workshop",
      name: "Nandi Auto Workshop",
      category: "automotive",
      city: "bengaluru",
      email: "hello@nandi-auto.example.com",
      phone: "+91 90000 00002",
      description:
        "A development-only automotive service provider serving Bengaluru.",
    },
    {
      slug: "civic-ledger-advisors",
      name: "Civic Ledger Advisors",
      category: "professional-services",
      city: "new-delhi",
      email: "hello@civic-ledger.example.com",
      phone: "+91 90000 00003",
      description:
        "A development-only professional services provider serving New Delhi.",
    },
  ] as const;

  const seededVendors: Array<{
    id: string;
    ownerUserId: string;
    slug: string;
  }> = [];

  for (const fixture of fixtures) {
    const categoryId = categoryBySlug.get(fixture.category);
    const cityId = cityBySlug.get(fixture.city);
    if (!categoryId || !cityId) continue;
    const owner = await prisma.user.upsert({
      where: { email: fixture.email },
      create: {
        email: fixture.email,
        name: fixture.name,
        role: UserRole.VENDOR,
        status: AccountStatus.ACTIVE,
      },
      update: {
        name: fixture.name,
        role: UserRole.VENDOR,
        status: AccountStatus.ACTIVE,
      },
    });
    const vendor = await prisma.vendorProfile.upsert({
      where: { ownerUserId: owner.id },
      create: {
        ownerUserId: owner.id,
        businessName: fixture.name,
        slug: fixture.slug,
        description: fixture.description,
        contactEmail: fixture.email,
        contactPhone: fixture.phone,
        websiteUrl: `https://${fixture.slug}.example.com`,
        yearEstablished: 2018,
        primaryCityId: cityId,
        status: VendorStatus.APPROVED,
        submittedAt: new Date(),
        reviewedAt: new Date(),
      },
      update: {
        businessName: fixture.name,
        slug: fixture.slug,
        description: fixture.description,
        contactEmail: fixture.email,
        contactPhone: fixture.phone,
        websiteUrl: `https://${fixture.slug}.example.com`,
        primaryCityId: cityId,
        status: VendorStatus.APPROVED,
        reviewedAt: new Date(),
      },
    });
    await prisma.vendorCategory.deleteMany({ where: { vendorId: vendor.id } });
    await prisma.vendorServiceArea.deleteMany({
      where: { vendorId: vendor.id },
    });
    await prisma.vendorCategory.create({
      data: { vendorId: vendor.id, categoryId },
    });
    await prisma.vendorServiceArea.create({
      data: { vendorId: vendor.id, cityId, isPrimary: true },
    });
    seededVendors.push({
      id: vendor.id,
      ownerUserId: owner.id,
      slug: fixture.slug,
    });
  }
  await seedPublicInquiries(seededVendors, cityBySlug.get("mumbai"));
  console.info(`Seeded ${fixtures.length} development public vendor fixtures.`);
}

async function seedPublicInquiries(
  vendors: Array<{ id: string; ownerUserId: string; slug: string }>,
  cityId: string | undefined,
) {
  if (!cityId || vendors.length < 3) return;
  const user = await prisma.user.upsert({
    where: { email: "alex.user@setu.example.com" },
    create: {
      email: "alex.user@setu.example.com",
      name: "Alex Development User",
      role: UserRole.USER,
      status: AccountStatus.ACTIVE,
    },
    update: {
      name: "Alex Development User",
      role: UserRole.USER,
      status: AccountStatus.ACTIVE,
    },
  });
  const examples = [
    {
      referenceNumber: "SETU-2026-DEMO01",
      vendor: vendors[0],
      status: "NEW" as const,
      subject: "Apartment painting estimate",
      body: "I would like an estimate for painting a two-bedroom apartment.",
    },
    {
      referenceNumber: "SETU-2026-DEMO02",
      vendor: vendors[1],
      status: "VIEWED" as const,
      subject: "Vehicle service availability",
      body: "Please share your next available service slot for my car.",
    },
    {
      referenceNumber: "SETU-2026-DEMO03",
      vendor: vendors[2],
      status: "RESOLVED" as const,
      subject: "Business accounting consultation",
      body: "I need help preparing accounts for a small business.",
    },
  ];
  for (const example of examples) {
    const inquiry = await prisma.inquiry.upsert({
      where: { referenceNumber: example.referenceNumber },
      create: {
        referenceNumber: example.referenceNumber,
        userId: user.id,
        vendorId: example.vendor.id,
        serviceCityId: cityId,
        subject: example.subject,
        status: example.status,
        lastMessageAt: new Date(),
        submittedAt: new Date(),
        version: 1,
      },
      update: {
        userId: user.id,
        vendorId: example.vendor.id,
        subject: example.subject,
        status: example.status,
        version: 1,
        serviceCityId: cityId,
      },
    });
    await prisma.inquiryMessage.deleteMany({
      where: { inquiryId: inquiry.id },
    });
    await prisma.inquiryStatusHistory.deleteMany({
      where: { inquiryId: inquiry.id },
    });
    await prisma.notification.deleteMany({ where: { inquiryId: inquiry.id } });
    await prisma.inquiryMessage.create({
      data: {
        inquiryId: inquiry.id,
        senderType: "USER",
        senderUserId: user.id,
        body: example.body,
      },
    });
    await prisma.inquiryStatusHistory.create({
      data: { inquiryId: inquiry.id, toStatus: "NEW", actorType: "SYSTEM" },
    });
    if (example.status !== "NEW") {
      await prisma.inquiryStatusHistory.create({
        data: {
          inquiryId: inquiry.id,
          fromStatus: "NEW",
          toStatus: example.status,
          actorType: "VENDOR",
          changedByVendorId: example.vendor.id,
          reason: "Development seed state",
        },
      });
    }
    await prisma.notification.create({
      data: {
        recipientType: "VENDOR",
        vendorId: example.vendor.id,
        inquiryId: inquiry.id,
        type: "INQUIRY_CREATED",
        title: "New inquiry",
        body: `New inquiry ${example.referenceNumber} received.`,
      },
    });
  }
}

async function seedDevelopmentAdmin() {
  const email = process.env.ADMIN_SEED_EMAIL;
  const password = process.env.ADMIN_SEED_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD are required to seed a development admin.",
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const twoFactorEnabled = process.env.ADMIN_SEED_2FA_ENABLED !== "false";

  await prisma.adminUser.upsert({
    where: { email },
    create: {
      email,
      passwordHash,
      role: AdminRole.SUPER_ADMIN,
      status: AccountStatus.ACTIVE,
      twoFactorEnabled,
    },
    update: {
      passwordHash,
      role: AdminRole.SUPER_ADMIN,
      status: AccountStatus.ACTIVE,
      twoFactorEnabled,
      ...(twoFactorEnabled
        ? {}
        : {
            twoFactorSecretEncrypted: null,
            twoFactorSecretKeyVersion: null,
            twoFactorConfirmedAt: null,
          }),
    },
  });

  console.info(
    `${seedMode === "production" ? "Seeded production bootstrap admin" : "Seeded development admin account"}: ${email}`,
  );
}

async function seedReferenceData() {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      create: category,
      update: {
        name: category.name,
        description: category.description,
        isActive: true,
        sortOrder: category.sortOrder,
      },
    });
  }

  for (const state of states) {
    const storedState = await prisma.state.upsert({
      where: { code: state.code },
      create: {
        name: state.name,
        code: state.code,
      },
      update: {
        name: state.name,
        isActive: true,
      },
    });

    for (const city of state.cities) {
      await prisma.city.upsert({
        where: {
          stateId_slug: {
            stateId: storedState.id,
            slug: city.slug,
          },
        },
        create: {
          stateId: storedState.id,
          name: city.name,
          slug: city.slug,
        },
        update: {
          name: city.name,
          isActive: true,
        },
      });
    }
  }

  console.info(
    `Seeded ${categories.length} categories and ${states.length} states with cities.`,
  );
}

async function seedInsuranceFoundation() {
  const admin = await prisma.adminUser.findUnique({
    where: { email: process.env.ADMIN_SEED_EMAIL },
    select: { id: true },
  });
  if (!admin) return;

  const insuranceDemoMode = process.env.SEED_INSURANCE_DEMO_MODE === "true";
  const demoEffectiveFrom = insuranceDemoMode ? new Date() : null;
  const demoLineStatus = insuranceDemoMode ? "ACTIVE" : "DRAFT";
  const demoCapabilities = insuranceDemoMode
    ? [
        InsuranceCapability.DISPLAY_INSURANCE_PRODUCTS,
        InsuranceCapability.COLLECT_CUSTOMER_NEEDS,
        InsuranceCapability.REQUEST_QUOTES,
        InsuranceCapability.COMPARE_QUOTES,
        InsuranceCapability.RANK_QUOTES,
        InsuranceCapability.RECOMMEND_PRODUCTS,
      ]
    : [];

  const lines = [
    {
      code: "LIFE",
      name: "Example life line",
      description:
        "Development-only configuration; not an enabled insurance offering.",
      sortOrder: 10,
    },
    {
      code: "HEALTH",
      name: "Example health line",
      description:
        "Development-only configuration; not an enabled insurance offering.",
      sortOrder: 20,
    },
    {
      code: "GENERAL",
      name: "Example general line",
      description:
        "Development-only configuration; not an enabled insurance offering.",
      sortOrder: 30,
    },
  ] as const;
  for (const line of lines) {
    await prisma.insuranceLine.upsert({
      where: { code: line.code },
      create: { ...line, status: demoLineStatus },
      update: { ...line, status: demoLineStatus },
    });
  }
  const healthLine = await prisma.insuranceLine.findUniqueOrThrow({
    where: { code: "HEALTH" },
    select: { id: true },
  });
  const healthPolicyType = await prisma.insurancePolicyType.upsert({
    where: { slug: "example-health-policy-type" },
    create: {
      insuranceLineId: healthLine.id,
      code: "EXAMPLE_HEALTH",
      name: "Example health policy type",
      slug: "example-health-policy-type",
      description:
        "Development catalogue configuration. Product display remains feature-gated.",
      status: "ACTIVE",
      isEnabledForMvp: true,
      sortOrder: 10,
    },
    update: { status: "ACTIVE", isEnabledForMvp: true },
  });

  await prisma.insuranceOperatingModel.upsert({
    where: {
      legalEntityName_primaryJurisdiction_configurationVersion: {
        legalEntityName: "Setu Example Insurance Entity",
        primaryJurisdiction: "Example jurisdiction",
        configurationVersion: 1,
      },
    },
    create: {
      legalEntityName: "Setu Example Insurance Entity",
      tradeName: "Setu Insurance Example",
      operatingRole: "OTHER_LICENSED_MODEL",
      licenceNumber: "EXAMPLE-NOT-A-LICENCE-0001",
      licenceAuthority: "Example authority only",
      licenceValidFrom: new Date("2026-01-01T00:00:00.000Z"),
      status: insuranceDemoMode
        ? InsuranceOperatingModelStatus.ACTIVE
        : InsuranceOperatingModelStatus.DRAFT,
      countryCode: "IN",
      primaryJurisdiction: "Example jurisdiction",
      permittedInsuranceLines: [],
      permittedOrganizationTypes: [],
      permittedCapabilities: demoCapabilities,
      restrictedCapabilities: [],
      configurationVersion: 1,
      effectiveFrom: demoEffectiveFrom,
      createdByAdminUserId: admin.id,
    },
    update: {
      status: insuranceDemoMode
        ? InsuranceOperatingModelStatus.ACTIVE
        : InsuranceOperatingModelStatus.DRAFT,
      permittedCapabilities: demoCapabilities,
      restrictedCapabilities: [],
      effectiveFrom: demoEffectiveFrom,
    },
  });

  const insurer = await prisma.insuranceOrganization.upsert({
    where: { slug: "example-insurer-not-real" },
    create: {
      type: "INSURER",
      legalName: "Example Insurer Not Real Ltd.",
      tradeName: "Example Insurer",
      slug: "example-insurer-not-real",
      registrationNumber: "EXAMPLE-INSURER-0001",
      regulatoryAuthority: "Example authority only",
      status: "DRAFT",
      supportEmail: "insurance-example@example.test",
      grievanceEmail: "grievance-example@example.test",
      countryCode: "IN",
      primaryJurisdiction: "Example jurisdiction",
    },
    update: { status: "DRAFT" },
  });

  const demoProduct = await prisma.insuranceProduct.upsert({
    where: { slug: "example-health-cover-not-real" },
    create: {
      organizationId: insurer.id,
      policyTypeId: healthPolicyType.id,
      code: "EXAMPLE_HEALTH_COVER",
      slug: "example-health-cover-not-real",
      status: insuranceDemoMode ? "ACTIVE" : "DRAFT",
      createdByAdminUserId: admin.id,
    },
    update: { status: insuranceDemoMode ? "ACTIVE" : "DRAFT" },
  });
  const demoProductVersion = await prisma.insuranceProductVersion.upsert({
    where: {
      productId_versionNumber: {
        productId: demoProduct.id,
        versionNumber: 1,
      },
    },
    create: {
      productId: demoProduct.id,
      versionNumber: 1,
      status: insuranceDemoMode ? "APPROVED" : "DRAFT",
      name: "Example Health Cover",
      shortDescription:
        "Development-only example product. It is not an insurance offering.",
      longDescription:
        "This fictional fixture exists only to demonstrate the Setu insurance interface locally.",
      coverageSummary: "Example-only display data; no coverage is offered.",
      effectiveFrom: demoEffectiveFrom,
      createdByAdminUserId: admin.id,
      approvedAt: insuranceDemoMode ? demoEffectiveFrom : null,
      approvedByAdminUserId: insuranceDemoMode ? admin.id : null,
    },
    update: {
      status: insuranceDemoMode ? "APPROVED" : "DRAFT",
      effectiveFrom: demoEffectiveFrom,
      approvedAt: insuranceDemoMode ? demoEffectiveFrom : null,
      approvedByAdminUserId: insuranceDemoMode ? admin.id : null,
    },
  });
  await prisma.insuranceProduct.update({
    where: { id: demoProduct.id },
    data: { currentVersionId: demoProductVersion.id },
  });

  const demoQuestionSchema = await prisma.insuranceQuestionSchema.upsert({
    where: {
      policyTypeId_version: {
        policyTypeId: healthPolicyType.id,
        version: 1,
      },
    },
    create: {
      policyTypeId: healthPolicyType.id,
      name: "Example health needs assessment",
      version: 1,
      status: insuranceDemoMode ? "PUBLISHED" : "DRAFT",
      effectiveFrom: demoEffectiveFrom,
      createdByAdminUserId: admin.id,
      publishedAt: insuranceDemoMode ? demoEffectiveFrom : null,
      publishedByAdminUserId: insuranceDemoMode ? admin.id : null,
    },
    update: {
      status: insuranceDemoMode ? "PUBLISHED" : "DRAFT",
      effectiveFrom: demoEffectiveFrom,
      publishedAt: insuranceDemoMode ? demoEffectiveFrom : null,
      publishedByAdminUserId: insuranceDemoMode ? admin.id : null,
    },
  });
  const demoQuestionSection = await prisma.insuranceQuestionSection.upsert({
    where: {
      questionSchemaId_key: {
        questionSchemaId: demoQuestionSchema.id,
        key: "coverage-basics",
      },
    },
    create: {
      questionSchemaId: demoQuestionSchema.id,
      key: "coverage-basics",
      title: "Coverage basics",
      description: "Example-only local development question.",
      sortOrder: 10,
    },
    update: {
      title: "Coverage basics",
      description: "Example-only local development question.",
      sortOrder: 10,
    },
  });
  await prisma.insuranceQuestion.upsert({
    where: {
      sectionId_key: {
        sectionId: demoQuestionSection.id,
        key: "age",
      },
    },
    create: {
      sectionId: demoQuestionSection.id,
      key: "age",
      label: "What is your age?",
      description: "Development-only example question.",
      fieldType: "NUMBER",
      isRequired: true,
      sortOrder: 10,
      validationConfig: { minimum: 18, maximum: 100 },
    },
    update: {
      label: "What is your age?",
      description: "Development-only example question.",
      fieldType: "NUMBER",
      isRequired: true,
      sortOrder: 10,
      validationConfig: { minimum: 18, maximum: 100 },
    },
  });
  await prisma.insuranceOrganizationLine.upsert({
    where: {
      organizationId_insuranceLineId: {
        organizationId: insurer.id,
        insuranceLineId: healthLine.id,
      },
    },
    create: { organizationId: insurer.id, insuranceLineId: healthLine.id },
    update: {},
  });
  await prisma.insuranceOrganization.upsert({
    where: { slug: "example-intermediary-not-real" },
    create: {
      type: "INTERMEDIARY",
      legalName: "Example Intermediary Not Real Ltd.",
      slug: "example-intermediary-not-real",
      registrationNumber: "EXAMPLE-INTERMEDIARY-0001",
      regulatoryAuthority: "Example authority only",
      status: "DRAFT",
      supportEmail: "intermediary-example@example.test",
      grievanceEmail: "grievance-intermediary@example.test",
      countryCode: "IN",
      primaryJurisdiction: "Example jurisdiction",
    },
    update: { status: "DRAFT" },
  });
  await prisma.insuranceDisclosureTemplate.upsert({
    where: {
      code_audience_version: {
        code: "EXAMPLE_OPERATING_NOTICE",
        audience: "ADMIN",
        version: 1,
      },
    },
    create: {
      code: "EXAMPLE_OPERATING_NOTICE",
      name: "Example operating notice",
      audience: "ADMIN",
      purpose: "OPERATING_ROLE",
      content: "Development-only draft. This is not a regulatory disclosure.",
      version: 1,
      status: "DRAFT",
      createdByAdminUserId: admin.id,
    },
    update: { status: "DRAFT" },
  });
  await prisma.insuranceConsentTemplate.upsert({
    where: { code_version: { code: "EXAMPLE_DATA_SHARING", version: 1 } },
    create: {
      code: "EXAMPLE_DATA_SHARING",
      name: "Example data sharing consent",
      purpose: "INSURER_DATA_SHARING",
      content:
        "Development-only draft. No customer consent is collected by Sprint I1.",
      version: 1,
      status: "DRAFT",
      createdByAdminUserId: admin.id,
    },
    update: { status: "DRAFT" },
  });
  console.info(
    insuranceDemoMode
      ? "Seeded development-only insurance demo fixtures."
      : "Seeded draft-only insurance foundation fixtures.",
  );
}

function loadLocalEnv() {
  const envPath = resolve(process.cwd(), ".env");

  if (!existsSync(envPath)) {
    return;
  }

  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

const categories = [
  {
    name: "Home Services",
    slug: "home-services",
    description: "Repairs, maintenance, cleaning, and household support.",
    sortOrder: 10,
  },
  {
    name: "Professional Services",
    slug: "professional-services",
    description: "Consultants, accountants, legal, and business specialists.",
    sortOrder: 20,
  },
  {
    name: "Events and Hospitality",
    slug: "events-hospitality",
    description: "Event planners, decorators, caterers, and venue support.",
    sortOrder: 30,
  },
  {
    name: "Healthcare and Wellness",
    slug: "healthcare-wellness",
    description: "Clinics, wellness providers, and allied service providers.",
    sortOrder: 40,
  },
  {
    name: "Automotive",
    slug: "automotive",
    description: "Vehicle maintenance, repair, accessories, and support.",
    sortOrder: 50,
  },
] as const;

const states = [
  {
    name: "Delhi",
    code: "DL",
    cities: [{ name: "New Delhi", slug: "new-delhi" }],
  },
  {
    name: "Karnataka",
    code: "KA",
    cities: [
      { name: "Bengaluru", slug: "bengaluru" },
      { name: "Mysuru", slug: "mysuru" },
    ],
  },
  {
    name: "Maharashtra",
    code: "MH",
    cities: [
      { name: "Mumbai", slug: "mumbai" },
      { name: "Pune", slug: "pune" },
      { name: "Nagpur", slug: "nagpur" },
    ],
  },
  {
    name: "Tamil Nadu",
    code: "TN",
    cities: [
      { name: "Chennai", slug: "chennai" },
      { name: "Coimbatore", slug: "coimbatore" },
    ],
  },
  {
    name: "Telangana",
    code: "TS",
    cities: [{ name: "Hyderabad", slug: "hyderabad" }],
  },
] as const;

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
