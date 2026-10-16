@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
set PID=
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3888" ^| findstr "LISTENING"') do set PID=%%p
if "%PID%"=="" (
  echo Tdaily is not running.
) else (
  taskkill /f /pid %PID% >nul 2>nul
  echo Tdaily stopped.
)
pause
