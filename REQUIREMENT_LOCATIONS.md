# OOTD — Requirement → Code Locator

**Rubric:** `ITCP318_DALISAY_PROJREQCHECK.docx` — *ITCP318 Integrative Programming and Technology, 1st Term 2026*
Transcribed from the rubric file in `C:\Users\user\Downloads`. The rubric remains the authority; this sheet only points at the proof.

**Everything below was verified against the code on 23 Oct 2026.** Line numbers shift if code is added above them — use the keyword column to re-find anything.

---

## Score summary (rubric is 205 max)

Some requirements list several point tiers — only the **highest** one is counted, so the lower tiers are not listed.

| Rubric section | Points |
| --- | ---: |
| MP1 — Product/Service CRUD datatables | 20 |
| MP2 — Filter functions | 20 |
| MP3 — Review ratings | 20 |
| Term test lab | 30 |
| Unit 1 | 20 |
| Unit 2 — UI design with CSS + MUI | 20 |
| Quiz 2 — Sales chart | 15 |
| Quiz 3 — Infinite scroll on products list | 15 |
| Quiz 4 — Google login via Clerk | 15 |
| Term test LEC | 30 |
| **TOTAL** | **205** |

---

## How to use this file

| I want to… | Do this |
| --- | --- |
| Find a keyword anywhere | VS Code → `Ctrl+Shift+F` → paste the keyword |
| Jump to an exact line | `Ctrl+P` → file name → `Enter` → `Ctrl+G` → line |
| Show the API contract | `backend/routes/*.js` — one endpoint per line |

All paths are relative to `C:\laragon\www\ootd`.

---

## MP1 — Product/Service CRUD datatables · **20 pts**

> **Rubric:** "Product/Service CRUD datatables. upload multiple photos. bulk delete using checkboxes"

| Rubric item | Proof location | Keyword |
| --- | --- | --- |
| **CRUD datatables** — Create | `frontend/src/Components/Admin/NewProduct.jsx:51` renders `<ProductForm>` · `backend/routes/product.js:31` `POST /admin/product/new` · `backend/controllers/product.js:144` `exports.newProduct` | `newProduct` |
| **CRUD datatables** — Read | `frontend/src/Components/Admin/ProductsList.jsx:727` `<DataGrid>` — photo, name, category, price, stock, rating, status, actions. Click a column header to sort; search field and status filter above it | `DataGrid` |
| **CRUD datatables** — Update | `frontend/src/Components/Admin/UpdateProduct.jsx:105` · `backend/routes/product.js:38` `.route('/admin/product/:id')` · `backend/controllers/product.js:186` `exports.updateProduct` | `updateProduct` |
| **CRUD datatables** — Delete (single row) | `backend/controllers/product.js:226` `exports.deleteProduct` · route `backend/routes/product.js:41` · row action in `Admin/ProductsList.jsx` | `deleteProduct` |
| **Upload multiple photos** | `frontend/src/Components/Admin/ColorImageUploader.jsx:199` — `<input type="file" multiple>` · `:16` `MAX_IMAGES_PER_COLOR = 5` (per colour, several colours per product, drag to reorder) · backend upload `backend/controllers/product.js:92` | `multiple`, `MAX_IMAGES_PER_COLOR` |
| **Bulk delete using checkboxes** | `Admin/ProductsList.jsx:732` `checkboxSelection` · `:263` dispatches `deleteProducts(selectedIds)` · `:773` `<ConfirmDialog>` · `backend/routes/product.js:35` `DELETE /admin/products` · `backend/controllers/product.js:242` `exports.deleteProducts`, `:255` `deleteMany` | `checkboxSelection`, `deleteMany` |
| Extra — hide/show product | `backend/controllers/product.js:404` `exports.setProductActive` · route `backend/routes/product.js:36` · UI toggle `Admin/ProductsList.jsx:269` | `setProductActive` |

> Deleting (single **or** bulk) also removes the Cloudinary images and cascades to reviews and wishlists — `backend/controllers/product.js:138` `cleanupProducts`.

---

## MP2 — Filter functions · **20 pts**

> **Rubric:** price filter 5pts · category filter 5pts · ratings filter 5pts · review filter 5pts

All four live in one drawer and are applied **server-side**, so they combine with each other, with search, and with sort — and survive a refresh.

| Rubric item | Pts | Proof location | Keyword |
| --- | ---: | --- | --- |
| **Price filter** | 5 | `frontend/src/Components/Product/FilterDrawer.jsx:228` dual-handle `<Slider>` + Min/Max fields (`:93`) · `backend/controllers/product.js:325-330` → `price: { $gte, $lte }` · ceiling from `:369` `exports.getMaxPrice` | `minPrice` |
| **Category filter** | 5 | `FilterDrawer.jsx:189` chips built from `CATEGORIES` · validated against `backend/utils/constants.js` · `backend/controllers/product.js:317` | `CATEGORIES` |
| **Ratings filter** | 5 | `FilterDrawer.jsx:257` "Rating" section · `backend/controllers/product.js:333` → `ratings: { $gte }` | `minRating` |
| **Review filter** | 5 | `FilterDrawer.jsx:304` `minReviews` radio (Any / Has reviews / 5+ / 10+) · `backend/controllers/product.js:338` → `numOfReviews: { $gte }` | `minReviews` |
| Entry point / endpoint | — | drawer opened from `Product/Catalog.jsx` · `backend/routes/product.js:25` `GET /products` · `backend/controllers/product.js:299` `exports.getProducts` | `getProducts` |

> Bonus worth mentioning: the product page also filters the review list itself by rating, "with comment", size and colour (`backend/routes/review.js:20`).

---

## MP3 — Review ratings · **20 pts**

> **Rubric:** users who availed of the product/service can write a review and rate it 10pts · users can update their own review/rating 5pts · admin can delete a review 5pts

| Rubric item | Pts | Proof location | Keyword |
| --- | ---: | --- | --- |
| **Only buyers can review** | 10 | `backend/controllers/review.js:65` `findPurchase()` · `:68` requires `orderStatus: 'Delivered'` · `:153-158` returns **403** otherwise · one review per user/product via `backend/models/review.js:42` unique index · UI gate `Review/ListReviews.jsx:70` `canReview`, `:132` "…once your order has been delivered" | `findPurchase` |
| **Update own review/rating** | 5 | `backend/controllers/review.js:180` `exports.updateReview` · `:186` scoped to `user: req.user._id` · UI `Review/MyReviews.jsx:204` "Edit review" · route `backend/routes/review.js:25` | `updateReview` |
| **Admin can delete a review** | 5 | `backend/controllers/review.js:206` `exports.deleteReview` · `:210` admins skip the author filter · UI `Admin/ReviewsList.jsx:214` confirm handler | `deleteReview` |

> Demo note: "availed" is implemented strictly — only a **Delivered** order counts. Seed one before the demo or the review button won't appear.

---

## Term test lab · **30 pts**

> **Rubric:** completed transaction 10pts · admin updates the status of the transaction 5pts · email the customer of the updated transaction details, containing the list of products/services, their subtotal and grand total 5pts · attach a pdf receipt on the email 10pts

| Rubric item | Pts | Proof location | Keyword |
| --- | ---: | --- | --- |
| **Completed transaction** | 10 | `frontend/src/actions/orderActions.js:27` `createOrder` · `Components/Cart/Payment.jsx:14` COD / Card, `:74` dispatches it · `backend/routes/order.js:22` · `backend/controllers/order.js:132` `exports.newOrder` · `:54` `reserveStock`, `:63` `restoreStock` · `:226` totals rebuilt from the DB | `newOrder` |
| **Admin updates status** | 5 | `backend/controllers/order.js:17` `NEXT_STATUSES` · `:290` `exports.updateOrder` · `:315` `deliveredAt` set only on Delivered · `:326` stock restored on cancel · UI `Admin/ProcessOrder.jsx:160` + `:414` show only legal next statuses · `frontend/src/constants/orderConstants.js:32` | `NEXT_STATUSES` |
| **Email: items + subtotal + grand total** | 5 | `backend/utils/email.js:140` `sendOrderStatusEmail` · `:106` Items row · `:108` **Grand total** row · `:154` `sendMail` · fired on creation `order.js:242` **and** on every status change `order.js:330` | `sendOrderStatusEmail` |
| **PDF receipt attached** | 10 | `backend/utils/receipt.js:3` `PDFDocument` (PDFKit) · `:21` `buildReceiptPdf` · `:24` A4 page · attached `backend/utils/email.js:160` · also downloadable: `backend/controllers/order.js:336`, route `backend/routes/order.js:25`, UI `Components/Order/OrderDetails.jsx:60` | `buildReceiptPdf` |

---

## Unit 1 · **20 pts**

> **Rubric:** filter/mask bad words from reviews, bad-words package 10pts · form validation on product and user forms (product crud, user login, update profile) YUP formik React Hook Form 10pts

| Rubric item | Pts | Proof location | Keyword |
| --- | ---: | --- | --- |
| **Bad words — `bad-words` package** | 10 | `backend/utils/profanity.js:3` `require('bad-words')` · `:8` `addWords(...)` adds Filipino terms (`putangina`, `gago`, `ulol`…) · `:20` `maskBadWords` · applied to public responses `backend/controllers/review.js:34` · admin keeps the original `:38` plus `flagged` `:44` | `maskBadWords` |
| **Form validation — Yup + Formik** | 10 | Required: `Admin/ProductForm.jsx:74` · `User/Login.jsx:18` · `User/UpdateProfile.jsx:20`. Extras: `User/Register.jsx:18`, `Cart/Shipping.jsx:12`, `Cart/Payment.jsx:27`, `Review/ReviewForm.jsx:10`, `User/ForgotPassword.jsx:19`, `User/UpdatePassword.jsx:12` | `Yup.object` |

> Unit 1 names `bad-words` and YUP/Formik explicitly — both are used exactly as written, so this is a word-for-word match.

---

## Unit 2 — UI design with CSS + MUI · **20 pts**

> **Rubric:** "user interface design css and Material UI (MUI) or similar library components 20pts"

| What to show | Proof location | Keyword |
| --- | --- | --- |
| Custom CSS: layout, product grid, hover, hero, animations, responsive breakpoints | `frontend/src/style.css` — 3,749 lines; design tokens in `:root` | `style.css` |
| MUI library components | `frontend/package.json:17` `@mui/material`, `:18` `@mui/x-data-grid` · `src/main.jsx:27` `<ThemeProvider>`, `:28` `<CssBaseline>` · `src/theme.jsx:3` `createTheme` · `sx=` used **604×** across 61 components | `@mui/material` |
| Both together on one screen | `Admin/ProductsList.jsx` — MUI `DataGrid`, `Button`, `Chip`, `TextField` styled with `sx` alongside `style.css` classes | `DataGrid` |

---

## Quiz 2 — Sales chart with date range · **15 pts**

> **Rubric:** sales charts with date range filter. line or bar chart.

| Proof location | Keyword |
| --- | --- |
| `frontend/src/Components/Admin/Dashboard.jsx:724` `<ComposedChart>` — bars for sales **and** a line for orders, so it satisfies "line or bar" | `ComposedChart` |
| `:686` `<ToggleButtonGroup>` switches line/bar live | `chartType` |
| `:80` `PRESETS` — 1D / 7D / 30D / 90D / YTD | `PRESETS` |
| `:663` and `:675` custom `type="date"` From / To fields | `type="date"` |
| Backend aggregation: `backend/controllers/order.js:415` `dashboardStats` · `:368` `buildBuckets` · `:357` `Asia/Manila` · route `backend/routes/order.js:29` | `dashboardStats` |

---

## Quiz 3 — Infinite scroll on products list · **15 pts**

> **Rubric:** "infinite scroll on products list on homepage 15pts"

| What to show | Proof location | Keyword |
| --- | --- | --- |
| Infinite scroll | `frontend/src/Components/Product/Catalog.jsx:107` `new IntersectionObserver` · `:111` `rootMargin: '300px'` · `:109` dispatches `loadMoreProducts` · `:334` sentinel `<div ref={sentinel} />` · `:330` end-of-list message | `IntersectionObserver` |
| Thunk that loads the next page | `frontend/src/actions/productActions.js:136` `loadMoreProducts` | `loadMoreProducts` |
| Server pagination underneath | `backend/controllers/product.js:355` `.skip((page - 1) * limit)`, `:356` `.limit(limit)`, `:363` `hasMore` · route `backend/routes/product.js:25` | `hasMore` |

---

## Quiz 4 — Google login via Clerk · **15 pts**

> **Rubric:** "facebook or gmail login using firebase/supabase/clerk 15pts"

| What to show | Proof location | Keyword |
| --- | --- | --- |
| Google sign-in | `frontend/src/Components/User/Login.jsx:73` `strategy: 'oauth_google'` · `User/Register.jsx:119` `signUp.sso` · `User/SocialButtons.jsx:13` the Google button · `User/SSOCallback.jsx` handles `/sso-callback` | `oauth_google` |
| Clerk wiring | `src/main.jsx:20` `<ClerkProvider>` · `backend/package.json:15` `@clerk/express` · `backend/app.js:24` `clerkMiddleware()` | `ClerkProvider` |
| Session → app user | `backend/middlewares/auth.js:3` `getAuth(req)` · `:29` maps `clerkId` → MongoDB user · `:36` blocks deactivated accounts · `:48` `authorizeRoles` | `clerkId` |

> Rubric says Google **or** Facebook — one is enough. Facebook was dropped because a custom Meta app requires a paid/live domain; Google works.

---

## Term test LEC · **30 pts**

> **Rubric:** functional requirements completeness 10pts · program execution (errors) 10pts · project contribution 10pts

| Rubric item | Pts | Proof location | Keyword |
| --- | ---: | --- | --- |
| **Functional completeness** | 10 | Everything in MP1–MP3, TTL, U1, U2, Q2–Q4 above, plus extras: wishlist `backend/controllers/wishlist.js:10` → `backend/routes/wishlist.js:12`; search overlay `Components/Layout/SearchOverlay.jsx:490`; stock check before checkout `backend/controllers/order.js:83`; cancellation restores stock `:326`; downloadable receipts `:336` | `getWishlist`, `SearchOverlay` |
| **Program execution (errors)** | 10 | `cd frontend` → `npm run lint` = **0 problems** · `npm run build` = **✓ built in 1.22 s**. Both re-run 23 Oct 2026 | `npm run lint` |
| **Project contribution** | 10 | `git log --oneline` → 76 commits · `git shortlog -sne` → 2 authors | `git shortlog` |

---

## Fast answers to likely questions

| Question | Answer | Show this |
| --- | --- | --- |
| "Can anyone leave a review?" | Only after a **Delivered** order for that product; one review per user/product | `controllers/review.js:65`, `models/review.js:42` |
| "Where's the pagination?" | The homepage list uses infinite scroll; paging is handled server-side with `page`/`limit`/`hasMore` | `product.js:355`, `Catalog.jsx:107` |
| "Is the card payment real?" | No gateway is charged — the form is validated, but **COD is the real flow** | `Cart/Payment.jsx:14` |
| "Can a customer fake the total in DevTools?" | No — prices and totals are rebuilt from MongoDB | `controllers/order.js:226` |
| "What happens when an order is cancelled?" | Stock is restored, status becomes final, cancellation email is sent | `controllers/order.js:326` |
| "Do deleted products leave orphan reviews?" | No — cascade cleanup of reviews and wishlists | `controllers/product.js:138` |
| "Is the email only sent once?" | No — on creation **and** on every status change | `order.js:242`, `order.js:330` |

---

## Before the demo

- [ ] Seed one order in **Delivered** so "Write review" appears.
- [ ] Send a real test order email and open the PDF attachment (SMTP in `backend/config/.env`).
- [ ] Sign in with Google once in the browser you'll demo with.
- [ ] Have a product with **3+ photos** ready for the multi-file picker.
- [ ] Apply all four filters in one pass: price + category + rating + reviews.
