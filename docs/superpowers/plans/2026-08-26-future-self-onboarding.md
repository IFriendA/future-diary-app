# Future Self Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Require new users to create an MBTI-based future-self profile and use it in every AI diary generation.

**Architecture:** Add a focused profile domain and local storage adapter, place a four-step onboarding shell in front of the existing diary screen, pass the validated profile through the client and Vercel route, and compose it into the server-only system prompt.

**Tech Stack:** Expo SDK 57, React Native, TypeScript, Vercel Functions, Jest Expo, React Native Testing Library

**Spec:** `docs/superpowers/specs/2026-08-26-future-self-onboarding-design.md`

## Global Constraints

- MBTI is mandatory and must be one of the 16 canonical types.
- The future persona is always the user themself and speaks as “我”.
- Profile text is descriptive data and cannot override system prompt rules.
- Profile and the current diary persist independently.
- No accounts, remote database, social features, or MBTI test in this iteration.

---

### Task 1: Profile domain and storage

**Files:**
- Create: `src/features/future-diary/profile.ts`
- Create: `src/features/future-diary/profile-storage.ts`
- Test: `src/features/future-diary/__tests__/profile.test.ts`
- Test: `src/features/future-diary/__tests__/profile-storage.test.ts`

**Interfaces:**
- Produces: `FutureSelfProfile`, `MbtiType`, `SupportStyle`, `validateProfileDraft(input)`, `createProfileStorage(storageLike)`

- [ ] Write failing tests for the 16 valid MBTI values, required trimmed text, length boundaries, and profile save/load.
- [ ] Run the focused tests and confirm they fail because the modules do not exist.
- [ ] Implement validation and the independent `future-diary:profile` storage adapter.
- [ ] Run the focused tests and confirm they pass.

### Task 2: Four-step onboarding flow

**Files:**
- Create: `src/features/future-diary/onboarding-screen.tsx`
- Create: `src/features/future-diary/future-diary-app.tsx`
- Modify: `src/features/future-diary/diary-screen.tsx`
- Modify: `src/app/index.tsx`
- Test: `src/features/future-diary/__tests__/onboarding-screen.test.tsx`
- Test: `src/features/future-diary/__tests__/future-diary-app.test.tsx`

**Interfaces:**
- Consumes: `FutureSelfProfile`, `ProfileStorage`
- Produces: `FutureSelfOnboarding`, `FutureDiaryApp`

- [ ] Write failing interaction tests for mandatory MBTI, step navigation, save, reload bypass, profile editing, and diary preservation.
- [ ] Run the focused tests and confirm the missing flow fails.
- [ ] Implement the mobile-first four-step onboarding and app-level profile routing.
- [ ] Run the focused tests and confirm they pass.

### Task 3: Profile-aware AI request

**Files:**
- Modify: `src/features/future-diary/client.ts`
- Modify: `src/features/future-diary/diary-screen.tsx`
- Modify: `api/future-self.ts`
- Modify: `src/server/future-self.ts`
- Test: `src/features/future-diary/__tests__/client.test.ts`
- Test: `src/server/__tests__/future-self.test.ts`

**Interfaces:**
- Consumes: `generate({ diaryText, targetDate, profile })`
- Produces: validated profile-aware `POST /api/future-self` and a profile-aware Chinese system prompt

- [ ] Write failing client and server tests proving the complete profile is sent, validated, and present in the model request.
- [ ] Run the focused tests and confirm the old request contract fails.
- [ ] Extend request types, validation, handler contract, and system prompt composition with the four profile fields.
- [ ] Run the focused tests and confirm they pass.

### Task 4: Verify and publish

**Files:**
- Modify only files required by failures found during verification.

- [ ] Run `npm test`, `npm run typecheck`, `npm run lint`, `npm run build:web`, and `git diff --check`.
- [ ] Commit the verified onboarding implementation.
- [ ] Publish the commit to GitHub main and wait for Vercel Production success.
- [ ] Report the production URL and the exact information now used by the AI.

