# Future Diary Core Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a mobile-friendly future diary flow that calls Pinova through a secure Vercel Function, returns a first-person future-self message and structured moments, persists progress locally, and is available on the production URL for testing.

**Architecture:** Keep model discovery, prompt construction, validation, and response parsing in a pure server module consumed by `api/future-self.ts`. Keep diary state transitions and persistence in a feature module consumed by one Expo Router screen; the client calls only the same-origin API and never receives a secret.

**Tech Stack:** Expo SDK 57, React Native 0.86, Expo Router, TypeScript, Vercel Functions, New API Chat Completions, Jest Expo, React Native Testing Library

**Spec:** `docs/superpowers/specs/2026-08-26-future-diary-core-loop-design.md`

## Global Constraints

- The persona is the user themself tomorrow and always speaks as “我”.
- `NEW_API_KEY` stays server-only and must never use an `EXPO_PUBLIC_` prefix.
- `NEW_API_MODEL` is optional; the backend discovers and selects a text-chat model when absent.
- The original diary text is canonical and remains available after AI errors.
- No social, MBTI, notifications, accounts, or cross-device sync in this plan.
- API requests accept 10–5000 diary characters and return 1–5 normalized moments.

---

### Task 1: Test harness and diary domain state

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `jest.config.js`
- Create: `src/features/future-diary/types.ts`
- Create: `src/features/future-diary/diary-state.ts`
- Test: `src/features/future-diary/__tests__/diary-state.test.ts`

**Interfaces:**
- Produces: `FutureDiary`, `DiaryMoment`, `MomentStatus`, `updateMomentStatus(diary, momentId, status)`

- [ ] **Step 1: Install the Expo-compatible test harness**

Run:

```bash
npx expo install jest-expo --dev
npm install --save-dev @testing-library/react-native @types/jest
```

Add `"test": "jest --runInBand"` to `package.json` and export the `jest-expo` preset from `jest.config.js`.

- [ ] **Step 2: Write a failing state-transition test**

```ts
expect(updateMomentStatus(diary, 'moment-1', 'fulfilled').moments[0].status).toBe('fulfilled');
expect(updateMomentStatus(diary, 'missing', 'partial')).toBe(diary);
```

Run: `npm test -- diary-state.test.ts`

Expected: FAIL because the feature module does not exist.

- [ ] **Step 3: Implement immutable moment status updates**

Define statuses `pending | partial | fulfilled | carried`; return the original diary when no moment matches, otherwise return a new diary with only the selected moment changed.

- [ ] **Step 4: Verify the domain tests**

Run: `npm test -- diary-state.test.ts`

Expected: PASS.

### Task 2: Pinova model engine and Vercel route

**Files:**
- Create: `src/server/future-self.ts`
- Create: `api/future-self.ts`
- Test: `src/server/__tests__/future-self.test.ts`

**Interfaces:**
- Consumes: `NEW_API_BASE_URL`, `NEW_API_KEY`, optional `NEW_API_MODEL`
- Produces: `createFutureSelfService(deps).generate({ diaryText, targetDate })`
- Produces: `POST /api/future-self`

- [ ] **Step 1: Write failing tests for validation and model choice**

```ts
expect(validateDiaryRequest({ diaryText: '太短', targetDate: '2026-08-27' })).toEqual({ ok: false, status: 400 });
expect(selectChatModel(['text-embedding-3-small', 'deepseek-chat', 'image-1'])).toBe('deepseek-chat');
```

Run: `npm test -- future-self.test.ts`

Expected: FAIL because the server module does not exist.

- [ ] **Step 2: Implement input validation and deterministic model filtering**

Reject missing/invalid dates and text outside 10–5000 characters. Exclude non-chat IDs and prefer `mini`, `flash`, `haiku`, then `chat`, followed by known text model families.

- [ ] **Step 3: Write failing tests for upstream request and output normalization**

Use an injected `fetch` that returns a complete OpenAI-compatible `/models` list and `/chat/completions` response. Assert the real service result contains the normalized message, one moment with `pending`, and the selected model. Add malformed JSON, 401, 429, and timeout cases.

- [ ] **Step 4: Implement the Pinova service**

Call `${baseUrl}/models` with Bearer auth when no override exists. Call `${baseUrl}/chat/completions` with a strict future-self system prompt, JSON response format, temperature `0.7`, and `max_completion_tokens: 900`. Extract fenced or plain JSON and normalize 1–5 moments.

- [ ] **Step 5: Implement the Vercel handler and MVP limiter**

Accept POST only, validate same-origin when an Origin header exists, limit each forwarded IP to eight requests per ten minutes per warm instance, map internal errors to safe Chinese messages, and never log diary text or secrets.

- [ ] **Step 6: Verify all server tests**

Run: `npm test -- future-self.test.ts`

Expected: PASS with no live Pinova requests.

### Task 3: Local persistence and mobile-first diary screen

**Files:**
- Create: `src/features/future-diary/storage.ts`
- Create: `src/features/future-diary/client.ts`
- Create: `src/features/future-diary/diary-screen.tsx`
- Create: `src/features/future-diary/__tests__/storage.test.ts`
- Create: `src/features/future-diary/__tests__/diary-screen.test.tsx`
- Modify: `src/app/index.tsx`
- Modify: `src/app/_layout.tsx`
- Modify: `src/global.css`
- Delete: `src/app/explore.tsx`

**Interfaces:**
- Consumes: `POST /api/future-self`
- Produces: `createDiaryStorage(storageLike)`, `generateFutureDiary(input, fetchImpl)`, `FutureDiaryScreen`

- [ ] **Step 1: Write failing persistence tests**

Assert save/load round-trips a complete diary and malformed stored JSON returns `null` without throwing.

- [ ] **Step 2: Implement injected storage**

Use a `StorageLike` interface for tests; pass browser `localStorage` on Web and omit it for the in-memory fallback.

- [ ] **Step 3: Write the failing screen interaction test**

Render `FutureDiaryScreen` with injected generator/storage, enter a valid diary, press “让明天的我先经历一次”, await the first-person message, press “已经发生”, and assert the fulfilled label appears.

- [ ] **Step 4: Implement the API client and screen**

Build the diary from the validated API result, keep text after failures, persist every status change, and render the input, loading/error state, future message, moments, three explicit status actions, and reset action in a single mobile-first page.

- [ ] **Step 5: Replace the Expo demo shell**

Use an Expo Router `Stack` with one index route, apply the existing safe-area provider, remove the demo explore route, and set the document title/app copy to “未来日记”.

- [ ] **Step 6: Verify screen and storage tests**

Run: `npm test -- storage.test.ts diary-screen.test.tsx`

Expected: PASS.

### Task 4: Full verification and production deployment

**Files:**
- Modify: `docs/superpowers/plans/2026-08-26-future-diary-core-loop.md`

**Interfaces:**
- Consumes: the complete feature branch and Vercel Production environment
- Produces: a live production test URL and a verified real Pinova response

- [ ] **Step 1: Run complete local verification**

```bash
npm test
npm run typecheck
npm run lint
npm run build:web
test -f dist/index.html
git diff --check
```

- [ ] **Step 2: Commit the implementation**

```bash
git add .
git commit -m "feat: add AI future diary core loop"
```

- [ ] **Step 3: Publish the feature and integrate to main**

Publish the verified commit, update `main` only after confirming the remote has not moved, and allow the GitHub integration to trigger Vercel Production.

- [ ] **Step 4: Verify the live endpoint**

POST a non-sensitive test diary to `/api/future-self` with `Origin` set to the production domain. Require HTTP 200, a non-empty first-person `futureMessage`, 1–5 moments, and no secret or diary body in Vercel logs.

- [ ] **Step 5: Report the testing URL and current MVP limitation**

Provide the production URL and state that warm-instance IP limiting is only an MVP guardrail; public launch still requires user authentication and durable rate limiting.
