# deploy-stylus.ps1
# Script para deploy do contrato Stylus no Windows
# Uso: .\scripts\deploy-stylus.ps1 -Network sepolia -PrivateKey "sua_chave"

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("sepolia", "mainnet")]
    [string]$Network = "sepolia",
    
    [Parameter(Mandatory=$true)]
    [string]$PrivateKey
)

# Configuração de redes
$networks = @{
    "sepolia" = "https://sepolia-rollup.arbitrum.io/rpc"
    "mainnet" = "https://arb1.arbitrum.io/rpc"
}

$endpoint = $networks[$Network]

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Backchain Randomness Oracle - Deploy" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Network: $Network" -ForegroundColor Yellow
Write-Host "Endpoint: $endpoint" -ForegroundColor Yellow
Write-Host ""

# Navegar para pasta do contrato
$contractPath = Join-Path $PSScriptRoot "..\stylus\randomness-oracle"
Set-Location $contractPath

Write-Host "[1/4] Verificando instalacao do Rust..." -ForegroundColor Green
try {
    $rustVersion = rustc --version
    Write-Host "  OK: $rustVersion" -ForegroundColor Gray
} catch {
    Write-Host "  ERRO: Rust nao instalado!" -ForegroundColor Red
    Write-Host "  Instale em: https://rustup.rs" -ForegroundColor Yellow
    exit 1
}

Write-Host "[2/4] Compilando contrato..." -ForegroundColor Green
cargo build --release
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERRO: Falha na compilacao!" -ForegroundColor Red
    exit 1
}
Write-Host "  OK: Compilado com sucesso" -ForegroundColor Gray

Write-Host "[3/4] Verificando compatibilidade Stylus..." -ForegroundColor Green
cargo stylus check --endpoint $endpoint
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERRO: Contrato nao compativel com Stylus!" -ForegroundColor Red
    exit 1
}
Write-Host "  OK: Contrato valido" -ForegroundColor Gray

Write-Host "[4/4] Fazendo deploy..." -ForegroundColor Green
$output = cargo stylus deploy --private-key $PrivateKey --endpoint $endpoint 2>&1
Write-Host $output

# Extrair endereco do output
if ($output -match "deployed at: (0x[a-fA-F0-9]{40})") {
    $contractAddress = $matches[1]
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "  DEPLOY CONCLUIDO!" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Contrato: $contractAddress" -ForegroundColor Yellow
    Write-Host "Network: $Network" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Proximo passo: Chamar initialize() no contrato" -ForegroundColor Cyan
    
    # Salvar endereco
    $deploymentsPath = Join-Path $PSScriptRoot "..\deployments"
    if (-not (Test-Path $deploymentsPath)) {
        New-Item -ItemType Directory -Path $deploymentsPath | Out-Null
    }
    
    $deploymentFile = Join-Path $deploymentsPath "stylus-$Network.json"
    $deployment = @{
        "RandomnessOracle" = $contractAddress
        "network" = $Network
        "deployedAt" = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
    }
    $deployment | ConvertTo-Json | Set-Content $deploymentFile
    Write-Host ""
    Write-Host "Endereco salvo em: $deploymentFile" -ForegroundColor Gray
}

Set-Location $PSScriptRoot\..
