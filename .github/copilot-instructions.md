# WorkNest — Copilot Instructions

This is a NestJS-based HR & Workforce Management platform (WorkNest). All UI work should align with the design system defined below, inspired by BambooHR's design tokens.

---

## Project Stack

- **Backend**: NestJS (TypeScript)
- **Component libraries**: PrimeReact / PrimeNG / PrimeVue, Element Plus/UI
- **Database**: PostgreSQL (Flyway migrations in `src/hrandworkforce/database/migrations/`)

---

## UI Design System

### Color Palette

Use CSS custom properties wherever possible.

#### Primary / Brand Colors
| Token | Hex | Usage |
|---|---|---|
| `--color-green-3` | `#599d15` | Primary brand green |
| `--color-green-2` | `#2e7918` | Hover states, borders on links |
| `--color-green-dark` | `#0d5d1b` | Deep accent |
| `--color-green-shade` | `#03551c` | Dark green for text links |
| `--color-green-tint` | `#ecffc7` | Light green background tint |
| `--color-teal-shade` | `#004c39` | Deep teal shade |

#### Accent / Secondary Colors
| Token | Hex | Usage |
|---|---|---|
| `--color-5` | `#16acff` | Primary blue accent |
| `--color-5-tint-5` | `#5cc8ff` | Light blue tint |
| `--color-5-shade-5` | `#1087cc` | Blue hover |
| `--color-5-shade-10` | `#095c8f` | Deep blue |
| `--color-azure-3` | `#117eac` | Azure accent |
| `--color-4` | `#ffe619` | Yellow highlight |
| `--color-4-tint-10` | `#fff58f` | Light yellow tint |
| `--color-4-shade-15` | `#7c3000` | Dark orange-brown |
| `--color-3-shade-10` | `#aa410c` | Warm orange |
| `--color-8-tint-10` | `#b1f8df` | Mint tint |

#### Neutral / Grayscale
| Token | Hex | Usage |
|---|---|---|
| `--color-white` | `#ffffff` | Backgrounds, text on dark |
| `--color-gray-7` | `#95918f` | Muted text, placeholders |
| `--color-gray-6` | `#a5a29f` | Secondary text |
| `--color-gray-border` | `#d4d2d0` | Card borders, dividers |
| `--color-text-dark` | `#313131` | Primary body text |

#### Semantic / State Colors
| Token | Hex | Usage |
|---|---|---|
| `--color-error` | `#cb4553` | Error states, destructive actions |

---

### Typography

#### Font Families
- **Headings**: `Fields`, fallback: `Lato, georgia, serif`
- **Body / UI**: `Inter`, fallback: `Lato, arial, sans-serif`
- **System fallback**: `Arial`

#### Type Scale
| Role | Size | Weight | Line Height | Notes |
|---|---|---|---|---|
| `heading-1` (desktop) | 56px / 3.5rem | 700 | 1.20 (tight) | Fields font |
| `heading-1` (mobile) | 36px / 2.25rem | 700 | 1.28 (tight) | Fields font |
| `body` | 16px / 1rem | 400 | 1.50 | Inter |
| `body-bold` | 16px / 1rem | 700 | 1.63 (relaxed) | Inter |
| `link` | 16px / 1rem | 700 | 1.50 | Inter |
| `link-caps` | 16px / 1rem | 700 | 1.13 | letter-spacing: 0.5px |
| `caption` | 14px / 0.875rem | 700 | 1.57 | Inter |
| `caption-sm` | 12px / 0.75rem | 400 | 1.50 | Inter |
| `button` | 13.33px / 0.833rem | — | — | Arial |

---

### Spacing

Base unit: **8px**

| Token | Value |
|---|---|
| `--space-1` | 8px |
| `--space-2` | 10px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 20px |
| `--space-6` | 24px |
| `--space-7` | 30px |
| `--space-8` | 40px |
| `--space-9` | 48px |
| `--space-10` | 64px |
| `--space-11` | 96px |
| `--space-12` | 128px |

Prefer multiples of 8px. Use 10px, 12px, 13px, 18px, 23px, 63px only when matching extracted values exactly.

---

### Border Radius

| Context | Value |
|---|---|
| Cards / panels | `16px` |
| Buttons, pill elements | `100px` |
| Avatars / circular elements | `50%` |

---

### Borders

| Context | Style |
|---|---|
| Cards | `1px solid #d4d2d0` |
| Focused / active links | `2px solid #2e7918` |

---

### Shadows

Apply subtle shadows for cards and elevated surfaces. Use 2 levels:
- **Level 1** — light drop shadow for cards
- **Level 2** — stronger shadow for modals/dropdowns

---

### Links

| Default Color | Hover Color | Hover Decoration |
|---|---|---|
| `#ffffff` | `var(--color-green-2)` | underline |
| `#2e7918` | `var(--color-green-2)` | underline |
| `#03551c` | `var(--color-green-2)` | underline |
| `#ecffc7` | `var(--color-green-2)` | underline |

All links hover to `--color-green-2` (`#2e7918`) with underline decoration.

---

### Buttons

Provide 5 variants:
1. **Primary** — green background (`--color-green-3`), white text, `border-radius: 100px`
2. **Secondary** — white background, green border, green text
3. **Accent / CTA** — blue (`--color-5`), white text
4. **Ghost** — transparent, bordered
5. **Danger / Destructive** — red (`--color-error` `#cb4553`)

All buttons use `border-radius: 100px` (pill shape).

---

### Breakpoints

Responsive breakpoints (mobile-first, min-width approach):

| Label | Width |
|---|---|
| xs | 359px |
| sm | 390px |
| sm-md | 450px |
| md | 600px |
| md-lg | 700px |
| lg | 768px |
| lg+ | 800px |
| xl | 900px |
| xl+ | 1000px |
| 2xl | 1024px |
| 3xl | 1200px |
| 4xl | 1280px |
| 5xl | 1440px |
| max | 1800px |

---

## Frameworks

### PrimeReact / PrimeNG / PrimeVue
- 9 Prime components detected in the codebase (component prefix: `p-` / `Prime*`)
- **Always prefer Prime components** before building custom equivalents — buttons, dialogs, tables, dropdowns, date pickers, etc.
- Override Prime component styles using their exposed CSS custom properties or `pt` (PassThrough) API — avoid deep `.p-*` selector overrides where possible.
- Apply the WorkNest design tokens when theming Prime components (colors, border-radius, spacing).

### Element Plus / Element UI
- 16 Element components detected in the codebase (component prefix: `el-`)
- Use Element Plus for form-heavy layouts, tables, and data-dense views where it is already established.
- Override Element styles via CSS variables (`--el-*`) mapped to WorkNest tokens rather than hardcoding values.
- Do not mix Prime and Element components for the same UI pattern in the same view — pick one and stay consistent within a feature module.

---

## Coding Conventions

- Use **CSS custom properties** (variables) for all color, spacing, and typography tokens.
- Follow **BEM** or **utility-first** class naming where applicable.
- Use **PrimeNG / PrimeReact** or **Element Plus** component APIs before building custom equivalents.
- Keep components **accessible** — proper ARIA labels, keyboard navigation, focus states using `--color-5` (blue) or `--color-green-3` outline.
- All inputs and form fields must have visible labels and error states using `--color-error`.
- Dark text on light backgrounds: use `--color-text-dark` (`#313131`).
- Secondary/muted text: use `--color-gray-7` (`#95918f`) or `--color-gray-6` (`#a5a29f`).
- Avoid hardcoded hex values in component styles — always reference CSS tokens.
