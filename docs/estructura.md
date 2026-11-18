# Estructura de AdoptPoint

La aplicación se organiza por responsabilidad. Las pantallas componen la interfaz; los servicios coordinan Firebase y Capacitor; los modelos definen los contratos de datos; las utilidades contienen operaciones independientes de la interfaz.

```text
src/
  app/
    app.component.*              Arranque, logo inicial y contenedor principal
    app.routes.ts                Rutas públicas y carga diferida
    paginas/
      bienvenida/
      acceso/
      login/
      registro/
      paginaprincipal/
      publicar/
      perfil/
      ajustes/
      notificaciones/
      terminos/
      creditos/
    compartido/
      componentes/
        esqueleto/
        filtros/
        historia-mascota/
        tarjetas-mascotas/
    nucleo/
      configuracion/firebase.ts  Única instancia de Auth y Firestore
      modelos/                   Publicación, perfil, notificación y filtros
      servicios/                 Autenticación, usuarios, publicaciones, GPS y avisos
      utilidades/                Imágenes, teléfonos, títulos y filtrado
      datos/creditos-catalogo.ts  Autoría y licencias del catálogo
  assets/                        Imágenes e iconos con direcciones estables
  environments/                  Configuración de desarrollo y producción
  pruebas/configuracion.ts       Preparación común de las pruebas
  main.ts                        Inicio de Angular e Ionic
  global.scss                    Estilos comunes
  theme/variables.scss           Colores y tipografía de AdoptPoint
firebase/
  firestore.rules
  firestore.indexes.json
  diagnosticos/                  Archivos generados, excluidos de Git
scripts/
  cargar-catalogo.mjs
  finalizar-firebase.mjs
  finalizar-firebase.ps1          Adaptador opcional del mismo comando Node
  verificar-estructura.mjs
docs/
  estructura.md
```

## Reglas para mantener el orden

1. Una nueva pantalla se crea en `paginas/nombre`, con sus archivos relacionados juntos.
2. Un componente utilizado por varias pantallas se ubica en `compartido/componentes`.
3. Los modelos compartidos se importan desde `nucleo/modelos`, sin depender de páginas o servicios.
4. La lógica de Firebase y Capacitor pertenece a `nucleo/servicios`. Los servicios no importan pantallas.
5. Las funciones sin estado de interfaz pertenecen a `nucleo/utilidades`.
6. Las pruebas permanecen junto al archivo que comprueban. Los datos de prueba se definen dentro de las pruebas, sin incorporarlos al catálogo de producción.
7. Ejecutar `npm.cmd run verificar:estructura` después de mover o crear archivos. Revisa imports, plantillas, estilos, dependencias entre carpetas y código sin uso.

## Compatibilidad

Las direcciones públicas de la aplicación se conservan. La bienvenida sigue en `/tabs/tab1` para mantener los enlaces anteriores, aunque su código ahora vive en `paginas/bienvenida`. `/tabs/acceso` redirige a `/acceso`.

Se retiraron las pantallas vacías Tab 2 y Tab 3, el componente ExploreContainer, el servicio genérico FirestoreService, el segundo archivo de acceso a Firebase y el catálogo de demostración sin uso. La aplicación usa las publicaciones de Firestore.

Las direcciones de imágenes existentes se mantienen: una publicación guardada puede hacer referencia a ellas. Los proyectos nativos, las colecciones de Firestore y las claves de almacenamiento del dispositivo mantienen sus nombres.

## Archivos de la raíz y archivos generados

`package.json`, los archivos `tsconfig`, `angular.json`, `capacitor.config.ts`, `firebase.json` y `ionic.config.json` permanecen en la raíz porque las herramientas los utilizan como puntos de entrada.

`node_modules`, `.angular`, `www` y las carpetas nativas de compilación se regeneran mediante las herramientas. VS Code las oculta del explorador para facilitar la navegación, y Git las ignora. No contienen el código fuente que se debe editar.

Los diagnósticos de Firebase se guardan en `firebase/diagnosticos`. El adaptador PowerShell delega en el script Node para evitar mantener dos implementaciones distintas.
