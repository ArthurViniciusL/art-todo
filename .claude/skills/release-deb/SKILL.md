---
name: release-deb
description: Cut an Art Todo release and publish the Linux .deb to GitHub Releases. Use when the user asks to release, ship, tag or publish a version, or to build and verify the .deb locally.
---

# Release a .deb

Packaging: `electron-builder.yml` (Linux `deb` target). Publishing: `.github/workflows/release.yml` runs on any `v*` tag and attaches the `.deb` to a GitHub Release.

## Steps

1. **Start from green main.** All phase PRs merged, and `git status` clean.
2. **Run all checks:**
   ```bash
   pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e
   ```
3. **Build and verify the package locally:**
   ```bash
   pnpm build:linux
   ```
   - The output is `dist/art-todo_<version>_amd64.deb`.
   - Inspect it: `dpkg-deb --info dist/art-todo_*.deb` and `dpkg-deb --contents dist/art-todo_*.deb | grep -E "migrations|better_sqlite3"`. Both migrations and the native module must be present.
   - Smoke-test the unpacked app with a throwaway profile, and confirm it creates `art-todo.db`:
     ```bash
     ART_TODO_USER_DATA=$(mktemp -d) dist/linux-unpacked/art-todo
     ```
   - Ask the user to install it themselves (`sudo apt install ./dist/art-todo_<version>_amd64.deb`). Do not run `sudo`.
4. **Bump the version** (semver; `0.x` until v1.0.0):
   ```bash
   pnpm version <patch|minor|major> --no-git-tag-version
   ```
   Commit `chore: release v<version>` on a branch and open a PR, or commit on main only if the user says so.
5. **Tag and push only after the user confirms.** Publishing a release is public.
   ```bash
   git tag v<version> && git push origin v<version>
   ```
6. **Check the workflow:** `gh run list --workflow release.yml --limit 1`. Then `gh release view v<version>` and confirm the `.deb` is attached.

## Gotchas

- GitHub Actions do not run while the account has a billing lock. Then the release must be built locally and uploaded by hand with `gh release create v<version> dist/art-todo_<version>_amd64.deb`, after the user confirms.
- The app icon is rendered from `build/icon-source.png` (square PNG, at least 512 px) with `pnpm icon:render`. To change it, replace that file and run the script.
- Keep renderer-only packages in `devDependencies`; anything in `dependencies` ships inside the `.deb`.
