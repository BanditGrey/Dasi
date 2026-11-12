@echo off
title Dasi - Build Launcher EXE
cd /d "%~dp0.."

echo ========================================================
echo   [DASI] Compilando Dasi.exe / DasiLauncher.exe...
echo ========================================================

set "CSC=C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
if not exist "%CSC%" set "CSC=C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe"

if not exist "%CSC%" (
    echo [ERRO] Compilador csc.exe nao encontrado.
    pause
    exit /b 1
)

"%CSC%" /target:winexe /out:"tools\launcher\DasiLauncher.exe" /win32icon:"tools\launcher\dasi.ico" /r:System.dll,System.Drawing.dll,System.Windows.Forms.dll "tools\launcher\DasiLauncher.cs"
if errorlevel 1 (
    echo [ERRO] Falha na compilacao do DasiLauncher.
    pause
    exit /b 1
)

copy /y "tools\launcher\DasiLauncher.exe" "Dasi.exe" >nul
echo.
echo [SUCESSO] Dasi.exe compilado e copiado para a raiz do projeto!
