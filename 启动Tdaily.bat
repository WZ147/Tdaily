@echo off
chcp 65001 >nul
title Tdaily
cd /d %~dp0
echo.
echo   Starting Tdaily ...
echo.
node server.js
if errorlevel 1 pause
