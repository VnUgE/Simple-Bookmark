param([String] $inputDir, [String] $outputDir)

$templateFiles = Get-ChildItem -Path $inputDir -Filter "*-template.json" -File

foreach ($file in $templateFiles) {
    $baseFilename = $file.BaseName + '.json'
    $templateFilePath = $file.FullName
    
    #remove the -template.json suffix 
    $outputFilePath = Join-Path -Path $outputDir -ChildPath $baseFilename.replace("-template","")
    
    #substitute environment variables for file variables
    Get-Content $templateFilePath | ForEach-Object { 
        if ($_ -match "\$\{(\w+)(:-([^\}]+))?\}")
        {
            $varName = $Matches[1]
            $defaultValue = if ($Matches[3]) { $Matches[3] } else { '' }
            $envValue = [Environment]::GetEnvironmentVariable($varName)
            if (!$envValue) { $envValue = $defaultValue }
            $_ -replace "\$\{(\w+)(:-([^\}]+))?\}", $envValue
        }
        else
        {
            $_
        }
    } | Set-Content $outputFilePath
}