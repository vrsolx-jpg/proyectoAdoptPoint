param([switch]$Aplicar)
$ErrorActionPreference = 'Stop'
$argumentos = @((Join-Path $PSScriptRoot 'finalizar-firebase.mjs'))
if ($Aplicar) { $argumentos += '--aplicar' }
& node @argumentos
if ($LASTEXITCODE -ne 0) { throw 'No se pudo completar la configuración de Firebase.' }
