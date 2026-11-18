# ClassMonitor-Playwright Jenkins Job Setup

## Missing plugins (install now)

Dashboard → **Manage Jenkins** → **Plugins** → **Available plugins**

Install:
1. **HTML Publisher** (required for report link)
2. **NodeJS** (optional — system Node v24 already works if on PATH)

Then **Download now and install after restart** if prompted → restart Jenkins.

## Create / verify job: ClassMonitor-Playwright

1. Dashboard → **New Item** (or open existing job)
2. Name: `ClassMonitor-Playwright`
3. Type: **Pipeline** → OK
4. **Pipeline** section:
   - Definition: **Pipeline script from SCM**
   - SCM: **Git**
   - Repository URL: `https://github.com/Shubham-Tiwari-QA/Playwright-CI-CD.git`
   - Credentials: add GitHub PAT only if anonymous checkout fails
   - Branch Specifier: `*/main`
   - Script Path: `Jenkinsfile`
5. Leave **Build periodically** unchecked until first manual success
6. Save

## Email (optional but recommended)

**Manage Jenkins** → **System** → **Extended E-mail Notification**
- SMTP server / port / credentials (enter yourself; do not share in chat)
- Default Recipients: your email
- Jenkins Location → Jenkins URL: `http://localhost:8080/`

## First build

1. Open `ClassMonitor-Playwright`
2. Click **Build with Parameters**
3. Keep defaults: `BATCH_ID=740`, `SESSION_ID=10822`
4. Click **Build**
