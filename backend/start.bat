@echo off
echo ========================================
echo   ImpactTracker API - Demarrage
echo ========================================
echo.

REM Activer l'environnement virtuel
call venv\Scripts\activate.bat

REM Démarrer l'API
echo Demarrage de l'API...
echo.
echo API sera disponible sur: http://localhost:8000
echo Documentation: http://localhost:8000/api/docs
echo.
echo Appuyez sur Ctrl+C pour arreter le serveur
echo.

python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

pause




