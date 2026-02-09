# PoopyFeed Frontend Style Guide

This style guide documents the design system for PoopyFeed's frontend application. Use this as a reference when building new components, pages, or features to maintain visual consistency across the application.

## Design Philosophy

**Bold & Modern**: High-contrast colors, sharp typography, and energetic interactions create a distinctive, production-grade aesthetic that stands out from generic baby app designs.

**Accessibility First**: All components must pass AXE automated checks and meet WCAG AA standards for color contrast, keyboard navigation, and screen reader support.

**Tailwind-Only**: All styling uses Tailwind CSS utilities. No custom CSS, keyframes, or inline styles.

---

## Color Palette

### Primary Colors

**Electric Blue** - Primary brand color, main CTAs, featured elements

```css
electric-50:  #e6f0ff  - Light backgrounds, subtle accents
electric-100: #cce0ff  - Hover states for light elements
electric-200: #99c2ff  - Borders, decorative elements
electric-300: #66a3ff  - Medium accents
electric-400: #3385ff  - Interactive elements
electric-500: #0066ff  - PRIMARY - Buttons, links, focus states
electric-600: #0052cc  - Hover states for primary elements
electric-700: #003d99  - Active states, dark accents
electric-800: #002966  - Text on light backgrounds
electric-900: #001433  - Headings, high-contrast text
```

**Vibrant Orange** - CTAs, energy, action

```css
vibrant-50:  #fff4ed  - Light backgrounds
vibrant-100: #ffe8d9  - Subtle accents
vibrant-200: #ffd1b3  - Borders, decorative
vibrant-300: #ffba8c  - Medium accents
vibrant-400: #ffa366  - Interactive elements
vibrant-500: #ff6b35  - SECONDARY - Prominent buttons, highlights
vibrant-600: #e65a2a  - Hover states
vibrant-700: #cc491f  - Active states
vibrant-800: #b33814  - Dark accents
vibrant-900: #99270a  - Deep contrast
```

**Neon Purple** - Accents, gradients, playful moments

```css
neon-50:  #f5f3ff   - Light backgrounds
neon-100: #ede9fe   - Subtle accents
neon-200: #ddd6fe   - Borders, decorative
neon-300: #c4b5fd   - Medium accents
neon-400: #a78bfa   - Interactive elements
neon-500: #8b5cf6   - ACCENT - Highlights, special elements
neon-600: #7c3aed   - Hover states
neon-700: #6d28d9   - Active states
neon-800: #5b21b6   - Dark accents
neon-900: #4c1d95   - Deep contrast
```

### Neutral Colors (Tailwind Defaults)

**Slate** - Text, UI elements, neutral surfaces

```css
slate-50:  #f8fafc   - Light backgrounds
slate-100: #f1f5f9   - Subtle backgrounds
slate-200: #e2e8f0   - Borders, dividers
slate-300: #cbd5e1   - Disabled states
slate-400: #94a3b8   - Placeholder text
slate-500: #64748b   - Secondary text
slate-600: #475569   - Body text (light backgrounds)
slate-700: #334155   - Emphasis text
slate-800: #1e293b   - Headings, primary text
slate-900: #0f172a   - High-contrast text
white:     #ffffff   - Pure white backgrounds
```

### Color Usage Guidelines

- **Backgrounds**: Use white, slate-50, electric-50, vibrant-50, or neon-50
- **Primary text**: slate-800 or slate-900 on light backgrounds
- **Secondary text**: slate-600 or slate-700
- **Disabled text**: slate-400
- **Primary actions**: electric-500 (buttons, links)
- **Secondary actions**: vibrant-500 (prominent CTAs)
- **Accents**: neon-500 (highlights, special features)
- **Borders**: slate-200 for neutral, brand colors for emphasis

### Gradients

**Background Gradients** (soft, for sections):

```html
<!-- Hero gradient -->
<div class="bg-gradient-to-br from-electric-500 via-electric-600 to-neon-700">
    <!-- CTA gradient -->
    <div class="bg-gradient-to-r from-vibrant-500 via-neon-500 to-electric-500">
        <!-- Subtle section background -->
        <div class="bg-gradient-to-b from-white to-electric-50"></div>
    </div>
</div>
```

**Button Gradients** (bold, high-contrast):

```html
<!-- Primary gradient button -->
<button
    class="bg-gradient-to-r from-electric-500 to-electric-600 hover:from-electric-600 hover:to-electric-700"
></button>
```

---

## Typography System

### Font Family

Uses Tailwind's default system font stack for optimal performance:

```css
font-sans:
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Roboto,
    "Helvetica Neue",
    Arial,
    sans-serif;
```

### Type Scale

```html
<!-- Hero Headlines (Landing pages) -->
<h1 class="text-5xl lg:text-7xl font-extrabold">
    Track Your Baby's Care Effortlessly
</h1>

<!-- Page Headings -->
<h1 class="text-4xl lg:text-5xl font-extrabold">Dashboard</h1>

<!-- Section Headings -->
<h2 class="text-3xl lg:text-4xl font-bold">Recent Activity</h2>

<!-- Subsection Headings -->
<h3 class="text-2xl lg:text-3xl font-bold">Feeding Schedule</h3>

<!-- Card Titles -->
<h4 class="text-xl font-semibold">Today's Summary</h4>

<!-- Small Headings -->
<h5 class="text-lg font-semibold">Quick Actions</h5>

<!-- Body Large -->
<p class="text-lg">Enhanced readability for important content</p>

<!-- Body (Default) -->
<p class="text-base">Standard paragraph text</p>

<!-- Small Text -->
<p class="text-sm">Secondary information, captions</p>

<!-- Extra Small -->
<p class="text-xs">Timestamps, metadata</p>
```

### Font Weights

```css
font-normal     (400) - Body text, paragraphs
font-medium     (500) - Emphasis, labels
font-semibold   (600) - Subheadings, card titles
font-bold       (700) - Section headings
font-extrabold  (800) - Page titles, hero headlines
```

### Line Heights

```css
leading-tight    (1.25)  - Headlines, display text
leading-snug     (1.375) - Headings
leading-normal   (1.5)   - Body text (DEFAULT)
leading-relaxed  (1.625) - Long-form content
leading-loose    (2)     - Spacious layouts
```

### Letter Spacing

```css
tracking-tight   (-0.025em) - Headlines, large display text
tracking-normal  (0)        - Body text (DEFAULT)
tracking-wide    (0.025em)  - Labels, small caps
tracking-wider   (0.05em)   - Buttons, badges
```

### Text Colors

```html
<!-- Primary text -->
<p class="text-slate-900">Highest contrast</p>
<p class="text-slate-800">Headings, emphasis</p>

<!-- Secondary text -->
<p class="text-slate-700">Body text (recommended)</p>
<p class="text-slate-600">De-emphasized content</p>

<!-- Tertiary text -->
<p class="text-slate-500">Captions, helper text</p>

<!-- Disabled text -->
<p class="text-slate-400">Disabled states</p>

<!-- On dark backgrounds -->
<p class="text-white">High contrast on dark</p>
<p class="text-slate-50">Softer on dark</p>

<!-- Accent colors -->
<a class="text-electric-600 hover:text-electric-700">Primary link</a>
<span class="text-vibrant-600">Highlighted text</span>
```

---

## Spacing System

### Section Spacing

```html
<!-- Large sections (hero, features) -->
<section class="py-16 lg:py-24">
    <!-- Medium sections -->
    <section class="py-12 lg:py-16">
        <!-- Small sections -->
        <section class="py-8 lg:py-12"></section>
    </section>
</section>
```

### Container Padding

```html
<!-- Standard container -->
<div class="max-w-7xl mx-auto px-6 lg:px-12">
    <!-- Wide container -->
    <div class="max-w-screen-2xl mx-auto px-6 lg:px-16">
        <!-- Narrow container (forms, content) -->
        <div class="max-w-2xl mx-auto px-6"></div>
    </div>
</div>
```

### Component Spacing

```html
<!-- Card padding -->
<div class="p-6 lg:p-8">
    <!-- Standard -->
    <div class="p-8 lg:p-10">
        <!-- Large -->
        <div class="p-4 lg:p-6">
            <!-- Compact -->

            <!-- Button padding -->
            <button class="px-8 py-4">
                <!-- Large CTA -->
                <button class="px-6 py-3">
                    <!-- Standard -->
                    <button class="px-4 py-2"><!-- Small --></button>
                </button>
            </button>
        </div>
    </div>
</div>
```

### Vertical Rhythm (space-y-\*)

```html
<!-- Form groups -->
<div class="space-y-6">
    <!-- Standard form spacing -->

    <!-- Card content -->
    <div class="space-y-4">
        <!-- Related content -->

        <!-- Tight groups -->
        <div class="space-y-2">
            <!-- Labels + inputs -->

            <!-- Loose sections -->
            <div class="space-y-8 lg:space-y-12">
                <!-- Section separation -->
            </div>
        </div>
    </div>
</div>
```

### Gap (for flex/grid)

```html
<!-- Grid gaps -->
<div class="grid gap-6 lg:gap-8">
    <!-- Standard -->
    <div class="grid gap-4">
        <!-- Compact -->
        <div class="grid gap-8 lg:gap-12">
            <!-- Spacious -->

            <!-- Flex gaps -->
            <div class="flex gap-3">
                <!-- Icon + text -->
                <div class="flex gap-4"><!-- Buttons --></div>
            </div>
        </div>
    </div>
</div>
```

---

## Border Radius System

### Buttons

```html
<!-- Primary CTAs (pill shape) -->
<button class="rounded-full">Get Started</button>

<!-- Secondary buttons -->
<button class="rounded-lg">Learn More</button>

<!-- Icon buttons -->
<button class="rounded-md">
    <svg>...</svg>
</button>
```

### Cards & Containers

```html
<!-- Large feature cards -->
<div class="rounded-3xl">
    <!-- Standard cards -->
    <div class="rounded-2xl">
        <!-- Compact cards -->
        <div class="rounded-xl">
            <!-- Small elements (badges, tags) -->
            <span class="rounded-lg">
                <!-- Inputs -->
                <input class="rounded-lg"
            /></span>
        </div>
    </div>
</div>
```

### Guidelines

- Use `rounded-full` for primary CTAs to emphasize softness and action
- Use `rounded-2xl` or `rounded-3xl` for cards to maintain modern aesthetic
- Use `rounded-lg` for inputs, secondary buttons, and small components
- Avoid `rounded-none` except for intentional design contrast (e.g., full-width mobile elements)

---

## Shadow System

### Elevation Levels

```html
<!-- Subtle shadow (resting cards) -->
<div class="shadow-md">
    <!-- Medium shadow (interactive cards) -->
    <div class="shadow-lg">
        <!-- Pronounced shadow (elevated elements) -->
        <div class="shadow-xl">
            <!-- Heavy shadow (modals, popovers) -->
            <div class="shadow-2xl"></div>
        </div>
    </div>
</div>
```

### Interactive Shadows (with hover)

```html
<!-- Card hover -->
<div class="shadow-md hover:shadow-lg transition-shadow duration-300">
    <!-- Button hover -->
    <button class="shadow-lg hover:shadow-xl transition-shadow duration-200">
        <!-- Elevated hover -->
        <div
            class="shadow-lg hover:shadow-2xl transition-shadow duration-300"
        ></div>
    </button>
</div>
```

### Combined with Transform

```html
<!-- Card with lift effect -->
<div
    class="shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
>
    <!-- Button with depth -->
    <button
        class="shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-200"
    ></button>
</div>
```

---

## Animation & Transitions

### Transition Durations

```css
duration-75    - Ultra fast (75ms)  - Micro-interactions
duration-100   - Very fast (100ms)  - Hover states
duration-150   - Fast (150ms)       - Color changes
duration-200   - Quick (200ms)      - Button interactions (RECOMMENDED)
duration-300   - Normal (300ms)     - Card interactions, transforms (DEFAULT)
duration-500   - Slow (500ms)       - Page transitions
duration-700   - Very slow (700ms)  - Loading states
```

### Transition Properties

```html
<!-- All properties (use sparingly) -->
<div class="transition-all duration-300">
    <!-- Colors only (efficient) -->
    <div class="transition-colors duration-200">
        <!-- Transform only -->
        <div class="transition-transform duration-300">
            <!-- Shadow only -->
            <div class="transition-shadow duration-300">
                <!-- Multiple specific properties -->
                <div class="transition-[transform,shadow] duration-300"></div>
            </div>
        </div>
    </div>
</div>
```

### Common Patterns

```html
<!-- Button hover -->
<button class="transition-all duration-200 hover:scale-105 active:scale-95">

<!-- Card hover with lift -->
<div class="transition-all duration-300 hover:shadow-xl hover:-translate-y-1">

<!-- Link hover -->
<a class="transition-colors duration-200 hover:text-electric-700">

<!-- Icon shift on hover -->
<div class="group">
  <svg class="transition-transform duration-300 group-hover:translate-x-1">
</div>

<!-- Fade in -->
<div class="opacity-0 animate-fade-in">
```

### Tailwind Built-in Animations

```html
<!-- Pulse (breathing effect) -->
<div class="animate-pulse">
    <!-- Bounce (attention) -->
    <div class="animate-bounce">
        <!-- Spin (loading) -->
        <svg class="animate-spin"></svg>
    </div>
</div>
```

---

## Grid & Layout Patterns

### Responsive Grids

```html
<!-- Features grid (2 columns on tablet+) -->
<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
    <!-- Benefits grid (3 columns on tablet+) -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        <!-- Asymmetric hero (7/5 split on desktop) -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div class="lg:col-span-7">Content</div>
            <div class="lg:col-span-5">Image</div>
        </div>

        <!-- Card grid (1/2/3 columns responsive) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"></div>
    </div>
</div>
```

### Breakpoints

```css
sm:   640px   - Small tablets, large phones (landscape)
md:   768px   - Tablets
lg:   1024px  - Desktops
xl:   1280px  - Large desktops
2xl:  1536px  - Extra large screens
```

### Mobile-First Approach

```html
<!-- Base styles apply to mobile, override for larger screens -->
<div class="text-2xl md:text-4xl lg:text-6xl">
    <div class="p-4 md:p-8 lg:p-12">
        <div class="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"></div>
    </div>
</div>
```

### Responsive Visibility

```html
<!-- Mobile only -->
<div class="block md:hidden">
    <!-- Tablet and up -->
    <div class="hidden md:block">
        <!-- Desktop only -->
        <div class="hidden lg:block">
            <!-- Hide on mobile, show on tablet+ -->
            <div class="hidden md:flex"></div>
        </div>
    </div>
</div>
```

### Flexbox Patterns

```html
<!-- Centered content -->
<div class="flex items-center justify-center">
    <!-- Space between -->
    <div class="flex items-center justify-between">
        <!-- Vertical stack with gap -->
        <div class="flex flex-col gap-4">
            <!-- Horizontal with wrap -->
            <div class="flex flex-wrap gap-4">
                <!-- Responsive direction -->
                <div class="flex flex-col lg:flex-row gap-6"></div>
            </div>
        </div>
    </div>
</div>
```

---

## Button Styles

### Primary CTA (High Emphasis)

```html
<button
    class="
  bg-electric-500 hover:bg-electric-600 active:bg-electric-700
  text-white font-bold
  px-8 py-4
  rounded-full
  shadow-lg hover:shadow-xl
  transition-all duration-200
  hover:scale-105 active:scale-95
  focus:ring-4 focus:ring-electric-300 focus:ring-offset-2
  disabled:bg-slate-300 disabled:cursor-not-allowed disabled:scale-100
"
>
    Get Started Free
</button>
```

### Secondary CTA (Medium Emphasis)

```html
<button
    class="
  bg-vibrant-500 hover:bg-vibrant-600 active:bg-vibrant-700
  text-white font-bold
  px-8 py-4
  rounded-full
  shadow-lg hover:shadow-xl
  transition-all duration-200
  hover:scale-105 active:scale-95
  focus:ring-4 focus:ring-vibrant-300 focus:ring-offset-2
"
>
    Sign Up Now
</button>
```

### Outline Button

```html
<button
    class="
  border-2 border-electric-500
  text-electric-600 hover:text-white
  font-bold
  px-8 py-4
  rounded-full
  hover:bg-electric-500
  transition-all duration-200
  focus:ring-4 focus:ring-electric-300 focus:ring-offset-2
"
>
    Learn More
</button>
```

### Ghost Button (Low Emphasis)

```html
<button
    class="
  text-electric-600 hover:text-electric-700
  font-semibold
  px-6 py-3
  rounded-lg
  hover:bg-electric-50
  transition-colors duration-200
  focus:ring-4 focus:ring-electric-300 focus:ring-offset-2
"
>
    View Details
</button>
```

### Icon Button

```html
<button
    class="
  p-3
  rounded-md
  text-slate-600 hover:text-electric-600
  hover:bg-electric-50
  transition-colors duration-200
  focus:ring-4 focus:ring-electric-300
"
>
    <svg class="w-6 h-6">...</svg>
</button>
```

### Button Sizes

```html
<!-- Large -->
<button class="px-10 py-5 text-lg font-bold rounded-full">
    <!-- Default -->
    <button class="px-8 py-4 text-base font-bold rounded-full">
        <!-- Medium -->
        <button class="px-6 py-3 text-sm font-semibold rounded-lg">
            <!-- Small -->
            <button class="px-4 py-2 text-sm font-medium rounded-md"></button>
        </button>
    </button>
</button>
```

---

## Card Styles

### Featured Card (Primary)

```html
<div
    class="
  bg-white
  rounded-3xl
  shadow-xl
  p-10
  hover:shadow-2xl hover:-translate-y-1
  transition-all duration-300
"
>
    <!-- Card content -->
</div>
```

### Standard Card

```html
<div
    class="
  bg-white
  rounded-2xl
  shadow-md
  p-8
  hover:shadow-lg
  transition-shadow duration-300
"
>
    <!-- Card content -->
</div>
```

### Colored Background Card

```html
<div
    class="
  bg-electric-50
  rounded-2xl
  shadow-md
  p-8
  hover:shadow-lg hover:bg-electric-100
  transition-all duration-300
"
>
    <!-- Card content -->
</div>
```

### Accent Border Card

```html
<div
    class="
  bg-white
  border-l-4 border-vibrant-500
  rounded-lg
  shadow-md
  p-6
"
>
    <!-- Card content -->
</div>
```

### Outline Card

```html
<div
    class="
  bg-white
  border-2 border-slate-200
  rounded-xl
  p-6
  hover:border-electric-400
  transition-colors duration-300
"
>
    <!-- Card content -->
</div>
```

### Interactive Card (Clickable)

```html
<a
    href="/details"
    class="
  block
  bg-white
  rounded-2xl
  shadow-md
  p-8
  hover:shadow-xl hover:-translate-y-1
  transition-all duration-300
  focus:ring-4 focus:ring-electric-300 focus:ring-offset-2
"
>
    <!-- Card content -->
</a>
```

---

## Icon Guidelines (Heroicons)

### Icon Sizes

```html
<!-- Extra Small (16px) -->
<svg class="w-4 h-4">
    <!-- Small (24px) - RECOMMENDED for inline -->
    <svg class="w-6 h-6">
        <!-- Medium (32px) -->
        <svg class="w-8 h-8">
            <!-- Large (48px) -->
            <svg class="w-12 h-12">
                <!-- Extra Large (64px) -->
                <svg class="w-16 h-16">
                    <!-- Hero (96px+) - For hero sections -->
                    <svg class="w-24 h-24"></svg>
                </svg>
            </svg>
        </svg>
    </svg>
</svg>
```

### Icon Colors

```html
<!-- Primary -->
<svg class="w-6 h-6 text-electric-500">
    <!-- Secondary -->
    <svg class="w-6 h-6 text-vibrant-500">
        <!-- Accent -->
        <svg class="w-6 h-6 text-neon-500">
            <!-- Neutral -->
            <svg class="w-6 h-6 text-slate-600">
                <!-- On dark backgrounds -->
                <svg class="w-6 h-6 text-white">
                    <!-- Inherit from parent -->
                    <svg class="w-6 h-6 text-current"></svg>
                </svg>
            </svg>
        </svg>
    </svg>
</svg>
```

### Icon Styles (Heroicons Variants)

**Outline** (stroke-based) - Use for:

- Navigation icons
- Feature icons
- Lightweight UI elements
- Body content icons

**Solid** (fill-based) - Use for:

- Buttons
- Highlighted features
- Call-to-action elements
- Emphasis and importance

### Implementation Pattern

```html
<!-- Outline icon -->
<svg
    class="w-6 h-6 text-electric-500"
    aria-hidden="true"
    fill="none"
    viewBox="0 0 24 24"
    stroke-width="1.5"
    stroke="currentColor"
>
    <path stroke-linecap="round" stroke-linejoin="round" d="..." />
</svg>

<!-- Solid icon -->
<svg
    class="w-6 h-6 text-vibrant-500"
    aria-hidden="true"
    fill="currentColor"
    viewBox="0 0 24 24"
>
    <path d="..." />
</svg>
```

### Icon + Text Pattern

```html
<!-- Inline with text -->
<div class="flex items-center gap-3">
    <svg class="w-6 h-6 text-electric-500 flex-shrink-0" aria-hidden="true">
        ...
    </svg>
    <span class="text-slate-700 font-medium">Feature description</span>
</div>

<!-- Icon before heading -->
<div class="flex items-center gap-4 mb-4">
    <svg class="w-12 h-12 text-vibrant-500" aria-hidden="true">...</svg>
    <h3 class="text-2xl font-bold text-slate-900">Section Title</h3>
</div>
```

### Accessibility

```html
<!-- Decorative icons (most common) -->
<svg aria-hidden="true">...</svg>

<!-- Meaningful icons (rare - provide context) -->
<svg role="img" aria-label="Success indicator">...</svg>

<!-- Never rely on icons alone for critical information -->
<button>
    <svg aria-hidden="true">...</svg>
    <span>Save</span>
    <!-- Always include text -->
</button>
```

---

## Forms & Inputs

### Text Input

```html
<input
    type="text"
    class="
    w-full
    px-4 py-3
    border-2 border-slate-200
    rounded-lg
    focus:border-electric-500 focus:ring-4 focus:ring-electric-100
    transition-all
    outline-none
    text-slate-900
    placeholder:text-slate-400
    disabled:bg-slate-100 disabled:cursor-not-allowed
  "
    placeholder="Enter your name"
/>
```

### Validation States

```html
<!-- Error state -->
<input
    class="
  border-red-500
  focus:border-red-500 focus:ring-red-100
"
/>
<p class="text-red-600 text-sm mt-2 font-medium">This field is required</p>

<!-- Success state -->
<input
    class="
  border-green-500
  focus:border-green-500 focus:ring-green-100
"
/>
<p class="text-green-600 text-sm mt-2 font-medium">Looks good!</p>
```

### Label

```html
<label for="email" class="block text-sm font-bold text-slate-900 mb-2">
    Email address
</label>
```

### Select Dropdown

```html
<select
    class="
  w-full
  px-4 py-3
  border-2 border-slate-200
  rounded-lg
  focus:border-electric-500 focus:ring-4 focus:ring-electric-100
  transition-all
  outline-none
  text-slate-900
  bg-white
"
>
    <option>Select an option</option>
</select>
```

### Checkbox

```html
<label class="flex items-center gap-3 cursor-pointer">
    <input
        type="checkbox"
        class="
      w-5 h-5
      rounded
      border-2 border-slate-300
      text-electric-500
      focus:ring-4 focus:ring-electric-300
      transition-colors
    "
    />
    <span class="text-slate-700 font-medium">Remember me</span>
</label>
```

---

## Accessibility Standards

### Color Contrast (WCAG AA)

**Minimum Ratios:**

- Large text (18px+ or 14px+ bold): 3:1
- Normal text: 4.5:1
- UI components (borders, icons): 3:1

**Safe Combinations:**

```html
<!-- ✅ High contrast (12.6:1) -->
<p class="text-slate-800 bg-white">
    <!-- ✅ Good contrast (8.6:1) -->
</p>

<p class="text-slate-700 bg-white">
    <!-- ✅ Accessible for large text (4.8:1) -->
</p>

<h1 class="text-electric-600 bg-white">
    <!-- ❌ Too low for body text (3.2:1) -->
    <p class="text-slate-400 bg-white">
        <!-- Only use for disabled/secondary -->
    </p>
</h1>
```

### Focus States

**All interactive elements MUST have visible focus indicators:**

```html
<!-- Buttons -->
<button class="focus:ring-4 focus:ring-electric-300 focus:ring-offset-2">
    <!-- Links -->
    <a class="focus:ring-4 focus:ring-electric-300 focus:ring-offset-2 rounded">
        <!-- Inputs -->
        <input
            class="focus:border-electric-500 focus:ring-4 focus:ring-electric-100" />

        <!-- Custom focus (high contrast) -->
        <div
            tabindex="0"
            class="focus:outline-none focus:ring-4 focus:ring-electric-500"
        ></div
    ></a>
</button>
```

### Semantic HTML

```html
<!-- ✅ Good: Semantic structure -->
<header>
    <nav aria-label="Main navigation">
        <ul>
            <li><a href="/">Home</a></li>
        </ul>
    </nav>
</header>

<main>
    <section aria-labelledby="features-title">
        <h2 id="features-title">Features</h2>
    </section>
</main>

<!-- ❌ Bad: Div soup -->
<div class="header">
    <div class="nav">
        <div class="link">Home</div>
    </div>
</div>
```

### Keyboard Navigation

- All interactive elements must be keyboard accessible (use `<button>`, `<a>`, or add `tabindex="0"`)
- Focus order must be logical (top to bottom, left to right)
- Provide skip links for long pages
- Avoid keyboard traps
- Test with Tab, Shift+Tab, Enter, Space, Arrow keys

### ARIA Best Practices

```html
<!-- Landmark labels -->
<nav aria-label="Main navigation">
    <aside aria-label="Related content">
        <!-- Section labels -->
        <section aria-labelledby="section-title">
            <h2 id="section-title">Title</h2>
        </section>

        <!-- Hidden decorative content -->
        <svg aria-hidden="true">...</svg>

        <!-- Meaningful icons -->
        <button aria-label="Close dialog">
            <svg aria-hidden="true">×</svg>
        </button>

        <!-- Loading states -->
        <div role="status" aria-live="polite">Loading...</div>
    </aside>
</nav>
```

---

## Component Patterns

### Section Template

```html
<section aria-labelledby="section-title" class="py-16 lg:py-24 bg-white">
    <div class="max-w-7xl mx-auto px-6 lg:px-12">
        <h2
            id="section-title"
            class="text-3xl lg:text-4xl font-bold text-slate-800 text-center mb-12"
        >
            Section Heading
        </h2>
        <!-- Content -->
    </div>
</section>
```

### Card Grid

```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
    <div
        class="bg-white rounded-2xl shadow-md p-8 hover:shadow-lg transition-shadow duration-300"
    >
        <!-- Card content -->
    </div>
</div>
```

### Hero Section

```html
<section
    aria-labelledby="hero-title"
    class="min-h-screen flex items-center bg-gradient-to-br from-electric-500 via-electric-600 to-neon-700"
>
    <div class="max-w-7xl mx-auto px-6 lg:px-12 py-16">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
                <h1
                    id="hero-title"
                    class="text-5xl lg:text-7xl font-extrabold text-white leading-tight mb-6"
                >
                    Your Hero Headline
                </h1>
                <p class="text-xl text-electric-100 mb-8">
                    Supporting description text
                </p>
                <a
                    href="/signup"
                    class="inline-block bg-vibrant-500 hover:bg-vibrant-600 text-white font-bold px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                >
                    Get Started Free
                </a>
            </div>
        </div>
    </div>
</section>
```

---

## Do's and Don'ts

### ✅ Do

- **Use generous whitespace** for breathing room and visual clarity
- **Maintain consistent rounded corners** (rounded-2xl, rounded-3xl for cards)
- **Apply smooth transitions** to all interactive elements (duration-200 to duration-300)
- **Use high-contrast color combinations** for better readability
- **Test keyboard navigation** and screen reader compatibility
- **Provide visible focus states** on all interactive elements
- **Use semantic HTML** (`<section>`, `<nav>`, `<main>`, `<header>`)
- **Include ARIA attributes** where appropriate
- **Scale text responsively** (text-2xl md:text-4xl lg:text-6xl)
- **Test on multiple devices** and browsers

### ❌ Don't

- **Don't use custom CSS** - Stick to Tailwind utilities
- **Don't ignore accessibility** - All components must pass AXE checks
- **Don't use tiny touch targets** - Minimum 44x44px for interactive elements
- **Don't rely on color alone** to convey meaning
- **Don't create keyboard traps** or inaccessible navigation
- **Don't use placeholder text as labels** - Always provide proper labels
- **Don't stack too many animations** - Keep interactions performant
- **Don't use low-contrast text** - Maintain WCAG AA standards
- **Don't forget focus states** - All interactive elements need them
- **Don't use rounded-none** on cards (unless intentional design choice)

---

## Quick Reference

### Common Utility Combos

**Section Container:**

```html
<div class="max-w-7xl mx-auto px-6 lg:px-12 py-16 lg:py-24"></div>
```

**Primary Button:**

```html
<button
    class="bg-electric-500 hover:bg-electric-600 text-white font-bold px-8 py-4 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 focus:ring-4 focus:ring-electric-300 focus:ring-offset-2"
></button>
```

**Card:**

```html
<div
    class="bg-white rounded-2xl shadow-md p-8 hover:shadow-lg transition-shadow duration-300"
></div>
```

**Heading:**

```html
<h2 class="text-3xl lg:text-4xl font-bold text-slate-800 mb-8"></h2>
```

**Grid:**

```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"></div>
```

---

## Resources

- **Tailwind CSS Documentation**: <https://tailwindcss.com/docs>
- **Heroicons**: <https://heroicons.com>
- **WCAG Guidelines**: <https://www.w3.org/WAI/WCAG21/quickref/>
- **Color Contrast Checker**: <https://webaim.org/resources/contrastchecker/>

---

**Last Updated**: 2026-02-09
**Design System Version**: 1.0
