# Design System

> Built by `/spec-design`. Single source of truth for the project's visual language.
>
> Follows the same shape as a Claude Design / Monad-style reference document. Replace placeholder values with extracted or generated tokens.

| Field | Value |
|-------|-------|
| Project | _<name>_ |
| Theme | light · dark · both |
| Inspiration | _<URL / brand name>_ |
| Last Updated | _<YYYY-MM-DD>_ |

---

## Style Statement

_<One paragraph describing the overall feel — what surface treatment, type pairing, color discipline, and rhythm the UI should embody.>_

## Tokens — Colors

| Name | Value | Token | Role |
|------|-------|-------|------|
| _<Primary Surface>_ | `#______` | `--color-primary-surface` | _<role>_ |
| _<Primary Text>_ | `#______` | `--color-primary-text` | _<role>_ |
| _<Accent>_ | `#______` | `--color-accent` | _<role>_ |

## Tokens — Typography

### _<Font Family 1>_ · `--font-display`
- **Substitute:** _<system fallback>_
- **Weights:** _<list>_
- **Sizes:** _<list>_
- **Line height:** _<value>_
- **Letter spacing:** _<value>_
- **Role:** _<headlines / display>_

### _<Font Family 2>_ · `--font-body`
- **Substitute:**
- **Weights:**
- **Sizes:**
- **Line height:**
- **Letter spacing:**
- **Role:** _<body / UI>_

### Type Scale

| Role | Size | Line Height | Letter Spacing | Token |
|------|------|-------------|----------------|-------|
| caption | 12px | 1.3 | -0.24px | `--text-caption` |
| body-sm | 14px | 1.35 | -0.28px | `--text-body-sm` |
| body | 16px | 1.35 | -0.32px | `--text-body` |
| subheading | 18px | 1.35 | -0.36px | `--text-subheading` |
| heading-sm | 24px | 1.2 | -0.48px | `--text-heading-sm` |
| heading | 32px | 1.2 | -0.64px | `--text-heading` |
| heading-lg | 40px | 1.2 | -0.8px | `--text-heading-lg` |
| display | 80px | 1.2 | -1.6px | `--text-display` |

## Tokens — Spacing & Shape

**Base unit:** 8px

| Name | Value | Token |
|------|-------|-------|
| 8 | 8px | `--spacing-8` |
| 16 | 16px | `--spacing-16` |
| 24 | 24px | `--spacing-24` |
| 32 | 32px | `--spacing-32` |
| 40 | 40px | `--spacing-40` |
| 72 | 72px | `--spacing-72` |
| 80 | 80px | `--spacing-80` |

### Border Radius

| Element | Value |
|---------|-------|
| buttons | _<px>_ |
| cards | _<px>_ |
| inputs | _<px>_ |
| tags | _<px>_ |

### Shadows

| Name | Value | Token |
|------|-------|-------|
| md | _<value>_ | `--shadow-md` |

### Layout

- **Page max-width:** _<px>_
- **Section gap:** _<px>_
- **Card padding:** _<px>_
- **Element gap:** _<px>_

## Components

### _<Component name>_
**Role:** _<purpose>_

_<One paragraph describing surface, type, spacing, and any non-obvious treatment.>_

## Do's and Don'ts

### Do
- _<rule>_
- _<rule>_

### Don't
- _<rule>_
- _<rule>_

## Surfaces

| Level | Name | Value | Purpose |
|-------|------|-------|---------|
| 0 | _<canvas>_ | `#______` | page background |
| 1 | _<elevated>_ | `#______` | cards |
| 2 | _<emphasis>_ | `#______` | CTAs |

## Imagery & Motion

_<Brief: how illustrations, photos, and motion are used — or deliberately avoided.>_

## Quick Start — CSS Custom Properties

```css
:root {
  /* paste extracted tokens here */
}
```

## Preview Assets

Generated HTML / CSS / JS examples live in [`./preview/`](./preview/).
