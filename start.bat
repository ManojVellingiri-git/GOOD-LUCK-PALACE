@echo off
title Good Luck Palace Web Server
echo ========================================================
echo   Good Luck Palace — Departmental Store (Est. 1983)
echo   Starting local server at http://localhost:3000 ...
echo ========================================================
timeout /t 2 /nobreak >nul
start http://localhost:3000
npm run dev
pause
