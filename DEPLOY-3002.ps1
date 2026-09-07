[CmdletBinding()]
param(
    [string]$Root = "C:\inetpub\wwwroot\IIS_ifare_3002",
    [string]$IpAddress = "10.200.0.39",
    [int]$ExternalPort = 3002,
    [int]$NodePort = 3003,
    [string]$SqlInstance = "localhost\SQLEXPRESS",
    [switch]$SkipSqlPermissions,
    [switch]$SkipFirewall,
    [Parameter(Mandatory = $true)]
    [switch]$ConfirmSharedDatabase
)

$ErrorActionPreference = "Stop"

if (-not $ConfirmSharedDatabase) {
    throw "This deployment uses the existing IFare databases. Re-run with -ConfirmSharedDatabase."
}

$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw "Run PowerShell as Administrator."
}

$paths = [ordered]@{
    Frontend    = Join-Path $Root "i-fare"
    FrontendApi = Join-Path $Root "i-fare_API"
    Backend     = Join-Path $Root "Backend"
    BackendApi  = Join-Path $Root "Backend_API"
}

$requiredFiles = @(
    (Join-Path $paths.Frontend ".output\server\index.mjs"),
    (Join-Path $paths.Frontend ".output\server\node_modules\vue\package.json"),
    (Join-Path $paths.Frontend "web.config"),
    (Join-Path $paths.FrontendApi "IFare_API.Web.Host.dll"),
    (Join-Path $paths.FrontendApi "appsettings.json"),
    (Join-Path $paths.Backend "index.html"),
    (Join-Path $paths.BackendApi "IFare_BDAPI.Web.Host.dll"),
    (Join-Path $paths.BackendApi "appsettings.json")
)

$missing = @($requiredFiles | Where-Object { -not (Test-Path -LiteralPath $_) })
if ($missing.Count -gt 0) {
    throw "Missing deployment files:`n$($missing -join "`n")"
}

foreach ($settingsPath in @(
    (Join-Path $paths.FrontendApi "appsettings.json"),
    (Join-Path $paths.BackendApi "appsettings.json")
)) {
    $settingsText = Get-Content -LiteralPath $settingsPath -Raw
    if ($settingsText -match "IFare(_FDAPI|_BDAPI)?Db_3002|IFare_3002|CHAINWIN-CHAINW") {
        throw "Unexpected database/server setting in $settingsPath"
    }
}

$nodeVersion = (& node --version 2>$null)
if ($LASTEXITCODE -ne 0 -or $nodeVersion -ne "v18.20.8") {
    throw "Node.js v18.20.8 is required. Current version: $nodeVersion"
}

Import-Module WebAdministration

if (-not (Get-WebGlobalModule | Where-Object Name -eq "RewriteModule")) {
    throw "IIS URL Rewrite is not installed."
}

try {
    $proxyEnabled = (Get-WebConfigurationProperty `
        -PSPath "MACHINE/WEBROOT/APPHOST" `
        -Filter "system.webServer/proxy" `
        -Name "enabled").Value
} catch {
    throw "IIS ARR is not installed or the proxy section is unavailable."
}

if (-not $proxyEnabled) {
    throw "Enable ARR Proxy in IIS Manager before running this script."
}

$siteName = "IIS_ifare_3002"
$appPools = [ordered]@{
    Frontend    = "ifare_front_3002"
    FrontendApi = "ifare_fdapi_3002"
    Backend     = "ifare_backend_3002"
    BackendApi  = "ifare_bdapi_3002"
}

function Ensure-AppPool([string]$name) {
    $poolPath = "IIS:\AppPools\$name"
    if (-not (Test-Path $poolPath)) {
        New-WebAppPool -Name $name | Out-Null
    }

    Set-ItemProperty $poolPath -Name managedRuntimeVersion -Value ""
    Set-ItemProperty $poolPath -Name enable32BitAppOnWin64 -Value $false
    Set-ItemProperty $poolPath -Name processModel.identityType -Value 4
    Set-ItemProperty $poolPath -Name startMode -Value "AlwaysRunning"
}

$appPools.Values | ForEach-Object { Ensure-AppPool $_ }

$bindingConflict = Get-WebBinding | Where-Object {
    $_.bindingInformation -match ":${ExternalPort}:" -and $_.ItemXPath -notmatch "site\[@name='$siteName'\]"
}
if ($bindingConflict) {
    throw "Port $ExternalPort is already bound by another IIS site."
}

$sitePath = "IIS:\Sites\$siteName"
if (-not (Test-Path $sitePath)) {
    New-Website `
        -Name $siteName `
        -PhysicalPath $paths.Frontend `
        -ApplicationPool $appPools.Frontend `
        -IPAddress $IpAddress `
        -Port $ExternalPort `
        -HostHeader "" | Out-Null
} else {
    Set-ItemProperty $sitePath -Name physicalPath -Value $paths.Frontend
    Set-ItemProperty $sitePath -Name applicationPool -Value $appPools.Frontend

    $hasBinding = Get-WebBinding -Name $siteName -Protocol http | Where-Object {
        $_.bindingInformation -match ":${ExternalPort}:"
    }
    if (-not $hasBinding) {
        New-WebBinding -Name $siteName -Protocol http -IPAddress $IpAddress -Port $ExternalPort -HostHeader ""
    }
}

function Ensure-WebApp([string]$alias, [string]$physicalPath, [string]$pool) {
    $appPath = "IIS:\Sites\$siteName\$alias"
    if (-not (Test-Path $appPath)) {
        New-WebApplication `
            -Site $siteName `
            -Name $alias `
            -PhysicalPath $physicalPath `
            -ApplicationPool $pool | Out-Null
    } else {
        Set-ItemProperty $appPath -Name physicalPath -Value $physicalPath
        Set-ItemProperty $appPath -Name applicationPool -Value $pool
    }
}

Ensure-WebApp "ifare_api" $paths.FrontendApi $appPools.FrontendApi
Ensure-WebApp "ifare_backend" $paths.Backend $appPools.Backend
Ensure-WebApp "ifare_bdapi" $paths.BackendApi $appPools.BackendApi

function Grant-FolderAccess([string]$path, [string]$identity, [string]$rights) {
    $acl = Get-Acl -LiteralPath $path
    $inheritance = [Security.AccessControl.InheritanceFlags]::ContainerInherit -bor `
        [Security.AccessControl.InheritanceFlags]::ObjectInherit
    $rule = New-Object Security.AccessControl.FileSystemAccessRule(
        $identity,
        $rights,
        $inheritance,
        [Security.AccessControl.PropagationFlags]::None,
        [Security.AccessControl.AccessControlType]::Allow
    )
    $acl.SetAccessRule($rule)
    Set-Acl -LiteralPath $path -AclObject $acl
}

Grant-FolderAccess $paths.Frontend "IIS APPPOOL\$($appPools.Frontend)" "ReadAndExecute, Synchronize"
Grant-FolderAccess $paths.FrontendApi "IIS APPPOOL\$($appPools.FrontendApi)" "ReadAndExecute, Synchronize"
Grant-FolderAccess $paths.Backend "IIS APPPOOL\$($appPools.Backend)" "ReadAndExecute, Synchronize"
Grant-FolderAccess $paths.BackendApi "IIS APPPOOL\$($appPools.BackendApi)" "ReadAndExecute, Synchronize"

foreach ($api in @(
    @{ Path = $paths.FrontendApi; Pool = $appPools.FrontendApi },
    @{ Path = $paths.BackendApi; Pool = $appPools.BackendApi }
)) {
    foreach ($relativeLogPath in @("App_Data\Logs", "App_Data\DbLogs", "logs")) {
        $logPath = Join-Path $api.Path $relativeLogPath
        if (-not (Test-Path -LiteralPath $logPath)) {
            New-Item -ItemType Directory -Path $logPath -Force | Out-Null
        }
        Grant-FolderAccess $logPath "IIS APPPOOL\$($api.Pool)" "Modify, Synchronize"
    }
}

if (-not $SkipSqlPermissions) {
    $sqlcmd = Get-Command sqlcmd -ErrorAction SilentlyContinue
    if (-not $sqlcmd) {
        throw "sqlcmd is not installed. Install SQL command-line tools or run with -SkipSqlPermissions and grant the App Pool identities in SSMS."
    }

    $grants = @(
        @{ Login = "IIS APPPOOL\$($appPools.FrontendApi)"; Databases = @("IFare_FDAPIDb", "IFare") },
        @{ Login = "IIS APPPOOL\$($appPools.BackendApi)"; Databases = @("IFare_BDAPIDb", "IFare") }
    )

    foreach ($grant in $grants) {
        $login = $grant.Login
        foreach ($database in $grant.Databases) {
            $query = @"
USE [master];
IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE [name] = N'$login')
    CREATE LOGIN [$login] FROM WINDOWS;
IF DB_ID(N'$database') IS NULL
    THROW 50000, 'Required database $database was not found.', 1;
USE [$database];
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE [name] = N'$login')
    CREATE USER [$login] FOR LOGIN [$login];
ALTER ROLE [db_datareader] ADD MEMBER [$login];
ALTER ROLE [db_datawriter] ADD MEMBER [$login];
"@
            & $sqlcmd.Source -S $SqlInstance -E -b -Q $query
            if ($LASTEXITCODE -ne 0) {
                throw "Failed to grant SQL access to $login on $database."
            }
        }
    }
}

if (-not $SkipFirewall) {
    $ruleName = "i-Fare test HTTP $ExternalPort"
    if (-not (Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue)) {
        New-NetFirewallRule `
            -DisplayName $ruleName `
            -Direction Inbound `
            -Action Allow `
            -Protocol TCP `
            -LocalPort $ExternalPort | Out-Null
    }
}

$nodeListener = Get-NetTCPConnection -LocalPort $NodePort -State Listen -ErrorAction SilentlyContinue
if (-not $nodeListener) {
    $env:PORT = [string]$NodePort
    $env:HOST = "127.0.0.1"
    $env:NODE_ENV = "production"
    $env:NUXT_PUBLIC_SITE_URL = "http://${IpAddress}:$ExternalPort"
    $env:NUXT_PUBLIC_FRONTEND_API_BASE = "/ifare_api/api/services/app"
    $env:NUXT_FRONTEND_API_SERVER_BASE = "http://${IpAddress}:$ExternalPort/ifare_api/api/services/app"
    $env:NUXT_GROQ_MODEL = "openai/gpt-oss-20b"
    $env:NUXT_LLM_GROQ_MODELS = "openai/gpt-oss-20b,openai/gpt-oss-120b"
    $env:NUXT_LLM_GROQ_INTENT_MODELS = "openai/gpt-oss-20b,openai/gpt-oss-120b"

    $nodeStdOut = Join-Path $paths.Frontend "node-3003.stdout.log"
    $nodeStdErr = Join-Path $paths.Frontend "node-3003.stderr.log"
    $nodeProcess = Start-Process `
        -FilePath (Get-Command node).Source `
        -ArgumentList @(".output\server\index.mjs") `
        -WorkingDirectory $paths.Frontend `
        -WindowStyle Hidden `
        -RedirectStandardOutput $nodeStdOut `
        -RedirectStandardError $nodeStdErr `
        -PassThru

    Set-Content -LiteralPath (Join-Path $paths.Frontend "node-3003.pid") -Value $nodeProcess.Id

    $nodeReady = $false
    for ($attempt = 1; $attempt -le 15; $attempt++) {
        Start-Sleep -Seconds 2
        if (Get-NetTCPConnection -LocalPort $NodePort -State Listen -ErrorAction SilentlyContinue) {
            $nodeReady = $true
            break
        }
    }
    if (-not $nodeReady) {
        $nodeError = if (Test-Path -LiteralPath $nodeStdErr) {
            Get-Content -LiteralPath $nodeStdErr -Raw
        } else {
            "No stderr log was created."
        }
        throw "Node did not start on port $NodePort.`n$nodeError"
    }
}

Start-WebAppPool $appPools.Frontend -ErrorAction SilentlyContinue
Start-WebAppPool $appPools.FrontendApi -ErrorAction SilentlyContinue
Start-WebAppPool $appPools.Backend -ErrorAction SilentlyContinue
Start-WebAppPool $appPools.BackendApi -ErrorAction SilentlyContinue
Start-Website $siteName

function Test-HttpEndpoint([string]$url) {
    $lastError = $null
    for ($attempt = 1; $attempt -le 8; $attempt++) {
        try {
            $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 120
            if ($response.StatusCode -eq 200) {
                Write-Host "[OK] $url" -ForegroundColor Green
                return
            }
            $lastError = "HTTP $($response.StatusCode)"
        } catch {
            $lastError = $_.Exception.Message
        }
        Start-Sleep -Seconds 3
    }
    throw "Endpoint failed: $url`n$lastError"
}

$baseUrl = "http://${IpAddress}:$ExternalPort"
Test-HttpEndpoint "$baseUrl/"
Test-HttpEndpoint "$baseUrl/ifare"
Test-HttpEndpoint "$baseUrl/ifare_api/api/services/app/Code/GetCodeDomicileList"
Test-HttpEndpoint "$baseUrl/ifare_backend/Login"
Test-HttpEndpoint "$baseUrl/ifare_bdapi/swagger/index.html"

Write-Host ""
Write-Host "Deployment completed: http://${IpAddress}:$ExternalPort/" -ForegroundColor Cyan
Write-Warning "Port 3002 is isolated, but both APIs use the existing IFare databases. Any content changes made from the 3002 backend are production data changes."
