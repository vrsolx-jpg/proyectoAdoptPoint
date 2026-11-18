param([switch]$Aplicar)
$ErrorActionPreference = 'Stop'
$proyecto = Split-Path -Parent $PSScriptRoot
Push-Location -LiteralPath $proyecto
try {
    function FirebaseJson([string[]]$Argumentos) {
        $salida = & npx.cmd --yes firebase-tools@15.36.0 @Argumentos --project adoptpoint --json --non-interactive
        if ($LASTEXITCODE -ne 0) { throw "Firebase no completó: $($Argumentos -join ' '). Revisa que la sesión tenga acceso a adoptpoint." }
        $respuesta = ($salida -join [Environment]::NewLine) | ConvertFrom-Json
        if ($respuesta.status -ne 'success') { throw 'Firebase devolvió una respuesta sin éxito.' }
        return $respuesta.result
    }
    $paquete = 'io.ionic.starter'
    $firmas = @(
        '57:B6:93:3A:1C:8F:01:A5:8C:BD:92:1D:6F:AE:97:BF:78:B3:D7:DE',
        'EA:EA:45:96:23:33:64:A1:8C:F4:F6:D0:18:9B:74:61:FE:25:03:87'
    )
    $lista = FirebaseJson -Argumentos @('apps:list', 'ANDROID')
    $candidatas = @()
    foreach ($app in $lista) {
        $configuracion = FirebaseJson -Argumentos @('apps:sdkconfig', 'ANDROID', $app.appId)
        $configuracionJson = $configuracion.fileContents | ConvertFrom-Json
        if ($configuracionJson.project_info.project_id -ne 'adoptpoint') { throw 'El proyecto del archivo Android no coincide.' }
        if (@($configuracionJson.client | Where-Object { $_.client_info.android_client_info.package_name -eq $paquete -and $_.client_info.mobilesdk_app_id -eq $app.appId }).Count -gt 0) {
            $candidatas += $app
        }
    }
    if ($candidatas.Count -gt 1) { throw 'Hay varias aplicaciones Android con el mismo paquete. Revisa el proyecto antes de modificarlo.' }
    if ($candidatas.Count -eq 0) {
        if (-not $Aplicar) { Write-Output 'Falta registrar la aplicación Android io.ionic.starter.'; return }
        $appAndroid = FirebaseJson -Argumentos @('apps:create', 'ANDROID', 'AdoptPoint', '--package-name', $paquete)
    } else { $appAndroid = $candidatas[0] }
    $certificados = FirebaseJson -Argumentos @('apps:android:sha:list', $appAndroid.appId)
    $existentes = @($certificados | ForEach-Object { $_.shaHash.Replace(':', '').ToUpperInvariant() })
    foreach ($firma in $firmas) {
        if ($firma.Replace(':', '') -notin $existentes) {
            Write-Output "Falta la firma Android: $firma"
            if ($Aplicar) { $null = FirebaseJson -Argumentos @('apps:android:sha:create', $appAndroid.appId, $firma) }
        }
    }
    if (-not $Aplicar) { Write-Output 'Comprobación terminada. Usa -Aplicar para registrar firmas y desplegar las reglas.'; return }
    $configuracion = FirebaseJson -Argumentos @('apps:sdkconfig', 'ANDROID', $appAndroid.appId)
    $configuracionJson = $configuracion.fileContents | ConvertFrom-Json
    $clienteAndroid = @($configuracionJson.client | Where-Object { $_.client_info.android_client_info.package_name -eq $paquete -and $_.client_info.mobilesdk_app_id -eq $appAndroid.appId })[0]
    $web = @($clienteAndroid.oauth_client | Where-Object { $_.client_type -eq 3 })[0]
    if (-not $web.client_id) { throw 'Firebase todavía no entrega un cliente OAuth web. Comprueba que Google esté activado en Authentication.' }
    $googleTs = Get-Content -LiteralPath (Join-Path $proyecto 'src/environments/google.ts') -Raw
    $googleTs = $googleTs -replace "clienteGoogleWeb = '[^']+'", ("clienteGoogleWeb = '" + $web.client_id + "'")
    [IO.File]::WriteAllText((Join-Path $proyecto 'src/environments/google.ts'), $googleTs)
    [IO.File]::WriteAllText((Join-Path $proyecto 'android/app/google-services.json'), $configuracion.fileContents)
    $null = FirebaseJson -Argumentos @('deploy', '--only', 'firestore:rules')
    $huellasOAuth = @($clienteAndroid.oauth_client | Where-Object { $_.client_type -eq 1 } | ForEach-Object { $_.android_info.certificate_hash.Replace(':', '').ToUpperInvariant() })
    $oauthCompleto = @($firmas | Where-Object { $_.Replace(':', '') -notin $huellasOAuth }).Count -eq 0
    $resumen = [ordered]@{
        proyecto = 'adoptpoint'; appAndroid = $appAndroid.appId; paquete = $paquete
        firmasRegistradas = $firmas; reglasDesplegadas = $true
        clienteWeb = $web.client_id; oauthAndroidCompleto = $oauthCompleto
        clientesAndroid = @($clienteAndroid.oauth_client | Where-Object { $_.client_type -eq 1 } | ForEach-Object { $_.android_info.certificate_hash })
    }
    $resumen | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $proyecto 'diagnostico-firebase.json') -Encoding utf8
    Write-Output 'Listo: firmas Android registradas y reglas de Firestore desplegadas en adoptpoint.'
    if (-not $oauthCompleto) {
        Write-Warning 'Google aún no entrega los clientes OAuth Android de ambas firmas. Revisa Google Cloud > APIs y servicios > Credenciales y registra el paquete io.ionic.starter con las firmas indicadas.'
    }
} finally { Pop-Location }
