Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Démarrage Backend ImpactTracker" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$backendPath = Join-Path $PSScriptRoot "backend"

if (-not (Test-Path $backendPath)) {
    Write-Host "❌ Dossier backend introuvable!" -ForegroundColor Red
    exit 1
}

Set-Location $backendPath

# Vérifier si venv existe
if (-not (Test-Path "venv\Scripts\Activate.ps1")) {
    Write-Host "❌ Environnement virtuel introuvable!" -ForegroundColor Red
    Write-Host "💡 Exécutez: python -m venv venv" -ForegroundColor Yellow
    exit 1
}

# Activer l'environnement virtuel
Write-Host "🔧 Activation de l'environnement virtuel..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

# Vérifier la connexion MySQL
Write-Host "🔍 Vérification de la connexion MySQL..." -ForegroundColor Yellow
python -c "from database import engine; from sqlalchemy import text; conn = engine.connect(); result = conn.execute(text('SELECT 1')); conn.close(); print('✅ MySQL OK')" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur de connexion MySQL!" -ForegroundColor Red
    Write-Host "💡 Vérifiez que MySQL est démarré et que la base de données existe" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🚀 Démarrage de l'API..." -ForegroundColor Green
Write-Host "   API: http://localhost:8000" -ForegroundColor Gray
Write-Host "   Docs: http://localhost:8000/api/docs" -ForegroundColor Gray
Write-Host ""
Write-Host "Appuyez sur Ctrl+C pour arrêter" -ForegroundColor Gray
Write-Host ""

# Démarrer l'API
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000




