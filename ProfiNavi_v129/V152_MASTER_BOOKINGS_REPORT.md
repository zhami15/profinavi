# ProfiNavi v152 — master-bookings spacing fix

Target page: `/master-bookings.html`

## Root cause
The shared `.master-days` rule defined only `margin-bottom: 12px` and no top margin, so the seven day buttons were visually pressed against the page header.

## Fix
Added a page-scoped rule only for the bookings page:

```css
.master-app-page[data-master-page="bookings"] .master-days {
  margin-top: 12px;
}
```

No booking logic, Supabase queries, actions, or other pages were changed.
