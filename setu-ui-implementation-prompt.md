# Setu — UI/UX Implementation Prompt

## Objective

Implement the Setu MVP frontend so it feels like a finished, trustworthy, modern product, using the supplied UI reference as the visual direction.

The target experience is a polished service-marketplace interface with:

- Clean white and soft-neutral surfaces
- A restrained violet primary brand color
- Rounded cards and controls
- Spacious layouts
- Clear information hierarchy
- High-quality responsive behavior
- Smooth, purposeful animation
- Consistent public, user, vendor, and admin experiences

This task is a frontend refinement and design-system implementation. Preserve all working Sprint 1–5 functionality and backend contracts unless a small compatibility fix is essential.

---

## 1. Mandatory Working Method

Before changing code:

1. Inspect the complete repository.
2. Inspect the public web application, vendor routes, account routes, and admin application.
3. Inspect the shared UI package, Tailwind configuration, global styles, icons, form components, layouts, and route groups.
4. Inspect all existing tests.
5. Inspect the current API contracts and preserve them.
6. Identify duplicated UI components and inconsistent styling.
7. Run baseline lint, type checking, frontend tests, and builds where possible.
8. Implement the design system first, then refactor screens progressively.
9. Preserve authentication boundaries and private-page cache behavior.
10. Do not report a command as passed unless it was actually executed successfully.

---

## 2. Design Direction

Setu must feel:

- Trustworthy
- Premium but accessible
- Modern
- Calm
- Professional
- Clear
- Mobile-first
- Suitable for a broad Indian service marketplace

Avoid:

- Heavy gradients
- Glassmorphism
- Excessive shadows
- Neon colors
- Overly playful illustration styles
- Fake testimonials
- Fake ratings
- Fake vendor counts
- Government-style visual language
- Visual clutter
- Generic dashboard-template styling

The reference design uses bright white surfaces, soft gray borders, subtle violet highlights, rounded corners, and highly structured spacing. Recreate the spirit and quality, not a pixel-for-pixel copy.

---

## 3. Brand System

### Product name

Use `Setu` consistently.

### Primary color

Use a violet family as the primary brand color.

Recommended semantic tokens:

```css
--color-primary-50: #f5f3ff;
--color-primary-100: #ede9fe;
--color-primary-200: #ddd6fe;
--color-primary-300: #c4b5fd;
--color-primary-400: #a78bfa;
--color-primary-500: #8b5cf6;
--color-primary-600: #7c3aed;
--color-primary-700: #6d28d9;
--color-primary-800: #5b21b6;
--color-primary-900: #4c1d95;
```

Use `primary-600` for main actions, `primary-700` for hover, and `primary-50` or `primary-100` for soft highlights.

### Neutral palette

Use a cool gray neutral system.

```css
--color-neutral-0: #ffffff;
--color-neutral-50: #fafafa;
--color-neutral-100: #f5f5f5;
--color-neutral-200: #e5e7eb;
--color-neutral-300: #d1d5db;
--color-neutral-500: #6b7280;
--color-neutral-700: #374151;
--color-neutral-900: #111827;
```

### Semantic colors

```css
--color-success: #16a34a;
--color-warning: #d97706;
--color-danger: #dc2626;
--color-info: #2563eb;
```

Use semantic colors sparingly and always pair them with labels or icons.

---

## 4. Typography

Use the existing legally available font. Prefer `Inter`, `Geist`, or the repository’s current sans-serif font.

Recommended hierarchy:

```text
Display:       48–64 px desktop, 36–44 px mobile
Page title:    32–40 px desktop, 28–32 px mobile
Section title: 24–30 px
Card title:    17–20 px
Body:          15–16 px
Small body:    13–14 px
Caption:       12–13 px
```

Use medium or semibold weight for headings. Avoid excessive boldness.

Body line-height should remain comfortable, approximately 1.5–1.7.

---

## 5. Layout System

### Public application

- Maximum content width: approximately 1200–1280 px
- Desktop horizontal padding: 24–32 px
- Mobile horizontal padding: 16 px
- Section spacing: 64–96 px desktop, 40–64 px mobile
- Card gaps: 16–24 px

### Dashboards

- Desktop sidebar: approximately 232–256 px
- Main content max width: approximately 1440 px
- Desktop content padding: 24–32 px
- Mobile content padding: 16 px

### Radius

```text
Small controls: 8 px
Inputs/buttons: 10–12 px
Cards:          14–18 px
Large panels:   20–24 px
Pills:          999 px
```

### Shadows

Use subtle shadows only:

```css
--shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.05);
--shadow-md: 0 8px 24px rgba(15, 23, 42, 0.08);
--shadow-lg: 0 20px 50px rgba(15, 23, 42, 0.12);
```

Do not apply shadows to every card. Prefer borders for most surfaces.

---

## 6. Core Shared Components

Create or refine these components in the shared UI package where appropriate:

- Button
- IconButton
- Input
- Textarea
- Select
- Combobox
- Checkbox
- RadioGroup
- FormField
- FieldLabel
- FieldDescription
- FieldError
- SearchInput
- Card
- MetricCard
- VendorCard
- CategoryCard
- CityCard
- Badge
- StatusBadge
- Alert
- Toast
- Dialog
- ConfirmationDialog
- Drawer or Sheet
- DropdownMenu
- Tabs
- Breadcrumbs
- Pagination
- Skeleton
- Spinner
- EmptyState
- ErrorState
- PageHeader
- SectionHeader
- DataTable
- ResponsiveList
- StepIndicator
- Progress
- FileUpload
- FileItem
- MessageBubble
- MessageComposer
- Timeline
- NotificationItem
- MobileBottomNavigation where required

Every component must support:

- Default
- Hover
- Focus-visible
- Active
- Disabled
- Loading where relevant
- Error where relevant

---

## 7. Public Homepage

Create a finished marketplace homepage.

### Header

Include:

- Setu logo and wordmark
- Home
- Categories
- Cities or Explore
- How it works
- Vendor onboarding entry
- Login/account controls
- Primary action such as `Find vendors` or `Get started`
- Responsive mobile menu

Do not expose an admin link.

### Hero

Use a two-column desktop composition:

Left:

- Trust badge or short trust statement
- Strong headline
- Supporting paragraph
- Search panel
- Popular search shortcuts

Right:

- A curated composition of service-category or vendor visual cards
- Use real project assets or neutral placeholders
- Do not invent fake vendor ratings or counts

Recommended headline direction:

```text
Find trusted local service providers near you
```

Search panel:

- Service/category input
- City input
- Primary search button
- Clear focus treatment
- Responsive stacked layout on mobile

### Trust strip

Display 3–4 factual platform attributes, such as:

- Verified vendor applications
- Private document handling
- Simple discovery
- Direct inquiries

Avoid unsupported guarantees.

### Popular categories

Use clean category tiles with:

- Icon
- Category name
- Optional approved-vendor count only if real
- Hover motion
- Clear link behavior

### Popular cities

Use compact location cards or links.

### Vendor call-to-action

Separate the vendor onboarding CTA visually from user discovery.

---

## 8. Search and Discovery Pages

Refine:

- Category index
- Category detail
- City index
- City detail
- Combined category-city pages
- Search results

Required layout:

- Breadcrumbs
- Clear page title
- Short page description
- Search or filter controls
- Result count
- Active filter chips
- Sort control
- Vendor card list/grid
- Pagination
- Empty state
- Error state

Desktop filters may use a sidebar or horizontal filter bar.

Mobile filters must use a drawer or sheet.

URL parameters remain the source of truth.

---

## 9. Vendor Cards

Use a premium, clean card design.

Recommended content order:

1. Vendor image or initials-based fallback
2. Verified badge
3. Business name
4. Primary city and state
5. Category labels
6. Short description
7. Service-area summary
8. Profile action

Do not display fake reviews, fake ratings, fake response times, or fabricated prices.

Animation:

- 150–220 ms hover elevation
- Slight upward translation, maximum 2–4 px
- Border or shadow refinement
- Respect reduced motion

---

## 10. Vendor Profile

Create a visually rich but trustworthy vendor profile page.

Desktop layout:

- Main profile content on the left
- Inquiry panel on the right

Mobile layout:

- Business summary first
- Inquiry call-to-action after primary information
- Optional sticky bottom CTA only if it remains accessible

Required sections:

- Vendor summary
- Verified badge
- Categories
- City and service areas
- About
- Business details
- Public contact information
- Inquiry form
- Verification explanation

Optional gallery only if real vendor media exists. Do not generate fake portfolio content.

Inquiry panel should use a clear card with strong field grouping and a prominent submit action.

---

## 11. User Dashboard

Create a calm dashboard shell.

Desktop:

- Left sidebar
- Main content
- Optional right supporting panel only when useful

Mobile:

- Compact top header
- Bottom navigation or drawer

Recommended sections:

- Welcome header
- Inquiry summary metric cards
- Recent inquiries
- Unread messages
- Notifications
- Recommended vendors only if real logic already exists; otherwise omit

Do not display fake analytics.

---

## 12. Inquiry and Messaging Experience

### Inquiry list

Use:

- Status badges
- Vendor identity
- Subject
- Reference number
- Last activity
- Unread indicator
- Responsive cards on mobile

### Inquiry detail

Display:

- Inquiry header
- Status
- Service details
- Vendor summary
- Timeline
- Message thread
- Message composer

### Messages

Message bubbles must clearly distinguish:

- User
- Vendor
- System

Use sender label, timestamp, and alignment. Do not rely only on color.

Use subtle enter animations for newly rendered messages, but do not create fake real-time behavior.

### Motion

- New message fade and translate: 150–200 ms
- Drawer and dialog: 180–240 ms
- Status badge update: subtle fade
- No bouncing or playful spring effects in operational workflows

---

## 13. Vendor Onboarding

Create a polished multi-step wizard.

Required elements:

- Step indicator
- Current step label
- Completion status
- Save state
- Back and continue actions
- Clear validation
- Mobile-friendly layout

Steps:

1. Business details
2. Categories
3. Service areas
4. Documents
5. Review and submit

Document upload must support:

- Drag and drop
- Standard file picker
- Accepted types
- Maximum size
- Upload progress
- Uploaded status
- Retry
- Remove
- Replace
- Error messages

Review page must display section summaries with edit actions.

---

## 14. Vendor Dashboard

Create a distinct vendor workspace with:

- Vendor identity
- Verification status
- Lead inbox
- Inquiry detail
- Messaging
- Notifications
- Profile/status navigation

Pending vendors must see a focused verification-status experience rather than empty lead-management screens.

Approved vendors may see:

- New inquiry count
- Active inquiries
- Resolved inquiries
- Recent activity

Use only real data.

---

## 15. Admin Application

The admin interface should share design foundations but be denser and operational.

### Admin shell

- Left sidebar
- Clear active route
- Admin identity and role
- Logout
- Mobile drawer
- No public-marketplace navigation

### Login and 2FA

Use a focused, secure layout.

- Minimal distractions
- Clear admin-only label
- Strong error handling
- TOTP setup panel
- Recovery-code panel
- Clear challenge-expiry state

### Dashboard

Use metric cards for:

- Pending verifications
- Approved vendors
- Rejected vendors
- Suspended vendors
- Open inquiries
- System status

Use real data only.

### Verification queue

Use:

- Search
- Filters
- Sort
- Result count
- Dense but readable table
- Responsive list alternative
- Clear review action

### Vendor review

Use a two-column or structured section layout:

- Vendor profile information
- Categories and service areas
- Documents
- Verification history
- Approve/reject actions

Use strong confirmation dialogs for high-impact actions.

### Audit logs

Use a readable table with filters and expandable safe metadata.

---

## 16. Motion System

Use purposeful motion only.

Recommended durations:

```text
Micro interaction: 120–160 ms
Standard transition: 180–240 ms
Overlay/dialog: 200–260 ms
Page section reveal: 250–400 ms
```

Recommended easing:

```css
cubic-bezier(0.22, 1, 0.36, 1)
```

Use animation for:

- Button hover and press
- Card hover
- Drawer and dialog entry
- Dropdown menus
- Tab indicator
- Toast entry and exit
- Skeleton-to-content transition
- Page-section reveal
- Step transitions
- Filter chip addition/removal

Do not animate:

- Large blocks during every route change
- Tables excessively
- Critical status changes with decorative effects
- Anything that delays user input

Respect:

```css
@media (prefers-reduced-motion: reduce);
```

Disable nonessential transforms and long transitions for reduced-motion users.

---

## 17. Responsive Behavior

Validate at:

```text
320 × 568
375 × 667
768 × 1024
1024 × 768
1440 × 900
```

Requirements:

- No horizontal overflow
- Search panel stacks on mobile
- Cards collapse to one column on narrow screens
- Filter sidebar becomes a drawer
- Tables become cards or responsive lists
- Admin pages remain usable on tablets
- Dialogs fit within viewport
- Message composer remains visible and usable
- Bottom navigation does not cover content
- Safe-area padding is used where appropriate

---

## 18. Accessibility

Target WCAG 2.1 AA behavior where practical.

Required:

- Semantic landmarks
- One clear page-level heading
- Logical heading hierarchy
- Visible labels
- Error associations
- Error summaries for long forms
- Keyboard navigation
- Visible focus
- Accessible dialogs
- Accessible drawers
- Accessible menus
- Accessible tabs
- Accessible pagination
- Accessible file upload
- Screen-reader announcements
- Non-color status indicators
- Suitable touch targets
- Reduced-motion support
- Sufficient contrast

Do not claim formal compliance without testing.

---

## 19. Loading, Empty, Error, and Success States

Every major screen must include intentional states.

### Loading

- Structured skeletons
- Local spinners for button actions
- Avoid full-screen spinners when unnecessary

### Empty

Examples:

- No approved vendors
- No inquiries
- No leads
- No notifications
- No verification applications
- No audit records

Each empty state should explain what is absent and offer a useful next action.

### Error

Support:

- Validation error
- Page load error
- Unauthorized
- Forbidden
- Not found
- Conflict
- Rate limited
- Dependency unavailable

### Success

Use persistent page updates for irreversible actions. Toasts may supplement but not replace them.

---

## 20. Frontend Architecture Constraints

- Preserve Next.js App Router.
- Preserve separate public and admin builds.
- Use server components for server-rendered content where practical.
- Use client components only for interactive behavior.
- Do not share authentication state between public and admin applications.
- Keep reusable primitives in the shared UI package.
- Keep app-specific compositions in each app.
- Avoid large third-party UI frameworks.
- Avoid unnecessary animation libraries.
- Avoid global CSS sprawl.
- Avoid arbitrary repeated Tailwind values.
- Do not expose private data through metadata, static generation, or public caches.

---

## 21. Testing Requirements

Add or update tests for:

### Shared UI

- Button variants
- Loading states
- Form errors
- Dialog keyboard behavior
- Status badges
- Pagination
- Empty states
- File upload
- Message bubbles

### Public application

- Header and mobile navigation
- Homepage hero
- Search
- Vendor cards
- Vendor profile
- Inquiry form
- User dashboard
- Inquiry detail
- Notifications
- Loading, empty, error, and conflict states

### Vendor application

- Onboarding stepper
- Forms
- Category selection
- Service areas
- Document upload
- Review and submission
- Status page
- Lead inbox
- Messaging

### Admin application

- Login
- 2FA
- Dashboard
- Verification queue
- Vendor review
- Document access
- Approval and rejection dialogs
- Vendor management
- Audit logs

### Accessibility

Use automated checks where available and manually validate keyboard operation for critical journeys.

---

## 22. Required Validation

Attempt:

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
pnpm format:check
```

Also run focused public, vendor, admin, and shared UI tests and builds.

Report exact results as:

```text
PASS
FAIL
NOT RUN
BLOCKED
```

Do not overstate completion.

---

## 23. Required Final Report

Return:

1. Existing UI assessment
2. Design system implemented
3. Token files changed
4. Shared components added or refactored
5. Public routes refined
6. Vendor routes refined
7. Admin routes refined
8. Motion system
9. Responsive behavior
10. Accessibility improvements
11. Frontend architecture impact
12. Tests added
13. Commands executed
14. Exact validation results
15. Incomplete items
16. Deviations and reasons
17. Known limitations
18. Screens that still require manual review

---

## Final Instruction

Implement this design direction directly in the existing Setu repository. Preserve all working MVP functionality, create a coherent and production-quality design system, refine the complete public, user, vendor, and admin experiences, implement smooth but restrained motion, ensure responsive and accessible behavior, run real validation commands, and report exact results without overstating completion.
