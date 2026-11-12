@echo off
title DASI — Continent of Legend Reimagined
cd /d "%~dp0"

echo ========================================================
echo    ⚔️ DASI — Continent of Legend Reimagined ⚔️
echo ========================================================
echo.

if exist "%~dp0Dasi.exe" (
    echo Iniciando Dasi Launcher Executavel...
    start "" "%~dp0Dasi.exe"
    exit /b 0
)

echo Dasi.exe nao encontrado. Iniciando via Node.js CLI...
set "DASI_DEV_CONTROLS=1"
node --experimental-strip-types src/server/network/GameServer.ts
pause
