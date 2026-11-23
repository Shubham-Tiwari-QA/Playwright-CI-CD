pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '15', artifactNumToKeepStr: '15'))
    timeout(time: 3, unit: 'HOURS')
  }

  parameters {
    string(name: 'BATCH_ID', defaultValue: '740', description: 'ClassMonitor batch id')
    string(name: 'SESSION_ID', defaultValue: '10822', description: 'ClassMonitor session id')
    string(name: 'TEST_PATH', defaultValue: 'tests', description: 'Playwright test path or file pattern')
  }

  environment {
    CI = 'true'
    // Corporate/local SSL interception on this PC
    NODE_OPTIONS = '--use-system-ca'
    // Use the interactive user browser cache on this PC (Jenkins service LOCALAPPDATA differs).
    PLAYWRIGHT_BROWSERS_PATH = 'C:\\Users\\DELL\\AppData\\Local\\ms-playwright'
    BATCH_ID = "${params.BATCH_ID}"
    SESSION_ID = "${params.SESSION_ID}"
    // Windows Git SSL (this PC requires Secure Channel backend)
    GIT_CONFIG_COUNT = '1'
    GIT_CONFIG_KEY_0 = 'http.sslBackend'
    GIT_CONFIG_VALUE_0 = 'schannel'
  }

  stages {
    stage('Checkout GitHub') {
      steps {
        checkout([
          $class: 'GitSCM',
          branches: [[name: '*/main']],
          userRemoteConfigs: [[
            url: 'https://github.com/Shubham-Tiwari-QA/Playwright-CI-CD.git'
          ]]
        ])
        script {
          env.GIT_COMMIT_SHORT = bat(
            script: '@echo off && git rev-parse --short HEAD',
            returnStdout: true
          ).trim()
        }
      }
    }

    stage('Verify Node.js and NPM') {
      steps {
        bat '''
          @echo off
          echo === Node ===
          where node
          node -v
          echo === npm ===
          where npm
          npm -v
          echo === Git ===
          git --version
          echo === Params BATCH_ID=%BATCH_ID% SESSION_ID=%SESSION_ID% ===
        '''
      }
    }

    stage('Install dependencies') {
      steps {
        bat 'npm ci'
      }
    }

    stage('Install Playwright Chromium') {
      steps {
        bat 'npx playwright install chromium'
      }
    }

    stage('Validate test parameters') {
      steps {
        bat '''
          @echo off
          if "%BATCH_ID%"=="" (
            echo BATCH_ID is required
            exit /b 1
          )
          if "%SESSION_ID%"=="" (
            echo SESSION_ID is required
            exit /b 1
          )
          echo Parameters OK: BATCH_ID=%BATCH_ID% SESSION_ID=%SESSION_ID%
        '''
      }
    }

    stage('Execute Playwright tests') {
      steps {
        // Keep build red on failure, but continue so reports/artifacts are still collected.
        catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
          bat """
            @echo off
            set CI=true
            set BATCH_ID=%BATCH_ID%
            set SESSION_ID=%SESSION_ID%
            set PLAYWRIGHT_BROWSERS_PATH=C:\\Users\\DELL\\AppData\\Local\\ms-playwright
            if not exist reports mkdir reports
            npx playwright test %TEST_PATH% --project=chromium
          """
        }
      }
    }

    stage('Generate HTML report and summary') {
      steps {
        bat '''
          @echo off
          if not exist reports mkdir reports
          set BUILD_NUMBER=%BUILD_NUMBER%
          set GIT_COMMIT_SHORT=%GIT_COMMIT_SHORT%
          set BATCH_ID=%BATCH_ID%
          set SESSION_ID=%SESSION_ID%
          node scripts\\ci-write-summary.js
        '''
        script {
          if (fileExists('reports/execution-summary.json')) {
            def propsText = bat(
              script: '''@echo off
powershell -NoProfile -Command "$s=Get-Content -Raw reports\\execution-summary.json | ConvertFrom-Json; Write-Output (\\\"TEST_TOTAL=$($s.total)`nTEST_PASSED=$($s.passed)`nTEST_FAILED=$($s.failed)`nTEST_SKIPPED=$($s.skipped)`nTEST_DURATION_MS=$($s.durationMs)`nTEST_FAILURE_REASON=$($s.failureReason)`nTEST_INTERRUPTED=$($s.interrupted)\\")"
''',
              returnStdout: true
            ).trim()
            propsText.split('\\r?\\n').each { line ->
              def idx = line.indexOf('=')
              if (idx > 0) {
                env."${line.substring(0, idx).trim()}" = line.substring(idx + 1).trim()
              }
            }
            if (env.TEST_INTERRUPTED == 'True' || env.TEST_INTERRUPTED == 'true') {
              echo "Interrupted or incomplete Playwright run detected."
              currentBuild.result = 'FAILURE'
            }
          } else {
            env.TEST_TOTAL = '0'
            env.TEST_PASSED = '0'
            env.TEST_FAILED = '0'
            env.TEST_SKIPPED = '0'
            env.TEST_DURATION_MS = '0'
            env.TEST_FAILURE_REASON = 'execution-summary.json missing'
            env.TEST_INTERRUPTED = 'true'
            currentBuild.result = 'FAILURE'
          }
        }
      }
    }

    stage('Collect evidence') {
      steps {
        bat '''
          @echo off
          if not exist artifacts mkdir artifacts
          if exist playwright-report powershell -NoProfile -Command "Compress-Archive -Path playwright-report -DestinationPath artifacts\\playwright-report.zip -Force"
          if exist test-results powershell -NoProfile -Command "Compress-Archive -Path test-results -DestinationPath artifacts\\test-results.zip -Force"
          if exist reports\\execution-summary.txt copy /Y reports\\execution-summary.txt artifacts\\execution-summary.txt
          if exist reports\\execution-summary.json copy /Y reports\\execution-summary.json artifacts\\execution-summary.json
          if exist reports\\playwright-results.json copy /Y reports\\playwright-results.json artifacts\\playwright-results.json
        '''
      }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: 'artifacts/**,playwright-report/**,test-results/**,reports/**', allowEmptyArchive: true, fingerprint: true

      script {
        try {
          publishHTML(target: [
            allowMissing: true,
            alwaysLinkToLastBuild: true,
            keepAll: true,
            reportDir: 'playwright-report',
            reportFiles: 'index.html',
            reportName: 'Playwright HTML Report'
          ])
        } catch (err) {
          echo "HTML Publisher plugin missing or failed: ${err}"
        }

        def emailStatus = currentBuild.currentResult ?: 'UNKNOWN'
        def emailError = null
        try {
          emailext(
            subject: "ClassMonitor Playwright CI | Build #${env.BUILD_NUMBER} | ${emailStatus}",
            body: """
              <h2>ClassMonitor Playwright Automation</h2>
              <p><b>Project:</b> ClassMonitor Teacher Portal</p>
              <p><b>Jenkins Job:</b> ${env.JOB_NAME}</p>
              <p><b>Build Number:</b> #${env.BUILD_NUMBER}</p>
              <p><b>Build Status:</b> ${emailStatus}</p>
              <p><b>GitHub Branch:</b> main</p>
              <p><b>Git Commit:</b> ${env.GIT_COMMIT_SHORT}</p>
              <p><b>Total Tests:</b> ${env.TEST_TOTAL ?: 'n/a'}</p>
              <p><b>Passed:</b> ${env.TEST_PASSED ?: 'n/a'}</p>
              <p><b>Failed:</b> ${env.TEST_FAILED ?: 'n/a'}</p>
              <p><b>Skipped:</b> ${env.TEST_SKIPPED ?: 'n/a'}</p>
              <p><b>Duration:</b> ${currentBuild.durationString}</p>
              <p><b>BATCH_ID:</b> ${params.BATCH_ID}</p>
              <p><b>SESSION_ID:</b> ${params.SESSION_ID}</p>
              <p><b>Failure Reason:</b> ${env.TEST_FAILURE_REASON ?: 'n/a'}</p>
              <p><b>Interrupted:</b> ${env.TEST_INTERRUPTED ?: 'false'}</p>
              <p><b>Jenkins Build URL:</b> <a href="${env.BUILD_URL}">${env.BUILD_URL}</a></p>
              <p><b>HTML Report:</b> <a href="${env.BUILD_URL}Playwright_20HTML_20Report/">${env.BUILD_URL}Playwright_20HTML_20Report/</a></p>
              <p><b>Artifacts:</b> <a href="${env.BUILD_URL}artifact/">${env.BUILD_URL}artifact/</a></p>
              <p><b>Screenshots / Videos / Traces:</b> <a href="${env.BUILD_URL}artifact/test-results/">${env.BUILD_URL}artifact/test-results/</a></p>
              <p><b>Test-results archive:</b> <a href="${env.BUILD_URL}artifact/artifacts/test-results.zip">${env.BUILD_URL}artifact/artifacts/test-results.zip</a></p>
              <p><b>JSON Report:</b> <a href="${env.BUILD_URL}artifact/reports/playwright-results.json">${env.BUILD_URL}artifact/reports/playwright-results.json</a></p>
            """,
            mimeType: 'text/html',
            to: '${DEFAULT_RECIPIENTS}',
            recipientProviders: [
              [$class: 'RequesterRecipientProvider'],
              [$class: 'CulpritsRecipientProvider']
            ],
            attachLog: true,
            compressLog: true,
            attachmentsPattern: 'artifacts/*.zip,artifacts/execution-summary.txt,artifacts/execution-summary.json'
          )
        } catch (err) {
          emailError = err
          echo "Email not sent. Configure Extended E-mail Notification SMTP + Default Recipients in Jenkins UI: ${err}"
        }

        // Email problems must never overwrite the Playwright result.
        if (emailError != null) {
          echo "Email step failed but build result remains: ${currentBuild.currentResult}"
        }

        try {
          cleanWs(deleteDirs: true, notFailBuild: true)
        } catch (err) {
          echo "Workspace cleanup skipped: ${err}"
        }
      }
    }

    success {
      echo 'Pipeline finished SUCCESS'
    }
    failure {
      echo 'Pipeline finished FAILURE — open console + Playwright HTML Report for details'
    }
    unstable {
      echo 'Pipeline finished UNSTABLE'
    }
  }
}
