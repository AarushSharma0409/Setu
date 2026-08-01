# Setu MVP UI/UX Design Specification

## 1. Purpose

This document defines the visual language, interaction model, responsive behavior, and accessibility standards for the Setu MVP.

The goal is to make Setu feel like a complete, trustworthy marketplace product rather than a collection of individually implemented screens.

The visual direction is based on a modern service-marketplace experience with:

- White and soft-neutral surfaces
- Violet brand accents
- Rounded cards and controls
- Generous spacing
- Clear typography
- Subtle depth
- Smooth motion
- Mobile-first interaction

The design must support four related experiences:

1. Public marketplace
2. User account and inquiries
3. Vendor onboarding and lead management
4. Admin verification and operations

---

## 2. Design Principles

### Trust first

The interface must feel reliable and calm. Avoid exaggerated claims, fake metrics, or overly decorative visuals.

### Clear hierarchy

Every page should make its primary purpose and next action obvious.

### Progressive disclosure

Show advanced details only when they are useful. Avoid overwhelming users with dense controls.

### Consistency

Use the same spacing, typography, color, status, and component conventions throughout the product.

### Mobile first

Public and vendor experiences must work comfortably on narrow screens. Admin workflows must remain usable on tablets.

### Motion with purpose

Animation should clarify state changes and improve continuity, not decorate the interface.

### Accessible by default

Use semantic HTML, keyboard-friendly controls, visible focus, suitable contrast, and non-color status indicators.

---

## 3. Brand Identity

### Product name

Setu

### Brand personality

- Trustworthy
- Modern
- Helpful
- Professional
- Inclusive
- Calm

### Primary color

Violet is the main brand color.

```css
--primary-50: #f5f3ff;
--primary-100: #ede9fe;
--primary-200: #ddd6fe;
--primary-300: #c4b5fd;
--primary-400: #a78bfa;
--primary-500: #8b5cf6;
--primary-600: #7c3aed;
--primary-700: #6d28d9;
--primary-800: #5b21b6;
--primary-900: #4c1d95;
```

Primary usage:

- Main buttons
- Active navigation
- Links
- Focus rings
- Selected controls
- Soft emphasis backgrounds

Do not use violet for every visual element.

### Neutral colors

```css
--neutral-0: #ffffff;
--neutral-50: #fafafa;
--neutral-100: #f5f5f5;
--neutral-200: #e5e7eb;
--neutral-300: #d1d5db;
--neutral-500: #6b7280;
--neutral-700: #374151;
--neutral-900: #111827;
```

### Semantic colors

```css
--success: #16a34a;
--warning: #d97706;
--danger: #dc2626;
--info: #2563eb;
```

Every semantic color must be paired with readable text or an icon.

---

## 4. Typography

Preferred font stack:

```css
font-family: Inter, Geist, ui-sans-serif, system-ui, sans-serif;
```

Recommended scale:

| Role          |  Desktop |   Mobile | Weight |
| ------------- | -------: | -------: | -----: |
| Display       |    56 px |    40 px |    700 |
| Page title    |    36 px |    30 px |    700 |
| Section title |    28 px |    24 px |    650 |
| Card title    |    18 px |    17 px |    600 |
| Body          |    16 px |    16 px |    400 |
| Small body    |    14 px |    14 px |    400 |
| Caption       | 12–13 px | 12–13 px |    500 |

Guidelines:

- Use sentence case.
- Avoid excessive bold text.
- Use muted text only for secondary information.
- Keep body line-height between 1.5 and 1.7.
- Limit long-form content to a readable width.

---

## 5. Spacing and Layout

### Spacing scale

Use a consistent 4 px base scale.

```text
4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96
```

### Public layout

- Maximum width: 1280 px
- Mobile page padding: 16 px
- Tablet page padding: 24 px
- Desktop page padding: 32 px
- Section spacing: 64–96 px desktop, 40–64 px mobile

### Dashboard layout

- Sidebar: 240 px
- Main content max width: 1440 px
- Main content padding: 24–32 px
- Mobile padding: 16 px

### Border radius

```text
Controls: 10–12 px
Cards: 16 px
Large panels: 20–24 px
Pills: 999 px
```

### Shadows

```css
--shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.05);
--shadow-md: 0 8px 24px rgba(15, 23, 42, 0.08);
--shadow-lg: 0 20px 50px rgba(15, 23, 42, 0.12);
```

Prefer borders over shadows for standard cards.

---

## 6. Design Tokens

Use semantic tokens.

```css
--background: var(--neutral-50);
--foreground: var(--neutral-900);
--surface: var(--neutral-0);
--surface-muted: var(--neutral-100);
--border: var(--neutral-200);
--border-strong: var(--neutral-300);
--primary: var(--primary-600);
--primary-hover: var(--primary-700);
--primary-soft: var(--primary-50);
--focus-ring: var(--primary-400);
--muted-text: var(--neutral-500);
```

Avoid repeated arbitrary colors in components.

---

## 7. Components

### Buttons

Variants:

- Primary
- Secondary
- Outline
- Ghost
- Danger
- Link

Sizes:

- Small
- Medium
- Large
- Icon

States:

- Default
- Hover
- Focus-visible
- Active
- Disabled
- Loading

Primary buttons use solid violet. Secondary buttons use soft violet or neutral surfaces. Danger buttons use semantic red.

### Inputs

Inputs must include:

- Visible label
- Optional description
- Error message
- Focus ring
- Disabled state
- Clear placeholder hierarchy

Use 44 px minimum interactive height where practical.

### Cards

Card styles:

- Standard bordered card
- Elevated card
- Soft-highlight card
- Metric card
- Interactive card

Do not nest cards unless the hierarchy is essential.

### Badges

Badges should be compact and readable.

Vendor status mapping:

| Status               | Treatment             |
| -------------------- | --------------------- |
| Draft                | Neutral               |
| Pending verification | Warning               |
| Approved             | Success               |
| Rejected             | Danger                |
| Suspended            | Danger/neutral strong |

Inquiry status mapping:

| Status      | Treatment      |
| ----------- | -------------- |
| New         | Primary        |
| Viewed      | Info           |
| Contacted   | Violet soft    |
| In progress | Warning        |
| Resolved    | Success        |
| Closed      | Neutral        |
| Withdrawn   | Neutral strong |

Never use color alone.

### Dialogs

Dialogs must include:

- Title
- Description
- Clear primary action
- Clear cancel action
- Focus trap
- Escape support where safe
- Loading state
- Explicit labels

Use confirmation dialogs for high-impact actions.

### Toasts

Use toasts for short-lived confirmation or recoverable errors.

Do not use a toast as the only confirmation for an irreversible action.

---

## 8. Navigation

### Public navigation

Desktop header:

- Setu logo
- Home
- Categories
- Cities or Explore
- How it works
- Vendor onboarding
- Login/account
- Primary search action

Mobile:

- Compact top bar
- Menu drawer
- Optional bottom navigation for authenticated account areas

### Vendor navigation

- Overview
- Application or profile
- Verification status
- Inquiries
- Notifications
- Logout

### Admin navigation

- Dashboard
- Verifications
- Vendors
- Inquiries if implemented
- Audit logs
- System status
- Logout

Admin navigation must be visually denser than public navigation.

---

## 9. Homepage

### Hero

Desktop uses a two-column layout.

Left:

- Trust statement
- Strong headline
- Supporting copy
- Search panel
- Popular searches

Right:

- Curated visual composition using category or vendor cards

Mobile stacks content vertically.

### Search panel

Fields:

- Service or category
- City
- Search action

Use a white panel with a subtle border and shadow.

### Trust strip

Use 3–4 factual attributes:

- Reviewed vendor applications
- Private document handling
- Simple discovery
- Direct inquiries

### Categories

Use a responsive grid of category cards.

### Cities

Use compact city links or cards.

### Vendor onboarding CTA

Use a separate section with a soft violet background.

---

## 10. Discovery Pages

Every discovery page includes:

- Breadcrumbs
- Page title
- Short description
- Filters
- Sort
- Result count
- Vendor cards
- Pagination
- Empty state
- Error state

Desktop filters may be horizontal or in a sidebar.

Mobile filters use a sheet or drawer.

Active filters appear as removable chips.

---

## 11. Vendor Card

Structure:

1. Vendor image or initials
2. Verified badge
3. Business name
4. Location
5. Categories
6. Description excerpt
7. Service-area summary
8. View profile action

Interaction:

- Hover elevation
- Focus-visible ring
- Slight 2–4 px lift
- 150–220 ms transition

Do not show unsupported ratings or prices.

---

## 12. Vendor Profile

Desktop layout:

- Main content column
- Inquiry sidebar

Required sections:

- Business summary
- Verified status
- Categories
- Primary location
- About
- Service areas
- Public contact details
- Inquiry form
- Verification explanation

The inquiry form should remain visually distinct from vendor information.

---

## 13. User Dashboard

Dashboard shell:

- Sidebar on desktop
- Compact header and bottom navigation on mobile

Suggested content:

- Welcome header
- Inquiry metrics
- Recent inquiries
- Unread notifications
- Recent messages

Only display real data.

---

## 14. Inquiry and Messaging UI

### Inquiry list

Use a responsive table on desktop and cards on mobile.

Show:

- Vendor name
- Subject
- Reference number
- Status
- Last activity
- Unread state

### Inquiry detail

Show:

- Header
- Status
- Service details
- Timeline
- Messages
- Composer
- Available actions

### Messages

User and vendor messages must be visually distinct, but not only through color.

Use:

- Sender label
- Alignment
- Timestamp
- Safe line wrapping

System messages use a neutral centered treatment.

---

## 15. Vendor Onboarding

Use a five-step wizard:

1. Business details
2. Categories
3. Service areas
4. Documents
5. Review and submit

The wizard must provide:

- Step progress
- Current step
- Back and continue
- Save state
- Field errors
- Error summary
- Mobile layout

Document upload includes drag-and-drop, file picker, progress, status, retry, remove, and replace.

---

## 16. Vendor Dashboard

Pending vendors see:

- Current verification status
- Submission date
- Application summary
- Next-step explanation

Approved vendors see:

- New inquiries
- Active inquiries
- Resolved inquiries
- Recent activity
- Notifications

Suspended vendors see a neutral restricted-state message without internal reasons.

---

## 17. Admin UI

Admin UI uses the same typography and tokens but a more operational layout.

### Login and 2FA

- Focused centered form
- Minimal distractions
- Secure language
- Clear errors
- Recovery-code alternative

### Dashboard

Metric cards for:

- Pending verifications
- Approved vendors
- Rejected vendors
- Suspended vendors
- Open inquiries
- System status

### Verification queue

- Search
- Filters
- Sort
- Paginated table
- Responsive list on smaller screens
- Review action

### Vendor review

- Profile summary
- Categories
- Service areas
- Documents
- Decision history
- Approve/reject actions

### Audit logs

- Timestamp
- Actor
- Action
- Entity
- Request ID
- Safe metadata

---

## 18. Motion and Animation

Motion must be subtle and purposeful.

### Durations

```text
Micro interaction: 120–160 ms
Standard transition: 180–240 ms
Overlay/dialog: 200–260 ms
Section reveal: 250–400 ms
```

### Easing

```css
cubic-bezier(0.22, 1, 0.36, 1)
```

### Approved use cases

- Button hover and press
- Card hover
- Drawer entry
- Dialog entry
- Dropdown menu
- Tab indicator
- Toast entry and exit
- Skeleton transition
- Step changes
- New message appearance
- Filter chip changes

### Avoid

- Long page entrance animations
- Bouncing effects
- Repeated animation on every render
- Decorative status animations
- Motion that delays interaction

### Reduced motion

Respect `prefers-reduced-motion` and disable nonessential transforms.

---

## 19. Responsive Rules

Target widths:

```text
Mobile:   320–767 px
Tablet:   768–1023 px
Desktop:  1024–1439 px
Wide:     1440 px and above
```

Rules:

- No unintended horizontal overflow
- Search panel stacks on mobile
- Cards become one column where needed
- Filters become drawers
- Tables become cards or responsive lists
- Dialogs remain inside viewport
- Message composer remains accessible
- Mobile navigation does not cover content
- Admin remains usable on tablets

---

## 20. Loading States

Use skeletons matching expected content.

Examples:

- Vendor card skeleton
- Search result skeleton
- Dashboard metric skeleton
- Table-row skeleton
- Message skeleton
- Profile-section skeleton

Use localized spinners for actions.

Avoid full-screen spinners unless the entire application is blocked.

---

## 21. Empty States

Required empty states:

- No categories
- No cities
- No vendors
- No inquiries
- No leads
- No notifications
- No verification applications
- No audit logs

Each state should include:

- Clear title
- Short explanation
- Useful next action where appropriate

---

## 22. Error States

Support:

- Validation errors
- Network errors
- Unauthorized
- Forbidden
- Not found
- Conflict
- Rate limited
- Dependency unavailable
- Unexpected error

Do not expose raw backend errors or stack traces.

Use request IDs in operational errors where available.

---

## 23. Accessibility

Target WCAG 2.1 AA behavior where practical.

Requirements:

- Semantic landmarks
- Logical heading hierarchy
- Visible labels
- Error associations
- Keyboard navigation
- Focus-visible styles
- Accessible dialogs
- Accessible menus
- Accessible tabs
- Accessible pagination
- Accessible file upload
- Screen-reader announcements
- Suitable contrast
- Non-color status indicators
- Touch-friendly controls
- Reduced-motion support

Automated checks do not replace manual testing.

---

## 24. Content Standards

Use consistent terminology:

- Vendor
- Inquiry
- Verification
- Approved
- Pending verification
- Rejected
- Suspended

Avoid unsupported claims:

- Best vendor
- Guaranteed
- Government approved
- 100% safe
- Fully verified
- Lowest price

Use neutral, factual microcopy.

---

## 25. Privacy and Security

- Do not include private data in metadata.
- Do not cache authenticated pages publicly.
- Do not expose signed document URLs in persistent state.
- Do not render messages or audit metadata as raw HTML.
- Clear sensitive client state on logout.
- Keep admin and public authentication isolated.
- Keep the admin application `noindex` and disallowed from crawling.

---

## 26. Quality Checklist

Before considering the UI complete:

- [ ] Public header is responsive
- [ ] Homepage feels complete
- [ ] Search is clear and usable
- [ ] Vendor cards are consistent
- [ ] Vendor profile is polished
- [ ] Inquiry form is usable
- [ ] User dashboard is coherent
- [ ] Messaging is mobile-friendly
- [ ] Vendor onboarding is clear
- [ ] Vendor dashboard reflects vendor status
- [ ] Admin login and 2FA are refined
- [ ] Verification queue is efficient
- [ ] Vendor review actions are safe
- [ ] Audit logs are readable
- [ ] Loading states exist
- [ ] Empty states exist
- [ ] Error states exist
- [ ] Motion respects reduced-motion settings
- [ ] Core flows are keyboard accessible
- [ ] No fake data is presented as real
- [ ] Public and admin builds remain separate

---

## 27. Reference Implementation Priorities

Implement in this order:

1. Design tokens
2. Shared components
3. Public application shell
4. Homepage
5. Discovery pages
6. Vendor profile
7. Authentication
8. User inquiry experience
9. Vendor onboarding
10. Vendor dashboard and leads
11. Admin authentication
12. Admin operational screens
13. Motion refinement
14. Responsive refinement
15. Accessibility fixes
16. Tests and documentation
