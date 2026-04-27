Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$svgPath = 'C:\Users\Silian\PycharmProjects\PProject\docs\figma_editable_replica.svg'
$svg = Get-Content -Raw -Encoding UTF8 $svgPath
$data = New-Object System.Windows.Forms.DataObject
$data.SetData('image/svg+xml', $svg)
$files = New-Object System.Collections.Specialized.StringCollection
[void]$files.Add($svgPath)
$data.SetFileDropList($files)
[System.Windows.Forms.Clipboard]::SetDataObject($data, $true)
