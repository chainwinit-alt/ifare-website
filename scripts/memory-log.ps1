param(
    [int]$ProcessId = 12996,
    [int]$IntervalSeconds = 5,
    [string]$Note = ""
)

$ErrorActionPreference = 'Continue'
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$logfile = Join-Path $PSScriptRoot "memory-log-$timestamp.csv"

"timestamp,working_set_mb,private_mb,handles,threads,cpu_total_sec,note" |
    Out-File -FilePath $logfile -Encoding utf8

Write-Host "PID         : $ProcessId"
Write-Host "Interval    : ${IntervalSeconds}s"
Write-Host "Output file : $logfile"
Write-Host "Stop with   : TaskStop on the bash task ID, or close this window"
Write-Host ""

$row = 0
while ($true) {
    $p = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
    $ts = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'

    if ($null -eq $p) {
        "$ts,,,,,,PROCESS_GONE" | Out-File -FilePath $logfile -Append -Encoding utf8
        Write-Host "[$ts] Process $ProcessId no longer exists. Exiting."
        break
    }

    $ws  = [math]::Round($p.WorkingSet64        / 1MB, 2)
    $pm  = [math]::Round($p.PrivateMemorySize64 / 1MB, 2)
    $h   = $p.HandleCount
    $t   = $p.Threads.Count
    $cpu = [math]::Round($p.TotalProcessorTime.TotalSeconds, 2)
    $rowNote = if ($row -eq 0) { $Note } else { "" }

    "$ts,$ws,$pm,$h,$t,$cpu,$rowNote" | Out-File -FilePath $logfile -Append -Encoding utf8
    Write-Host "[$ts] WS=${ws}MB  Private=${pm}MB  Handles=$h  Threads=$t  CPU=${cpu}s"

    $row++
    Start-Sleep -Seconds $IntervalSeconds
}
