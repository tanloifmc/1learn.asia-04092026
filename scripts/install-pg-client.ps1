# install-pg-client.ps1
$ErrorActionPreference = "Stop"
$destPath = "$PSScriptRoot\..\pgsql"
$zipPath = "$PSScriptRoot\..\pgsql.zip"

if (-Not (Test-Path "$destPath\pgsql\bin\pg_dump.exe")) {
    Write-Host "Downloading PostgreSQL binaries using curl.exe..."
    curl.exe -L -o $zipPath "https://get.enterprisedb.com/postgresql/postgresql-16.3-1-windows-x64-binaries.zip"
    Write-Host "Extracting..."
    Expand-Archive -Path $zipPath -DestinationPath $destPath -Force
    Write-Host "Cleaning up zip..."
    Remove-Item $zipPath
    Write-Host "Done."
} else {
    Write-Host "PostgreSQL binaries already exist at $destPath"
}
