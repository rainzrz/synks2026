@echo off
echo ========================================
echo Customer Portal - Setup
echo ========================================
echo.

REM Create directory structure
echo Creating directory structure...
if not exist backend mkdir backend
if not exist frontend\src mkdir frontend\src
if not exist electron\assets mkdir electron\assets

REM Setup Backend
echo.
echo ========================================
echo Setting up Backend...
echo ========================================
cd backend

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH!
    echo Please install Python 3.8+ from https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Create virtual environment
echo Creating virtual environment...
python -m venv venv

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing Python dependencies...
pip install -r requirements.txt

cd ..

REM Setup Frontend
echo.
echo ========================================
echo Setting up Frontend...
echo ========================================
cd frontend

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Installing frontend dependencies...
call npm install

cd ..

REM Setup Electron
echo.
echo ========================================
echo Setting up Electron...
echo ========================================
cd electron

echo Installing electron dependencies...
call npm install

cd ..

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo   1. Run: start-dev.bat     (to start backend + frontend)
echo   2. Run: start-backend.bat (to start backend only)
echo   3. Run: start-frontend.bat (to start frontend only)
echo.
pause