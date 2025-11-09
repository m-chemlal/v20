Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   ImpactTracker - Démarrage complet" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Démarrer le backend
Write-Host "🔧 Démarrage du Backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; .\venv\Scripts\Activate.ps1; python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

Start-Sleep -Seconds 3

# Démarrer le frontend
Write-Host "🎨 Démarrage du Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd $PSScriptRoot; pnpm dev"

Start-Sleep -Seconds 5

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ SERVEURS DÉMARRÉS!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "🔧 Backend API:" -ForegroundColor Cyan
Write-Host "   http://localhost:8000" -ForegroundColor White
Write-Host "   Documentation: http://localhost:8000/api/docs" -ForegroundColor Gray
Write-Host ""
Write-Host "🎨 Frontend:" -ForegroundColor Cyan
Write-Host "   http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "💡 Les deux serveurs ont été lancés dans des fenêtres séparées" -ForegroundColor Yellow
Write-Host "   Appuyez sur Ctrl+C dans chaque fenêtre pour les arrêter" -ForegroundColor Yellow
Write-Host ""




