# Style Guide: Edlide Website

## Design Philosophy
**"Modern Minimalism"** - Clean, professional aesthetic with subtle sophistication. Every element serves a purpose with refined visual hierarchy and smooth user experience.

## Color Palette

### Primary Colors (Current)
```css
--background: 13 8% 8%;      /* Deep dark background - #0d0f14 */
--surface: 220 13% 13%;      /* Slightly lighter for cards - #14171d */
--surface-elevated: 215 13% 22%; /* Hover states - #2a2d38 */
--border: 215 13% 22%;       /* Subtle borders - #2a2d38 */
```

### Text Colors (Current)
```css
--text-primary: 0 0% 98%;     /* Main headings - WHITE #f8f9fa */
--text-secondary: 0 0% 98%;   /* Secondary content - WHITE #f8f9fa */
--text-muted: 220 9% 65%;     /* Subtle text - light gray #adb5bd */
--text-accent: 260 8% 80%;    /* Links, CTAs - Light neutral #e6e6e6 */
```

### Accent Colors (Current)
```css
--accent-primary: 0 0% 98%;   /* Primary actions - WHITE */
--accent-secondary: 215 13% 22%; /* Secondary backgrounds - #2a2d38 */
--accent-success: 142 69% 58%;  /* Success states - Green */
--accent-warning: 45 93% 47%;   /* Warnings - Amber */
--accent-danger: 0 84% 60%;     /* Error states - Red */
```

### Modern Button Design
```css
.btn-primary {
  background: hsl(var(--primary));      /* WHITE background */
  color: hsl(var(--primary-foreground)); /* Dark text */
  border: 1px solid hsl(var(--border)); 
  border-radius: 0.75rem;
  padding: 0.75rem 1.5rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: hsl(var(--accent));       /* Light background on hover */
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
}
```

## Typography

### Font Stack
```css
--font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
--font-mono: "JetBrains Mono", "Fira Code", Consolas, monospace;
```

### Type Scale
```css
--text-xs: 0.75rem;    /* 12px - Code, metadata */
--text-sm: 0.875rem;   /* 14px - Small text, captions */
--text-base: 1rem;     /* 16px - Body text */
--text-lg: 1.125rem;   /* 18px - Large body */
--text-xl: 1.25rem;    /* 20px - Small headings */
--text-2xl: 1.5rem;    /* 24px - Section headings */
--text-3xl: 1.875rem;  /* 30px - Page headings */
--text-4xl: 2.25rem;   /* 36px - Hero headings */
--text-5xl: 3rem;      /* 48px - Display headings */
```

### Font Weights
```css
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

## Spacing System

### 8px Grid System
All spacing follows an 8px grid for consistency:
```css
--space-1: 0.25rem;  /* 4px - Hairline gaps */
--space-2: 0.5rem;   /* 8px - Small padding */
--space-3: 0.75rem;  /* 12px - Medium padding */
--space-4: 1rem;     /* 16px - Standard spacing */
--space-5: 1.25rem;  /* 20px - Section spacing */
--space-6: 1.5rem;   /* 24px - Large spacing */
--space-8: 2rem;     /* 32px - Section breaks */
--space-10: 2.5rem;  /* 40px - Page margins */
--space-12: 3rem;    /* 48px - Component separation */
--space-16: 4rem;    /* 64px - Page sections */
--space-20: 5rem;    /* 80px - Hero spacing */
```

## Component Guidelines

### Buttons
```css
/* Primary Button */
.btn-primary {
  background: var(--accent-primary);
  color: white;
  padding: var(--space-3) var(--space-6);
  border-radius: 6px;
  font-weight: var(--font-medium);
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: #228be6;
  transform: translateY(-1px);
}
```

### Cards
```css
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: var(--space-6);
  transition: all 0.2s ease;
}

.card:hover {
  background: var(--surface-elevated);
  border-color: #3a3d48;
}
```

### Code Blocks
```css
.code-block {
  background: #0a0b0e;
  border: 1px solid #1a1d25;
  border-radius: 6px;
  padding: var(--space-4);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  overflow-x: auto;
}
```

## Layout Patterns

### Container
```css
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-6);
}

/* Responsive containers */
@media (min-width: 640px) { .container { padding: 0 var(--space-8); } }
@media (min-width: 1024px) { .container { padding: 0 var(--space-10); } }
```

### Section Spacing
```css
.section {
  padding: var(--space-16) 0;
}

.section-sm { padding: var(--space-12) 0; }
.section-lg { padding: var(--space-20) 0; }
```

## Animation Guidelines

### Transitions
```css
/* Standard easing */
.transition-standard {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Enhanced hover effects */
.hover-lift {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.hover-lift:hover { 
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
}
```

### Modern Animations
```css
/* Glass effect */
.glass-effect {
  backdrop-filter: blur(10px);
  background: rgba(26, 29, 37, 0.8);
  border: 1px solid rgba(42, 45, 56, 0.5);
}

/* Gradient text */
.gradient-text {
  background: linear-gradient(135deg, #ffffff 0%, #e5e7eb 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Hero gradient background */
.hero-gradient {
  background: radial-gradient(ellipse at center, 
    rgba(26, 29, 37, 0.4) 0%, 
    rgba(13, 15, 20, 0.8) 50%, 
    rgba(13, 15, 20, 1) 100%);
}

/* Grid pattern overlay */
.bg-grid-pattern {
  background-image: 
    linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), 
    linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
  background-size: 24px 24px;
}

/* Floating animation */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}
```

### Loading States
```css
/* Enhanced skeleton loader */
.skeleton {
  background: linear-gradient(90deg, #1a1d25 25%, #2a2d38 50%, #1a1d25 75%);
  background-size: 200% 100%;
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

## Responsive Design

### Breakpoints
```css
--breakpoint-sm: 640px;   /* Mobile landscape */
--breakpoint-md: 768px;   /* Tablet */
--breakpoint-lg: 1024px;  /* Desktop */
--breakpoint-xl: 1280px;  /* Large desktop */
--breakpoint-2xl: 1536px; /* Extra large */
```

### Mobile-First Approach
- Base styles target mobile (320px+)
- Progressively enhance for larger screens
- Touch-friendly tap targets (44px minimum)
- Optimized typography scaling

## Accessibility Standards

### Color Contrast
- AA compliance: 4.5:1 for normal text, 3:1 for large text
- Avoid color as only information conveyance
- Focus indicators visible with 2px outline

### Interactive Elements
- All interactive elements Focusable
- Keyboard navigation support
- Screen reader friendly semantic HTML
- ARIA labels for custom components