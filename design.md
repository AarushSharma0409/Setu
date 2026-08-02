# Setu MVP UI/UX Design Specification

## 1. Purpose

This document defines the visual language, interaction model, responsive behavior, and accessibility standards for the Setu MVP.

The goal is to make Setu feel like a complete, trustworthy marketplace product rather than a collection of individually implemented screens.

The visual direction is based on a modern, immersive service-marketplace experience with:

- White and soft-neutral surfaces
- Violet brand accents with restrained luminous highlights
- Rounded cards and controls
- Generous spacing
- Clear typography
- Layered depth and spatial composition
- Smooth, choreographed motion
- Tactile microinteractions
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

### Immersion with purpose

The product should feel alive through depth, continuity, and responsive motion. Animation must clarify relationships, acknowledge input, and preserve context—not become visual noise or delay task completion.

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

## 17.5 Immersive Visual Layers

The interface should gain visual richness through controlled layering rather than excessive decoration.

### Hero environment

- Use one large soft violet glow and one secondary neutral glow.
- Add abstract bridge or connection motifs that support the “Setu” name without resembling government symbols.
- Compose two or three floating preview cards showing real product concepts such as a vendor card, inquiry update, or verified profile.
- Keep foreground text on a stable high-contrast plane.
- Use masks and gradients to fade decorative layers before they interfere with content.

### Premium surfaces

Use a hierarchy of surfaces:

```text
Base canvas
Raised section
Interactive card
Overlay
Focused action surface
```

Interactive cards may use a very soft accent border, a pointer spotlight, and a small elevation transition. Standard form cards should remain calm and predictable.

### Visual storytelling

Use compact, real product previews to explain value:

- Discovery preview: category, city, and approved vendors
- Trust preview: verification state and transparent explanation
- Inquiry preview: message and status continuity
- Vendor preview: onboarding progress and lead inbox

Do not include features that do not exist in the MVP.

### Texture and gradients

- Allow restrained radial gradients and low-opacity noise texture on marketing surfaces.
- Avoid full-page gradients behind dense application content.
- Avoid glassmorphism on forms, tables, dialogs, and document review.
- Decorative layers must never reduce contrast or readability.

---

## 18. Immersive Motion and Interaction System

Setu should feel polished, spatial, and responsive without becoming theatrical. Motion is part of the product language and must be designed as a system.

### Recommended implementation

Use the existing animation stack when suitable. If no capable library exists, prefer **Motion for React** through `motion/react` for React components.

Use Motion for:

- Shared-layout transitions
- Presence and exit animations
- Spring-based interactive feedback
- Scroll-triggered section reveals
- Staggered list and card entrances
- Animated drawers, dialogs, tabs, and filters
- Number and status transitions

Use CSS transitions for simple hover, focus, color, opacity, and shadow changes. Do not use JavaScript animation where CSS is sufficient.

### Motion tokens

```text
Instant feedback:     80–120 ms
Micro interaction:  120–180 ms
Standard transition: 180–260 ms
Overlay/dialog:      220–320 ms
Section reveal:      320–520 ms
Hero choreography:   500–900 ms maximum
```

```css
--ease-standard: cubic-bezier(0.22, 1, 0.36, 1);
--ease-enter: cubic-bezier(0.16, 1, 0.3, 1);
--ease-exit: cubic-bezier(0.4, 0, 1, 1);
```

Recommended spring profiles:

```text
Tactile:  stiffness 420, damping 30, mass 0.7
Layout:   stiffness 300, damping 32, mass 0.9
Gentle:   stiffness 180, damping 24, mass 1.0
```

Treat these as starting points, not arbitrary per-component settings. Centralize them in motion utilities.

### Immersive homepage choreography

The public homepage may use:

- A soft animated violet radial glow behind the hero
- Very slow ambient gradient movement with low opacity
- Layered vendor-preview cards with small depth offsets
- Pointer-responsive parallax limited to 4–8 px on capable desktop devices
- A search panel that settles into place on first load
- Staggered category-card reveal as the section enters the viewport
- Subtle icon drift or pulse used once, not continuously
- A search-button press transition that visually carries into results

The hero must remain fully understandable and usable when animation is disabled.

### Spatial depth

Create depth using restrained combinations of:

- Overlapping surfaces
- Soft blurred background shapes
- Border contrast
- Small elevation changes
- Scale changes of approximately 0.98–1.02
- Pointer spotlight effects on premium cards
- Foreground/background motion at different speeds

Do not use aggressive 3D rotation. Card tilt should stay below approximately 1.5 degrees and must be disabled on touch devices and reduced-motion settings.

### Shared-layout transitions

Use shared element or layout animations where they improve continuity:

- Selected category chip into active filter chip
- Vendor card image or identity block into vendor profile header
- Inquiry list item into inquiry detail header
- Notification item removal after mark-read
- Onboarding step indicator progression
- Mobile filter trigger into filter drawer

Do not block navigation waiting for animation. The route and data state remain authoritative.

### Component microinteractions

#### Buttons

- Hover: slight elevation or background shift
- Press: scale to approximately `0.98`
- Loading: transition label into spinner without changing width
- Success where appropriate: brief icon confirmation, then settle

#### Cards

- Hover: translate upward by 2–4 px with border and shadow refinement
- Focus-visible: equivalent non-pointer emphasis
- Optional desktop spotlight follows pointer with very low-opacity radial highlight
- Never make operational admin rows float dramatically

#### Inputs and selects

- Smooth focus-ring appearance
- Label and helper-state transitions
- Search suggestions enter with staggered opacity and vertical movement
- Validation error appears without shaking the entire form

A short horizontal nudge may be used only for a failed one-time confirmation action, never repeatedly.

#### Tabs and filters

- Shared animated active indicator
- Filter chips animate addition and removal
- Result count crossfades or increments smoothly
- Filter drawer uses opacity plus short-axis movement

#### Dialogs, drawers, and menus

- Backdrop fades independently
- Surface enters with scale plus opacity, or slides from its physical edge
- Exit animations are shorter than entry animations
- Focus management must not wait for animation completion

#### Toasts and notifications

- Enter from the nearest viewport edge
- Stack changes animate smoothly
- Auto-dismiss progress must not be the only time indicator
- Mark-read transitions reduce emphasis without removing context abruptly

#### Messaging

- New message enters with subtle opacity and vertical offset
- Sending state shows locally without pretending delivery confirmation
- Status and system messages use a restrained timeline transition
- Do not animate the full conversation on every refetch

#### Dashboards

- Metric values may animate from their previous displayed value
- Skeletons crossfade into content
- Charts are outside MVP unless real and useful
- Table sorting should animate row reordering only when it remains legible

### Scroll-based reveals

Use viewport reveals selectively:

- Animate each major marketing section once
- Prefer opacity plus 12–24 px vertical movement
- Stagger child cards by 40–80 ms
- Trigger before the content reaches the center of the viewport
- Never hide essential content solely until JavaScript executes

Avoid scroll hijacking, pinned storytelling, and long parallax sequences.

### Route and page transitions

Use restrained route continuity:

- Crossfade main content or animate a small page-header region
- Preserve scroll and focus behavior correctly
- Avoid animating the entire application shell on every route
- Use loading skeletons for data latency rather than long exit transitions

### Ambient animation limits

Continuous animation is permitted only for subtle decorative layers.

Rules:

- Maximum two continuously animated ambient elements per viewport
- Minimum cycle duration approximately 8 seconds
- Low opacity and low travel distance
- Pause or simplify when offscreen
- Avoid continuous animation in admin operational pages
- Avoid high-frequency blur, large filters, or expensive box-shadow animation

### Performance requirements

- Animate `transform` and `opacity` whenever possible
- Avoid layout-thrashing properties such as width, height, top, and left for frequent animation
- Avoid animating large blurred surfaces on low-power mobile devices
- Lazy-load motion-heavy visual modules
- Keep animation code out of server components unless a client boundary is needed
- Do not convert entire pages into client components solely for animation
- Target smooth interaction on mid-range mobile devices
- Use `will-change` sparingly and remove it after animation where practical

### Reduced motion

Respect `prefers-reduced-motion` and Motion's reduced-motion hooks.

When reduced motion is enabled:

- Remove parallax, tilt, continuous ambient movement, and large translations
- Replace shared-layout motion with immediate state changes or short opacity fades
- Keep focus, success, loading, and state feedback visible
- Do not remove information or interaction affordances

### Prohibited motion patterns

Avoid:

- Scroll hijacking
- Autoplay video backgrounds
- Cursor replacement
- Excessive 3D card tilt
- Repeated bouncing
- Large page entrance animations on every navigation
- Animation that blocks input
- Decorative status pulsing
- Constant motion in tables or admin queues
- Animating every element simultaneously
- Fake progress or fake real-time activity

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
