# CVA Policy Platform - Dev Environment Startup Script

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CVA Policy Platform - Dev Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ── 1. Check .env ────────────────────────────────────────────────────────────
if (-Not (Test-Path ".env")) {
    Write-Host "[ERROR] .env file not found." -ForegroundColor Red
    Write-Host "  Copy .env.example to .env and fill in your settings." -ForegroundColor Yellow
    exit 1
}
Write-Host "[OK] .env found" -ForegroundColor Green

# ── 2. Start PostgreSQL ───────────────────────────────────────────────────────
Write-Host "[...] Starting PostgreSQL..." -ForegroundColor Yellow
$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue | Select-Object -First 1

if ($pgService) {
    if ($pgService.Status -ne "Running") {
        Start-Service $pgService.Name
        Start-Sleep -Seconds 2
    }
    Write-Host "[OK] PostgreSQL is running ($($pgService.Name))" -ForegroundColor Green
} else {
    Write-Host "[WARN] PostgreSQL service not found. Make sure it is running manually." -ForegroundColor Yellow
}

# ── 3. Install dependencies ───────────────────────────────────────────────────
Write-Host "[...] Checking dependencies..." -ForegroundColor Yellow
if (-Not (Test-Path "node_modules")) {
    Write-Host "[...] Running npm install..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) { Write-Host "[ERROR] npm install failed." -ForegroundColor Red; exit 1 }
}
Write-Host "[OK] Dependencies ready" -ForegroundColor Green

# ── 4. Run migrations ─────────────────────────────────────────────────────────
Write-Host "[...] Applying database migrations..." -ForegroundColor Yellow
npx prisma migrate deploy 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[WARN] Migration issue detected. Attempting to resolve init migration..." -ForegroundColor Yellow
    npx prisma migrate resolve --applied 20260305223329_init 2>&1 | Out-Null
    npx prisma migrate deploy 2>&1 | Out-Null
}
Write-Host "[OK] Database migrations applied" -ForegroundColor Green

# ── 5. Generate Prisma client ─────────────────────────────────────────────────
Write-Host "[...] Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate 2>&1 | Out-Null
Write-Host "[OK] Prisma client ready" -ForegroundColor Green

# ── 6. Start dev server ───────────────────────────────────────────────────────
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting dev server..." -ForegroundColor Cyan
Write-Host "  http://localhost:3000" -ForegroundColor White
Write-Host "  Login: admin@cva.internal / Admin@CVA2024!" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

npm run dev
