@echo off
title Dasi - Parar Servicos
cd /d "%~dp0"

echo ========================================================
echo   [DASI] Encerrando processos nas portas 8080 e 8081...
echo ========================================================

for /f "tokens=5" %%a in ('netstat -aon ^| find ":8080" ^| find "LISTENING"') do (
    echo Encerrando processo PID %%a na porta 8080...
    taskkill /f /pid %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -aon ^| find ":8081" ^| find "LISTENING"') do (
    echo Encerrando processo PID %%a na porta 8081...
    taskkill /f /pid %%a >nul 2>&1
)

echo.
echo Concluido! Todas as portas estao liberadas.
timeout /t 2 /nobreak >nul
