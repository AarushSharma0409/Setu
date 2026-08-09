# Setu Neumorphic UI/UX Design System

## 1. Design Direction

Setu should adopt a modern **soft-neumorphic interface** inspired by the approved visual reference.

The design language should feel clean, calm, tactile, premium, approachable, modern, spacious, trustworthy, and highly legible. The interface should not use exaggerated skeuomorphism. Neumorphism is used selectively to create depth and hierarchy while preserving accessibility, clarity, and performance.

The design must remain suitable for public marketplace discovery, vendor onboarding and dashboards, insurance customer journeys, quote comparison, account dashboards, insurer/organization workflows, admin operations, support, and monitoring.

## 2. Core Visual Principle

The UI should visually feel like components are softly molded from the same surface.

Use pale neutral backgrounds, soft inset and outset shadows, large rounded corners, subtle blue-violet accents, restrained pastel highlights, high whitespace, minimal hard borders, elevated cards, soft pressed states, subtle inset inputs, circular soft buttons, and restrained gradients.

Avoid harsh black shadows, high-gloss glass effects, excessive gradients, excessive 3D effects, low-contrast text, fake physical controls, strong inner shadows on text areas, and excessive raised surfaces.

## 3. Base Palette

Use semantic design tokens rather than raw values throughout components.

### Background

```css
--surface-root: #eef2f8;
--surface-soft: #f3f6fb;
--surface-raised: #f7f9fc;
--surface-muted: #e7ecf5;
```

### Text

```css
--text-primary: #171a22;
--text-secondary: #5f6675;
--text-muted: #8b92a2;
--text-inverse: #ffffff;
```

### Accent

```css
--accent-primary: #5f7cff;
--accent-primary-hover: #4d6af2;
--accent-secondary: #806cf6;
--accent-soft: #dfe6ff;
```

### Semantic

```css
--success: #52cfa7;
--success-soft: #dff7ef;
--warning: #f1bd64;
--warning-soft: #fff3da;
--danger: #ef767a;
--danger-soft: #fde7e8;
--info: #6d8cff;
--info-soft: #e7ecff;
```

Actual implementation should reuse existing Setu brand tokens when possible and map these values into the existing token system.

## 4. Neumorphic Shadow System

Centralize all elevation.

### Raised Surface

```css
box-shadow:
  10px 10px 24px rgba(163, 177, 198, 0.28),
  -10px -10px 24px rgba(255, 255, 255, 0.78);
```

### Small Raised Surface

```css
box-shadow:
  5px 5px 12px rgba(163, 177, 198, 0.24),
  -5px -5px 12px rgba(255, 255, 255, 0.72);
```

### Pressed / Inset

```css
box-shadow:
  inset 4px 4px 8px rgba(163, 177, 198, 0.2),
  inset -4px -4px 8px rgba(255, 255, 255, 0.72);
```

### Floating Action

```css
box-shadow:
  0 8px 22px rgba(95, 124, 255, 0.26),
  6px 6px 14px rgba(163, 177, 198, 0.22),
  -5px -5px 12px rgba(255, 255, 255, 0.7);
```

Use shadows sparingly. Dense admin tables should use flatter surfaces.

## 5. Radius System

```css
--radius-sm: 10px;
--radius-md: 14px;
--radius-lg: 18px;
--radius-xl: 24px;
--radius-2xl: 30px;
--radius-pill: 999px;
```

Recommended: input 12–14px, button 12–16px, card 18–24px, dashboard panel 20–28px, modal 24–28px, mobile shell 28–34px where visually appropriate.

## 6. Spacing

Use a consistent 4px-based system:

```text
4 8 12 16 20 24 32 40 48 64 80
```

Cards should have generous internal spacing. Desktop dashboard cards: 24–32px padding. Mobile cards: 16–20px padding.

## 7. Typography

Keep the existing Setu font stack unless there is a strong technical reason to change. Typography should be crisp and minimal.

Recommended scale:

```text
Display: 44–56px
H1: 32–40px
H2: 26–32px
H3: 20–24px
Body large: 17–18px
Body: 15–16px
Small: 13–14px
Meta: 12px
```

Use medium/semibold headings, regular body text, muted metadata, and strong numeric hierarchy in dashboards. Avoid excessive bold copy.

## 8. Main Layout

### Desktop

Use a light left navigation plus main content workspace. The sidebar should appear as part of the soft surface rather than a detached dark panel.

Desktop shell may use max-width 1440–1600px, a rounded outer app frame where appropriate, and a soft root shadow. For full-bleed production pages, use the neumorphic system inside standard viewport layouts rather than forcing every page into a floating mockup frame.

### Mobile

Use a top app bar, bottom navigation where appropriate, floating action only for high-frequency actions, stacked content, and full-width cards with 16px gutters.

## 9. Sidebar

Use a light soft panel. Navigation items use icon + label + active state. Active item uses a soft raised/inset background, accent icon/text, and subtle blue-violet emphasis. Inactive items remain mostly flat. Avoid rendering every navigation row as a card.

## 10. Top Navigation

Desktop top bar may include search, notification button, account, and contextual primary action. Search field should use an inset surface. Utility icon buttons should use circular or rounded soft raised controls.

## 11. Buttons

### Primary

Use a blue-violet gradient only for primary actions.

```css
background: linear-gradient(135deg, #6f8cff, #5571ef);
```

Use a raised shadow. Hover: slight lift and stronger accent shadow. Pressed: reduce elevation and apply a subtle inset effect.

### Secondary

Neutral soft raised surface.

### Ghost

Flat, no neumorphic shadow.

### Danger

Use red as a semantic accent, not a red neumorphic slab.

## 12. Button States

All buttons require hover, active, focus-visible, disabled, and loading states. Focus must use a real high-contrast focus ring. Do not rely on shadow changes alone for keyboard focus.

## 13. Inputs

Inputs should feel gently inset. Use a neutral root surface, inset shadow, clear border or focus ring when active, visible label, helper text, and error text. Do not over-darken inset shadows.

Focus uses an accent border/ring plus reduced inset shadow. Accessibility wins over pure neumorphism.

## 14. Cards

Card variants:

```text
Raised
Flat
Inset
Interactive
Selected
Status
```

Do not use raised shadows for every nested card. Recommended hierarchy:

```text
page background
  raised major section
    mostly flat/inset child content
```

## 15. Dashboard KPI Cards

Use a compact heading, primary metric, short supporting label, miniature chart or progress indicator, and generous whitespace.

Marketplace examples: active vendors, inquiries, responses, saved vendors.

Insurance examples: assessment progress, available quotes, saved quotes, latest quote validity.

Admin examples: pending verification, active products, provider health, failures requiring attention.

## 16. Progress Rings

Use for meaningful completion metrics only, such as assessment completion or onboarding completion. Use SVG, an accent gradient if appropriate, and always include numerical text.

## 17. Charts

Charts should be visually light: thin lines, minimal grid, subtle area fill, muted axis labels, rounded chart containers. Do not put strong neumorphic shadows around each chart element. The chart container may be raised; chart itself remains flat.

## 18. Tables

Admin and operations tables must prioritize readability. Use only light neumorphism: raised page container, flat table surface, soft row separators, subtle hover, status badges, clear sticky header. Do not turn every row into a floating card on desktop.

## 19. Mobile Lists

Convert dense tables into stacked soft cards on narrow screens. Each row card should expose primary identity, status, key metadata, primary action, and overflow action menu.

## 20. Modal and Drawer

Use a soft raised surface with a low-opacity dark backdrop and optional subtle blur. Modal should have a strong contrast boundary. Do not rely solely on shadows to distinguish it.

## 21. Status Badges

Use pill badges with soft tinted backgrounds for Approved, Pending, Active, Expired, Failed, In progress, Healthy, Degraded, etc. Text contrast must remain accessible.

## 22. Notifications

Use compact raised notification cards. Unread items may use a small accent marker and slightly stronger elevation. Read items should appear flatter. Do not over-animate notification lists.

## 23. Public Marketplace

Apply neumorphism selectively.

### Homepage

Use a soft hero search panel, raised category cards, layered vendor highlights, smooth pale background, and subtle accent gradients. Avoid making every marketing section a raised container.

### Vendor Cards

Use soft elevation, business name, verification, category, city, short description, and action. Hover should translateY(-2px), not use strong 3D tilt.

## 24. Search

Public search should become one of the key neumorphic components. Use a large inset search field plus raised search/filter buttons. Selected filters may use small pressed pills.

## 25. Vendor Profile

Use a raised identity/header card, flatter detail sections, inset or outlined info groups, and a strong inquiry CTA. Avoid excessive card nesting.

## 26. Vendor Dashboard

Use a light sidebar, greeting/header, KPI cards, lead list, message/activity feed, and status metrics. Cards may have stronger neumorphism than public discovery.

## 27. Vendor Onboarding

Use a raised central form card, inset inputs, soft progress bar, pressed active step, and clear primary CTA. Avoid heavy shadows on long forms.

## 28. Insurance Landing

Use the same system with a slightly more refined and trustworthy tone. Hero may feature layered insurance quote cards, subtle blue-violet gradient orb, policy selection tiles, and smooth floating surfaces. Avoid clichéd shields everywhere.

## 29. Insurance Need Assessment

Use a raised main wizard panel, flat or lightly inset form sections, pressed selection controls, soft progress indicator, and sticky navigation on desktop where appropriate.

Selection cards use raised default and pressed/selected state with accent check.

## 30. Quote Generation

Use a calm processing card and show only real progress, for example `3 of 5 products evaluated`. Use a progress ring, softly animated dots, or staged result cards only when results actually arrive.

## 31. Quote Cards

Use raised neumorphic quote cards with insurer, product, premium, cover, waiting period, deductible, key coverage, compare, save, and details. Selected comparison cards should have an accent outline, slightly pressed surface, and check icon. Do not use glowing neon cards.

## 32. Quote Comparison

Desktop: large raised comparison container with a mostly flat table and sticky insurer/product headers. Mobile: stacked comparison cards. Neumorphism should not reduce data density or comparison clarity.

## 33. Saved Quotes

Use soft cards grouped into Current and Expired. Expired cards should be visually quieter.

## 34. Handoff

Confirmation card should look secure and deliberate. Use insurer identity, selected quote summary, disclosure/consent section, strong primary CTA, and restrained external-link icon.

## 35. Admin

Admin should use restrained neumorphism. Prioritize operational density. Use light raised summary panels, flat data tables, subtle status cards, inset search/filter controls, and minimal decorative shadows.

## 36. Insurance Operations

Operations dashboard should be slightly flatter than customer dashboards. Use shadows to define top-level metric cards, incident panel, and provider-health panel. Inside use compact rows, tables, timeline, and alerts. Critical state should use semantic color, not just stronger shadow.

## 37. Mobile Navigation

Use a raised pill-like bottom nav where appropriate. Only add a central floating action where a truly primary action exists. Do not force this pattern onto every page.

## 38. Motion

Use Motion for React:

```ts
import { motion, AnimatePresence } from "motion/react";
```

Motion remains subtle.

## 39. Motion Tokens

```ts
export const motionDurations = {
  fast: 0.16,
  normal: 0.24,
  slow: 0.34,
};

export const motionSpring = {
  type: "spring",
  stiffness: 320,
  damping: 30,
};
```

## 40. Card Motion

Interactive card hover:

```ts
whileHover={{ y: -2 }}
```

Tap:

```ts
whileTap={{ scale: 0.985 }}
```

Do not animate large rotations.

## 41. Neumorphic Press Motion

When selection is pressed, move from raised to slightly inset using CSS shadow transition plus a small scale. Duration 120–180ms.

## 42. Page Motion

Main content may use opacity 0→1 and y 10→0. Do not animate every nested component.

## 43. Dashboard Stagger

KPI cards may enter with a 40–60ms stagger on initial render only. Do not replay on every filter change.

## 44. Reduced Motion

Respect `prefers-reduced-motion`. Disable parallax, large transforms, stagger, and continuous floating. Use simple opacity transitions only where needed.

## 45. Focus and Accessibility

Pure neumorphism often has poor contrast. Setu must not repeat that weakness.

Mandatory: explicit focus rings, sufficient text contrast, visible input boundaries, state labels, error text, icons with text where meaning is critical, and WCAG 2.1 AA target where practical.

Never use shadow alone to communicate selected, disabled, error, focused, or success.

## 46. Dark Mode

Do not automatically implement dark neumorphism unless explicitly required. If dark mode already exists, preserve functionality and adapt carefully with accessible dark surfaces.

## 47. Performance

Avoid extremely large blur radii, dozens of layered box shadows, animated box shadows across large lists, heavy backdrop-filter use, and large continuous CSS filters. Use neumorphic effects on meaningful containers only.

## 48. Responsive Breakpoints

Validate 320, 375, 430, 768, 1024, 1280, and 1440+. No horizontal overflow. Neumorphic shadows must not cause clipping.

## 49. Component Library

Create or refine reusable components:

```text
NeoSurface
NeoCard
NeoButton
NeoIconButton
NeoInput
NeoSelect
NeoTextarea
NeoSearch
NeoBadge
NeoProgressRing
NeoMetricCard
NeoModal
NeoDrawer
NeoTabs
NeoSegmentedControl
NeoBottomNav
NeoSidebar
NeoToolbar
NeoEmptyState
NeoStatusPanel
```

Do not duplicate existing shared UI unnecessarily. Prefer extending existing Setu components with `variant="neomorphic"` where clean.

## 50. Shadow Variants

Recommended API:

```ts
type NeoElevation = "flat" | "raised-sm" | "raised" | "raised-lg" | "inset";
```

Centralize mapping.

## 51. Interaction States

Every interactive component should define default, hover, focus-visible, active, selected, disabled, loading, and error.

## 52. Skeletons

Use low-contrast soft skeletons. Do not use aggressive shimmer. Respect reduced motion.

## 53. Empty States

Use minimal iconography and a raised container only where appropriate. Examples: no inquiries, no quotes, no saved vendors, no saved quotes, no provider incidents.

## 54. Implementation Rule

Neumorphism is a **surface treatment**, not an excuse to redesign information architecture unnecessarily.

Preserve navigation logic, routing, form behavior, accessibility, domain states, permissions, and APIs.

## 55. Design QA Checklist

For every major page verify:

```text
Visual hierarchy
Surface hierarchy
Contrast
Focus
Hover
Pressed state
Error state
Loading
Empty
Responsive
Reduced motion
Keyboard access
Screen-reader labels
Shadow clipping
Performance
```

## 56. Final Quality Bar

The final Setu interface should resemble the reference in these qualities: large soft panels, elegant white/gray canvas, blue-violet accent, rounded dashboard cards, inset search and input areas, soft floating action buttons, polished desktop/mobile consistency, tactile interaction states, clear typography, strong whitespace, and restrained chart styling.

But it must improve on typical neumorphism by ensuring accessible contrast, explicit borders/focus rings where necessary, clear state communication, flatter operational data tables, stronger readability, production performance, and reduced-motion support.
