# ADR-0004: In-app updates from GitHub Releases

**Status:** Accepted
**Date:** 2026-10-26
**Deciders:** Arthur Vinicius

## Context

Updating meant downloading the `.deb` from GitHub Releases and running `sudo apt install` by hand. The app should find a new version, download it and install it from inside the app. It is a local, offline app, so this adds its first network access.

## Decision

- The main process (`src/main/updates.ts`) asks the GitHub Releases API for the latest release. A release is offered only when all of these hold:
  - its tag is a newer semver than `app.getVersion()`;
  - it has an `art-todo_<version>_amd64.deb` asset;
  - its notes contain a line `SHA-256: <hex>`.
- The download uses Electron `net.fetch` and goes to the temp folder. The file is checked against that SHA-256, and a mismatch discards it.
- Installation runs `pkexec apt-get install -y <file>` through `execFile`, never a shell, so the system's own password dialog asks for the password. The app then relaunches.
  - A cancelled password prompt leaves the update ready to retry.
  - Without `pkexec`, the file is opened in the system installer instead.
- The renderer follows a state machine (`UpdateState`), which the main process pushes through the typed `updates:state` event (ADR-0003).
- Checks run 10 s after startup and then every 24 h. They happen only in the packaged app, and only while the `updates:autoCheck` setting is on (the default). A manual check is always available from the top bar icon and the command palette.

## Options Considered

### Option A: GitHub API + pkexec (chosen)

**Pros:** No new runtime dependency. It does not need CI: a release published by hand works as long as its notes carry the checksum.
**Cons:** The release notes format is part of the contract.

### Option B: electron-updater (DebUpdater)

**Pros:** The standard Electron path.
**Cons:**
- It needs `latest-linux.yml` from the CI publish step, which cannot run today.
- It adds a runtime dependency to the `.deb`.
- Its `.deb` support is younger than its AppImage support.

### Option C: APT repository

**Pros:** Updates come through `apt upgrade` like any other package.
**Cons:** It needs a GPG key, a hosted index and CI.

## Consequences

- Every release must include `SHA-256: <hex>` in its notes. See the `release-deb` skill.
- The app now makes network requests to `api.github.com` and the release asset host, and only for updates.
- Tests use `ART_TODO_UPDATE_URL`, `ART_TODO_UPDATE_DELAY_MS` and `ART_TODO_FAKE_UPDATE_INSTALL` to work against a local feed without pkexec.
