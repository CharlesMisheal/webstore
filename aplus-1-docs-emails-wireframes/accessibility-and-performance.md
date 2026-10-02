# Accessibility & performance notes

**Accessibility (WCAG 2.2 AA target)**
- Contrast: body text ≥ 7:1 (`#4B5565`/`#1B2230` on ivory); minimum 4.5:1 for all text; gold `#B8923A` is decorative only. UI borders ≥ 3:1.
- Targets ≥ 48×48 px mobile; 8px spacing between targets. Visible 2px focus ring (`#2B6CB0`) on every interactive element; logical tab order; skip-to-content link.
- Forms: visible labels (not placeholder only), inline errors with icon + text (not colour only), `aria-live="polite"` for toasts, `role="alertdialog"` for confirmations with focus trap and Esc to close; return focus to the trigger.
- Images: meaningful `alt` (product name + colour); decorative images `alt=""`. Admin drag-reorder must have keyboard alternative (“Move up/down” buttons).
- Status chips include text, never colour only. Respect `prefers-reduced-motion`. Zoom to 200% without horizontal scroll; support 320 px width.
- Payment states announce result to screen readers; Paystack iframe/hosted page is third-party.

**Performance**
- Target LCP < 2.5 s on 4G Android; CLS < 0.1; INP < 200 ms. Total JS on home < 170 KB gz.
- Images: WebP/AVIF via `next/image`, explicit width/height, `sizes`, lazy-load below the fold, hero `priority` ≤ 150 KB; product thumbs 400 px ≤ 40 KB.
- Fonts: self-host Playfair (600/700 + italic 400) and Inter variable with `font-display: swap`, preload the two critical files.
- ISR/static for catalogue; revalidate on admin publish. Cache API reads at the edge. Load the Paystack script only on the payment step.
- Admin: paginate lists (25/page), server-side search/filter, avoid loading all images.
