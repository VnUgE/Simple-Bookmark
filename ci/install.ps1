param([String] $BaseUrl, [String] $ModuleName, [String] $ProjectName, [String]$FileName, [String]$Version)

#random delays to space out the downloads
$randomDelay = Get-Random -Minimum 1000 -Maximum 2000
Start-Sleep -Milliseconds $randomDelay

$_src = "$BaseUrl/$ModuleName/$Version/$ProjectName/$FileName"

#download the latest version
Invoke-WebRequest "$_src" -OutFile $FileName

#download latest sha256
Invoke-WebRequest "$_src.sha256" -OutFile "$FileName.sha256"

#verify the file
$hash = (Get-FileHash $FileName -Algorithm SHA256).Hash

#read the sha256 file
$sha256 = Get-Content "$FileName.sha256"

#compare the hashes
if ($hash -eq $sha256) {
    Write-Host "Hashes match, file is valid" -ForegroundColor Blue
} else {
   throw "Hashes do not match, file is invalid"
}

