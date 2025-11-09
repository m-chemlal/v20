@echo off
echo ========================================
echo   ImpactTracker - Demarrage complet
echo ========================================
echo.

echo Demarrage du Backend...
start "Backend API" cmd /k "cd backend && venv\Scripts\activate.bat && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

timeout /t 3 /nobreak > nul

echo Demarrage du Frontend...
start "Frontend" cmd /k "pnpm dev"

timeout /t 5 /nobreak > nul

echo.
echo ========================================
echo   SERVEURS DEMARRES!
echo ========================================
echo.
echo Backend API:
echo    http://localhost:8000
echo    Documentation: http://localhost:8000/api/docs
echo.
echo Frontend:
echo    http://localhost:5173
echo.
echo Appuyez sur une touche pour fermer cette fenetre...
pause > nul




