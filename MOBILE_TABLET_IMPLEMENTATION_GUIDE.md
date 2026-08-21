# 📱 Mobile & Tablet Responsive Implementation Guide

## Overview

This document explains how to implement and maintain responsive design for mobile devices (320px-767px) and tablets (768px-1024px) across the E-Checksheet GA application built with Next.js.

## Quick Start

### 1. Import Responsive Utilities CSS

Add this to your layout or main styles file:

```tsx
import '@/styles/responsive-utilities.css'
```

### 2. Standard Media Query Breakpoints

Use these consistent breakpoints across all pages:

```css
/* Mobile: 320px - 479px */
@media (max-width: 479px) { }

/* Mobile & Tablet: 480px - 767px */
@media (max-width: 767px) { }

/* Tablet: 768px - 1024px */
@media (max-width: 1024px) { }

/* Desktop: 1025px+ */
@media (min-width: 1025px) { }
```

## Responsive Layout Patterns

### Pattern 1: Responsive Grid (for Cards/Checklist)

Desktop: 3 columns → Tablet: 2 columns → Mobile: 1 column

```tsx
// In your JSX
<div className="checklist-grid"></div>

// In your CSS
.checklist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

@media (max-width: 1024px) {
  .checklist-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .checklist-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

@media (max-width: 479px) {
  .checklist-grid {
    gap: 10px;
  }
}
```

### Pattern 2: Responsive Flex (Header Direction Change)

```tsx
.header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 16px;
  padding: 24px;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: stretch;
    padding: 16px;
    gap: 12px;
  }
}

@media (max-width: 479px) {
  .header {
    padding: 12px;
    gap: 8px;
  }
}
```

### Pattern 3: Mobile-First Card View for Tables

On mobile, convert tables to card stacks:

```css
.detail-table {
  width: 100%;
  border-collapse: collapse;
}

@media (max-width: 767px) {
  .detail-table thead {
    display: none;
  }

  .detail-table tbody {
    display: block;
  }

  .detail-table tr {
    display: block;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    margin-bottom: 12px;
    padding: 0;
  }

  .detail-table td {
    display: grid;
    grid-template-columns: 100px 1fr;
    gap: 8px;
    padding: 10px;
    border: none;
    border-bottom: 1px solid #f0f0f0;
  }

  .detail-table td:last-child {
    border-bottom: none;
  }

  .detail-table td::before {
    font-weight: 600;
    color: #0d47a1;
    content: attr(data-label);
  }
}
```

### Pattern 4: Modal Responsive Sizing

```css
.modal-container {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

@media (max-width: 1024px) {
  .modal-container {
    max-width: 85vw;
    max-height: 90vh;
  }
}

@media (max-width: 768px) {
  .modal-container {
    width: 100%;
    max-width: 100%;
    max-height: 95vh;
    border-radius: 12px 12px 0 0;
  }
}
```

### Pattern 5: Form Grid Responsive

Single column on mobile, multiple on larger screens:

```css
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

@media (max-width: 1024px) {
  .form-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
  }
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

@media (max-width: 479px) {
  .form-grid {
    gap: 10px;
  }
}
```

## Typography Scaling

```css
:root {
  /* Mobile */
  --font-sm: 0.85rem;
  --font-base: 0.95rem;
  --font-lg: 1.1rem;
  --font-xl: 1.3rem;
  --font-2xl: 1.5rem;
}

@media (min-width: 768px) {
  :root {
    /* Tablet */
    --font-sm: 0.9rem;
    --font-base: 1rem;
    --font-lg: 1.2rem;
    --font-xl: 1.4rem;
    --font-2xl: 1.6rem;
  }
}

/* Usage */
.card-title {
  font-size: var(--font-lg);
}

.page-heading {
  font-size: var(--font-2xl);
}
```

## Spacing Scale

```css
:root {
  /* Mobile */
  --spacing-xs: 6px;
  --spacing-sm: 8px;
  --spacing-md: 12px;
  --spacing-lg: 16px;
  --spacing-xl: 20px;
  --spacing-2xl: 24px;
  --spacing-3xl: 32px;
}

@media (min-width: 768px) {
  :root {
    /* Tablet */
    --spacing-xs: 8px;
    --spacing-sm: 12px;
    --spacing-md: 16px;
    --spacing-lg: 20px;
    --spacing-xl: 24px;
    --spacing-2xl: 32px;
    --spacing-3xl: 40px;
  }
}

/* Usage */
.card {
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
  gap: var(--spacing-md);
}
```

## Touch-Friendly Design

### Minimum Touch Target Size: 44px

```css
/* Button */
.btn-responsive {
  min-height: 44px;
  min-width: 44px;
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-base);
}

/* Form Input */
.form-input {
  min-height: 40px;
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: 16px; /* Prevents iOS zoom-in on focus */
}

/* Ensure proper spacing between interactive elements */
.btn-group {
  gap: 12px; /* Space between buttons */
}
```

## Mobile-Specific Optimizations

### 1. Full-Width Buttons on Mobile

```css
.btn-full {
  width: 100%;
}

@media (max-width: 768px) {
  .btn-action {
    width: 100%;
  }
}
```

### 2. Stack Modal Buttons

```css
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 768px) {
  .modal-footer {
    flex-direction: column-reverse;
    width: 100%;
  }

  .modal-footer button {
    width: 100%;
  }
}
```

### 3. Reduce Font Sizes on Small Screens

```css
h1 {
  font-size: 1.8rem;
}

@media (max-width: 1024px) {
  h1 {
    font-size: 1.6rem;
  }
}

@media (max-width: 768px) {
  h1 {
    font-size: 1.3rem;
  }
}

@media (max-width: 479px) {
  h1 {
    font-size: 1.15rem;
  }
}
```

### 4. Hide Elements on Mobile

```css
.desktop-only {
  display: block;
}

.mobile-only {
  display: none;
}

@media (max-width: 768px) {
  .desktop-only {
    display: none;
  }

  .mobile-only {
    display: block;
  }
}
```

### 5. Adjust Sidebar on Mobile

```css
.sidebar {
  width: 280px;
  position: fixed;
}

.page-content {
  margin-left: 280px;
}

@media (max-width: 1024px) {
  .sidebar {
    width: 240px;
  }

  .page-content {
    margin-left: 240px;
  }
}

@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: -280px;
    width: 280px;
    transition: left 0.3s ease;
    z-index: 1000;
  }

  .sidebar.open {
    left: 0;
  }

  .page-content {
    margin-left: 0;
  }
}
```

## Image Optimization

```css
/* Responsive Images */
.img-responsive {
  max-width: 100%;
  height: auto;
  display: block;
}

/* Thumbnail Sizing */
.img-thumbnail {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 6px;
}

@media (min-width: 768px) {
  .img-thumbnail {
    width: 80px;
    height: 80px;
  }
}
```

## CSS Variables Usage

```tsx
// Use CSS variables for consistent responsive sizing
import '@/styles/responsive-utilities.css'

// In your styled component or CSS
const styles = `
  .card {
    padding: var(--spacing-lg);
    font-size: var(--font-base);
    gap: var(--spacing-md);
  }

  @media (max-width: 768px) {
    .card {
      padding: var(--spacing-md);
      font-size: var(--font-sm);
    }
  }
`
```

## Common Components Responsive Setup

### 1. Page Header

```css
.page-header {
  padding: 32px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

@media (max-width: 1024px) {
  .page-header {
    padding: 24px 18px;
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
    padding: 16px 12px;
    gap: 12px;
  }
}

@media (max-width: 479px) {
  .page-header {
    padding: 12px 8px;
    gap: 8px;
  }
}
```

### 2. Card Container

```css
.card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

@media (max-width: 1024px) {
  .card {
    padding: 20px;
    margin-bottom: 20px;
  }
}

@media (max-width: 768px) {
  .card {
    padding: 16px;
    margin-bottom: 16px;
    border-radius: 10px;
  }
}

@media (max-width: 479px) {
  .card {
    padding: 12px;
    margin-bottom: 12px;
  }
}
```

### 3. Modal Dialog

```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  z-index: 2000;
}

.modal-container {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

@media (max-width: 1024px) {
  .modal-container {
    max-width: 85vw;
  }
}

@media (max-width: 768px) {
  .modal-container {
    max-width: 100%;
    max-height: 95vh;
    border-radius: 12px 12px 0 0;
  }
}
```

## Testing Checklist

- [ ] iPhone SE (375px width)
- [ ] iPhone 12/13/14 (390px width)
- [ ] Samsung S21 (360px width)
- [ ] iPad (768px width)
- [ ] iPad Pro (1024px width)
- [ ] Test in portrait orientation
- [ ] Test in landscape orientation
- [ ] Test touch interactions
- [ ] Test modal scrolling on small screens
- [ ] Verify all buttons are at least 44px
- [ ] Verify no horizontal scrolling except tables
- [ ] Verify images are responsive
- [ ] Verify forms stack properly
- [ ] Test with browser DevTools device emulation

## Files Updated

1. ✅ `app/status-ga/page.tsx` - Main checklist with tablet/mobile optimization
2. ✅ `app/status-ga/form-inspeksi-stop-kontak/stop-kontak/riwayat/page.tsx` - Modal and form responsive
3. ✅ `app/status-ga/form-inspeksi-stop-kontak/instalasi-listrik/riwayat/page.tsx` - Mobile/tablet optimization
4. ✅ `styles/responsive-utilities.css` - Reusable CSS utilities
5. 📄 This guide document

## Next Steps

1. Apply responsive utilities CSS to all remaining history pages
2. Update Sidebar component for mobile burger menu
3. Test all pages on actual mobile/tablet devices
4. Implement dark mode responsive support if needed
5. Add landscape orientation support

## Performance Tips

- Use CSS media queries instead of JavaScript for layout changes
- Avoid max-width large values; use 100% for mobile-first
- Minimize repaints by grouping related media queries
- Use CSS variables for easy theme adjustments
- Test on actual devices, not just browser emulation

## Resources

- [MDN: Responsive Design](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design)
- [Google: Mobile-Friendly Test](https://search.google.com/test/mobile-friendly)
- [CSS Tricks: A Complete Guide to Grid](https://css-tricks.com/snippets/css/complete-guide-grid/)
- [WebAIM: Mobile Accessibility](https://webaim.org/articles/mobile/)

## Support

For questions about implementing responsive design:
1. Refer to the RESPONSIVE_CSS_GUIDE.md
2. Review the utility CSS pattern examples above
3. Check existing page implementations in the codebase
4. Test with Chrome DevTools device emulation
