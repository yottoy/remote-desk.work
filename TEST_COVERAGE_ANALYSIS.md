# Test Coverage Analysis

## Current State

The codebase has **~63 test files** but **no formal test framework** configured. All tests are standalone Node.js scripts using manual assertions and `console.log` for output. There is no code coverage tooling, no structured test runner, and no CI pipeline that gates merges on test results.

### What Exists Today

| Area | Files | Test Type | Notes |
|------|-------|-----------|-------|
| MongoDB connectivity | 5+ files | Integration | Tests DB connection, not queries |
| Individual scrapers (Indeed, Upwork, RemoteIO, etc.) | 20+ files | Integration | Hit live sites; fragile, non-deterministic |
| Job filtering / quality scoring | 6 files | Unit-ish | Use mock data but no assertions framework |
| API endpoints | 4 files | Integration | Call live/local server |
| Python bridge | 2 files | Integration | Test IPC between Node and Python |
| Schema generation (SEO) | 2 files | Unit-ish | Verify JSON-LD output |
| Email services (SendGrid, Mailerlite) | 4 files | Integration | Call real APIs |
| Production deployment health | 1 file | E2E | Checks live ClickClickJob.com |

### What Is Missing

**The entire frontend (50+ React components, 40+ pages) has zero tests.**
**The backend middleware, services, and route handlers have zero unit tests.**
**There is no test framework (Jest, Vitest, Mocha) properly configured anywhere.**

---

## Priority Areas for Improved Test Coverage

### 1. Core Business Logic — Unit Tests (Critical)

These modules contain the core decision-making logic for the product and are the highest-value targets for unit testing.

**`src/utils/smartBalancedRemoteValidator.js`**
- The `validateRemoteJob()` method has complex scoring with multiple branches (instant rejection patterns, title checks, company checks, location analysis, remote indicator scoring). A single regex or scoring error could silently let onsite jobs through or reject good remote jobs.
- `filterRemoteJobs()` has the `keepAmbiguous` parameter that changes behavior — both paths need coverage.
- `ensureJobHasDescription()` has 4 distinct code paths depending on which fields are present.

**`src/utils/qualityFilter.js`**
- `calculateQualityScore()` combines credibility, red flags, relevance keywords, and remote status into a single 0–10 score. Each modifier needs boundary testing.
- `filterJobs()` mutates the input array by adding `qualityScore` — this side-effect should be tested.

**`src/utils/JobFilter.js`**
- Needs tests for each filter predicate and for combined filter scenarios.

**`src/utils/enhancedRemoteJobValidator.js`**
- Similar pattern-matching logic to the smart validator — needs edge case coverage.

**Recommended approach:** Use Jest or Vitest with pure function imports. No database or network needed. These are the cheapest tests to write and the highest value.

---

### 2. Authentication & Authorization Middleware (Critical)

**`src/middleware/authMiddleware.js`**
- `extractToken()` — needs tests for missing header, malformed header, correct Bearer token.
- `verifyToken()` — needs tests for valid token, expired token, tampered token.
- `requireAuth()` — needs tests for no token, invalid token, valid token with missing user, valid token with existing user.
- `requireRole()` — needs tests for missing user, wrong role, correct role, array of roles.
- `requireAdmin()` / `requireEditor()` — verify they delegate correctly.

**Security note:** The JWT secret falls back to a hardcoded string (`'your-secret-key-change-in-production'`). A test should assert that the production secret is not the default.

**Recommended approach:** Mock the database calls and JWT library. Test the middleware functions with mock `req`/`res`/`next` objects.

---

### 3. Error Handler Middleware (High)

**`src/middleware/errorHandler.js`**
- `errorHandler()` has 8 different error type branches (ValidationError, MongoError, MongoError with code 11000, JsonWebTokenError, TokenExpiredError, CastError, custom statusCode, default 500). Each branch should return the correct HTTP status and message.
- Behavior differs between development and production (`NODE_ENV`).
- `asyncHandler()` should correctly catch and forward promise rejections.

**Recommended approach:** Simple unit tests with mock req/res objects and synthetic Error instances.

---

### 4. Frontend Validation & Middleware (High)

**`frontend/lib/validation/email.ts`**
- `validateEmail()` has 5 validation paths (format, length, domain length, disposable domain, XSS). Needs positive and negative test cases for each.
- The early return on format failure means subsequent validators are unreachable for invalid formats — tests should verify this ordering.
- `sanitizeEmail()` — simple but should verify trim and lowercase behavior.

**`frontend/lib/middleware/rateLimit.ts`**
- Rate limiter state management, expiry cleanup, header setting, and the 429 response path all need testing.
- Edge case: what happens when `x-forwarded-for` is an array vs. string.

**Recommended approach:** Vitest (already a Next.js project) with simple function-level tests.

---

### 5. Frontend React Components (High)

The frontend has 50+ components and zero tests. Priority components:

| Component | Why It Needs Tests |
|-----------|-------------------|
| `JobAlertSignup.jsx` (20KB) | User-facing form with validation, API calls, error states |
| `EditorPickJobCard.jsx` (17KB) | Complex rendering logic, conditional display |
| `JobMarketInsightsDashboard.jsx` (20KB) | Data visualization, state management |
| `EmailCaptureForm.tsx` | Form validation, submission handling |
| `SearchBar.tsx` | User input handling, query building |
| `JobList.tsx` | Data fetching, loading/error states, pagination |
| SEO components (JobSchema, BreadcrumbSchema, etc.) | Structured data output must be valid JSON-LD |

**Recommended approach:** React Testing Library + Vitest. Focus on user interactions and rendered output rather than implementation details.

---

### 6. API Route Handlers (Medium)

**`api/auth/[...auth].js`**, **`api/job-alerts/[...alerts].js`**, **`api/analytics/[...analytics].js`**, **`api/content/[...content].js`**

These Vercel serverless function handlers have no tests. They should have integration tests that verify:
- Correct HTTP status codes for success and failure
- Input validation and error responses
- Authorization checks work end-to-end

**Backend routes:** `src/routes/contentRoutes.js`, `jobAlertRoutes.js`, `authRoutes.js`, `analyticsRoutes.js` also lack tests.

**Recommended approach:** Supertest with mocked database for the Express routes. Next.js API route testing utilities for the Vercel endpoints.

---

### 7. Email & Notification Services (Medium)

**`src/services/emailService.js`**, **`src/services/jobAlertService.js`**, **`frontend/services/mailerlite/`** (7 files)

These services handle user-facing email operations (digest emails, alerts, subscriber management). They need:
- Unit tests with mocked email providers (SendGrid, Mailerlite)
- Tests for email template rendering
- Tests for subscriber CRUD operations
- Tests for digest generation logic

---

### 8. Scraper Reliability (Lower Priority but Important)

The existing scraper tests hit live websites, making them inherently flaky. They should be restructured:

- **Unit tests** for HTML parsing logic using saved HTML fixtures
- **Unit tests** for data normalization (date parsing, salary extraction, deduplication)
- **Integration tests** can remain for smoke-testing live sites, but should be tagged separately and not block CI

---

## Infrastructure Recommendations

1. **Set up Jest or Vitest** as the test runner across the project. Vitest is recommended for the Next.js frontend; Jest works well for the Node.js backend.

2. **Add a `test` npm script** to the root `package.json` that runs all tests.

3. **Add code coverage reporting** (Istanbul/c8) with a minimum threshold (start at 20%, ratchet up over time).

4. **Add a CI test gate** in GitHub Actions that blocks merges when tests fail.

5. **Separate test categories** with tags or directory conventions:
   - `__tests__/unit/` — fast, no I/O, run on every commit
   - `__tests__/integration/` — need database or network, run in CI
   - `__tests__/e2e/` — full stack, run on deploy

6. **Remove duplicate/dead test files** — files like `test-local-api 2.js` and the many overlapping scraper test scripts should be consolidated.

---

## Summary Priority Matrix

| Priority | Area | Effort | Impact |
|----------|------|--------|--------|
| **P0** | Smart remote validator unit tests | Low | High — core product correctness |
| **P0** | Quality filter unit tests | Low | High — directly affects job listings shown |
| **P0** | Auth middleware unit tests | Low | High — security-critical |
| **P1** | Error handler tests | Low | Medium — prevents silent failures |
| **P1** | Email validation tests | Low | Medium — user-facing input handling |
| **P1** | Rate limiter tests | Low | Medium — prevents abuse |
| **P1** | Frontend form components | Medium | High — user-facing features |
| **P2** | API route handler tests | Medium | Medium — integration correctness |
| **P2** | Email service tests | Medium | Medium — notification reliability |
| **P2** | SEO schema component tests | Low | Medium — search visibility |
| **P3** | Scraper parsing unit tests | High | Medium — data quality |
| **P3** | Test infrastructure setup | Medium | Enables everything above |
