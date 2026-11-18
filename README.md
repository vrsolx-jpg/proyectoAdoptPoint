# AdoptPoint

Aplicación Ionic y Angular con componentes standalone, Signals, Capacitor y Firebase.

## Ejecutar y compilar

Desde la raíz del proyecto, en PowerShell:

```powershell
npm.cmd install
npm.cmd start
```

Para comprobar la estructura y generar la aplicación:

```powershell
npm.cmd run verificar:estructura
npm.cmd run lint
npm.cmd run build
```

Después de una compilación correcta, sincronizar Android:

```powershell
npx.cmd cap sync android
```

Los comandos terminados en `.cmd` evitan el bloqueo de `npm.ps1` por la política de ejecución de PowerShell.

## Organización

- `src/app/paginas`: pantallas, cada una con su componente, HTML, SCSS y pruebas.
- `src/app/compartido/componentes`: filtros, tarjetas, historias y esqueletos reutilizables.
- `src/app/nucleo`: modelos, servicios, configuración, datos y utilidades.
- `src/environments`: configuración por entorno y cliente Google.
- `firebase`: reglas, índices y diagnósticos generados.
- `scripts`: herramientas de mantenimiento y verificación.
- `android` e `ios`: proyectos nativos de Capacitor.

La guía completa está en [docs/estructura.md](docs/estructura.md).

## Firebase

Comprobar la configuración, sin modificar producción:

```powershell
node scripts/finalizar-firebase.mjs
```

Aplicar firmas y reglas cuando sea necesario:

```powershell
node scripts/finalizar-firebase.mjs --aplicar
```

El diagnóstico se guarda en `firebase/diagnosticos/diagnostico-firebase.json`. La carga controlada del catálogo continúa en `scripts/cargar-catalogo.mjs`; recibe `--datos` y `--estado`, con el archivo de cuentas fuera del repositorio.
