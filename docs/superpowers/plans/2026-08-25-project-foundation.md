# Future Diary Project Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a universal Expo foundation that builds as a mobile-friendly static website on Vercel and remains ready for later iOS and Android builds.

**Architecture:** Use Expo Router as the shared navigation and application shell for Web, iOS, and Android. Export the Web target to `dist/` for Vercel; keep all future AI calls behind server APIs so no provider secret enters the client bundle.

**Tech Stack:** Expo SDK 57, React Native, Expo Router, TypeScript, npm, Vercel static hosting

**Spec:** `docs/product-spec.md`

## Global Constraints

- The future persona is the user themself and always speaks in first person.
- The original diary text remains canonical; future parsing is derived metadata.
- The first deployment contains no AI provider secret or backend implementation.
- The project must support Web now and native iOS/Android later from one codebase.

---

### Task 1: Universal application scaffold and deploy contract

**Files:**
- Generate: `app/`, `assets/`, `package.json`, `app.json`, `tsconfig.json`
- Create: `vercel.json`
- Modify: `package.json`

**Interfaces:**
- Consumes: Expo CLI static Web export command
- Produces: `npm run build:web`, which writes a deployable site to `dist/`

- [x] **Step 1: Generate the official TypeScript Expo Router scaffold**

Run:

```bash
npx create-expo-app@4.0.0 . --template default --yes
```

Expected: Expo Router application files and dependency lockfile are created without changing the Git remote.

- [x] **Step 2: Add an explicit Web build command**

Add this script to `package.json`:

```json
"build:web": "expo export --platform web"
```

- [x] **Step 3: Define the Vercel output contract**

Create `vercel.json`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "npm run build:web",
  "outputDirectory": "dist",
  "framework": null
}
```

- [x] **Step 4: Verify type safety and production export**

Run:

```bash
npx tsc --noEmit
npm run build:web
test -f dist/index.html
```

Expected: all commands exit with status 0 and `dist/index.html` exists.

- [x] **Step 5: Commit the deployable foundation**

```bash
git add .
git commit -m "chore: initialize future diary app"
```

### Task 2: Publish and verify repository deployment trigger

**Files:**
- No source file changes expected

**Interfaces:**
- Consumes: local `main` commit and configured `origin`
- Produces: GitHub `main`, which triggers the existing Vercel project deployment

- [x] **Step 1: Confirm repository identity and clean status**

Run:

```bash
git remote -v
git status --short
git branch --show-current
```

Expected: origin is `IFriendA/future-diary-app`, status is clean, and branch is `main`.

- [ ] **Step 2: Push the initial commit**

Run:

```bash
git push -u origin main
```

Expected: GitHub accepts the new `main` branch and Vercel receives a repository event.

- [ ] **Step 3: Verify the remote commit and deployment state**

Run:

```bash
gh repo view IFriendA/future-diary-app --json defaultBranchRef,isEmpty,url
```

Expected: `isEmpty` is `false` and the default branch is `main`; then verify Vercel reports Ready for the commit.
