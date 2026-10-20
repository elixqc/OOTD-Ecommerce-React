# OOTD E-Commerce — Project Structure & Code Audit

> Audited **20 Oct 2026** · 143 files (excludes `node_modules/`, `.git/`, and this file).
> Line counts and comment ratios are measured from the current working tree.

## Legend

| Mark | Meaning |
| --- | --- |
| ✅ | Format matches the project baseline — good as-is |
| ⚠️ | Small format/quality nit (unused import, trailing space, long line, comment-heavy) |
| 🔧 | Structure needs work (too large, duplicated, mixed responsibilities) |
| 🗑 | Unused — safe to delete after a quick confirm |
| ➖ | Binary / generated / config — not graded |

A file can have both a format nit and a structure problem; the tree shows the **highest-priority** flag. Details are in the tables below.

---

## 1. What "proper" looks like (your baseline)

Your `FilterDrawer.jsx` and `Catalog.jsx` already define a clear, consistent house style. This is the standard I graded against:

```jsx
import { useEffect, useState } from 'react';
import {
    Accordion,
    AccordionDetails,
    // ...
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import api from '../../api';

// One collapsible section with the round chevron button
function Section({ id, title, open, onToggle, children }) {
    return (
        <Accordion
            disableGutters
            square
            elevation={0}
            expanded={open}
            onChange={() => onToggle(id)}
            className="filter-accordion"
        >
            <AccordionSummary
                expandIcon={
                    <span className="filter-chevron">
                        <ExpandMoreIcon fontSize="small" />
                    </span>
                }
            >
                <Typography className="filter-section-title">{title}</Typography>
            </AccordionSummary>
            <AccordionDetails>{children}</AccordionDetails>
        </Accordion>
    );
}
```

**The rules your codebase already follows (keep them):**

1. **4 spaces**, never tabs.
2. **Single quotes** for JS strings, **double quotes** for JSX attributes.
3. **Semicolons** on every statement.
4. **Trailing commas** in multi-line imports, objects, and argument lists.
5. Helper components (`Section`) sit above the default export; one component per file where possible.
6. Imports ordered: React → router/redux → MUI → icons → local modules.
7. One blank line between logical blocks.
8. JSX props go one-per-line once there is more than ~3.
9. Comments explain **why**, not what the next line does.
10. No unused imports (ESLint catches these).

**Use these as templates:** `FilterDrawer.jsx`, `ProductCard.jsx`, `ProductCardSkeleton.jsx`, `WishlistButton.jsx`, `NewProduct.jsx`, `UpdateProduct.jsx`, `AdminLayout.jsx`, `CheckoutSteps.jsx`, `OrderInfo.jsx`, `ProtectedRoute.jsx`.

> Note: `Catalog.jsx` is a **format** benchmark, but it has 2 lint errors (see §6). `FilterDrawer.jsx` is clean on both.

---

## 2. Annotated file tree

```
OOTD-Ecommerce-React/
├── backend/
│   ├── config/
│   │   ├── .env  ➖  local secrets (git-ignored)
│   │   ├── cloudinary.js  ✅
│   │   ├── database.js  ✅
│   │   └── serviceAccountKey.json  ➖  generated credential JSON
│   ├── controllers/
│   │   ├── auth.js  ⚠️  duplicate comment block at lines 196-199
│   │   ├── order.js  🔧  538 lines: orders + dashboard analytics
│   │   ├── product.js  ⚠️  353 lines, widest comment coverage, trailing whitespace
│   │   ├── review.js  ⚠️  14.4% comments
│   │   └── wishlist.js  ⚠️  18.8% comments (small file)
│   ├── middlewares/
│   │   └── auth.js  ✅
│   ├── models/
│   │   ├── order.js  ✅
│   │   ├── product.js  ✅
│   │   ├── review.js  ✅
│   │   └── user.js  ✅
│   ├── routes/
│   │   ├── auth.js  ✅
│   │   ├── order.js  ✅
│   │   ├── product.js  ✅
│   │   ├── review.js  ⚠️  trailing whitespace
│   │   └── wishlist.js  ✅
│   ├── utils/
│   │   ├── constants.js  ✅
│   │   ├── email.js  ⚠️  long line (203 chars)
│   │   ├── orderFormat.js  ✅
│   │   ├── productImages.js  ✅
│   │   ├── profanity.js  ✅
│   │   └── receipt.js  ✅
│   ├── app.js  ⚠️  trailing whitespace
│   ├── package-lock.json  ➖
│   ├── package.json  ✅
│   └── server.js  ✅
├── frontend/
│   ├── public/
│   │   ├── android-chrome-192x192.png  ➖
│   │   ├── android-chrome-512x512.png  ➖
│   │   ├── apple-touch-icon.png  ➖
│   │   ├── favicon-16x16.png  ➖
│   │   ├── favicon-32x32.png  ➖
│   │   ├── favicon.ico  ➖
│   │   ├── favicon.svg  ➖
│   │   ├── icons.svg  ➖
│   │   └── site.webmanifest  ➖
│   ├── src/
│   │   ├── actions/
│   │   │   ├── cartActions.js  ⚠️  10.7% comments
│   │   │   ├── orderActions.js  ✅
│   │   │   ├── productActions.js  ✅
│   │   │   ├── reviewActions.js  ✅
│   │   │   ├── userActions.js  ✅
│   │   │   └── wishlistActions.js  ✅
│   │   ├── assets/
│   │   │   ├── hero.png  🗑  unused asset
│   │   │   ├── ootd-hero.jpeg  🗑  unused duplicate of ootd-hero.jpg
│   │   │   ├── ootd-hero.jpg  ➖
│   │   │   ├── react.svg  🗑  Vite template leftover
│   │   │   └── vite.svg  🗑  Vite template leftover
│   │   ├── Components/
│   │   │   ├── Admin/
│   │   │   │   ├── AdminLayout.jsx  ✅
│   │   │   │   ├── ColorImageUploader.jsx  ✅
│   │   │   │   ├── Dashboard.jsx  🔧  7 subcomponents, 684 lines
│   │   │   │   ├── NewProduct.jsx  ✅
│   │   │   │   ├── OrdersList.jsx  🔧  list page duplication, 403 lines
│   │   │   │   ├── ProcessOrder.jsx  ⚠️  337 lines, long lines
│   │   │   │   ├── ProductForm.jsx  🔧  650-line form
│   │   │   │   ├── ProductsList.jsx  🔧  list page duplication, 558 lines
│   │   │   │   ├── ReviewsList.jsx  🔧  list page duplication, 546 lines
│   │   │   │   ├── UpdateProduct.jsx  ✅
│   │   │   │   ├── UpdateUser.jsx  ⚠️  373 lines, long lines
│   │   │   │   └── UsersList.jsx  🔧  list page duplication, 454 lines
│   │   │   ├── Cart/
│   │   │   │   ├── Cart.jsx  ⚠️  long lines
│   │   │   │   ├── CheckoutLayout.jsx  ✅
│   │   │   │   ├── CheckoutSteps.jsx  ✅
│   │   │   │   ├── ConfirmOrder.jsx  ✅
│   │   │   │   ├── OrderSuccess.jsx  ✅
│   │   │   │   ├── Payment.jsx  ✅
│   │   │   │   └── Shipping.jsx  ✅
│   │   │   ├── Common/
│   │   │   │   └── LocationFields.jsx  ✅
│   │   │   ├── Layout/
│   │   │   │   ├── ConfirmDialog.jsx  ✅
│   │   │   │   ├── CustomerLayout.jsx  ✅
│   │   │   │   ├── Footer.jsx  ✅
│   │   │   │   ├── Header.jsx  ⚠️  373 lines: desktop nav + search + mobile menu
│   │   │   │   ├── MetaData.jsx  ✅  5 lines; comments explain a real React 19 behaviour
│   │   │   │   ├── NotFound.jsx  ✅
│   │   │   │   └── SearchOverlay.jsx  🔧  461 lines, 2 components
│   │   │   ├── Order/
│   │   │   │   ├── ListOrders.jsx  🔧  list page duplication, 399 lines
│   │   │   │   ├── OrderDetails.jsx  ✅
│   │   │   │   ├── OrderInfo.jsx  ✅
│   │   │   │   └── OrderStatusChip.jsx  ✅
│   │   │   ├── Product/
│   │   │   │   ├── Catalog.jsx  ✅  format baseline; lint clean
│   │   │   │   ├── FilterDrawer.jsx  ✅
│   │   │   │   ├── ProductCard.jsx  ✅
│   │   │   │   ├── ProductCardSkeleton.jsx  ✅
│   │   │   │   ├── ProductDetails.jsx  🔧  4 components, 582 lines
│   │   │   │   └── WishlistButton.jsx  ✅
│   │   │   ├── Review/
│   │   │   │   ├── ListReviews.jsx  ✅
│   │   │   │   ├── MyReviews.jsx  ✅
│   │   │   │   └── ReviewForm.jsx  ✅
│   │   │   ├── Route/
│   │   │   │   └── ProtectedRoute.jsx  ✅
│   │   │   ├── Support/
│   │   │   │   ├── SupportLayout.jsx  🔧  8 exported components
│   │   │   │   └── SupportPages.jsx  🔧  6 pages in one file
│   │   │   ├── User/
│   │   │   │   ├── AuthHeading.jsx  ✅
│   │   │   │   ├── authMotion.js  ✅
│   │   │   │   ├── AuthPage.jsx  ⚠️  long line (235 chars)
│   │   │   │   ├── AuthSwitch.jsx  ✅
│   │   │   │   ├── ForgotPassword.jsx  ✅
│   │   │   │   ├── Login.jsx  ✅
│   │   │   │   ├── PasswordField.jsx  ✅
│   │   │   │   ├── Profile.jsx  ✅
│   │   │   │   ├── Register.jsx  ✅
│   │   │   │   ├── SocialButtons.jsx  ✅
│   │   │   │   ├── SSOCallback.jsx  ✅
│   │   │   │   ├── UpdatePassword.jsx  ✅
│   │   │   │   └── UpdateProfile.jsx  ✅
│   │   │   ├── Wishlist/
│   │   │   │   └── Wishlist.jsx  ✅
│   │   │   └── Home.jsx  ✅
│   │   ├── constants/
│   │   │   ├── cartConstants.js  ✅
│   │   │   ├── orderConstants.js  ✅
│   │   │   ├── productConstants.js  ✅
│   │   │   ├── reviewConstants.js  ✅
│   │   │   ├── storeInfo.js  ✅
│   │   │   ├── userConstants.js  ✅
│   │   │   └── wishlistConstants.js  ✅
│   │   ├── reducers/
│   │   │   ├── cartReducers.js  ✅
│   │   │   ├── orderReducers.js  ✅
│   │   │   ├── productReducers.js  ✅
│   │   │   ├── reviewReducers.js  ✅
│   │   │   ├── userReducers.js  ✅
│   │   │   └── wishlistReducers.js  ✅
│   │   ├── Utils/
│   │   │   ├── helpers.jsx  ✅
│   │   │   ├── imageFile.js  ✅
│   │   │   ├── locations.js  ✅
│   │   │   └── productImages.js  ⚠️  duplicates backend/utils/productImages.js; double blank line
│   │   ├── api.js  ✅
│   │   ├── App.css  🗑  unused (not imported); 2-space Vite default
│   │   ├── App.jsx  ✅
│   │   ├── index.css  🗑  unused (not imported); 2-space Vite default
│   │   ├── main.jsx  ✅
│   │   ├── store.js  ⚠️  trailing whitespace
│   │   ├── style.css  🔧  3,682-line global stylesheet
│   │   └── theme.jsx  ✅
│   ├── .env  ➖  local secrets (git-ignored)
│   ├── .gitignore  ➖
│   ├── eslint.config.js  ⚠️  2-space + no semicolons (Vite template), rest of repo is 4-space
│   ├── index.html  ✅
│   ├── package-lock.json  ➖
│   ├── package.json  ✅
│   ├── README.md  ➖
│   └── vite.config.js  ✅
├── .gitignore  ➖
├── package-lock.json  ➖
└── package.json  ⚠️  stray mongodb dep, no scripts/workspaces
```

---

## 3. Format scoreboard

| Result | Count |
| --- | --- |
| ✅ Clean | **88** |
| ⚠️ Minor nit | **17** |
| 🔧 Structure work | **13** |
| 🗑 Unused | **6** |
| ➖ N/A | 19 |

**What is already consistent (this is the good news):**

- **Indentation:** 4 spaces in *every* app file; no tabs anywhere. The only 2-space files are `eslint.config.js` and the unused Vite CSS files.
- **Quotes:** single quotes in JS, double quotes in JSX attributes — consistent.
- **Semicolons / trailing commas:** used consistently.
- **Naming:** PascalCase components, camelCase functions, SCREAMING_SNAKE action constants.
- **No commented-out code** anywhere (verified line by line).
- **No tabs, no mixed indentation.**
- **Architecture:** Redux split into `actions / constants / reducers` is clean; `NewProduct` and `UpdateProduct` correctly wrap a shared `ProductForm`.

**Where formatting is *not* uniform:**

- 7 files use **LF** while the rest of the working tree uses **CRLF** (git `core.autocrlf=true`):

  `backend/utils/receipt.js`, `backend/utils/orderFormat.js`, `frontend/src/actions/reviewActions.js`, `frontend/src/reducers/reviewReducers.js`, `frontend/src/constants/reviewConstants.js`, `frontend/src/Components/Order/OrderDetails.jsx`, `frontend/src/Components/Order/OrderStatusChip.jsx`

  Fix once with `.gitattributes` + a normalize pass (§8).
- **Trailing whitespace** (1–2 lines each): `backend/controllers/product.js`, `backend/app.js`, `backend/routes/review.js`, `frontend/src/store.js`.
- **Longest lines** (> 150 chars): `SupportPages.jsx` (236), `AuthPage.jsx` (235), `backend/utils/email.js` (203), `UpdateUser.jsx` (184), `ReviewsList.jsx` (182), `ProcessOrder.jsx` (181), `Dashboard.jsx` (170), `UsersList.jsx` (166), `ProductsList.jsx` / `OrdersList.jsx` / `ListOrders.jsx` / `Cart.jsx` (163), `ProductForm.jsx` (161), `SupportLayout.jsx` (153).

**Minor nit list (the 19 ⚠️ files, plus `ProductDetails` which is flagged 🔧):**

| File | Nit | Fix |
| --- | --- | --- |
| `backend/app.js` | 2 trailing-space lines | `trimTrailingWhitespace` / Prettier |
| `backend/routes/review.js` | 1 trailing-space line | same |
| `backend/controllers/product.js` | 1 trailing space, 11.4% comments, 353 lines | Prettier + trim comment headers |
| `backend/controllers/auth.js` | Duplicate comment block (196–199) | Delete the first pair |
| `backend/controllers/review.js` | 14.4% comments | Trim restating comments |
| `backend/controllers/wishlist.js` | 18.8% comments | Optional; file is only 40 lines |
| `backend/utils/email.js` | 203-char line | Let Prettier wrap the template |
| `frontend/src/store.js` | 1 trailing-space line | Prettier |
| `frontend/src/actions/cartActions.js` | 10.7% comments | Fine, or shorten |
| `frontend/src/Components/Home.jsx` | ✅ Fixed — unused `notifyError` removed | — |
| `frontend/src/Components/Cart/Cart.jsx` | Long lines | Wrap JSX |
| `frontend/src/Components/Product/Catalog.jsx` | ✅ Fixed — unused `total` removed; effect replaced | — |
| `frontend/src/Components/Product/ProductDetails.jsx` | ✅ Fixed — unused `ToggleButtonGroup` removed | — |
| `frontend/src/Components/Layout/Header.jsx` | 373 lines | See P2 |
| `frontend/src/Components/Admin/UpdateUser.jsx` | 373 lines, 184-char line | See P2 |
| `frontend/src/Components/Admin/ProcessOrder.jsx` | 337 lines, long JSX lines | See P2 |
| `frontend/src/Components/User/AuthPage.jsx` | 235-char line (inline gradient) | Split the gradient string |
| `frontend/src/Utils/productImages.js` | Duplicates backend util, double blank line | See P3 |
| `frontend/eslint.config.js` | 2-space + no semicolons (template) | Optional: align to 4-space |
| root `package.json` | Stray `mongodb` dep, no scripts | Delete or turn into a workspace |

---

## 4. Structure priorities (do them in this order)

### 🟥 P0 — Quick cleanup (≈1 hour, no behavior change)

1. **Delete unused files** (confirm first):
   - `frontend/src/App.css` (185 lines) and `frontend/src/index.css` (112 lines) — nothing imports them; `main.jsx` imports only `style.css`.
   - `frontend/src/assets/hero.png`, `ootd-hero.jpeg`, `react.svg`, `vite.svg` — only `ootd-hero.jpg` is referenced (`Home.jsx`, `AuthPage.jsx`, `style.css`).
2. **Remove the 4 unused imports** flagged by ESLint (see §6). ✅ Done — `Cart`, `Home`, `Catalog`, `ProductDetails` are clean.
3. **Delete the root `package.json` + `package-lock.json`**, or replace them with a real workspace (P3). Right now the root installs a `mongodb` dependency that no code uses.
4. **Lock the format** so it cannot drift again: add `.editorconfig`, `.prettierrc`, `.gitattributes` (§8), then run Prettier once in a separate commit.

### 🟧 P1 — Biggest structural wins (≈2–3 days)

5. **Split `frontend/src/style.css` (3,682 lines).** It is the largest file in the repo and touches every page. You already have section headers inside it, so this is mostly moving blocks:
   ```
   src/styles/
   ├── base.css        (tokens, reset, typography)
   ├── layout.css      (customer layout, header, footer, toasts)
   ├── admin.css       (admin layout, dashboard, lists, forms)
   ├── catalog.css     (toolbar, filters, product grid/cards)
   ├── product.css     (details, gallery, colors, reviews)
   ├── checkout.css    (cart, shipping, payment, orders)
   ├── auth.css        (login/register/profile)
   ├── support.css
   └── responsive.css  (media queries at the end)
   ```
   Import them from `style.css` in that order. Target: **no CSS file over 500 lines**. Long-term, move colors/spacing into `theme.jsx` and keep CSS for animations and complex selectors only.

6. **Kill the admin list-page duplication.** These values are copy-pasted:

   | Value | Defined in |
   | --- | --- |
   | `NEUTRAL` | 9 files (5 admin lists + `ListOrders`, `Dashboard`, `UpdateUser`, `ProductForm`) |
   | `BORDER` | 10 files (the same 9, plus `ColorImageUploader`) |
   | `STATUS_COLORS` | 5 files (`OrdersList`, `ListOrders`, `ProcessOrder`, `Dashboard`, `UpdateUser`) |
   | `fieldSx` | 6 files |
   | `toInputDate` | 5 files (`OrdersList`, `ListOrders`, `UsersList`, `ReviewsList`, `Dashboard`) |

   Create `Components/Admin/shared/`:
   ```
   adminUi.js          // colors, fieldSx, STATUS_COLORS
   dateRange.js        // toInputDate, presets, range helpers
   AdminDataGrid.jsx   // shared DataGrid defaults + empty/loading state
   AdminToolbar.jsx    // search, filter button, date range
   useAdminFilters.js  // search/filter/date state
   ```
   This removes roughly 400–600 duplicated lines across `ProductsList` (558), `ReviewsList` (546), `UsersList` (454), `OrdersList` (403), and `ListOrders` (399).

7. **Split `SupportPages.jsx` (701 lines, 6 pages in one file):**
   ```
   Support/
   ├── SupportLayout.jsx       // shell only
   ├── pages/
   │   ├── ContactPage.jsx
   │   ├── ShippingPage.jsx
   │   ├── ReturnPage.jsx
   │   ├── FaqPage.jsx
   │   ├── TermsPage.jsx
   │   └── PrivacyPage.jsx
   └── LegalPage.jsx           // shared by Terms + Privacy
   ```
   Update the import in `App.jsx`.

8. **Split `backend/controllers/order.js` (538 lines).** It currently mixes order CRUD/stock with dashboard analytics (`TIMEZONE`, `buildBuckets`, `processingCount`, `dashboardStats`, lines ~342–538).
   - Move dashboard code to `controllers/dashboard.js` (routes accordingly).
   - Optionally extract stock helpers (`reserveStock`, `restoreStock`, `getAvailable`) to `services/stock.js`.
   - Target: `order.js` ≈ 300 lines.

9. **Break up `ProductForm.jsx` (650 lines):**
   ```
   Admin/ProductForm/
   ├── index.jsx            // Formik shell + submit
   ├── validation.js        // Yup schema
   ├── useProductForm.js    // colors/variants state + uploads
   ├── BasicsSection.jsx
   ├── PricingSection.jsx
   ├── ColorsSection.jsx
   └── VariantsTable.jsx
   ```
   `ColorImageUploader.jsx` already exists and can stay as-is.

### 🟨 P2 — Medium files

10. **`Dashboard.jsx` (684 lines, 7 subcomponents)** → `Admin/Dashboard/` with `index.jsx`, `StatCard.jsx`, `SalesChart.jsx`, `SalesTooltip.jsx`, `TopSellers.jsx`, `UserMenu.jsx`, `ChangeChip.jsx`.
11. **`ProductDetails.jsx` (582 lines, 4 components)** → `Product/Details/` with `Gallery.jsx`, `ColorPanel.jsx`, `SizePicker.jsx`, `ReviewSummary.jsx`.
12. **`SearchOverlay.jsx` (461 lines)** → extract `SearchResults.jsx` and a `useProductSearch` hook. **`Header.jsx` (373)** → extract `MobileMenu.jsx` / `SearchBar.jsx`.
13. **`SupportLayout.jsx` (250 lines, 8 exports)** → split each primitive into `Support/ui/` (`SupportPage`, `SupportSection`, `CardGrid`, `InfoCard`, `Steps`, `SupportAccordion`). The `react-refresh/only-export-components` error itself comes from `export const bodyText` on line 23 — move that style object to `supportStyles.js` and import it in both support files.
14. **`backend/controllers/product.js` (353 lines)** → move upload/delete/cleanup image logic into `services/productImages.js`; keep controllers to request validation + response.

### 🟩 P3 — Nice to have

15. **De-duplicate shared logic between frontend and backend:**
    - `CATEGORIES`, `GENDERS`, `MAX_IMAGES_PER_COLOR` are copied in `backend/utils/constants.js` and `frontend/src/constants/productConstants.js` (the file even says "must match").
    - `backend/utils/productImages.js` and `frontend/src/Utils/productImages.js` implement the same `sameColor / getColorImageUrl` logic and have already **diverged** (frontend uses optional chaining, backend does not).
    - Options: a `shared/` folder consumed by both (Vite alias for frontend), or a generated `shared/constants.json`. For a school project, a single JSON plus a small check script is enough.
16. **Make the root a workspace** (or delete it):
    ```json
    {
      "private": true,
      "workspaces": ["frontend", "backend"],
      "scripts": {
        "dev": "concurrently \"npm:dev -w backend\" \"npm:dev -w frontend\"",
        "lint": "npm run lint -w frontend",
        "format": "prettier --write ."
      },
      "devDependencies": { "concurrently": "^9", "prettier": "^3" }
    }
    ```

---

## 5. Comment audit

Good news first: **none of your comments are commented-out code**, and most explain *why* (stock rules, timezone handling, React 19 behavior) rather than restating the line below. There is no file that needs a mass deletion.

The ratio is `comment lines / non-blank code lines`, so tiny files look inflated.

| File | Comment lines | Ratio | Verdict |
| --- | ---: | ---: | --- |
| `backend/controllers/order.js` | 39 | 8.4% | **Keep** — the stock/timezone comments are valuable. They move with the dashboard split. |
| `backend/controllers/product.js` | 33 | 11.4% | **Trim** — the `// GET /api/...` route headers repeat what the route file already says. Keep the "why" comments. |
| `backend/controllers/review.js` | 28 | 14.4% | **Trim a little** — a few comments restate the next line (e.g. "The reviewer's id is left out" is useful; "Checks the rating" is not). |
| `backend/controllers/auth.js` | 20 | 9.2% | **Fix one thing** — lines 196–199 are a duplicated endpoint comment; delete the first two lines. |
| `frontend/src/actions/cartActions.js` | 13 | 10.7% | **Fine** — comments explain cart-key and stock rules. |
| `backend/controllers/wishlist.js` | 6 | 18.8% | **Fine** — only 6 lines, but the route docs could live in `routes/wishlist.js`. |
| `frontend/src/constants/productConstants.js` | 5 | 15.6% | **Fine** — section labels. |
| `frontend/src/Components/Layout/MetaData.jsx` | 2 | 40% | **Fine** — a 5-line file explaining non-obvious React 19 behavior. Do not remove. |
| `backend/utils/orderFormat.js` | 2 | 14.3% | Fine. |

**Rule of thumb for the ones marked "trim":**

- Keep comments that answer **why**, **what breaks otherwise**, or **business rules** (stock limits, TZ, masking).
- Delete comments that repeat the function name or the next line (`// Checks the rating`).
- Delete duplicated blocks (`auth.js:196–199`).
- Don't add file-header banners or JSDoc to every prop — this codebase doesn't need it.

---

## 6. ESLint findings — all fixed (20 Oct 2026)

`npm run lint` in `frontend/` now reports **0 problems** and `vite build` succeeds. The table below is kept as a record of what was fixed:

| File:line | Rule | Fix |
| --- | --- | --- |
| `Components/Cart/Cart.jsx:8` | `no-unused-vars` | Remove `ShoppingBagOutlinedIcon` import |
| `Components/Home.jsx:7` | `no-unused-vars` | Remove `notifyError` from the import |
| `Components/Product/Catalog.jsx:49` | `no-unused-vars` | Remove `total` from the `useSelector` destructure |
| `Components/Product/Catalog.jsx:65` | `react-hooks/set-state-in-effect` | Derive `category` from `searchParams` directly (single source of truth) instead of syncing state in an effect |
| `Components/Product/ProductDetails.jsx:12` | `no-unused-vars` | Remove `ToggleButtonGroup` import |
| `Components/Support/SupportLayout.jsx:23` | `react-refresh/only-export-components` | ✅ Moved `export const bodyText` to `supportStyles.js`; imported in `SupportLayout.jsx` + `SupportPages.jsx` |

For the Catalog one, use React's "adjust state during render" pattern instead of an effect, so the URL stays the source of truth without an extra render:

```jsx
const urlCategory = categoryFromUrl(searchParams.get('category'));
const [options, setFilters] = useState(emptyFilters);
const [lastUrlCategory, setLastUrlCategory] = useState(urlCategory);

if (urlCategory !== lastUrlCategory) {
    setLastUrlCategory(urlCategory);
    setFilters((prev) => ({ ...prev, category: urlCategory }));
}

const filters = useMemo(() => ({ ...options, keyword }), [options, keyword]);
```

No effect, no cascading render, and the footer links still work.

---

## 7. Unused files and assets

Confirm these are not referenced anywhere before deleting (I checked imports and `url()` references):

| File | Size | Why it is unused |
| --- | ---: | --- |
| `frontend/src/App.css` | 185 lines | Not imported (only `style.css` is) |
| `frontend/src/index.css` | 112 lines | Not imported |
| `frontend/src/assets/hero.png` | — | Not referenced |
| `frontend/src/assets/ootd-hero.jpeg` | — | Duplicate of the `.jpg` that *is* used |
| `frontend/src/assets/react.svg` | — | Vite template leftover |
| `frontend/src/assets/vite.svg` | — | Vite template leftover |

Also remove the stray root dependency: `package.json` at the project root only declares `mongodb`, and no file outside `node_modules` imports it.

---

## 8. Tooling to keep it clean

Add these three files at the project root (or in `frontend/`):

**`.editorconfig`**
```ini
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = space

[*.{js,jsx,css,json,md}]
indent_size = 4

[*.{json,yml,yaml}]
indent_size = 2
```

**`.prettierrc`**
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 4,
  "printWidth": 100,
  "trailingComma": "all",
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

**`.gitattributes`**
```gitattributes
* text=auto eol=lf
*.png binary
*.jpg binary
*.jpeg binary
*.ico binary
*.woff2 binary
```

**Commands**
```bash
cd frontend
npm i -D prettier
npx prettier --write "src/**/*.{js,jsx,css}"
npx prettier --check "src/**/*.{js,jsx,css}"
npm run lint
```

Run the Prettier pass as its **own commit** so the diff is pure formatting and easy to skip when reviewing logic changes.

> Prettier will convert the 7 LF files and the rest to LF, remove trailing spaces, wrap the long lines, and normalize JSX — while keeping your 4-space / single-quote style.

---

## 9. Folder map

| Folder | Purpose |
| --- | --- |
| `backend/config` | DB, Cloudinary, and env configuration |
| `backend/controllers` | Request logic for auth, orders, products, reviews, wishlist |
| `backend/middlewares` | JWT / role guards |
| `backend/models` | Mongoose schemas |
| `backend/routes` | Express route definitions |
| `backend/utils` | Email, receipt, formatting, profanity filter helpers |
| `frontend/src/actions` | Redux thunks (API calls) |
| `frontend/src/reducers` | Redux state slices |
| `frontend/src/constants` | Action-type constants and store info |
| `frontend/src/Components` | UI grouped by feature (Admin, Cart, Product, User, …) |
| `frontend/src/Utils` | Shared helpers (images, locations) |
| `frontend/public` | Static assets and PWA manifest/icons |

**File counts:** backend 29 · frontend 111 · root 3 (143 total, excluding `node_modules`, `.git`, and this file).

---

## 10. Progress checklist

- [ ] P0 · delete `App.css`, `index.css`, 4 unused assets
- [x] P0 · remove 4 unused imports; fix Catalog effect; move `bodyText`
- [ ] P0 · resolve root `package.json`
- [ ] P0 · add `.editorconfig`, `.prettierrc`, `.gitattributes`; run Prettier
- [ ] P1 · split `style.css` into `src/styles/*`
- [ ] P1 · create `Admin/shared/` and reuse across the 5 list pages
- [ ] P1 · split `SupportPages.jsx` into `Support/pages/*`
- [ ] P1 · split `backend/controllers/order.js` (dashboard out)
- [ ] P1 · split `ProductForm.jsx`
- [ ] P2 · split `Dashboard`, `ProductDetails`, `SearchOverlay`, `Header`
- [ ] P2 · split `SupportLayout` primitives
- [ ] P2 · extract product image service in the backend
- [ ] P3 · single source for `CATEGORIES`/`GENDERS`/`productImages`
- [ ] P3 · root workspace with `dev` / `lint` / `format` scripts
