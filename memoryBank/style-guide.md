# Style Guide

## UI/UX Design Patterns

### Design Philosophy
- **VSCode Consistency**: Maintain familiar VSCode interface patterns
- **Minimal AI Presence**: AI features integrate naturally without disrupting workflow
- **Dark/Light Mode Support**: Respect system theme and VSCode color schemes
- **Accessibility First**: Screen reader support, keyboard navigation, color contrast

### Component Design System

#### Color Scheme
```css
/* Void-specific CSS custom properties (Dark mode) */
:root {
  --void-bg-1: #1e1e1e;      /* Primary background */
  --void-bg-2: #252526;      /* Secondary background */
  --void-bg-3: #2d2d30;      /* Tertiary background */

  --void-fg-1: #cccccc;      /* Primary foreground */
  --void-fg-2: #969696;      /* Secondary foreground */
  --void-fg-3: #6a6a6a;      /* Tertiary foreground */
  --void-fg-4: #464647;      /* Quaternary foreground */

  --void-border-1: #3e3e42;  /* Primary border */
  --void-border-2: #464647;  /* Secondary border */

  --void-accent: #0e70c0;    /* Void brand blue */
  --void-accent-hover: #1177cb;  /* Accent hover state */
}

/* Light mode adapted from VSCode theme */
[data-theme="light"] {
  --void-bg-1: #ffffff;
  --void-bg-2: #f3f3f3;
  --void-bg-3: #e8e8e8;

  --void-fg-1: #333333;
  --void-fg-2: #6c6c6c;
  --void-fg-3: #9e9e9e;
  --void-fg-4: #c8c8c8;

  --void-border-1: #e5e5e5;
  --void-border-2: #d4d4d4;
}
```

#### Typography
```css
.void-text-primary {
  @apply text-void-fg-1 font-normal;
}

.void-text-secondary {
  @apply text-void-fg-2 text-sm;
}

.void-text-tertiary {
  @apply text-void-fg-3 text-sm;
}

.void-heading {
  @apply text-void-fg-1 font-semibold text-lg;
}
```

#### Component Patterns

##### Buttons
```typescript
// Primary button (solid)
<VoidButtonBgDarken className="bg-void-accent hover:bg-void-accent-hover text-white">
  Primary Action
</VoidButtonBgDarken>

// Secondary button (outline)
<VoidButtonBgDarken className="border border-void-border-1 text-void-fg-1 hover:bg-void-bg-2">
  Secondary Action
</VoidButtonBgDarken>

// Icon buttons
<button className="text-void-fg-3 hover:text-void-fg-1 p-1">
  <Icon size={16} />
</button>
```

##### Input Components
```typescript
// Text inputs
<VoidSimpleInputBox
  className="bg-void-bg-2 border border-void-border-1 text-void-fg-1"
  placeholder="Enter text..."
/>

// Text areas
<VoidInputBox2
  className="bg-void-bg-2 border border-void-border-1 text-void-fg-1 min-h-[100px]"
  multiline
/>
```

##### Switches and Toggles
```typescript
<VoidSwitch
  size="xs"  // xs, sm, sm+, md
  value={isEnabled}
  onChange={setIsEnabled}
/>

// With label
<div className="flex items-center gap-2">
  <VoidSwitch size="xs" value={enabled} onChange={setEnabled} />
  <span className="text-void-fg-3 text-sm">Feature Label</span>
</div>
```

##### Dropdowns
```typescript
<VoidCustomDropdownBox
  options={modelOptions}
  selectedOption={selectedModel}
  onChangeOption={setSelectedModel}
  getOptionDisplayName={(model) => model.name}
  className="bg-void-bg-2 border border-void-border-1 text-void-fg-1"
/>
```

## Code Style Conventions

### TypeScript Patterns

#### Service Class Pattern
```typescript
export interface IMyService {
  doSomething(input: string): Promise<string>;
}

export class MyService implements IMyService {

  constructor(
    @IInstantiationService private readonly instantiationService: IInstantiationService,
    @IVoidSettingsService private readonly settingsService: IVoidSettingsService,
  ) {}

  async doSomething(input: string): Promise<string> {
    // Implementation
    return result;
  }

  dispose(): void {
    // Cleanup if needed
  }
}
```

#### React Component Pattern
```typescript
export const MyComponent = () => {
  const settingsState = useSettingsState();
  const accessor = useAccessor();
  const [localState, setLocalState] = useState<string>('');

  const handleClick = useCallback(() => {
    // Handle click
  }, [localState]);

  return (
    <div className="bg-void-bg-1 p-3 rounded-sm">
      <h3 className="text-void-fg-1 font-medium mb-2">Component Title</h3>
      {/* Component JSX */}
    </div>
  );
};
```

#### Type Definitions
```typescript
// Use union types for constrained values
type ModelProvider = 'openai' | 'anthropic' | 'ollama' | 'google';

// Use interfaces for object shapes
interface ModelConfig {
  name: string;
  provider: ModelProvider;
  maxTokens?: number;
  enabled: boolean;
}

// Use generics for reusable functions
interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

### File Organization

#### Imports Order
```typescript
// 1. VSCode/platform imports (general)
import { Disposable } from '../../../../../../../base/common/lifecycle.js';
import { IInstantiationService } from '../../../../../../../platform/instantiation/common/instantiation.js';

// 2. Void/common imports (project-specific common)
import { ModelProvider } from '../../../common/voidSettingsTypes.js';

// 3. React and UI imports
import React, { useState, useCallback } from 'react';
import { VoidButton } from '../util/inputs.js';

// 4. Node imports (main process only)
import * as fs from 'fs';
import * as path from 'path';
```

#### Export Patterns
```typescript
// Default export for main component
export default const Settings = () => {
  // Component implementation
};

// Named exports for utilities
export const formatErrorMessage = (error: unknown): string => {
  // Implementation
};

export type { SettingsProps };  // Type exports
```

## Design System Guidelines

### Layout Patterns
```css
/* Standard spacing */
.void-section {
  @apply py-4 px-6;
}

.void-subsection {
  @apply py-2 px-3;
}

/* Flex layouts */
.void-flex-center {
  @apply flex items-center justify-center;
}

.void-flex-between {
  @apply flex items-center justify-between;
}

/* Grid layouts */
.void-grid-2 {
  @apply grid grid-cols-2 gap-4;
}

.void-grid-3 {
  @apply grid grid-cols-3 gap-4;
}
```

### Interactive States
```css
/* Hover states */
.void-hover:hover {
  @apply brightness-110 cursor-pointer;
}

.void-hover-bg:hover {
  @apply bg-void-bg-3;
}

/* Focus states */
.void-focus:focus {
  @apply outline-none ring-2 ring-void-accent ring-opacity-50;
}

/* Active states */
.void-active:active {
  @apply opacity-80;
}
```

### Loading and Error States
```typescript
// Loading state
<IconLoading className="animate-spin text-void-fg-3" />

// Error display
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>

// Warning box
<WarningBox
  text="Warning message"
  className="border-orange-500 bg-orange-500/10"
/>
```

## Brand Guidelines

### Logo and Branding
- **Primary Color**: #0e70c0 (Void Blue)
- **Secondary Color**: Used for accents and highlights
- **Logo Usage**: Void logo appears in welcome screen and about dialog
- **Typography**: System fonts consistent with VSCode

### Voice and Tone
- **Technical**: Precise, accurate technical terminology
- **Helpful**: User-friendly error messages and assistance
- **Efficient**: Concise UI copy, respect developer time
- **Professional**: Maintain VSCode's professional tone

### Animation Principles
```css
/* Subtle animations only */
.transition-all {
  @apply transition-all duration-200 ease-in-out;
}

/* Loading animations */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
```

## Accessibility Standards

### Keyboard Navigation
- **Tab Order**: Logical tab sequence through interactive elements
- **Focus Indicators**: Visible focus states on all interactive elements
- **Shortcuts**: VSCode keyboard shortcuts where applicable
- **Skip Links**: Content jump navigation for screen readers

### Screen Reader Support
- **ARIA Labels**: Proper labeling for icons and complex controls
- **Live Regions**: Dynamic content announcements
- **Alternative Text**: Meaningful descriptions for images
- **Structure**: Proper heading hierarchy and landmarks

### Color and Contrast
- **Contrast Ratio**: WCAG AA compliance for text (4.5:1 minimum)
- **Color Independence**: Information not conveyed by color alone
- **High Contrast**: Support for VSCode high contrast themes

---

**Note**: This style guide maintains consistency with VSCode's design language while introducing Void-specific branding and AI interaction patterns. All components should follow these guidelines for visual and functional consistency.