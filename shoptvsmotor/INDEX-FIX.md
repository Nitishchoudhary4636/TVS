# Fix console errors on shoptvsmotor.vercel.app

## Error 1: `styler-sitemap.js` 404
Upload `js/styler-sitemap.js` from this folder to your Vercel project (file already copied from `tvs-sitemap.js`).

## Error 2: `(index):279 Cannot set properties of null (innerHTML)`
`#cats`, `#featured`, `#carTrack` are inside **HTML comments** but JS still tries to fill them.

**Fix A (recommended):** In `index.html`, **uncomment** the three sections:
- Shop by Category (`id="cats"`)
- Featured Products (`id="featured"`)
- New Arrivals (`id="carTrack"`)

**Fix B:** Replace the bottom `<script>` block (from `mountChrome("home");` onward) with the safe version in `index-script-safe.txt`.

## Error 3: iframe sandbox warning
Safe to ignore — Salesforce Visual Editor message.

## Error 4: `visual-editor.ts classList` null
Usually caused by Error 2 crashing the page. Fix 1 + 2 first, then reload Visual Editor.

## Deploy
```powershell
cd shoptvsmotor
vercel --prod
```

Verify: https://shoptvsmotor.vercel.app/js/styler-sitemap.js returns 200
