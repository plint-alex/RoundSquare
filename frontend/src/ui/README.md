# Design System Documentation

This document describes the design system, design tokens, component usage, accessibility guidelines, and responsive breakpoints for the frontend application.

## CSS Methodology

We use **CSS Modules** for component styling. Each component has its own CSS file that is scoped to that component. Global styles and design tokens are defined in `global.css`.

### Why CSS Modules?

- **Scoped styles**: Prevents style conflicts between components
- **No runtime overhead**: Styles are processed at build time
- **Simple and maintainable**: No additional dependencies or complex setup
- **Type-safe**: TypeScript support for CSS module imports

## Design Tokens

All design tokens are defined as CSS custom properties (variables) in `global.css`. This ensures consistency across the application and makes it easy to update the design system.

### Colors

#### Light Mode (Default)
- `--color-primary`: Primary brand color (#2563eb)
- `--color-primary-hover`: Primary hover state (#1d4ed8)
- `--color-error`: Error/warning color (#dc2626)
- `--color-text`: Main text color (#1f2937)
- `--color-text-secondary`: Secondary text color (#6b7280)
- `--color-bg`: Main background color (#ffffff)
- `--color-bg-secondary`: Secondary background color (#f9fafb)
- `--color-border`: Border color (#e5e7eb)
- `--color-input-bg`: Input background (#ffffff)
- `--color-input-border`: Input border (#d1d5db)
- `--color-input-focus`: Input focus color (#2563eb)
- `--color-focus`: Focus outline color (#2563eb)
- `--color-focus-ring`: Focus ring color (rgba(37, 99, 235, 0.1))

#### Status Colors
- `--color-status-active`: Active status (#10b981)
- `--color-status-cooldown`: Cooldown status (#f59e0b)
- `--color-status-completed`: Completed status (#6b7280)

#### Dark Mode
All colors are automatically adjusted for dark mode using `@media (prefers-color-scheme: dark)`. The application respects the user's system preference.

### Spacing

We use a consistent spacing scale based on rem units:
- `--spacing-xs`: 0.25rem (4px)
- `--spacing-sm`: 0.5rem (8px)
- `--spacing-md`: 1rem (16px)
- `--spacing-lg`: 1.5rem (24px)
- `--spacing-xl`: 2rem (32px)
- `--spacing-2xl`: 3rem (48px)

### Typography

- `--font-family`: System font stack (system-ui, -apple-system, ...)
- `--font-size-xs`: 0.75rem (12px)
- `--font-size-sm`: 0.875rem (14px)
- `--font-size-base`: 1rem (16px)
- `--font-size-lg`: 1.125rem (18px)
- `--font-size-xl`: 1.25rem (20px)
- `--font-size-2xl`: 1.5rem (24px)
- `--font-size-3xl`: 2rem (32px)

### Border Radius

- `--radius-sm`: 0.25rem (4px)
- `--radius-md`: 0.375rem (6px)
- `--radius-lg`: 0.5rem (8px)

### Shadows

- `--shadow-sm`: Subtle shadow for elevation
- `--shadow-md`: Medium shadow for cards
- `--shadow-lg`: Large shadow for elevated elements

### Transitions

- `--transition-fast`: 0.1s
- `--transition-base`: 0.2s
- `--transition-slow`: 0.3s

### Z-index Scale

- `--z-index-base`: 1
- `--z-index-dropdown`: 10
- `--z-index-sticky`: 20
- `--z-index-fixed`: 30
- `--z-index-modal-backdrop`: 40
- `--z-index-modal`: 50
- `--z-index-popover`: 60
- `--z-index-tooltip`: 70
- `--z-index-toast`: 80

## Components

### Layout

The `Layout` component provides consistent page structure with header, content area, and optional footer.

```tsx
import { Layout } from '@/components/Layout'

<Layout
  title="Page Title"
  headerActions={<Button>Action</Button>}
  footer={<Button>Footer Action</Button>}
>
  <div>Page content</div>
</Layout>
```

### Button

Reusable button component with variants, sizes, and loading states.

```tsx
import { Button } from '@/components/Button'

<Button variant="primary" size="md" fullWidth isLoading={false}>
  Click me
</Button>
```

**Props:**
- `variant`: `'primary' | 'secondary' | 'danger'` (default: `'primary'`)
- `size`: `'sm' | 'md' | 'lg'` (default: `'md'`)
- `isLoading`: `boolean` (default: `false`)
- `fullWidth`: `boolean` (default: `false`)
- All standard button HTML attributes are supported

### Card

Generic card component with optional accent bar, header, content, and footer.

```tsx
import { Card } from '@/components/Card'

<Card
  accentColor="var(--color-status-active)"
  clickable={true}
  onClick={() => console.log('clicked')}
  header={<h3>Card Header</h3>}
  footer={<button>Action</button>}
>
  Card content
</Card>
```

**Props:**
- `accentColor`: Optional accent bar color
- `clickable`: Whether the card is clickable (default: `false`)
- `onClick`: Click handler (required if `clickable={true}`)
- `header`: Optional header content
- `footer`: Optional footer content

### StatusBadge

Component for displaying round status with color-coded indicators.

```tsx
import { StatusBadge } from '@/components/StatusBadge'

<StatusBadge status="ACTIVE" showLabel={true} />
```

**Props:**
- `status`: `'ACTIVE' | 'COOLDOWN' | 'COMPLETED'`
- `showLabel`: Whether to show the status label (default: `true`)

### Timer

Generic timer component for displaying formatted duration.

```tsx
import { Timer } from '@/components/Timer'

<Timer
  duration={120}
  label="Time remaining"
  variant="active"
  announceChanges={true}
/>
```

**Props:**
- `duration`: Duration in seconds (`number | null`)
- `label`: Optional label text
- `variant`: `'cooldown' | 'active' | 'completed' | 'default'` (default: `'default'`)
- `announceChanges`: Whether to announce changes to screen readers (default: `false`)

### StatRow

Component for consistent stat displays with label and value.

```tsx
import { StatRow } from '@/components/StatRow'

<StatRow label="Total Points" value={1234} />
```

**Props:**
- `label`: Stat label (`string`)
- `value`: Stat value (`ReactNode`)

## Responsive Breakpoints

We use a mobile-first approach with the following breakpoints:

- **<360px**: Extra small devices (very small phones)
- **360px-640px**: Small devices (phones)
- **640px-1024px**: Medium devices (tablets)
- **1024px+**: Large devices (desktops)

### Usage in CSS

```css
/* Mobile-first: Base styles for mobile */
.my-component {
  padding: var(--spacing-md);
}

/* Tablet and up */
@media (min-width: 640px) {
  .my-component {
    padding: var(--spacing-lg);
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .my-component {
    padding: var(--spacing-xl);
  }
}
```

### Critical Considerations

- **Goose view**: Must fit on <360px screens. The ASCII art scales using `clamp()` and responsive font sizes.
- **Tap targets**: Minimum 44x44px on touch devices
- **Text readability**: Minimum font size of 14px (0.875rem)

## Accessibility Guidelines

### Focus Management

All interactive elements must have visible focus states. We use `:focus-visible` to show focus only for keyboard navigation:

```css
.button:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px var(--color-focus-ring);
}
```

### ARIA Labels

- All interactive elements must have descriptive `aria-label` attributes
- Use `aria-live` regions for dynamic content updates (e.g., timers)
- Use `role` attributes appropriately (e.g., `role="timer"`, `role="button"`)

### Keyboard Navigation

- All interactive elements must be keyboard accessible
- Use `tabIndex={0}` for focusable elements
- Use `tabIndex={-1}` to prevent focus when disabled
- Support Enter and Spacebar keys for button-like elements

### Screen Reader Support

- Use semantic HTML where possible
- Provide alternative text for visual content using `aria-label` or `aria-describedby`
- Announce dynamic content changes using `aria-live` regions

### Example: Accessible Button

```tsx
<button
  onClick={handleClick}
  aria-label="Tap the goose to score points"
  aria-disabled={disabled}
  tabIndex={disabled ? -1 : 0}
>
  Goose
</button>
```

## Iconography

We use **inline SVG** for icons to avoid external dependencies. All icons are embedded directly in components where needed. No external fonts or icon libraries are required.

Example:
```tsx
<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
  <path d="..." fill="currentColor" />
</svg>
```

## ASCII Art

The goose ASCII art is kept as an optional Easter egg. It's rendered using monospace fonts and responsive scaling to ensure it displays correctly on all screen sizes.

The art is intentionally minimalistic and uses simple characters (▓, ▒, ░) to create a recognizable goose shape.

## Testing Accessibility

### Automated Testing

Run Lighthouse audits to check accessibility scores:

```bash
npm run build
npm run preview
# Then run Lighthouse in Chrome DevTools
```

Target: **Lighthouse accessibility score >= 90** on all key screens.

### Manual Testing

1. **Keyboard Navigation**: Tab through all interactive elements
2. **Screen Reader**: Test with NVDA (Windows), JAWS (Windows), or VoiceOver (macOS/iOS)
3. **Focus Visibility**: Ensure all focused elements have visible outlines
4. **Color Contrast**: Verify sufficient contrast ratios (WCAG AA minimum)

## Best Practices

1. **Always use design tokens**: Don't hardcode colors, spacing, or typography values
2. **Mobile-first**: Write mobile styles first, then enhance for larger screens
3. **Accessibility first**: Build accessible components by default
4. **Consistent spacing**: Use the spacing scale consistently
5. **Semantic HTML**: Use appropriate HTML elements for structure
6. **Test on real devices**: Test responsive behavior on actual devices when possible

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [A11y Project](https://www.a11yproject.com/)


