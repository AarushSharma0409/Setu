import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { PrismaClient, AdminRole, AccountStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

loadLocalEnv();

const prisma = new PrismaClient();

async function main() {
  await seedReferenceData();
  await seedDevelopmentAdmin();
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
    },
  });

  console.info(`Seeded development admin account: ${email}`);
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
