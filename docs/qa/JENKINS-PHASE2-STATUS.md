# Jenkins Phase 2 Status

## Result: SUCCESS (core runtime)

| Component | Location / Status |
|---|---|
| Disk check (E:) | ~85 GB free before install; ~84.9 GB after |
| Temurin JDK 21 | `E:\Java\temurin-21` (OpenJDK 21.0.13 LTS) |
| Existing JDK 17 | Preserved at `C:\Program Files\Java\jdk-17` |
| Node.js v24 | Preserved (`v24.12.0`) |
| Playwright project | Preserved at `E:\ClassMonitor-Automation` |
| Jenkins LTS | `2.580.2` WAR |
| JENKINS_HOME | `E:\Jenkins` |
| App dir | `E:\JenkinsApp` |
| Windows service | `Jenkins` — **Running**, StartType **Automatic** |
| URL | http://127.0.0.1:8080 (`/login` HTTP 200) |

## Notes

1. Official Temurin **MSI** into Program Files failed with Error 1310 writing `ucrtbase.dll` (likely AV/file lock). Portable ZIP install on **E:** was used instead — fully working.
2. Official Windows **MSI** URL `windows-stable/jenkins.msi` returned 404. Jenkins was installed as LTS WAR + WinSW service (supported production pattern).
3. Update-center SSL errors may appear in logs (same local SSL interception seen with Git). Plugin install may need corporate CA trust or temporary workaround later.
4. Daily 6 PM schedule is **not** enabled yet.

## Your required UI step before Phase 3

1. Open Chrome: **http://127.0.0.1:8080**
2. Open password file in Notepad: **`E:\Jenkins\secrets\initialAdminPassword`**
3. Paste into **Unlock Jenkins**
4. Create your admin user
5. Keep instance URL as `http://localhost:8080/`
6. Tell me when unlock + admin user are done so I can proceed with plugins, GitHub job, Jenkinsfile, and parameters

Do **not** share the admin password in chat.
