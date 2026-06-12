@echo off
title SupportArena Local Web Server
echo ===================================================
echo 🏛️  SupportArena - Local Server Launcher
echo ===================================================
echo.
echo Attempting to start python HTTP server on port 8000...
echo.
start "" "http://localhost:8000/index.html"
python -m http.server 8000
if %errorlevel% neq 0 (
    echo.
    echo [WARNING] Python not found or port in use.
    echo Opening index.html directly in your default browser...
    start "" "index.html"
)
pause
