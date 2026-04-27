Add-Type -AssemblyName System.Windows.Forms
$svg = Get-Content -Raw -Encoding UTF8 'C:\Users\Silian\PycharmProjects\PProject\docs\figma_editable_replica.svg'
[System.Windows.Forms.Clipboard]::SetText($svg, [System.Windows.Forms.TextDataFormat]::UnicodeText)
