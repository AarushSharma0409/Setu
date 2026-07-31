import type { INestApplication } from "@nestjs/common";
import { ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import cookieParser from "cookie-parser";
import request from "supertest";

import { AppModule } from "../src/app/app.module";
import { PasswordService } from "../src/auth/password.service";
import { EnvService } from "../src/common/env/env.service";
import { PrismaService } from "../src/database/prisma.service";
import { RedisService } from "../src/redis/redis.service";

interface UserRecord {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  role: "USER" | "VENDOR";
  status: "ACTIVE" | "SUSPENDED" | "DISABLED";
}

interface AdminRecord {
  id: string;
  email: string;
  passwordHash: string;
  role: "SUPER_ADMIN" | "OPERATIONS" | "REVIEWER";
  status: "ACTIVE" | "SUSPENDED" | "DISABLED";
  twoFactorEnabled: boolean;
}

interface SessionRecord {
  id: string;
  subjectType: "USER" | "ADMIN";
  userId: string | null;
  adminUserId: string | null;
  tokenHash: string;
  tokenFamily: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

interface CategoryRecord {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
}

interface StateRecord {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

interface CityRecord {
  id: string;
  stateId: string;
  name: string;
  slug: string;
  isActive: boolean;
}

interface VendorProfileRecord {
  id: string;
  ownerUserId: string;
  businessName: string | null;
  slug: string | null;
  legalName: string | null;
  description: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  websiteUrl: string | null;
  yearEstablished: number | null;
  addressLine1: string | null;
  addressLine2: string | null;
  postalCode: string | null;
  primaryCityId: string | null;
  status: "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "SUSPENDED";
  submittedAt: Date | null;
}

interface VendorCategoryRecord {
  vendorId: string;
  categoryId: string;
}

interface VendorServiceAreaRecord {
  id: string;
  vendorId: string;
  cityId: string;
  isPrimary: boolean;
}

interface VendorDocumentRecord {
  id: string;
  vendorId: string;
  type:
    | "GST_CERTIFICATE"
    | "PAN_CARD"
    | "BUSINESS_REGISTRATION"
    | "ADDRESS_PROOF"
    | "OTHER";
  storageKey: string;
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
  checksumSha256: string;
  status: "UPLOADED" | "PENDING_REVIEW" | "APPROVED" | "REJECTED";
  uploadedAt: Date;
}

class FakePrisma {
  users = new Map<string, UserRecord>();
  admins = new Map<string, AdminRecord>();
  sessions = new Map<string, SessionRecord>();
  categories = new Map<string, CategoryRecord>();
  states = new Map<string, StateRecord>();
  cities = new Map<string, CityRecord>();
  vendorProfiles = new Map<string, VendorProfileRecord>();
  vendorCategories: VendorCategoryRecord[] = [];
  vendorServiceAreas: VendorServiceAreaRecord[] = [];
  vendorDocuments = new Map<string, VendorDocumentRecord>();
  healthy = true;
  nextId = 1;

  constructor() {
    const categoryId = "11111111-1111-4111-8111-111111111111";
    const stateId = "22222222-2222-4222-8222-222222222222";
    const cityId = "33333333-3333-4333-8333-333333333333";

    this.categories.set(categoryId, {
      id: categoryId,
      name: "Home Services",
      slug: "home-services",
      description: "Repairs and maintenance",
      isActive: true,
      sortOrder: 10,
    });
    this.states.set(stateId, {
      id: stateId,
      name: "Karnataka",
      code: "KA",
      isActive: true,
    });
    this.cities.set(cityId, {
      id: cityId,
      stateId,
      name: "Bengaluru",
      slug: "bengaluru",
      isActive: true,
    });
  }

  user = {
    upsert: async ({
      where,
      create,
      update,
    }: {
      where: { email?: string; phone?: string };
      create: Partial<UserRecord>;
      update: Partial<UserRecord>;
    }) => {
      const existing = [...this.users.values()].find((user) =>
        where.email ? user.email === where.email : user.phone === where.phone,
      );

      if (existing) {
        Object.assign(existing, update);
        return existing;
      }

      const user: UserRecord = {
        id: `user-${this.nextId++}`,
        email: create.email ?? null,
        phone: create.phone ?? null,
        name: create.name ?? null,
        role: "USER",
        status: "ACTIVE",
      };
      this.users.set(user.id, user);
      return user;
    },
    findUnique: async ({ where }: { where: { id?: string } }) =>
      where.id ? (this.users.get(where.id) ?? null) : null,
    update: async ({
      where,
      data,
    }: {
      where: { id: string };
      data: Partial<UserRecord>;
    }) => {
      const user = this.users.get(where.id);
      if (!user) {
        throw new Error("User not found");
      }
      Object.assign(user, data);
      return user;
    },
  };

  adminUser = {
    findUnique: async ({ where }: { where: { id?: string; email?: string } }) =>
      [...this.admins.values()].find(
        (admin) => admin.id === where.id || admin.email === where.email,
      ) ?? null,
  };

  refreshSession = {
    create: async ({
      data,
    }: {
      data: Omit<SessionRecord, "id" | "revokedAt"> & {
        revokedAt?: Date | null;
      };
    }) => {
      const session: SessionRecord = {
        ...data,
        id: `session-${this.nextId++}`,
        revokedAt: data.revokedAt ?? null,
      };
      this.sessions.set(session.id, session);
      return session;
    },
    findUnique: async ({ where }: { where: { tokenHash: string } }) =>
      [...this.sessions.values()].find(
        (session) => session.tokenHash === where.tokenHash,
      ) ?? null,
    update: async ({
      where,
      data,
    }: {
      where: { id: string };
      data: Partial<SessionRecord>;
    }) => {
      const session = this.sessions.get(where.id);
      if (!session) {
        throw new Error("Session not found");
      }
      Object.assign(session, data);
      return session;
    },
    updateMany: async ({
      where,
      data,
    }: {
      where: Partial<SessionRecord>;
      data: Partial<SessionRecord>;
    }) => {
      for (const session of this.sessions.values()) {
        const matches = Object.entries(where).every(
          ([key, value]) => session[key as keyof SessionRecord] === value,
        );
        if (matches) {
          Object.assign(session, data);
        }
      }
      return { count: 1 };
    },
  };

  category = {
    findMany: async () =>
      [...this.categories.values()]
        .filter((category) => category.isActive)
        .sort((first, second) => first.sortOrder - second.sortOrder)
        .map(({ id, name, slug, description }) => ({
          id,
          name,
          slug,
          description,
        })),
  };

  state = {
    findMany: async () =>
      [...this.states.values()]
        .filter((state) => state.isActive)
        .map(({ id, name, code }) => ({ id, name, code })),
  };

  city = {
    findMany: async ({ where }: { where?: { stateId?: string } } = {}) =>
      [...this.cities.values()]
        .filter((city) => city.isActive)
        .filter((city) => !where?.stateId || city.stateId === where.stateId)
        .map((city) => ({
          ...city,
          state: { name: this.states.get(city.stateId)?.name ?? "State" },
        })),
  };

  vendorProfile = {
    findUnique: async ({
      where,
    }: {
      where: { ownerUserId?: string; id?: string; slug?: string | null };
    }) => {
      const vendor =
        [...this.vendorProfiles.values()].find(
          (profile) =>
            profile.ownerUserId === where.ownerUserId ||
            profile.id === where.id ||
            profile.slug === where.slug,
        ) ?? null;

      return vendor ? this.vendorWithRelations(vendor) : null;
    },
    create: async ({ data }: { data: Partial<VendorProfileRecord> }) => {
      const vendor: VendorProfileRecord = {
        id: this.nextUuid(),
        ownerUserId: data.ownerUserId ?? "",
        businessName: data.businessName ?? null,
        slug: data.slug ?? null,
        legalName: data.legalName ?? null,
        description: data.description ?? null,
        contactEmail: data.contactEmail ?? null,
        contactPhone: data.contactPhone ?? null,
        websiteUrl: data.websiteUrl ?? null,
        yearEstablished: data.yearEstablished ?? null,
        addressLine1: data.addressLine1 ?? null,
        addressLine2: data.addressLine2 ?? null,
        postalCode: data.postalCode ?? null,
        primaryCityId: data.primaryCityId ?? null,
        status: "DRAFT",
        submittedAt: null,
      };
      this.vendorProfiles.set(vendor.id, vendor);
      return this.vendorWithRelations(vendor);
    },
    update: async ({
      where,
      data,
    }: {
      where: { id: string };
      data: Partial<VendorProfileRecord>;
    }) => {
      const vendor = this.vendorProfiles.get(where.id);
      if (!vendor) {
        throw new Error("Vendor not found");
      }
      Object.assign(vendor, data);
      return this.vendorWithRelations(vendor);
    },
  };

  vendorCategory = {
    deleteMany: async ({ where }: { where: { vendorId: string } }) => {
      this.vendorCategories = this.vendorCategories.filter(
        (record) => record.vendorId !== where.vendorId,
      );
      return { count: 1 };
    },
    createMany: async ({
      data,
    }: {
      data: { vendorId: string; categoryId: string }[];
    }) => {
      this.vendorCategories.push(...data);
      return { count: data.length };
    },
  };

  vendorServiceArea = {
    deleteMany: async ({ where }: { where: { vendorId: string } }) => {
      this.vendorServiceAreas = this.vendorServiceAreas.filter(
        (record) => record.vendorId !== where.vendorId,
      );
      return { count: 1 };
    },
    createMany: async ({
      data,
    }: {
      data: { vendorId: string; cityId: string; isPrimary: boolean }[];
    }) => {
      this.vendorServiceAreas.push(
        ...data.map((record) => ({ ...record, id: this.nextUuid() })),
      );
      return { count: data.length };
    },
  };

  vendorDocument = {
    create: async ({
      data,
    }: {
      data: Omit<VendorDocumentRecord, "id" | "uploadedAt" | "status"> & {
        status?: VendorDocumentRecord["status"];
      };
    }) => {
      const document: VendorDocumentRecord = {
        ...data,
        id: this.nextUuid(),
        status: data.status ?? "UPLOADED",
        uploadedAt: new Date(),
      };
      this.vendorDocuments.set(document.id, document);
      return document;
    },
    findFirst: async ({ where }: { where: { id: string; vendorId: string } }) =>
      [...this.vendorDocuments.values()].find(
        (document) =>
          document.id === where.id && document.vendorId === where.vendorId,
      ) ?? null,
    delete: async ({ where }: { where: { id: string } }) => {
      const document = this.vendorDocuments.get(where.id);
      if (!document) {
        throw new Error("Document not found");
      }
      this.vendorDocuments.delete(where.id);
      return document;
    },
    updateMany: async ({
      where,
      data,
    }: {
      where: Partial<VendorDocumentRecord>;
      data: Partial<VendorDocumentRecord>;
    }) => {
      for (const document of this.vendorDocuments.values()) {
        const matches = Object.entries(where).every(
          ([key, value]) =>
            document[key as keyof VendorDocumentRecord] === value,
        );
        if (matches) {
          Object.assign(document, data);
        }
      }
      return { count: 1 };
    },
  };

  async $transaction<T>(
    callbackOrPromises: ((tx: FakePrisma) => Promise<T>) | Promise<T>[],
  ) {
    if (Array.isArray(callbackOrPromises)) {
      return Promise.all(callbackOrPromises);
    }

    const callback = callbackOrPromises;
    return callback(this);
  }

  async isHealthy() {
    if (!this.healthy) {
      throw new Error("database down");
    }
    return true;
  }

  nextUuid() {
    const value = String(this.nextId++).padStart(12, "0");
    return `00000000-0000-4000-8000-${value}`;
  }

  private vendorWithRelations(vendor: VendorProfileRecord) {
    return {
      ...vendor,
      categories: this.vendorCategories
        .filter((record) => record.vendorId === vendor.id)
        .map((record) => ({
          category: this.categories.get(record.categoryId),
        })),
      serviceAreas: this.vendorServiceAreas
        .filter((record) => record.vendorId === vendor.id)
        .map((record) => {
          const city = this.cities.get(record.cityId);
          return {
            ...record,
            city: city
              ? {
                  ...city,
                  state: {
                    name: this.states.get(city.stateId)?.name ?? "State",
                  },
                }
              : undefined,
          };
        }),
      documents: [...this.vendorDocuments.values()]
        .filter((document) => document.vendorId === vendor.id)
        .map(
          ({
            id,
            type,
            originalFileName,
            mimeType,
            sizeBytes,
            status,
            uploadedAt,
          }) => ({
            id,
            type,
            originalFileName,
            mimeType,
            sizeBytes,
            status,
            uploadedAt,
          }),
        ),
    };
  }
}

const testEnv = {
  values: {
    NODE_ENV: "test",
    API_PORT: 4000,
    DATABASE_URL: "postgresql://setu:setu_local_password@localhost:5432/setu",
    REDIS_URL: "redis://localhost:6379",
    JWT_ACCESS_SECRET: "access-secret-for-e2e-tests-at-least-32-chars",
    JWT_REFRESH_SECRET: "refresh-secret-for-e2e-tests-at-least-32-chars",
    ACCESS_TOKEN_TTL: "15m",
    REFRESH_TOKEN_TTL: "7d",
    CORS_ALLOWED_ORIGINS: ["http://localhost:3000", "http://localhost:3001"],
    OBJECT_STORAGE_PROVIDER: "local",
    OBJECT_STORAGE_LOCAL_DIR: ".local-storage-test",
    DOCUMENT_MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024,
    DOCUMENT_ALLOWED_MIME_TYPES: ["application/pdf", "image/jpeg", "image/png"],
    SIGNED_URL_TTL_SECONDS: 300,
  },
  isProduction: false,
  isDevelopmentLike: true,
} satisfies Partial<EnvService>;

async function createApp(envOverride: Partial<EnvService> = testEnv) {
  const fakePrisma = new FakePrisma();
  const passwordService = new PasswordService();
  fakePrisma.admins.set("admin-1", {
    id: "admin-1",
    email: "admin.local@setu.test",
    passwordHash: await passwordService.hash("change-me-local-admin-password"),
    role: "SUPER_ADMIN",
    status: "ACTIVE",
    twoFactorEnabled: false,
  });

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(EnvService)
    .useValue(envOverride)
    .overrideProvider(PrismaService)
    .useValue(fakePrisma)
    .overrideProvider(RedisService)
    .useValue({ isHealthy: async () => true })
    .compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix("api/v1");
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );
  await app.init();

  return { app, fakePrisma };
}

describe("Setu API foundation", () => {
  let app: INestApplication;

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it("serves health and readiness endpoints", async () => {
    ({ app } = await createApp());

    await request(app.getHttpServer()).get("/api/v1/health/live").expect(200);
    await request(app.getHttpServer()).get("/api/v1/health/ready").expect(200);
  });

  it("returns readiness failure when dependencies are unavailable", async () => {
    const setup = await createApp();
    app = setup.app;
    setup.fakePrisma.healthy = false;

    await request(app.getHttpServer()).get("/api/v1/health/ready").expect(503);
  });

  it("blocks development login in production mode", async () => {
    ({ app } = await createApp({
      ...testEnv,
      isProduction: true,
      isDevelopmentLike: false,
    }));

    await request(app.getHttpServer())
      .post("/api/v1/auth/dev-login")
      .send({ email: "dev.user@setu.test" })
      .expect(403);
  });

  it("supports public auth refresh, logout, and protected user route", async () => {
    ({ app } = await createApp());

    const login = await request(app.getHttpServer())
      .post("/api/v1/auth/dev-login")
      .send({ email: "dev.user@setu.test" })
      .expect(201);

    const accessToken = login.body.accessToken as string;
    const refreshToken = login.body.refreshToken as string;

    await request(app.getHttpServer())
      .get("/api/v1/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    const refreshed = await request(app.getHttpServer())
      .post("/api/v1/auth/refresh")
      .send({ refreshToken })
      .expect(201);

    await request(app.getHttpServer())
      .post("/api/v1/auth/logout")
      .send({ refreshToken: refreshed.body.refreshToken })
      .expect(201);

    await request(app.getHttpServer())
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: refreshed.body.refreshToken })
      .expect(401);
  });

  it("keeps public and admin tokens separated", async () => {
    ({ app } = await createApp());

    const publicLogin = await request(app.getHttpServer())
      .post("/api/v1/auth/dev-login")
      .send({ email: "dev.user@setu.test" })
      .expect(201);
    const adminLogin = await request(app.getHttpServer())
      .post("/api/v1/admin/auth/login")
      .send({
        email: "admin.local@setu.test",
        password: "change-me-local-admin-password",
      })
      .expect(201);

    await request(app.getHttpServer())
      .get("/api/v1/admin/system-status")
      .set("Authorization", `Bearer ${publicLogin.body.accessToken as string}`)
      .expect(401);
    await request(app.getHttpServer())
      .get("/api/v1/users/me")
      .set("Authorization", `Bearer ${adminLogin.body.accessToken as string}`)
      .expect(401);
    await request(app.getHttpServer())
      .get("/api/v1/admin/system-status")
      .set("Authorization", `Bearer ${adminLogin.body.accessToken as string}`)
      .expect(200);
  });

  it("supports vendor onboarding through submission", async () => {
    const setup = await createApp();
    app = setup.app;

    const login = await request(app.getHttpServer())
      .post("/api/v1/auth/dev-login")
      .send({ email: "vendor.user@setu.test" })
      .expect(201);
    const accessToken = login.body.accessToken as string;

    const categories = await request(app.getHttpServer())
      .get("/api/v1/categories")
      .expect(200);
    const cities = await request(app.getHttpServer())
      .get("/api/v1/locations/cities")
      .expect(200);
    const categoryId = categories.body.categories[0].id as string;
    const cityId = cities.body.cities[0].id as string;

    await request(app.getHttpServer())
      .post("/api/v1/vendors/onboarding/start")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(201)
      .expect(({ body }) => {
        expect(body.vendor.status).toBe("DRAFT");
      });
    expect([...setup.fakePrisma.users.values()][0]?.role).toBe("VENDOR");

    await request(app.getHttpServer())
      .patch("/api/v1/vendors/me/profile")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        businessName: "Setu Test Services",
        description: "A development vendor profile for onboarding tests.",
        contactEmail: "vendor.user@setu.test",
        addressLine1: "123 Test Street",
        postalCode: "560001",
        primaryCityId: cityId,
      })
      .expect(200);

    await request(app.getHttpServer())
      .put("/api/v1/vendors/me/categories")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ categoryIds: [categoryId] })
      .expect(200);

    await request(app.getHttpServer())
      .put("/api/v1/vendors/me/service-areas")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ cityIds: [cityId], primaryCityId: cityId })
      .expect(200);

    await request(app.getHttpServer())
      .post("/api/v1/vendors/me/documents")
      .set("Authorization", `Bearer ${accessToken}`)
      .field("type", "GST_CERTIFICATE")
      .attach("file", Buffer.from("%PDF-1.4\n%EOF"), "gst.pdf")
      .expect(201)
      .expect(({ body }) => {
        expect(body.vendor.documents).toHaveLength(1);
      });

    await request(app.getHttpServer())
      .post("/api/v1/vendors/me/submit")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(201)
      .expect(({ body }) => {
        expect(body.vendor.status).toBe("PENDING_REVIEW");
        expect(body.vendor.missingRequirements).toEqual([]);
      });

    await request(app.getHttpServer())
      .patch("/api/v1/vendors/me/profile")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ businessName: "Late Edit" })
      .expect(403);
  });

  it("rejects admin tokens on vendor routes", async () => {
    ({ app } = await createApp());

    const adminLogin = await request(app.getHttpServer())
      .post("/api/v1/admin/auth/login")
      .send({
        email: "admin.local@setu.test",
        password: "change-me-local-admin-password",
      })
      .expect(201);

    await request(app.getHttpServer())
      .get("/api/v1/vendors/me")
      .set("Authorization", `Bearer ${adminLogin.body.accessToken as string}`)
      .expect(401);
  });
});
