# Promptly: Test Cases

Base URL of the API: `http://localhost:3001`. Expected results are derived from the requirements and the server code. **Status** is `Not run` until the case is executed.

**Version under test:** `main @ 12ef1c2` | **Run date:** 2026-11-19 | **Executed:** 5 of 78 (6.4%), all Pass. The remaining cases are written but not yet run.

Priority: **H** high, **M** medium, **L** low. Status: Not run / Pass / Fail / Blocked.

## 1. Registration (`POST /api/register`)

| ID | Title | Steps | Expected result | Pri | Status |
|---|---|---|---|---|---|
| REG-01 | Register with valid data | Send `{"email":"qa.user1@gmail.com","password":"Passw0rd!23"}` | `201`; body has `user.id`, `user.email`, `user.created_at`; no `password_hash` in the response; new row in `users` with an argon2 hash | H | Pass |
| REG-02 | Email is trimmed and lowercased | Send `"  QA.User9@Gmail.com "` | `201`; stored email is `qa.user9@gmail.com` | M | Not run |
| REG-03 | Duplicate email | Register the same email twice | Second request: `409`, `{"error":"Email already registered"}` | H | Pass |
| REG-04 | Duplicate email in another letter case | Register `qa.user1@gmail.com`, then `QA.USER1@gmail.com` | `409` (unique index on `lower(email)`) | H | Pass |
| REG-05 | Password too short (7 chars) | Send a 7-character password | `400`, `{"error":"Invalid email or password (min 8 characters)"}` | H | Pass |
| REG-06 | Password boundary 8 and 128 chars | Register with an 8-character and a 128-character password (different emails) | Both `201` | M | Not run |
| REG-07 | Password too long (129 chars) | Send a 129-character password | `400` | M | Not run |
| REG-08 | Invalid email formats | Try `abc`, `a@b`, `a b@c.com`, empty string, 255-character email | Every request: `400` | H | Pass |
| REG-09 | Wrong data types | Send `email: 123`, `password: 12345678`, `email: null`, missing fields | `400`, server does not crash | M | Not run |
| REG-10 | Domain without mail records | Register `user@this-domain-does-not-exist-xyz.com` | `400`, `{"error":"Email domain looks invalid"}` | M | Not run |
| REG-11 | SQL injection in email | Send `"email":"a'; DROP TABLE users;--@gmail.com"` | `400` or `201` with the string stored as data; table `users` still exists | H | Not run |
| REG-12 | Registration does not log the user in | Register, then call `GET /api/me` with the same cookie jar | `401` (registration does not create a session) | L | Not run |

## 2. Login, session, logout

| ID | Title | Steps | Expected result | Pri | Status |
|---|---|---|---|---|---|
| LOG-01 | Login with valid credentials | `POST /api/login` with the registered user | `200`, body `{"user":{"id","email"}}`; `Set-Cookie: sid=...; HttpOnly; SameSite=Lax; Max-Age=2592000`; new row in `sessions` with `id_hash` (not the raw token) | H | Not run |
| LOG-02 | Wrong password | Valid email, wrong password | `401`, `{"error":"Invalid email or password"}`; no cookie | H | Not run |
| LOG-03 | Unknown email | Email that is not registered | `401`, **same** message as LOG-02 (no user enumeration) | H | Not run |
| LOG-04 | Email is case-insensitive | Login with `QA.USER1@GMAIL.COM` | `200` | M | Not run |
| LOG-05 | Missing fields | Send `{}`, only email, only password | `400`, `{"error":"Email and password are required"}` | M | Not run |
| LOG-06 | Password longer than 128 chars | Send a 129-character password | `400` | L | Not run |
| LOG-07 | Response time does not reveal user existence | Measure 20 requests with a wrong password for an existing and for an unknown email | Average times are comparable (server verifies against a dummy hash) | L | Not run |
| ME-01 | `GET /api/me` with a valid session | Login, then call `/api/me` | `200`, `{"user":{"id","email"}}` | H | Not run |
| ME-02 | `/api/me` without cookie | No cookie | `401`, `{"error":"Not authenticated"}` | H | Not run |
| ME-03 | `/api/me` with a forged cookie | `sid=abc123` | `401` | H | Not run |
| ME-04 | Expired session | In DB set `sessions.expires_at` to the past, call `/api/me` | `401` | M | Not run |
| OUT-01 | Logout | Login, `POST /api/logout`, then `GET /api/me` | Logout `200 {"ok":true}`; cookie cleared; session row deleted; `/api/me` returns `401` | H | Not run |
| OUT-02 | Old cookie cannot be reused after logout | Save the `sid` value, logout, send the saved cookie manually | `401` | H | Not run |
| OUT-03 | Logout without session | `POST /api/logout` with no cookie | `200 {"ok":true}`, no error | L | Not run |

## 3. Guest mode and quota (`GET /api/quota`)

| ID | Title | Steps | Expected result | Pri | Status |
|---|---|---|---|---|---|
| QUO-01 | New guest gets an identity | Call `/api/quota` without cookies | `200`, `{"type":"guest","used":0,"limit":5,"remaining":5}`; `gid` cookie set (HttpOnly, SameSite=Lax); row in `guests` | H | Not run |
| QUO-02 | Guest keeps the same identity | Call `/api/quota` twice with the same cookie jar | Same `gid`, only one new row in `guests` | M | Not run |
| QUO-03 | Quota decreases after a message | Create a chat, send one message, call `/api/quota` | `used` is `1`, `remaining` is `4` | H | Not run |
| QUO-04 | Guest limit reached | Send 5 messages, then a 6th | 6th request: `403`, `{"error":"Request limit reached","code":"LIMIT_REACHED","type":"guest"}`; no new message saved; `used` stays `5` | H | Not run |
| QUO-05 | Registered user has a bigger limit | Login, call `/api/quota` | `{"type":"user","limit":30}` | H | Not run |
| QUO-06 | User limit reached | Set `users.used = 30` in DB, send a message | `403`, `code: LIMIT_REACHED`, `type: user` | M | Not run |
| QUO-07 | Failed AI request does not consume quota | Use an invalid `XAI_API_KEY`, send a message, then check `/api/quota` | `502`; `used` is unchanged (quota refunded) | H | Not run |
| QUO-08 | Parallel requests cannot exceed the limit | With `used = 4` (limit 5) send 10 message requests in parallel | Exactly one request succeeds; the rest get `403`; `used` ends at `5` | H | Not run |
| QUO-09 | Fake `gid` cookie | Send `gid=not-a-uuid`, then a random valid UUID not in DB | Server issues a new `gid` and a fresh guest; no `500` | M | Not run |

## 4. Chats (`/api/chats`)

| ID | Title | Steps | Expected result | Pri | Status |
|---|---|---|---|---|---|
| CHT-01 | Create a chat | `POST /api/chats` | `201`, `chat.id` is a UUID, `title` is `New Chat` | H | Not run |
| CHT-02 | List shows only own chats, newest first | Create three chats, send a message to the oldest | `GET /api/chats` returns only this actor's chats, ordered by `updated_at` descending | H | Not run |
| CHT-03 | Open a chat with messages | `GET /api/chats/:id` after sending a message | `200`; `messages` are in the correct order with roles `user`, `assistant` | H | Not run |
| CHT-04 | Invalid chat id | `GET /api/chats/123` | `404`, `{"error":"Not found"}` | M | Not run |
| CHT-05 | Another user cannot read my chat | User 1 creates a chat; user 2 requests it | `404` (not `403`, so existence is not revealed) | H | Not run |
| CHT-06 | A guest cannot read a user's chat | Use a user's chat id from a guest session | `404` | H | Not run |
| CHT-07 | Delete own chat | `DELETE /api/chats/:id` | `200 {"ok":true}`; chat and its messages are removed from DB (cascade); next `GET` returns `404` | H | Not run |
| CHT-08 | Delete someone else's chat | User 2 deletes user 1's chat | `404`; chat still exists | H | Not run |
| CHT-09 | Delete an already deleted chat | Repeat DELETE | `404` | L | Not run |
| CHT-10 | SQL injection in chat id | `GET /api/chats/1' OR '1'='1` | `404`, no SQL error | M | Not run |

## 5. Messages and streaming (`POST /api/chats/:id/messages`)

| ID | Title | Steps | Expected result | Pri | Status |
|---|---|---|---|---|---|
| MSG-01 | Send a valid message | `{"content":"Hello"}` | `200`, `Content-Type: text/event-stream`; events `delta` (several), then `done` with `message`, `remaining`, `stopped:false`; user and assistant messages saved | H | Not run |
| MSG-02 | Title generated after the first exchange | Send the first message in a new chat | A `title` event arrives; chat title is no longer `New Chat` and is at most 80 characters | M | Not run |
| MSG-03 | Empty and whitespace message | `""` and `"   "` | `400`, `{"error":"Invalid message"}`; quota not consumed | H | Not run |
| MSG-04 | Message length boundary | 20 000 characters, then 20 001 characters | First accepted; second `400` | M | Not run |
| MSG-05 | Wrong content type | `{"content":123}`, `{"content":null}`, `{}` | `400` | M | Not run |
| MSG-06 | Unknown chat | Valid UUID that does not exist | `404` | M | Not run |
| MSG-07 | Message to someone else's chat | User 2 posts to user 1's chat | `404`; no message saved; quota not consumed | H | Not run |
| MSG-08 | Stop generation | Start a long answer, abort the request in the middle | Server stops reading from xAI; the partial answer is saved as an assistant message; no unhandled error in the server log | H | Not run |
| MSG-09 | AI provider error before streaming | Invalid API key | `502`, `{"error":"AI provider error"}`; user message removed; quota refunded | H | Not run |
| MSG-10 | Context is limited | Send 25 messages in one chat, inspect the request sent to xAI | At most 40 latest messages plus the system prompt are sent | L | Not run |
| MSG-11 | Unicode and Markdown preserved | Send Cyrillic text, emoji, a table in Markdown | Stored and returned unchanged | M | Not run |
| MSG-12 | Oversized request body | Send a body larger than 100 KB | Request rejected (`413`), server stays up | M | Not run |
| MSG-13 | System prompt and API key are not exposed | Inspect all responses and the built frontend (`npm run build`, search for `xai-`) | Neither the key nor the system prompt text appears in client code or responses | H | Not run |

## 6. Rate limiting

| ID | Title | Steps | Expected result | Pri | Status |
|---|---|---|---|---|---|
| RL-01 | Auth limiter | Send 11 login attempts within 15 minutes from one IP | The 11th: `429`, `{"error":"Too many attempts, try again later"}`; `RateLimit` headers present | H | Not run |
| RL-02 | Message limiter | Send 21 message requests within a minute | The 21st: `429`, `{"error":"Too many requests, try again in a minute"}` | H | Not run |
| RL-03 | Limit resets | Wait for the window to pass and repeat | Requests work again | M | Not run |

## 7. Security and error handling

| ID | Title | Steps | Expected result | Pri | Status |
|---|---|---|---|---|---|
| SEC-01 | Cookie attributes | Inspect `sid` and `gid` in DevTools | `HttpOnly` set, `SameSite=Lax`; `Secure` in production only | H | Not run |
| SEC-02 | Session token is stored hashed | Compare the `sid` cookie with `sessions.id_hash` | Values differ (SHA-256 of the token) | M | Not run |
| SEC-03 | CORS | Send a request with `Origin: http://evil.example` | No `Access-Control-Allow-Origin` for that origin | M | Not run |
| SEC-04 | XSS in a message | Send `<img src=x onerror=alert(1)>` and reload the chat | Text is shown as text; no script runs | H | Not run |
| SEC-05 | Malformed JSON | Send `{bad json` with `Content-Type: application/json` | Client error with a short JSON message, no stack trace or HTML | M | Not run |
| SEC-06 | Request without body | `POST /api/login` with no body and no content type | `400` with a JSON message, not `500` | M | Not run |
| SEC-07 | Password hash never returned | Check every auth and chat response | No `password_hash` field anywhere | H | Not run |
| SEC-08 | Health check | `GET /api/health` | `200`, `{"ok":true,...}` | L | Not run |

## 8. UI (manual)

| ID | Title | Steps | Expected result | Pri | Status |
|---|---|---|---|---|---|
| UI-01 | Sign up and sign in from the modal | Open the auth modal, register, sign in | User is signed in; sidebar shows the log-out action; invalid input shows an understandable message | H | Not run |
| UI-02 | Limit reached as a guest | Send messages until the limit | Registration modal opens and a styled limit message is shown | H | Not run |
| UI-03 | Log out | Click log out | Returns to guest state; previous user's chats are not visible | H | Not run |
| UI-04 | Chat list: search and delete | Create three chats, search by title, delete one | Search filters the list; deleted chat disappears and does not return after reload | M | Not run |
| UI-05 | Dark theme persists | Switch theme, reload | Theme is kept | L | Not run |
| UI-06 | Responsive layout | Set width to 375 px | Sidebar opens over the chat and can be closed; input is usable | M | Not run |
| UI-07 | Markdown rendering | Ask for a table, a formula and a code block | Table, KaTeX formula and highlighted code are rendered | M | Not run |
| UI-08 | Streaming display and Stop | Send a long question, press Stop | Text appears gradually; Stop ends generation and keeps the partial answer | H | Not run |
| UI-09 | Network error | Stop the backend, send a message | User sees an error; no endless loader | M | Not run |

## Execution log

| Date | Build / commit | Executed | Pass | Fail | Blocked | Notes |
|---|---|---|---|---|---|---|
| | | | | | | |

## Execution log

| ID | Result | Evidence |
|---|---|---|
| REG-01 | Pass | 201, hash_start = $argon2id$. Postman + pgAdmin. |
| REG-03 | Pass | 409, Error: "Email already registered". Postman |
| REG-04 | Pass | 409, Error: "Email already registered". Postman |
| REG-05 | Pass | 400, Error: "Invalid email or password (min 8 characters)" |
| REG-08 | Pass | 400, Error: "Invalid email or password (min 8 characters)" |
| REG-11 | Not run | 400, Error: "Invalid email or password (min 8 characters)" + pgAdmin |

REG-11 has a recorded result (400) but is left as `Not run` until the pgAdmin check that `users` still exists is confirmed.

Note: on Windows, Node may use `127.0.0.1` as its only DNS server, so the MX check fails with `ECONNREFUSED` and registration returns `Email domain looks invalid`. This was worked around with a preloaded `dns.setServers(['8.8.8.8','1.1.1.1'])` (see BUG-08).
