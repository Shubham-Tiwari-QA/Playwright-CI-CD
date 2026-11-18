# Jenkins CI/CD – Windows System Inspection Report

Generated from live PC inspection. No software was installed or modified during this phase.

## 1. Operating System

| Item | Value |
|---|---|
| OS | Microsoft Windows 11 Pro |
| Version | 10.0.26300 |
| Architecture | 64-bit |

## 2. Disk Space

| Drive | Size | Free |
|---|---|---|
| C: | 116.17 GB | **15.22 GB** (tight for Jenkins + artifacts) |
| E: | 121.29 GB | **85.82 GB** (preferred for Jenkins home / workspace) |

**Recommendation:** Install Jenkins and store `JENKINS_HOME` / workspaces on **E:** to avoid filling C:.

## 3. Memory

| Item | Value |
|---|---|
| Total RAM | ~15.8 GB (`16581700` KB) |
| Free RAM (at inspection) | ~3.5 GB |

Adequate for Jenkins + headed/headless Chromium with `workers: 1`.

## 4. CPU

| Item | Value |
|---|---|
| CPU | Intel Core i5-8400 @ 2.80GHz |
| Cores / Logical | 6 / 6 |

## 5. Java

| Item | Value |
|---|---|
| Default `java` shim | ProductVersion **25.0.2** via Oracle javapath |
| Installed JDK found | `C:\Program Files\Java\jdk-17` (**Java 17 – Jenkins compatible**) |
| Java 21 LTS | Not separately installed |
| Recommendation | Use existing **JDK 17** for Jenkins (`JAVA_HOME`). Optional: add Temurin 21 later. Do **not** point Jenkins at Java 25 shim. |

## 6. Git

| Item | Value |
|---|---|
| Version | 2.52.0.windows.1 |
| Path | `C:\Program Files\Git\cmd\git.exe` |
| Status | **OK – already installed** |

## 7. Node.js / npm

| Item | Value |
|---|---|
| Node | v24.12.0 |
| npm | 11.6.2 |
| Path | `C:\Program Files\nodejs\` |
| Status | **OK – compatible with project** |

## 8. Playwright

| Item | Value |
|---|---|
| `@playwright/test` (project) | 1.64.1 |
| Browser cache | `%LOCALAPPDATA%\ms-playwright` |
| Chromium | chromium-1208, chromium-1248 present |
| Status | **OK – Chromium already cached** |

## 9. Jenkins

| Item | Value |
|---|---|
| Windows service | **Not found** |
| Common install dirs | **Not found** |
| Status | **Not installed** |

## 10. Browsers

| Browser | Status |
|---|---|
| Google Chrome | Found (`C:\Program Files\Google\Chrome\Application\chrome.exe`) |
| Microsoft Edge | Not found at default path |
| Playwright Chromium | Found under `ms-playwright` |

## 11. Network

| Target | Result |
|---|---|
| https://github.com | HTTP 200 |
| https://stagelearn.classmonitor.com/teacher/login | HTTP 200 |
| git ls-remote to Playwright-CI-CD | To be verified with credentials if private |

## 12. Project / GitHub State

| Item | Value |
|---|---|
| Local path | `E:\ClassMonitor-Automation` |
| Remote | `https://github.com/Shubham-Tiwari-QA/Playwright-CI-CD.git` |
| Current branch (workspace) | `cursor/teacher-portal-dynamic-ids` |
| User-requested Jenkins branch | `main` |
| `Jenkinsfile` | **Missing** (needs creation) |
| `package-lock.json` | Present |
| Dynamic IDs | `BATCH_ID`, `SESSION_ID` via `process.env` |
| Current headed config | `headless: false` in `playwright.config.js` (Jenkins should force headless via CLI/`CI=true` without rewriting tests unnecessarily) |

## Disk Usage Estimate (per nightly run)

| Artifact | Rough size |
|---|---|
| `node_modules` (once) | 200–400 MB |
| Playwright report + failure video/trace | 50–300 MB per build |
| 15 retained builds | ~1–5 GB |

E: has enough space. C: does **not** have comfortable headroom.

## Risks / Approvals Required

1. Install Jenkins LTS (admin / Windows service).
2. Install Java 21 Temurin (keep existing JDK 24/25).
3. Optionally relocate `JENKINS_HOME` to `E:\Jenkins`.
4. SMTP credentials for Email Extension (user-provided secret).
5. GitHub credentials if repo auth is required for checkout from Jenkins service account.
6. Disable sleep at 6 PM IST or keep PC awake for schedule.
7. Do **not** enable cron until first manual SUCCESS/FAILURE email validation.
