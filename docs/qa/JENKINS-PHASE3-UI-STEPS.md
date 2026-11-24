# Phase 3–8 UI Steps (after “Jenkins is ready!”)

Click **Start using Jenkins** first.

## A) Install missing plugins

Already present from suggested plugins: Git, GitHub, Pipeline, Email Extension, Credentials Binding, Workspace Cleanup.

Still required:

1. Left menu → **Manage Jenkins**
2. **Plugins** → **Available plugins**
3. Search and install (with restart if prompted):
   - **HTML Publisher**
   - **NodeJS** (optional; system Node v24 can be used without it)
4. Wait until install finishes / Jenkins restarts if asked

## B) Configure Node / tools (optional)

If NodeJS plugin installed:

1. **Manage Jenkins** → **Tools**
2. **NodeJS installations** → Add
3. Name: `node24`
4. Or leave empty and rely on system `C:\Program Files\nodejs` (already on PATH for the Jenkins service account if system-wide)

## C) Extended Email (you enter secrets yourself)

1. **Manage Jenkins** → **System**
2. Find **Extended E-mail Notification**
3. Set SMTP server, port, credentials, default user email
4. **Default Recipients**: your email address
5. Save

Also under **Jenkins Location**:
- Jenkins URL: `http://localhost:8080/`
- System Admin e-mail address: your email

## D) Create Pipeline job (branch main)

1. Dashboard → **New Item**
2. Name: `ClassMonitor-Playwright`
3. Type: **Pipeline** → OK
4. **Build Triggers**: leave schedule **unchecked** for now
5. **Pipeline**:
   - Definition: **Pipeline script from SCM**
   - SCM: **Git**
   - Repository URL: `https://github.com/Shubham-Tiwari-QA/Playwright-CI-CD.git`
   - Credentials: add GitHub PAT/credentials if checkout requires auth
   - Branch Specifier: `*/main`
   - Script Path: `Jenkinsfile`
6. Save

## E) First manual build

1. Open job → **Build with Parameters**
2. Confirm defaults: `BATCH_ID=740`, `SESSION_ID=10822`
3. **Build**
4. Verify console, HTML report link, artifacts
5. Verify email arrives for SUCCESS or FAILURE (real status only)

## F) Enable 6 PM IST schedule only after E succeeds

1. Job → **Configure**
2. **Build Triggers** → **Build periodically**
3. Schedule:
   ```
   TZ=Asia/Kolkata
   0 18 * * *
   ```
4. Save

## G) Commit Jenkinsfile to GitHub main

The local workspace currently has a new `Jenkinsfile`. Merge/push it to `main` before the Jenkins job can load it from SCM.
