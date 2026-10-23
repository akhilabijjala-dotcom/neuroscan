---
name: Synapse Precision
colors:
  surface: '#101415'
  surface-dim: '#101415'
  surface-bright: '#363a3b'
  surface-container-lowest: '#0b0f10'
  surface-container-low: '#191c1e'
  surface-container: '#1d2022'
  surface-container-high: '#272a2c'
  surface-container-highest: '#323537'
  on-surface: '#e0e3e5'
  on-surface-variant: '#c4c5d9'
  inverse-surface: '#e0e3e5'
  inverse-on-surface: '#2d3133'
  outline: '#8e90a2'
  outline-variant: '#434656'
  surface-tint: '#b8c3ff'
  primary: '#b8c3ff'
  on-primary: '#002388'
  primary-container: '#2e5bff'
  on-primary-container: '#efefff'
  inverse-primary: '#124af0'
  secondary: '#bec6e0'
  on-secondary: '#283044'
  secondary-container: '#3f465c'
  on-secondary-container: '#adb4ce'
  tertiary: '#b7c8e1'
  on-tertiary: '#213145'
  tertiary-container: '#5e6e85'
  on-tertiary-container: '#e9f0ff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b8c3ff'
  on-primary-fixed: '#001356'
  on-primary-fixed-variant: '#0035be'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#d3e4fe'
  tertiary-fixed-dim: '#b7c8e1'
  on-tertiary-fixed: '#0b1c30'
  on-tertiary-fixed-variant: '#38485d'
  background: '#101415'
  on-background: '#e0e3e5'
  surface-variant: '#323537'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  container-margin: 24px
  gutter: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

The design system is engineered for high-stakes clinical environments, specifically tailored for neurologists and radiologists who require prolonged focus and absolute visual clarity. The personality is authoritative, precise, and systematic.

The aesthetic follows a **Modern Corporate** approach with **Minimalist** influences. It prioritizes data density and "black-room" compatibility, ensuring that the UI recedes to highlight medical imagery. The emotional response is one of calm confidence and technical reliability, achieved through a structured grid, purposeful use of color, and high-contrast diagnostic workspaces.

## Colors

This design system utilizes a dual-surface strategy. Diagnostic views use a **Deep Charcoal/Navy** palette (`#020617`) to maximize the dynamic range of grayscale medical images (DICOM). Administrative and patient record areas transition to a highly legible **Clinical White/Gray** surface in light mode, though dark mode remains the default for the primary workspace.

- **Primary Blue:** A trusted, medium-high saturation blue used for primary actions and "system ready" states.
- **Alert System:** Amber is reserved for "observation required" (e.g., low-confidence AI detection), while Red is strictly for "critical finding" or "malignancy suspected."
- **Grayscale:** A neutral, cool-toned scale is used to prevent color pollution during visual diagnostics.

## Typography

The typography system is built on **Inter** for its exceptional legibility in small sizes and high-density layouts. **JetBrains Mono** is introduced specifically for technical metadata, coordinate systems, and scan parameters to ensure zero ambiguity between characters (e.g., 0 vs O, 1 vs l).

- **Hierarchy:** Strict vertical rhythm ensures readability in data-heavy patient records. 
- **Contrast:** High-contrast ratios between labels and values (e.g., Medium weight for labels, Regular for values).
- **Mobile Adaptability:** Headlines scale down by 20% on mobile devices, though the primary diagnostic experience is optimized for high-resolution desktop monitors.

## Layout & Spacing

The layout utilizes a **Fixed Grid** model for administrative views and a **Dynamic Workspace** model for diagnostic views.

- **Diagnostic Layout:** Uses a multi-pane system (2x2 or 3x3) with 2px "dead-zones" between images to prevent visual bleed. Sidebars are collapsible to grant maximum screen real estate to the image viewer.
- **Administrative Layout:** A standard 12-column grid with 24px margins. 
- **Spacing Rhythm:** Based on a 4px base unit. Tight spacing is used within data groups (4-8px) while larger sections are separated by 24-32px to provide mental "breathing room" between disparate patient cases.

## Elevation & Depth

The design system employs **Tonal Layers** rather than heavy shadows to maintain a "flat" clinical precision.

- **Level 0 (Base):** Deepest background for image viewing.
- **Level 1 (Surface):** Toolbars, sidebars, and navigation. Use a slightly lighter tint of the navy background.
- **Level 2 (Float):** Pop-overs, tooltips, and context menus. These use a fine, 1px low-contrast outline (Primary Blue at 20% opacity) and a tight, subtle ambient shadow to separate from the diagnostic canvas.
- **Interaction:** Active panes or selected images are highlighted with a 2px interior border in the Primary Blue color, avoiding external shadows that could distort adjacent image perception.

## Shapes

The shape language is **Soft (0.25rem)**. This provides a professional, modern feel without being overly "friendly" or consumer-oriented. 

- **Hard Edges:** Diagnostic viewports and image containers maintain 0px roundedness to preserve every pixel of the scan.
- **Soft Edges:** Buttons, input fields, and card containers use the `rounded-sm` (4px) setting to create a distinction between the "tool" and the "content."
- **Pills:** Status badges (e.g., "In Progress," "Reviewed") use a fully rounded pill shape for immediate semantic recognition against the otherwise rectangular UI.

## Components

### Buttons & Inputs
Buttons are high-contrast with clear hover states. Inputs use a "Bordered" style in light mode and a "Filled" style in dark mode to ensure they remain visible against deep backgrounds.

### Medical Data Tables
Tables are the backbone of the system. They feature fixed headers, zebra-striping (at 2% opacity), and "Critical Value" highlighting. Row height is compact (32px or 40px) to maximize information density.

### AI Processing Indicators
Progress is shown via a slim, non-pulsing linear bar in Primary Blue. When AI completes a task, a subtle "Pulse" animation occurs only on the specific classification badge to draw attention without being jarring.

### Classification Badges
Small, high-contrast markers placed directly on or adjacent to images. They use high-visibility colors (Amber/Red) and must include an icon (e.g., an exclamation mark) to be accessible to color-blind practitioners.

### Image Viewer Controls
Monochromatic icons on semi-transparent dark "pucks" that appear when hovering over image quadrants. This keeps the workspace clean when not actively manipulating the view.