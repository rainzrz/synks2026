@echo off
echo ========================================
echo Starting Backend and Frontend...
echo ========================================
echo.
echo Backend will start in a new window
echo Frontend will start in this window
echo.
echo Press Ctrl+C in each window to stop
echo ========================================
echo.

REM Start backend in new window
start "Backend Server" cmd /k "cd backend && call venv\Scripts\activate.bat && python main.py"

REM Wait a bit for backend to start
echo Waiting for backend to start...
timeout /t 3 /nobreak > nul

REM Start frontend in current window
cd frontend
npm run dev

pause