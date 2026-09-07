[CmdletBinding()]
param(
    [string]$Root = "C:\inetpub\wwwroot\IIS_ifare_3002",
    [int]$NodePort = 3003
)

$ErrorActionPreference = "Stop"

$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw "Run PowerShell as Administrator."
}

Import-Module WebAdministration

$siteName = "IIS_ifare_3002"
$appPools = @(
    "ifare_front_3002",
    "ifare_fdapi_3002",
    "ifare_backend_3002",
    "ifare_bdapi_3002"
)

if (Test-Path "IIS:\Sites\$siteName") {
    Stop-Website -Name $siteName -ErrorAction SilentlyContinue
}

foreach ($pool in $appPools) {
    if (Test-Path "IIS:\AppPools\$pool") {
        Stop-WebAppPool -Name $pool -ErrorAction SilentlyContinue
    }
}

$pidFile = Join-Path $Root "i-fare\node-3003.pid"
if (Test-Path -LiteralPath $pidFile) {
    $nodePid = [int](Get-Content -LiteralPath $pidFile -Raw).Trim()
    $process = Get-Process -Id $nodePid -ErrorAction SilentlyContinue
    if ($process -and $process.ProcessName -eq "node") {
        Stop-Process -Id $nodePid -Force
    }
    Remove-Item -LiteralPath $pidFile -Force
}

$listener = Get-NetTCPConnection -LocalPort $NodePort -State Listen -ErrorAction SilentlyContinue
if ($listener) {
    Write-Warning "Port $NodePort is still in use by PID $($listener.OwningProcess). It was not stopped because it was not recorded by this deployment."
} else {
    Write-Host "IIS_ifare_3002 and its recorded Node process are stopped." -ForegroundColor Green
}
