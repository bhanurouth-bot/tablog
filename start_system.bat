@echo off
TITLE Tab Audit Production Server
COLOR 1F

:: 1. Navigate to project folder
cd /d "%~dp0"

:: 2. Activate Python Environment
IF EXIST "venv\Scripts\activate.bat" (
    CALL venv\Scripts\activate.bat
) ELSE (
    ECHO venv not found. Using global python...
)

:: 3. Start the Production Server
:: (I have removed the line that opens the browser)
python production_server.py

pause