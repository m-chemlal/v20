Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   ImpactTracker API - Demarrage" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Activer l'environnement virtuel
& .\venv\Scripts\Activate.ps1

Write-Host "Demarrage de l'API..." -ForegroundColor Green
Write-Host ""
Write-Host "API sera disponible sur: http://localhost:8000" -ForegroundColor Yellow
Write-Host "Documentation: http://localhost:8000/api/docs" -ForegroundColor Yellow
Write-Host ""
Write-Host "Appuyez sur Ctrl+C pour arreter le serveur" -ForegroundColor Gray
Write-Host ""

# Démarrer l'API
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000




