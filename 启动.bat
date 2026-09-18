@echo off
chcp 65001 >nul
set "EDITOR_DIR=%~dp0"
rem Standalone mode: put the Rime config folder path (e.g. D:\rime_data) in
rem Rime目录.txt next to this script. Without it, the parent folder is used.
set "RIME_ROOT="
if exist "%EDITOR_DIR%Rime目录.txt" (
  set /p RIME_ROOT=<"%EDITOR_DIR%Rime目录.txt"
) else if exist "%EDITOR_DIR%RimeRoot.txt" (
  set /p RIME_ROOT=<"%EDITOR_DIR%RimeRoot.txt"
)
if defined RIME_ROOT set "RIME_ROOT=%RIME_ROOT:"=%"
if not defined RIME_ROOT for %%I in ("%EDITOR_DIR%..") do set "RIME_ROOT=%%~fI"
set "SERVER=%EDITOR_DIR%local\local_server.ps1"
where powershell.exe >nul 2>nul
if not errorlevel 1 (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%SERVER%" -Root "%RIME_ROOT%"
  exit /b %errorlevel%
)
where powershell >nul 2>nul
if not errorlevel 1 (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%SERVER%" -Root "%RIME_ROOT%"
  exit /b %errorlevel%
)
echo PowerShell was not found. Please open index.html and choose the Rime config folder in Chrome or Edge.
pause
exit /b 1
