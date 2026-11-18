---
name: leak-guard
description: Scan code and git changes for leaked credentials and personal email addresses before writing files and before every commit.
---

# Leak Guard

## Goal

No credential and no personal email address ever lands in a file or a commit.
Run this check while coding (before writing config, keys, or contact details
into the repo) and before every commit, amend, or push.

## What counts as a leak

Credentials:

- API keys, access tokens, refresh tokens, session secrets, webhooks URLs
- Passwords and passphrases in code, config, comments, or docs
- Private keys (`PRIVATE KEY` blocks, `.pem`/`.key`/`.p12` files) and certificates with keys
- Cloud provider keys (AWS, GCP, Azure), database connection strings with passwords
- `.env` files, or any file whose name suggests secrets (`*secret*`, `*credential*`, `*token*`)

Personal email:

- Any email address that is not an explicitly public project contact
- The committer's own private address in code, docs, or sample config
  (the git commit author field is fine when it is the user's intended identity)

## Method

### 1. While coding, before writing

- Never write a real credential into the repo. Use placeholders such as
  `YOUR_API_KEY_HERE`, environment variables, or the project's secret manager.
- Never invent an example email with a real-looking personal domain. Use
  `user@example.com` or the project's public contact address.
- Keep secrets out of untracked scratch files too; they get committed by
  accident. Confirm `.gitignore` covers `.env`, key files, and local config.

### 2. Before every commit, scan the change

Inspect exactly what is about to be committed, including untracked files:

```sh
git status --short
git diff --cached --stat
git diff --cached -U0 | grep -nE -i \
  -e 'private[ -_]?key' \
  -e 'api[ -_]?key|apikey|api_secret|client_secret' \
  -e 'access[ -_]?token|refresh[ -_]?token|auth[ -_]?token|bearer [A-Za-z0-9._~-]+' \
  -e 'password|passwd|pwd[ =:].+|passphrase' \
  -e 'aws_(secret_)?access_key|AKIA[0-9A-Z]{16}|xox[bpas]-|gh[pousr]_[A-Za-z0-9_]+|sk-(live|test)-|AIza[0-9A-Za-z_-]{35}' \
  -e '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}' \
  -e '^\+.*\.pem$|^\+.*\.key$|^\+\+\+ b/\.env'
```

Also scan untracked files that are about to be added (`git status --short`
lines starting with `??`) with the same patterns before staging them.

### 3. Decide

- Any credential hit: stop. Remove the secret from the change (`git restore`,
  `git rm --cached`, or rewrite the file), move it to env/secret manager, and
  re-scan. If it was already pushed, say so and recommend rotation; never
  rewrite published history without an explicit request.
- Any personal-email hit: stop. Replace it with the public project contact or
  `user@example.com`, unless the user confirms that address is meant to be public.
- False positives (a placeholder, a documented public contact, `user@example.com`):
  note them briefly and continue.
- Never print a suspected real secret value in chat; cite the file and line
  only, redacted.

## Rules

- Scan the staged diff, not just the working tree; staged content is what ships.
- A clean scan is a prerequisite for the commit, not a substitute for review.
- Report every hit with file, line, and which pattern matched; fix or get
  explicit confirmation before committing.
- If a value is uncertain, treat it as a leak and ask.
