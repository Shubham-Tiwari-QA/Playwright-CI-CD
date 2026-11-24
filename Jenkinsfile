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

    stage('Execute Demo enrollment tests') {
      steps {
        catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
          bat """
            @echo off
            set CI=true
            set DEMO_BASE_URL=https://stagelearn.classmonitor.com/demo
            set PLAYWRIGHT_BROWSERS_PATH=C:\\Users\\DELL\\AppData\\Local\\ms-playwright
            set PLAYWRIGHT_HTML_REPORT=playwright-report-demo
            set PLAYWRIGHT_JSON_OUTPUT=playwright-report-demo\\results.json
            set PLAYWRIGHT_JUNIT_OUTPUT=playwright-report-demo\\junit.xml
            set PLAYWRIGHT_OUTPUT_DIR=test-results-demo
            call npm run test:ci
          """
        }
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
            npx playwright test %TEST_PATH% --project=chromium --grep-invert "@demo"
          """
        }
      }
    }

    stage('Generate HTML report and summary') {
      steps {
        bat '''
          @echo off
          if not exist reports mkdir reports
          echo ClassMonitor Playwright Jenkins Report> reports\\execution-summary.txt
          echo Build: %BUILD_NUMBER%>> reports\\execution-summary.txt
          echo Branch: main>> reports\\execution-summary.txt
          echo Commit: %GIT_COMMIT_SHORT%>> reports\\execution-summary.txt
          echo BATCH_ID: %BATCH_ID%>> reports\\execution-summary.txt
          echo SESSION_ID: %SESSION_ID%>> reports\\execution-summary.txt
          echo See Jenkins build page for status, duration, failed tests and evidence.>> reports\\execution-summary.txt
        '''
      }
    }

    stage('Collect evidence') {
      steps {
        bat '''
          @echo off
          if not exist artifacts mkdir artifacts
          if exist playwright-report powershell -NoProfile -Command "Compress-Archive -Path playwright-report -DestinationPath artifacts\\playwright-report.zip -Force"
          if exist playwright-report-demo powershell -NoProfile -Command "Compress-Archive -Path playwright-report-demo -DestinationPath artifacts\\playwright-report-demo.zip -Force"
          if exist test-results powershell -NoProfile -Command "Compress-Archive -Path test-results -DestinationPath artifacts\\test-results.zip -Force"
          if exist test-results-demo powershell -NoProfile -Command "Compress-Archive -Path test-results-demo -DestinationPath artifacts\\test-results-demo.zip -Force"
          if exist reports\\execution-summary.txt copy /Y reports\\execution-summary.txt artifacts\\execution-summary.txt
        '''
      }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: 'artifacts/**,playwright-report/**,playwright-report-demo/**,test-results/**,test-results-demo/**,reports/execution-summary.txt', allowEmptyArchive: true, fingerprint: true

      script {
        try {
          if (fileExists('playwright-report/index.html')) {
            publishHTML(target: [
              allowMissing: true,
              alwaysLinkToLastBuild: true,
              keepAll: true,
              reportDir: 'playwright-report',
              reportFiles: 'index.html',
              reportName: 'Playwright HTML Report'
            ])
          }
          if (fileExists('playwright-report-demo/index.html')) {
            publishHTML(target: [
              allowMissing: true,
              alwaysLinkToLastBuild: true,
              keepAll: true,
              reportDir: 'playwright-report-demo',
              reportFiles: 'index.html',
              reportName: 'Demo Playwright HTML Report'
            ])
          }
        } catch (err) {
          echo "HTML Publisher plugin missing or failed: ${err}"
        }

        try {
          junit allowEmptyResults: true, testResults: 'playwright-report/junit.xml,playwright-report-demo/junit.xml'
        } catch (err) {
          echo "JUnit publisher missing or failed: ${err}"
        }

        try {
          emailext(
            subject: "ClassMonitor Playwright - Build #${env.BUILD_NUMBER} - ${currentBuild.currentResult}",
            body: """
              <h2>ClassMonitor Playwright Automation</h2>
              <p><b>Status:</b> ${currentBuild.currentResult}</p>
              <p><b>Date/Time:</b> ${new Date()}</p>
              <p><b>Build:</b> #${env.BUILD_NUMBER}</p>
              <p><b>Branch:</b> main</p>
              <p><b>Commit:</b> ${env.GIT_COMMIT_SHORT}</p>
              <p><b>BATCH_ID:</b> ${params.BATCH_ID}</p>
              <p><b>SESSION_ID:</b> ${params.SESSION_ID}</p>
              <p><b>Duration:</b> ${currentBuild.durationString}</p>
              <p><b>Jenkins Build URL:</b> <a href="${env.BUILD_URL}">${env.BUILD_URL}</a></p>
              <p><b>HTML Report:</b> <a href="${env.BUILD_URL}Playwright_20HTML_20Report/">${env.BUILD_URL}Playwright_20HTML_20Report/</a></p>
              <p><b>Demo HTML Report:</b> <a href="${env.BUILD_URL}Demo_20Playwright_20HTML_20Report/">${env.BUILD_URL}Demo_20Playwright_20HTML_20Report/</a></p>
              <p><b>Demo URL:</b> https://stagelearn.classmonitor.com/demo</p>
              <p><b>Artifacts:</b> <a href="${env.BUILD_URL}artifact/">${env.BUILD_URL}artifact/</a></p>
              <p>Open the build page for failed test names, console errors, screenshots, videos and traces.</p>
            """,
            mimeType: 'text/html',
            to: '${DEFAULT_RECIPIENTS}',
            attachLog: true,
            compressLog: true,
            attachmentsPattern: 'artifacts/*.zip,artifacts/execution-summary.txt'
          )
        } catch (err) {
          echo "Email not sent. Configure Extended E-mail Notification SMTP + Default Recipients in Jenkins UI: ${err}"
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
