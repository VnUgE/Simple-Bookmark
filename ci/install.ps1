param([String] $BaseUrl, [String] $ModuleName, [String] $ProjectName, [String]$FileName)

#get the latest file
Invoke-WebRequest "$BaseUrl/$ModuleName/@latest" -OutFile latest.txt
#read the file into a variable
$latest = Get-Content latest.txt

#download the latest version
Invoke-WebRequest "$BaseUrl/$ModuleName/$latest/$ProjectName/$FileName" -OutFile $FileName

#download latest sha256
Invoke-WebRequest "$BaseUrl/$ModuleName/$latest/$ProjectName/$FileName.sha256" -OutFile "$FileName.sha256"

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

