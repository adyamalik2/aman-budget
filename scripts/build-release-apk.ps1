$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

Write-Host "=== AMAN Budget Release APK Builder ===" -ForegroundColor Cyan
Write-Host "Project: $ProjectRoot" -ForegroundColor Gray

Write-Host "`n[1/5] Build web app..." -ForegroundColor Yellow
npm run build

Write-Host "`n[2/5] Sync Capacitor Android..." -ForegroundColor Yellow
npx cap sync android

$javaHome = "C:\Program Files\Android\Android Studio\jbr"
if (!(Test-Path "$javaHome\bin\java.exe")) {
  throw "Java 21 Android Studio JBR tidak ditemukan di: $javaHome"
}

$env:JAVA_HOME = $javaHome
$env:Path = "$javaHome\bin;$env:Path"

Write-Host "`n[3/5] Using Java:" -ForegroundColor Yellow
java -version

$androidDir = Join-Path $ProjectRoot "android"

# Kredensial signing dibaca otomatis oleh Gradle dari android/keystore.properties.
$keystoreProps = Join-Path $androidDir "keystore.properties"
if (!(Test-Path $keystoreProps)) {
  throw "android/keystore.properties tidak ditemukan. Salin android/keystore.properties.example lalu isi storeFile/storePassword/keyAlias/keyPassword."
}

Set-Location $androidDir

Write-Host "`n[4/5] Building signed release APK..." -ForegroundColor Yellow
& .\gradlew.bat assembleRelease "-Dorg.gradle.java.home=$javaHome"

Write-Host "`n[5/5] Copy APK to android/app/release..." -ForegroundColor Yellow
$sourceApk = Join-Path $androidDir "app\build\outputs\apk\release\app-release.apk"
$targetDir = Join-Path $androidDir "app\release"
$targetApk = Join-Path $targetDir "app-release.apk"

New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
Copy-Item $sourceApk $targetApk -Force

Write-Host "`nBUILD RELEASE APK SELESAI" -ForegroundColor Green
Write-Host "APK final:" -ForegroundColor Green
Write-Host $targetApk -ForegroundColor Cyan
