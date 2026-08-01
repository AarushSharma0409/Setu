# Setu UI system

Sprint 5.5 establishes a compact, semantic UI foundation for the public,
vendor, and operations applications.

## Principles

- Make discovery, verification, and inquiry actions obvious.
- Prefer calm surfaces, strong typography, and restrained elevation.
- Use sentence case and factual language; never imply a service-quality guarantee.
- Treat loading, empty, error, disabled, and conflict states as first-class UI.
- Keep public discovery open and approachable while making operations denser and task-focused.

## Tokens

Shared CSS variables live in `packages/ui/src/styles.css` and are imported by
both applications. They include semantic colors, spacing-friendly component
dimensions, radius, elevation, motion, focus, and layout widths. Pages should
use the shared primitives and semantic variables instead of introducing new
unrelated colors.

Core semantic colors include `--setu-primary`, `--setu-success`,
`--setu-warning`, `--setu-danger`, `--setu-info`, `--setu-border`, and
`--setu-focus-ring`. Reduced-motion users receive near-zero animation and
transition durations.

## Typography and spacing

The interface uses the system sans-serif stack already supplied by the browser,
with a limited scale: page titles, section titles, body, small body, captions,
labels, and button text. Page containers use a 72rem maximum width and narrow
reading content to approximately 48rem. Cards use medium/large radius and
restrained shadows.

## Shared components

`packages/ui` provides Button, IconButton, Input, Textarea, Select, FormField,
Card, PageContainer, PageHeader, SectionHeader, Badge, StatusBadge, Alert,
LoadingState, Spinner, Skeleton, EmptyState, ErrorState, Progress, SkipLink,
and Label. Buttons support primary, secondary, outline, ghost, danger, and link
variants plus small, medium, large, icon, disabled, and loading states.

Status badges centralize readable mappings for vendor, inquiry, document, and
account states. Status meaning is never communicated by color alone.

## Shells

The public app uses `PublicShell` with a responsive header, mobile navigation,
account/vendor workspace links, skip link, and footer. It never links to admin.
The admin app keeps a separate `ProtectedShell` with a responsive operations
sidebar, identity display, status navigation, and logout.

## Responsive strategy

Layouts are mobile-first. Grids collapse at narrow widths, navigation becomes a
menu, forms remain usable at 320px, and administrative tables expose a card
list alternative on mobile. Inquiry threads wrap long text, while dialogs and
cards stay within the viewport.

## Accessibility standards

Interactive controls use semantic elements, visible focus rings, labels,
`aria-current` for active navigation/steps, `role=status` for loading, and
`role=alert` for errors. The public shell provides a skip link. Reduced motion
is respected. Automated checks are useful but do not constitute a full WCAG
audit; manual keyboard and screen-reader follow-up remains part of release QA.

## State conventions

- Loading: `LoadingState`, `Spinner`, and `Skeleton` where layout stability matters.
- Empty: `EmptyState` with an honest description and only a useful next action.
- Error: `ErrorState` or semantic `Alert` with recovery guidance.
- Success: `Alert` or confirmation card with a reference number where applicable.
- Conflict: preserve user input and explain that the resource changed; retry safely.
- Disabled: preserve layout, explain unavailable actions, and avoid color-only cues.
