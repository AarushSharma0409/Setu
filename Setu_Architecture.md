# Setu — PAN-India Multi-Category Vendor Directory Platform — Full Architecture (v2)

**Change from v1:** Insurance is no longer a lead-routing-only category. You hold an **IRDAI Web Aggregator license**, so the platform now includes a real quotation/comparison engine for insurance — this section (8) is fully rewritten. Purchase/policy-issuance still stays off-platform (redirects to insurer/broker), consistent with aggregator scope — that boundary is unaffected by the license you hold.

---

## 1. Product Summary

A JustDial-style multi-category vendor directory (local services, IT service providers, immigration consultants) **plus** a licensed insurance comparison/quotation engine (PolicyBazaar-style) for the insurance category specifically. Non-insurance categories remain lead/inquiry-based (list → contact); insurance is comparison/quotation-based (details → quotes → select → redirect to insurer/broker for purchase).

---

## 2. High-Level System Architecture

```
   PUBLIC-FACING (app.yourplatform.com)          INTERNAL ONLY (ops.yourplatform-xyz.com)
   ┌──────────────────────┐                       ┌──────────────────────┐
   │   Next.js Frontend    │                       │   Admin Panel (SPA)  │
   │ (SSR category/city    │                       │  Separate deployment,│
   │  pages for SEO, PWA)  │                       │  separate build —    │
   │  user + vendor UI      │                      │  no shared bundle    │
   │  + insurance quote UI  │                      │  with public app.    │
   └──────────┬───────────┘                       │  No public links.    │
              │ HTTPS/REST                          │  robots.txt disallow│
   ┌──────────▼───────────┐                        │  + noindex; IP allow-│
   │     API Gateway        │                       │  list; mandatory 2FA;│
   │ (auth, rate limiting,  │◄──────────────────────│  unauth'd = 404, not │
   │  request routing)      │   admin-only routes    │  a login page        │
   └──────────┬───────────┘   (separate auth guard)  │                      │
      ┌───────────┬───────────┬────┴─────┬────────────┬────────────┬────────┐
┌─────▼─────┐┌────▼─────┐┌────▼─────┐┌───▼────────┐┌───▼────────┐┌────▼─────┐┌────▼──────┐
│  Vendor   ││  Search/ ││  Lead    ││Verification││ Insurance  ││Notification││ Insurance  │
│  Service  ││  Filter  ││ Routing  ││  Service   ││  Quotation ││  Service   ││  Insurer   │
│(non-insur.)││(Typesense)││ Service  ││(admin queue)││  Engine    ││(email/SMS/ ││ Integration│
│           ││          ││          ││            ││  (NEW)     ││ WhatsApp)  ││   Layer    │
└─────┬─────┘└────┬─────┘└────┬─────┘└─────┬──────┘└─────┬──────┘└────┬─────┘└─────┬──────┘
      │           │           │            │             │            │            │
      └───────────┴───────────┴─────┬──────┴─────────────┴────────────┴────────────┘
                                     │
                         ┌───────────▼────────────┐
                         │   Postgres (primary)    │
                         │   + Redis (cache/queue)  │
                         │   + S3 (documents/media) │
                         └─────────────────────────┘
```

**Deployment note:** Modular monolith for backend v1. Admin panel is a separate frontend deployment/subdomain regardless of backend approach (see Section 12).

---

## 3. Full Sitemap (revised — insurance gets its own flow, ~34 page types)

### Public / Marketing (no login)
1. Home — category grid, search bar, city selector
2. Category landing page — templated per category×city (non-insurance categories)
3. Vendor public profile — services, reviews, verified badge, "Contact Vendor"
4. Search results / filtered listing page (non-insurance categories)
5. **Insurance landing page** — policy type selector (health, motor, life, term, etc.)
6. About / How it works
7. For Vendors — sell the platform, pricing tiers
8. Contact / Support
9. Terms of Service, Privacy Policy, Refund Policy
10. Blog / SEO content (optional, phase 2)

### Insurance-specific (NEW — replaces old "insurance as directory" flow)
11. **Need-profile form** — per policy type (age, coverage amount, city, existing conditions/vehicle details/etc. depending on type)
12. **Quotation results page** — multiple insurer quotes side-by-side, filterable (premium, coverage, claim settlement ratio, insurer rating)
13. **Quote detail page** — single insurer's plan breakdown, terms, inclusions/exclusions
14. **Redirect/handoff page** — "Continue to [Insurer/Broker] to complete purchase" (this is the license boundary — actual purchase happens off-platform)
15. My Quotes (saved/past quotation requests, in user dashboard)

### User-facing (logged in, non-insurance)
16. Signup / Login (OTP, Google, WhatsApp)
17. User dashboard — inquiries/leads sent, status tracker
18. Inquiry detail / chat thread
19. Saved / bookmarked vendors
20. Profile settings
21. Review submission (unlocked only post-completed inquiry)

### Vendor-facing (logged in)
22. Vendor registration — multi-step (business details → category attributes → document upload)
23. Pending verification status page
24. Vendor dashboard — leads, funnel, profile completeness
25. Vendor profile edit
26. Subscription / billing (tiers, featured placement)
27. Vendor lead inbox / chat

### Admin (internal ops)
28. Admin login (2FA required)
29. Vendor verification queue — approve/deny with document viewer, SLA timer
30. Vendor management — search/edit/suspend
31. User management
32. Category/filter schema manager
33. Leads & analytics dashboard
34. **Insurer & product management (NEW)** — onboard insurers, manage their product/rate data feeds, monitor quote-to-redirect conversion
35. Content moderation — flagged reviews/vendors

---

## 4. Database Schema (revised)

```sql
-- (unchanged core tables: users, vendors, categories, vendor_documents,
--  leads, reviews, messages, admin_users — see v1 for full definitions)

-- Insurers (replaces insurance_partners from v1)
insurers (
  id, name, irdai_registration_no, active,
  integration_type ENUM('api','manual_rate_card'),
  api_endpoint, contact_details
)

-- Insurance products offered per insurer
insurance_products (
  id, insurer_id REFERENCES insurers,
  policy_type ENUM('health','motor','life','term','travel','other'),
  product_name, coverage_details JSONB,
  base_premium_rules JSONB    -- rating factors: age bands, coverage amount, city tier, etc.
)

-- A user's quotation request (the "need profile")
quote_requests (
  id, user_id REFERENCES users,
  policy_type, profile_data JSONB,   -- age, coverage needed, vehicle/health details, city
  created_at
)

-- Individual quotes generated per insurer for a request
quotes (
  id, quote_request_id REFERENCES quote_requests,
  insurer_id REFERENCES insurers,
  product_id REFERENCES insurance_products,
  premium_amount, coverage_summary JSONB,
  claim_settlement_ratio, insurer_rating,
  generated_at
)

-- Tracks what happens after a user picks a quote (redirect, not purchase)
quote_selections (
  id, quote_id REFERENCES quotes,
  user_id, redirected_at, redirect_status ENUM('clicked','converted_unknown')
)
```

---

## 5. Backend Services (revised)

| Module | Responsibility |
|---|---|
| **Vendor Service** | Unchanged — CRUD, attribute validation, status transitions (non-insurance categories) |
| **Verification Service** | Unchanged — admin queue, SLA timers, document access control |
| **Search/Filter Service** | Unchanged — Typesense sync for non-insurance categories |
| **Lead Routing Service** | Now scoped to non-insurance categories only |
| **Insurance Quotation Engine (NEW)** | Takes a `quote_request`, applies each active insurer's `base_premium_rules` (or calls their API if `integration_type = api`) to generate comparable `quotes`, ranks/filters by user criteria |
| **Insurance Insurer Integration Layer (NEW)** | Manages insurer onboarding — either live API integration or manual rate-card ingestion (CSV/admin-entered rules) for insurers without an API |
| **Messaging Service** | Unchanged, non-insurance categories |
| **Review Service** | Unchanged |
| **Notification Service** | Unchanged, plus quote-ready notifications |
| **Billing Service** | Vendor subscription tiers only — no insurance billing since purchase is off-platform |
| **Admin/Analytics Service** | Extended with insurer/product management, quote-to-redirect conversion tracking |

---

## 6. Frontend Architecture

Unchanged from v1 (Next.js, Tailwind, React Query, Typesense InstantSearch), plus:
- **Quotation results UI** — comparison table/cards, sortable by premium/coverage/rating, filter panel (similar pattern to product-comparison UIs, not a generic vendor listing).
- **Need-profile form** — multi-step, conditional fields per policy type (health vs. motor vs. life have different required inputs).

---

## 7. Verification Flows

Unchanged from v1 (Section 7) — user OTP/OAuth verification, vendor manual verification with 12–24hr SLA. **Insurers** (not individual vendors) go through a separate, lighter onboarding: IRDAI registration number validation + product/rate data setup, managed by ops via the new Insurer & Product Management panel — not the same queue as local-service vendors.

---

## 8. Insurance Quotation & Comparison Engine (Licensed — Aggregator Scope)

This replaces v1's "lead-routing-only" approach now that you hold an aggregator license.

**What's in scope (permitted under aggregator license):**
- Collecting user need-profile data (age, coverage needs, city, etc.)
- Generating and displaying multiple insurers' quotes side-by-side
- Sorting/filtering/ranking quotes by premium, coverage, claim settlement ratio, insurer rating
- Highlighting a "recommended" or "best value" quote based on transparent, disclosed criteria

**What's still out of scope (purchase/issuance is not aggregator activity):**
- Accepting payment for a policy on your platform
- Generating or issuing policy documents
- Any step past "user selects a quote" — from there, redirect to the insurer's or broker's platform to complete the actual purchase

**Flow:**
1. User picks a policy type → fills need-profile form (`quote_requests`)
2. Quotation Engine generates `quotes` from all active insurers matching the profile (via API or rate-card rules)
3. Results page shows comparison table
4. User selects a quote → `quote_selections` logs the click → redirect to insurer/broker's purchase flow (deep link or affiliate link)
5. You earn referral commission per IRDAI-compliant aggregator commercial terms with each insurer — this is a business/contract detail per insurer, not a platform feature

**Compliance checklist for launch (verify with your compliance team, not just engineering):**
- Every insurer listed must have a valid, current IRDAI registration on file (`insurers.irdai_registration_no`) — verify, don't just collect the field.
- Quote comparison and ranking criteria must be transparent/disclosed to users (standard IRDAI aggregator requirement) — display methodology, not a black-box "recommended" tag.
- No aggregator-side fee charged to the user — revenue must come from insurer commission, matching your license terms.

---

## 9. Feature List by Module

- **Search/Filter (non-insurance):** faceted search, geo-radius, saved searches, typo-tolerance
- **Insurance quotation:** multi-insurer quote generation, comparison table, transparent ranking, save-quote-for-later
- **Lead capture (non-insurance):** structured per-category inquiry forms
- **Messaging:** in-platform threads, phone hidden until opt-in
- **Reviews:** gated to completed leads
- **Vendor tiers:** free / featured / premium — non-insurance monetization
- **Insurer management:** onboarding, rate-card/API integration, conversion tracking — insurance monetization
- **Notifications:** WhatsApp Business API, SMS, email — including "your quotes are ready"
- **Admin verification queue:** SLA-tracked vendor approval (non-insurance)
- **Category schema manager:** admin-configurable categories/filters

---

## 10. Tech Stack Summary

Unchanged from v1 — Next.js / NestJS-or-FastAPI / Postgres / Typesense / Redis / S3 / WhatsApp Business API / SES-SendGrid / Razorpay-Cashfree (vendor billing only) / Docker / AWS Mumbai.

---

## 11. What Beats JustDial / PolicyBazaar (Design-Level Differentiators)

Non-insurance categories: unchanged from v1 (verified onboarding, in-platform chat, gated reviews, structured filtering, lead-quality visibility).

Insurance category — differentiator vs. PolicyBazaar specifically: transparent ranking methodology shown to users (many aggregators obscure why a plan is "recommended" — commission-driven ranking is a known trust problem in this space); this is a real trust/differentiation lever if you commit to it, not just a compliance checkbox.

---

## 12. Admin Panel Isolation (Confidentiality Requirement)

Unchanged from v1 — separate subdomain/deployment, no public links, robots.txt disallow + noindex, IP allowlisting, mandatory 2FA, generic 404 for unauthenticated access, no admin terminology leaked in public-facing copy or API responses. Now also applies to the new Insurer & Product Management panel (Section 3, page 34) — same isolation rules.

---

## 13. Open Items Requiring Non-Engineering Decisions

- Confirm each insurer's IRDAI registration validity before listing their products — compliance task, not engineering.
- Insurer commercial agreements (referral commission terms per insurer) — business/legal, needed before the Insurer Integration Layer has real data to work with.
- Ranking/recommendation disclosure methodology — needs sign-off from whoever holds your compliance function, since "transparent criteria" is an IRDAI expectation, not just a UX nicety.
- Vendor subscription pricing tiers (non-insurance) — business decision.
- SLA staffing plan for the vendor verification queue at projected PAN-India volume.
- Whether policy types beyond an initial 2–3 (e.g., start with health + motor) are in v1 scope or phased — each policy type needs its own need-profile form and rating logic.
