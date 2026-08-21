# 📱 Responsive CSS Guide - Mobile & Tablet Optimization

## Breakpoints Standard

```css
/* Mobile First Approach */
/* Mobile: 320px - 479px */
/* Tablet: 480px - 1024px */
/* Desktop: 1025px+ */

@media (max-width: 479px) { /* Small Mobile */ }
@media (max-width: 768px) { /* Mobile & Small Tablet */ }
@media (max-width: 1024px) { /* Tablet */ }
@media (max-width: 1200px) { /* Small Desktop */ }
```

## Key Responsive Improvements Applied

### 1. **Layout & Margins**
- **Mobile**: Reduce padding to 12-16px
- **Tablet**: Increase to 16-24px  
- **Desktop**: Full 24-32px padding

### 2. **Typography**
- **Mobile**: Base font 14-16px, headings 1.2-1.4rem
- **Tablet**: Base font 15-17px, headings 1.4-1.6rem
- **Desktop**: Base font 16px+, headings 1.6-2rem

### 3. **Grid Layouts**
- **Mobile**: Single column (1fr)
- **Tablet**: 2 columns (repeat(2, 1fr))
- **Desktop**: 3+ columns (repeat(auto-fit, minmax(300px, 1fr)))

### 4. **Touch Targets**
- Minimum button size: 44px x 44px
- Minimum clickable area: 48px
- Gap between interactive elements: 8-12px

### 5. **Tables**
- **Mobile**: Switch to card/accordion view
- **Tablet**: Stack columns, reduce TD padding to 10px
- **Desktop**: Full table with horizontal scroll container

### 6. **Modals**
- **Mobile**: Full-screen or max-height 95vh with scroll
- **Tablet**: 85vw width, max-height 90vh
- **Desktop**: max-width 800-900px

### 7. **Sidebar**
- **Mobile**: Hidden by default, toggle menu
- **Tablet**: Fixed but can collapse
- **Desktop**: Always visible

## Common Patterns Used

```tsx
// Pattern 1: Responsive Grid
.responsive-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

@media (max-width: 768px) {
  .responsive-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

// Pattern 2: Flex Direction Change
.flex-responsive {
  display: flex;
  flex-direction: row;
  gap: 16px;
}

@media (max-width: 768px) {
  .flex-responsive {
    flex-direction: column;
    gap: 12px;
  }
}

// Pattern 3: Hide/Show Elements
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

// Pattern 4: Stack Forms
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}
```

## Mobile-First Checklist

- ✅ 44px minimum touch target size
- ✅ Sufficient padding/margin for touch
- ✅ Readable font sizes (min 16px input)
- ✅ Optimized for portrait orientation
- ✅ Responsive images
- ✅ No horizontal scroll except tables
- ✅ Touch-friendly menus and buttons
- ✅ Proper modal stacking (z-index)
- ✅ Modal footer buttons stacked on mobile
- ✅ Tables converted to cards on mobile

## Spacing Scale

```
Mobile:    8px, 12px, 16px, 24px, 32px
Tablet:    12px, 16px, 24px, 32px, 40px
Desktop:   16px, 24px, 32px, 40px, 48px
```

## Color & Contrast

- Text: min WCAG AA contrast (4.5:1 for normal text)
- Buttons: min 44px height, clear visual state
- Focus states: clear outline or background change

## Files to Update with Responsive CSS

1. ✅ `app/status-ga/page.tsx` - Main checklist page
2. ✅ `app/status-ga/*/riwayat/*/page.tsx` - History pages (modals)
3. ✅ Components with complex tables and forms
4. ✅ Modal styling across all history pages
5. ✅ Form grid layouts in edit modals

## Testing Checklist

- [ ] Test on iPhone SE (375px)
- [ ] Test on iPhone 14 (390px)
- [ ] Test on iPad (768px)
- [ ] Test on iPad Pro (1024px)
- [ ] Test landscape orientation
- [ ] Test touch interactions
- [ ] Test modal scrolling on mobile
- [ ] Test form input focus on mobile
- [ ] Test table overflow handling
- [ ] Test button accessibility (min 44px)
