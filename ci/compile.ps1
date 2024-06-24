param([String] $inputDir, [String] $outputDir)

$templateFiles = Get-ChildItem -Path $inputDir -Filter "*-template.json" -File

foreach ($file in $templateFiles) {
    $baseFilename = $file.BaseName + '.json'
    $templateFilePath = $file.FullName
	
	#remove the -template.json suffix 
	$outputFilePath = Join-Path -Path $outputDir -ChildPath $baseFilename.replace("-template","")
    
	#substitute environment variables for file variables
	Get-Content $templateFilePath | ForEach-Object { 
        if ($_ -match "\$\{((\w+))\}")
        {
            $_ -replace "\$\{(\w+)\}",$([Environment]::GetEnvironmentVariable($Matches[1]))
        }
        else
        {
            $_
        }
    } | Set-Content $outputFilePath
}