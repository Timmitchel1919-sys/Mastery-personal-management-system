# Mastery — Design System

The retained **Mastery** design language. The Compass color palette and Compass UI
specification are explicitly out of scope and must not be implemented.

Concrete token values (exact hex, type scale numbers, radii) are finalized in **Layer 2**.
This document fixes the system's structure, principles, and component inventory so Layer 2
implements against a known target.

---

## 1. Principles

- **Mobile-first**, then tablet, then desktop. Design the smallest layout first.
- **Calm and focused.** Mastery is used daily for reflection and planning; the UI favors
  clarity, generous spacing, and low visual noise over decoration.
- **Semantic and accessible by default.** Semantic HTML elements, visible focus, keyboard
  operability, `prefers-reduced-motion` respected, WCAG AA contrast in every theme.
- **Token-driven.** Components consume design tokens (CSS variables mapped into the Tailwind
  theme), never raw hex or magic numbers.
- **Theme-aware.** Every color is defined for light and dark; `system` follows the OS.
- **Composable.** Small primitives compose into feature components; no one-off styling that
  bypasses the token layer.

## 2. Tokens

Defined as CSS custom properties on `:root` (light) and `:root[data-theme="dark"]` /
`@media (prefers-color-scheme: dark)`, then exposed through `tailwind.config`.

### Color roles (semantic, not literal)

| Role | Usage |
|---|---|
| `background`, `surface`, `surface-raised` | page and card backgrounds |
| `border`, `border-strong` | dividers, input outlines |
| `text`, `text-muted`, `text-subtle` | primary / secondary / tertiary text |
| `primary`, `primary-foreground`, `primary-hover` | main actions, active nav |
| `accent`, `accent-foreground` | optional per-user accent (`accentColorPreference`) |
| `success`, `warning`, `danger`, `info` (+ `-foreground`, `-subtle`) | status and feedback |
| `focus-ring` | focus outline color |
| `overlay` | modal / drawer scrim |

Pillar accent hints (`spiritual`, `personal`, `societal`) are provided as subtle tints for
labels and charts, never as the only signal.

### Scales

- **Spacing:** 4px base — `0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24` (× 4px).
- **Radius:** `sm`, `md`, `lg`, `xl`, `full`.
- **Typography:** one sans UI family + optional serif for long-form reflection; sizes
  `xs, sm, base, lg, xl, 2xl, 3xl, 4xl` with matching line-heights; weights `regular,
  medium, semibold, bold`.
- **Shadow / elevation:** `xs, sm, md, lg` — restrained; dark theme leans on surface
  contrast over shadow.
- **Motion:** durations `fast (120ms)`, `base (200ms)`, `slow (320ms)`; standard easing;
  all transitions disabled under `prefers-reduced-motion`.
- **Breakpoints:** `sm 640`, `md 768`, `lg 1024`, `xl 1280`, `2xl 1536`.
- **Z-index:** documented ladder — base, dropdown, sticky, drawer, modal, toast, tooltip.

## 3. Layout system

- **Desktop:** fixed left sidebar, sticky topbar, scrollable main, optional contextual
  right panel.
- **Tablet:** collapsible sidebar, compact topbar.
- **Mobile:** navigation drawer + fixed bottom navigation (Dashboard, Plan, Focus, Act,
  Grow), safe-area insets, touch-friendly controls (min target ≈ 44px).
- Content max-width and consistent page padding via a `PageContainer`.

## 4. Component inventory

**Primitives (`components/ui/`):** Button, IconButton, Link, Input, Textarea, Select,
Combobox, Checkbox, Radio, Switch, Slider, DatePicker, TimePicker, Badge, Tag, Avatar,
Tooltip, Popover, DropdownMenu, Dialog/Modal, Drawer/Sheet, Tabs, Accordion, Card,
Progress, Meter, Spinner, Skeleton, Toast, Alert, Breadcrumb, Pagination, Table/DataTable,
SegmentedControl, Kbd.

**Layout (`components/layout/`):** AppShell, Sidebar, SidebarItem, Topbar, BottomNav,
Breadcrumbs, RightPanel, PageContainer, PageHeader.

**Shared composites (`components/shared/`):** LoadingState, EmptyState, ErrorState,
ConfirmDialog, FormField (label + control + error + hint), SearchInput, CommandPalette,
StatCard, TrendChart wrapper, DateRangePicker, TagInput, PillarLabel.

Each component: typed props, forwarded ref where relevant, `className` merge via
`tailwind-merge` + `clsx`, accessible roles/labels, keyboard support, light/dark verified,
a story/example in the design-system route, and at least a smoke render test.

## 5. Accessibility checklist (per component and per screen)

- Semantic element or correct ARIA role; labelled controls; described errors.
- Full keyboard path; visible `focus-ring`; logical tab order; focus trap in modals/drawers.
- Contrast AA for text and essential UI in light and dark.
- Respects `prefers-reduced-motion`; no information conveyed by color alone.
- Hit targets meet the minimum on touch.

## 6. Theming rules

- No component defines a color outside the token layer.
- `ThemeProvider` sets `data-theme`; an inline script applies the stored/system theme
  before paint to prevent flash.
- Optional `accentColorPreference` maps to the `accent` role only; it never overrides
  status colors or contrast requirements.

## 7. Implementation status (Layer 2)

**Tokens** — `src/app/globals.css`: semantic `--color-*` roles (background, surface,
surface-raised, overlay, foreground, muted, subtle, border, border-strong, primary /
primary-foreground / primary-hover, accent, success/warning/danger/info + `-foreground` /
`-subtle`, ring, `pillar-{spiritual,personal,societal}`), `--font-{sans,serif,mono}`,
light + dark values via the 3-block pattern (`:root` / `@media` / `[data-theme]`), exposed
to Tailwind v4 with `@theme inline`. Base layer sets default border color, focus-visible
ring, and a `prefers-reduced-motion` reset. Spacing / radius / shadow / breakpoint scales
use Tailwind v4 defaults.

**Theme system** — `src/lib/theme.ts` (`Theme`, `resolveTheme`, `applyTheme`, storage
helpers, `themeStore` for `useSyncExternalStore`), `src/components/theme-script.tsx`
(pre-hydration no-flash script in `<head>`), `src/providers/theme-provider.tsx`
(`ThemeProvider` + `useTheme`), `src/components/ui/theme-toggle.tsx`. Preference is stored
in `localStorage` (key `mastery.theme`); cross-device persistence via the user profile is
wired in Layer 18. Follows OS changes in `system` mode and cross-tab `storage` events.

**Components built** — `src/components/ui/`: Button, IconButton, Spinner, Badge, Card
(+ Header/Title/Description/Content/Footer), Skeleton, Separator, VisuallyHidden, Kbd,
Avatar, Label, Input, Textarea, FormField, Checkbox, Switch, RadioGroup, Select, Tabs,
Dialog, DropdownMenu, Tooltip, Alert, SegmentedControl, ThemeToggle. `src/components/layout/`:
PageContainer, PageHeader, Breadcrumbs. Showcase route: `/design-system`.

**Deferred** (added by the first layer that needs them, same wrapper pattern): Accordion,
Popover, Toast, Combobox, Slider, DatePicker/TimePicker, Table/DataTable, Pagination,
CommandPalette. The responsive app shell (Sidebar / Topbar / BottomNav) is Layer 5.
