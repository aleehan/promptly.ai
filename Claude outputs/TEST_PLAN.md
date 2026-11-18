# Promptly: Test Plan

| | |
|---|---|
| **Product** | Promptly, AI chat web application (React + Vite frontend, Node.js/Express backend, PostgreSQL) |
| **Version under test** | `main @ 12ef1c2`, local development build |
| **Author** | Alikhan Murat |
| **Date** | 2026-11-19 |
| **Related documents** | [TEST_CASES.md](TEST_CASES.md), [BUG_REPORTS.md](BUG_REPORTS.md) |

## 1. Purpose

Describe what is tested in Promptly, how, and when the testing is considered done. The plan focuses on the backend API (authentication, guest quota, chats, streaming messages) because that is where the business logic and security-sensitive behavior live. The UI is covered by a smaller set of manual checks.

## 2. Scope

### In scope

| Area | What is verified |
|---|---|
| Registration and login | Input validation, duplicate emails, error messages, session cookie flags, session expiry, logout |
| Guest mode and quota | Guest identification by `gid` cookie, limit of 5 requests for guests and 30 for users, atomic counting, refund on failure |
| Chats | Create, list, open, delete; isolation between users and guests |
| Messages | Validation, streaming (Server-Sent Events), stop generation, AI provider failure, rollback |
| Rate limiting | Auth limiter (10 per 15 min) and message limiter (20 per min) |
| Basic security | SQL injection strings, XSS in messages, CORS, cookie flags, secrets not exposed to the client, error responses |
| UI (manual) | Auth modal, limit-reached flow, dark theme, responsive sidebar, chat search and deletion, Markdown rendering |

### Out of scope (for now)

- Load and performance testing.
- Cross-browser testing beyond latest Chrome.
- Quality and correctness of the answers produced by the Grok model.
- Email verification and password reset (features are not implemented yet).
- Deployment environment (not deployed yet).

## 3. Test approach

| Type | How | Tools |
|---|---|---|
| Functional API testing | Send requests to the running server and compare status codes, bodies and headers with the expected results in the test cases | Postman |
| Database state checks | Verify side effects (rows in `users`, `sessions`, `guests`, `chats`, `messages`, counter `used`) | pgAdmin |
| Exploratory testing | Time-boxed sessions around auth, quota and streaming, looking for unexpected behavior | Browser DevTools (Network, Application tabs) |
| Boundary and negative testing | Lengths (password 7/8/128/129, message 20000/20001), wrong types, missing fields | Postman |
| Security checks (basic) | Injection strings, XSS payload, CORS, cookie attributes | Browser DevTools |
| UI manual testing | Scenarios from the test cases on desktop and 375 px mobile width | Chrome |
| Regression | Re-run all High-priority cases after every fix | Same as above |

The AI provider (xAI) is replaced with a stub or invalid key when a case needs a controlled failure, so tests do not spend money and do not depend on an external service.

## 4. Test environment

| Item | Value |
|---|---|
| OS | Windows 11 |
| Browser | Google Chrome (latest) |
| Frontend | Vite dev server, `http://localhost:5173` |
| Backend | Node.js (Express 5), `http://localhost:3001` |
| Database | PostgreSQL (local), schema from migrations 001-004, clean database before each full run |
| Start command | `npm run migrate` then `npm run dev:all` |

## 5. Test data

- Valid user: `qa.user1@gmail.com` / `Passw0rd!23`; second user for isolation checks: `qa.user2@gmail.com`.
- Boundary passwords: 7, 8, 128 and 129 characters.
- Boundary messages: 1 character, 20 000 characters, 20 001 characters, whitespace only.
- Injection strings: `' OR '1'='1`, `'; DROP TABLE users;--`, `<img src=x onerror=alert(1)>`.
- Registered emails must use a real domain with MX records, because the server checks it.

## 6. Entry and exit criteria

**Entry:** the application starts with `npm run dev:all`, migrations are applied, `/api/health` returns `200`.

**Exit:**
- 100% of High-priority test cases executed; at least 90% of all cases executed.
- No open defects of severity Critical or High.
- Every Medium and Low defect is either fixed or documented in "Known limitations" in the README.

## 7. Severity and priority

| Severity | Meaning | Example |
|---|---|---|
| Critical | Data loss, security breach, system unusable | Another user can read someone else's chat |
| High | Main flow broken, no workaround | Registered user cannot send messages |
| Medium | Feature works incorrectly, workaround exists | Wrong status code, confusing error |
| Low | Cosmetic or minor inconvenience | Typo, stack trace in dev error page |

Test case priority: **High** (core flow and security), **Medium** (validation and edge cases), **Low** (UI polish).

## 8. Risks

| Risk | Mitigation |
|---|---|
| Streaming responses depend on an external API and are hard to reproduce | Use a stub server or an invalid key for failure scenarios |
| Quota race conditions are hard to catch manually | Send parallel requests with a script and compare the final `used` value in the database |
| Rate limiter state is kept in memory and leaks between tests | Restart the server between rate-limit cases |
| No automated tests yet | Plan: automate High-priority API cases with Supertest/Playwright and run them in CI |

## 9. Deliverables

1. This test plan.
2. Test cases with execution status ([TEST_CASES.md](TEST_CASES.md)).
3. Bug reports ([BUG_REPORTS.md](BUG_REPORTS.md)).
4. A short summary after each test run: executed, passed, failed, blocked, open defects.
