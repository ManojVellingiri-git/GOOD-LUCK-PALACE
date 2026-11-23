@echo off
echo ==============================================================================
echo                 GOOD LUCK PALACE (EST. 1983, COIMBATORE)
echo                 Starting E-Commerce Platform Services
echo ==============================================================================

cd /d "%~dp0"

echo [1/2] Launching FastAPI Backend Server on http://127.0.0.1:8001 ...
start "Good Luck Palace Backend (FastAPI)" cmd /k ".\backend_venv\Scripts\activate && uvicorn backend.main:app --host 127.0.0.1 --port 8001 --reload"

timeout /t 2 /nobreak >nul

echo [2/2] Launching Vite Frontend Dev Server on http://localhost:3000 ...
start "Good Luck Palace Frontend (Vite)" cmd /k "npm run dev"

echo.
echo ==============================================================================
echo Both services are now running!
echo Storefront URL:      http://localhost:3000
echo Admin Portal:        http://localhost:3000/admin (or click 'Admin Portal' in header)
echo Backend API Docs:    http://127.0.0.1:8001/docs
echo ==============================================================================
echo Default Credentials:
echo   Store Admin: owner@goodluckpalace.com / GoodLuck@1983
echo   Sample User: customer@example.com / Customer@123
echo ==============================================================================
pause
