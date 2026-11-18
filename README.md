<div align="center">

# Promptly

**A ChatGPT-style web app for an AI assistant focused on personal finance. React + Express + PostgreSQL, plain JavaScript.**

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=nodedotjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Status](https://img.shields.io/badge/status-in%20development-orange)

[Screenshots](#screenshots) · [Features](#features) · [QA](#quality-assurance) · [Roadmap](#roadmap)

![Promptly, light theme](docs/screenshots/01-welcome-light.png)

</div>

---

## About

Promptly is a pet project: a chat UI for an AI assistant ("Ask Promptly AI anything about your finances"). It started as hand-written HTML/CSS, was migrated to React with a deliberate constraint (**no state-management libraries and no UI kits**, only native hooks) and then grew into a full-stack app: an Express API that hides the LLM key, PostgreSQL storage, custom authentication and streaming answers.

## Screenshots

**Light and dark theme**

| Light | Dark |
| --- | --- |
| ![Welcome, light](docs/screenshots/01-welcome-light.png) | ![Welcome, dark](docs/screenshots/02-welcome-dark.png) |

**Answers: table, LaTeX formula, code, chart**

| Table and formula | Code with highlighting |
| --- | --- |
| ![Table and formula](docs/screenshots/11-desktop-table-formula-sidebar.jpg) | ![Code block](docs/screenshots/12-desktop-code-block.jpg) |

![Chart in dark theme, with chat search in the sidebar](docs/screenshots/15-desktop-dark-search.jpg)

**Streaming with a Stop button**

![Loading state with the Stop button](docs/screenshots/09-desktop-loading-stop.jpg)

**Sign up**

![Auth modal](docs/screenshots/03-auth-modal-dark.png)

**Mobile**

| Welcome (dark) | Sidebar (dark) | Welcome (light) | Chart, streaming |
| --- | --- | --- | --- |
| <img src="docs/screenshots/04-mobile-welcome-dark.jpg" width="180"> | <img src="docs/screenshots/05-mobile-sidebar-dark.jpg" width="180"> | <img src="docs/screenshots/06-mobile-welcome-light.jpg" width="180"> | <img src="docs/screenshots/08-mobile-chart-title.jpg" width="180"> |

## Features

**Chat**
- Real AI answers from Grok (xAI), streamed token by token over Server-Sent Events
- "Stop generating" button; the partial answer is kept
- Auto-generated chat titles
- Multiple chats stored in PostgreSQL: create, open, search, delete
- Welcome screen with suggested prompts, auto-growing input

**Rich answers**
- Markdown with GFM tables, code blocks with syntax highlighting
- LaTeX formulas (KaTeX)
- Charts rendered from a `chart` JSON block (Recharts)

**Accounts and limits**
- Own authentication: argon2 password hashes, server-side sessions, `httpOnly` cookie, no user enumeration on login
- Guest mode with a small request quota; registered users get a larger one
- Rate limiting on auth and message endpoints, input validation, API key never reaches the browser

**UI**
- Dark theme (remembered between visits)
- Responsive layout with a slide-out sidebar

## Tech stack

| Area | Choice |
| --- | --- |
| Frontend | React, Vite, plain JavaScript, plain CSS |
| State | `useState`, `useEffect`, `useRef`, `useCallback`, custom hooks (`useChats`, `useAuth`) |
| Rendering | react-markdown, remark-gfm, remark-math, rehype-katex, react-syntax-highlighter, Recharts |
| Backend | Node.js, Express, `express-rate-limit`, `cookie-parser` |
| Database | PostgreSQL (`pg`), SQL migrations |
| Auth | argon2, sessions in DB (token hash only), `gid` cookie for guests |
| AI | Grok API (xAI), streaming |

## Architecture notes

- **Server owns the data.** The client sends only the new message; the server stores it, reads the last 40 messages, calls the model and streams the reply back.
- **Atomic quota.** `UPDATE ... WHERE used < limit` prevents going over the limit with parallel requests; the request is refunded if the AI call fails.
- **Streaming events:** `delta` (text chunk), `done`, `title`, `error`. Closing the connection aborts the call to xAI.
- **Ownership checks** on every chat route; foreign or malformed ids return `404`.
- **Data model:** `users`, `sessions`, `guests`, `chats` (exactly one owner: user or guest), `messages`.

## Getting started

Requirements: Node.js, PostgreSQL, an xAI API key.

```bash
git clone https://github.com/aleehan/promptly.git
cd promptly
npm install
```

Create a `.env` file for the server (it is git-ignored). Variable names below are placeholders: use the ones from `server/db.js` and `server/index.js`.

```env
XAI_API_KEY=your_key
DATABASE_URL=postgres://user:password@localhost:5432/promptly
```

```bash
npm run migrate    # create tables
npm run dev:all    # frontend (5173) + API (3001)
```

Open `http://localhost:5173`.

## Quality assurance

Test documentation lives in [`docs/qa`](docs/qa):

| Document | Content |
| --- | --- |
| [TEST_PLAN.md](docs/qa/TEST_PLAN.md) | Scope, approach (Postman, pgAdmin, DevTools), environment, entry/exit criteria, risks |
| [TEST_CASES.md](docs/qa/TEST_CASES.md) | 78 cases: registration, login/session, quota, chats, streaming, rate limiting, security, UI |
| [BUG_REPORTS.md](docs/qa/BUG_REPORTS.md) | 8 defects found by code review, waiting to be reproduced |

Current state: 5 of 78 cases executed (registration), all passed. The rest are written but not yet run, and the bug reports are still unverified.

## Known limitations

- No email confirmation and no password reset
- Guest limit can be bypassed by clearing cookies
- Guest chats are not moved to the account after sign-up
- Empty chats can be created
- Not deployed yet

## Roadmap

- [x] Migrate HTML/CSS to React components, custom hooks
- [x] Real AI answers (Grok), Markdown, code highlighting, formulas, charts
- [x] Express backend, API key stays on the server
- [x] Own authentication, guest quota, rate limiting
- [x] Chats in PostgreSQL
- [x] Streaming (SSE) with a Stop button
- [x] Dark theme
- [x] QA documentation (test plan, test cases, bug reports)
- [ ] Run the remaining test cases, confirm or close the bug reports
- [ ] Automated tests (Supertest / Vitest)
- [ ] Deployment and CI
- [ ] Finance features: CSV upload, RAG over transactions

## Author

**Murat Alikhan** · [GitHub](https://github.com/aleehan) · [LinkedIn](https://www.linkedin.com/in/alikhan-murat-baurzhanuly/)

## License

Released under the [MIT License](LICENSE).
