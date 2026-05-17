---
description: Create a ready-to-run worktree for this ar-002-clubs repo when the user gives a TU task, Notion spec link, or GitHub PR link. Use it whenever new implementation should happen in a fresh sibling worktree instead of the current checkout. Read the task source first, confirm the TU number and scope, choose the correct branch, create the worktree under ../clubs-worktrees, copy required ignored files from the main repo, and run the bootstrap commands in order.
---

# Create Worktree

Create an isolated, runnable worktree for this repo before starting a new task.

## When to use

Use this skill when:

- the user asks to start work on a new TU task
- the user gives a Notion task/spec page and wants implementation to happen in a fresh worktree
- the user gives only a new task summary and the task page must be created before the worktree
- the user gives a GitHub PR link and wants that existing branch pulled into a separate worktree
- the user wants a clean workspace with the repo bootstrapped before coding

Do not use this skill if the user explicitly wants work to happen in the current worktree.

## Task source first

Always inspect the task source before creating the worktree.

### If the user gives a Notion page

1. Use the available Notion integration or fetched page content if present.
2. Extract:
   - TU number
   - requested work
   - acceptance criteria
   - whether this is a fresh task or follow-up on an existing PR
3. If Notion tools are unavailable, stop guessing and ask the user for the TU number and the key task summary before proceeding.

### If the user gives a PR link

1. Use `gh pr view` to inspect:
   - PR number
   - title
   - body
   - `headRefName`
   - `baseRefName`
2. Treat the PR branch as the source of truth.
3. Reuse the PR head branch instead of inventing a new TU branch.

### If the user gives only a TU number or task summary

1. Confirm the TU number from the task source when possible.
2. If the task has no TU number yet, create a new task page in the Notion task DB first:
   - `https://www.notion.so/sparcs/19cc25603b0b8050bc8ff9d4807e5f3a?v=19cc25603b0b8001a7e4000cfc41151a&source=copy_link`
3. Store the task title, summary, scope, and acceptance criteria there, then obtain the generated task number.
4. Use the TU number to build the branch name.

## Branch naming rules

- Existing PR: reuse the PR head branch exactly.
- Fresh task with a TU number: use `TU-<number>`.
- If the task source does not contain a TU number and no PR branch exists, create a Notion task page first when tools are available. Ask the user for the TU number only when the task page cannot be created.

## Worktree location rules

- Worktrees for this repo always live under the sibling folder `../clubs-worktrees`.
- If `../clubs-worktrees` does not exist, create it.
- The worktree directory name should match the branch name after sanitizing `/` to `-`.

Examples:

- `TU-405` -> `../clubs-worktrees/TU-405`
- `chore/upgrade-next-15-5-16-security` -> `../clubs-worktrees/chore-upgrade-next-15-5-16-security`

## Bootstrap requirements for this repo

After the worktree is created, copy required ignored files from the main repo root when they exist:

- `.env`
- `.clubs-secrets`
- `.claude`

Then run the bootstrap commands in this order inside the new worktree:

1. Ensure Node 22.22.1:
   - `source ~/.nvm/nvm.sh`
   - `nvm use 22.22.1 || nvm install 22.22.1`
2. `pnpm install`
3. `pnpm rebuild @prisma/client prisma`
4. `pnpm --filter api prisma:generate`

Important repo-specific notes:

- `turbo` already takes care of `@clubs/interface#build` and `@clubs/domain#build` for `dev`
- `turbo` does not guarantee Prisma client generation for `api`
- `packages/api` reads `../../.env`, so the worktree root needs `.env`

### Optional runtime prep

Only do these when the task needs the app or DB to run:

1. `pnpm db-up`
2. `pnpm --filter api prisma:push`

## Preferred execution path

Use the helper command:

`pnpm create-worktree -- --branch <branch> [--start-point <ref>] [--reuse-remote-branch]`

### Use these modes

- Existing PR branch:
  - `--branch <headRefName> --reuse-remote-branch`
- Fresh TU task:
  - `--branch TU-405 --start-point origin/dev`

Use `--dry-run` first when:

- the branch name came from a long PR head ref
- the repo state looks unusual
- you want to show the exact operations before doing them

## Validation after setup

After the script finishes:

1. Confirm the worktree path exists.
2. Run `git status --short --branch` inside the new worktree.
3. Confirm `.env` exists if it was present in the main repo.
4. If the user asked for a runnable workspace, run either:
   - `pnpm --filter api build`
   - `pnpm --filter web build`
   - or `pnpm dev`
   depending on task scope.

## Response expectations

When you finish:

- tell the user which task source you read
- state the TU number
- state the branch name
- state the worktree path
- state which ignored files were copied
- state which bootstrap commands ran
- mention any skipped optional steps such as DB startup
