import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const archivo = fileURLToPath(import.meta.url);
const carpetaProyecto = resolve(dirname(archivo), '..');
const ejecutarArchivo = promisify(execFile);
const paquete = 'io.ionic.starter';
const firmas = [
  '57:B6:93:3A:1C:8F:01:A5:8C:BD:92:1D:6F:AE:97:BF:78:B3:D7:DE',
  'EA:EA:45:96:23:33:64:A1:8C:F4:F6:D0:18:9B:74:61:FE:25:03:87'
];
const normalizarFirma = (firma) => String(firma ?? '').replaceAll(':', '').toUpperCase();

function comandoFirebase() {
  try {
    return [createRequire(import.meta.url).resolve('firebase-tools/lib/bin/firebase.js')];
  } catch {
    const npx = join(dirname(process.execPath), 'node_modules/npm/bin/npx-cli.js');
    if (!existsSync(npx)) {
      throw new Error('No encontramos npm junto a Node.js. Revisa la instalación de Node.js y npm.');
    }
    return [npx, '--yes', 'firebase-tools@15.36.0'];
  }
}

function leerRespuesta(texto) {
  try {
    return JSON.parse(texto.trim().replace(/^\uFEFF/, ''));
  } catch {
    return null;
  }
}

function mensajeFirebase(respuesta) {
  if (typeof respuesta?.error === 'string') return respuesta.error;
  return respuesta?.error?.message || respuesta?.message || '';
}

export async function ejecutarFirebase(argumentos, raiz = carpetaProyecto) {
  let salida;
  try {
    salida = await ejecutarArchivo(process.execPath, [
      ...comandoFirebase(), ...argumentos, '--project', 'adoptpoint', '--json', '--non-interactive'
    ], { cwd: raiz, windowsHide: true, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024, timeout: 180_000 });
  } catch (error) {
    const detalle = mensajeFirebase(leerRespuesta(error.stdout ?? ''));
    throw new Error('Firebase no completó “' + argumentos.join(' ') + '”. '
      + (detalle || (error.killed ? 'La operación tardó demasiado.' : error.message)));
  }
  const respuesta = leerRespuesta(salida.stdout);
  if (respuesta?.status !== 'success') {
    throw new Error('Firebase no completó “' + argumentos.join(' ') + '”. '
      + (mensajeFirebase(respuesta) || 'No recibimos una respuesta JSON válida.'));
  }
  return respuesta.result;
}

function leerConfiguracion(resultado) {
  const configuracion = JSON.parse(resultado.fileContents);
  if (configuracion.project_info?.project_id !== 'adoptpoint') {
    throw new Error('El proyecto del archivo Android no coincide con adoptpoint.');
  }
  return configuracion;
}

function clienteDelPaquete(configuracion, appId) {
  return configuracion.client?.find((cliente) =>
    cliente.client_info?.android_client_info?.package_name === paquete
    && cliente.client_info?.mobilesdk_app_id === appId);
}

export async function finalizarFirebase({
  aplicar = false, raiz = carpetaProyecto, ejecutar = ejecutarFirebase, informar = console.log
} = {}) {
  const invocar = (argumentos) => ejecutar(argumentos, raiz);
  informar('Comprobando la sesión de Firebase y la aplicación Android de adoptpoint…');
  const aplicaciones = await invocar(['apps:list', 'ANDROID']);
  if (!Array.isArray(aplicaciones)) {
    throw new Error('Firebase no devolvió una lista de aplicaciones válida.');
  }
  const candidatas = [];
  for (const aplicacion of aplicaciones) {
    const configuracion = leerConfiguracion(await invocar(['apps:sdkconfig', 'ANDROID', aplicacion.appId]));
    if (clienteDelPaquete(configuracion, aplicacion.appId)) candidatas.push(aplicacion);
  }
  if (candidatas.length > 1) {
    throw new Error('Hay varias aplicaciones Android con el mismo paquete. Revisa el proyecto antes de modificarlo.');
  }
  let aplicacion = candidatas[0];
  if (!aplicacion) {
    if (!aplicar) {
      informar('Falta registrar la aplicación Android ' + paquete + '. Usa --aplicar para completar la configuración.');
      return;
    }
    informar('Registrando AdoptPoint para Android…');
    aplicacion = await invocar(['apps:create', 'ANDROID', 'AdoptPoint', '--package-name', paquete]);
  }
  if (!/^1:\d+:android:[a-zA-Z0-9]+$/.test(aplicacion.appId)) {
    throw new Error('Firebase devolvió un identificador Android inesperado.');
  }
  const certificados = await invocar(['apps:android:sha:list', aplicacion.appId]);
  if (!Array.isArray(certificados)) throw new Error('Firebase no devolvió una lista de certificados válida.');
  const existentes = new Set(certificados.map(({ shaHash }) => normalizarFirma(shaHash)));
  for (const firma of firmas) {
    if (!existentes.has(normalizarFirma(firma))) {
      informar('Falta registrar la firma Android: ' + firma);
      if (aplicar) await invocar(['apps:android:sha:create', aplicacion.appId, firma]);
    }
  }
  if (!aplicar) {
    informar('Comprobación terminada. Usa --aplicar para registrar firmas y desplegar las reglas.');
    return;
  }
  const resultado = await invocar(['apps:sdkconfig', 'ANDROID', aplicacion.appId]);
  const configuracion = leerConfiguracion(resultado);
  const cliente = clienteDelPaquete(configuracion, aplicacion.appId);
  const web = cliente?.oauth_client?.find(({ client_type }) => client_type === 3);
  if (!web?.client_id || !/^[a-zA-Z0-9.-]+\.apps\.googleusercontent\.com$/.test(web.client_id)) {
    throw new Error('Firebase todavía no entrega un cliente OAuth web. Comprueba que Google esté activado en Authentication y vuelve a ejecutar el script.');
  }
  const rutaGoogle = join(raiz, 'src/environments/google.ts');
  const original = await readFile(rutaGoogle, 'utf8');
  if (!/clienteGoogleWeb = '[^']+'/.test(original)) {
    throw new Error('No encontramos clienteGoogleWeb en src/environments/google.ts.');
  }
  await writeFile(rutaGoogle, original.replace(/clienteGoogleWeb = '[^']+'/, () =>
    "clienteGoogleWeb = '" + web.client_id + "'"));
  await writeFile(join(raiz, 'android/app/google-services.json'), resultado.fileContents);
  informar('Desplegando únicamente las reglas de Firestore…');
  await invocar(['deploy', '--only', 'firestore:rules']);
  const clientesAndroid = (cliente.oauth_client ?? []).filter(({ client_type }) => client_type === 1)
    .map(({ android_info }) => android_info?.certificate_hash).filter(Boolean);
  const huellas = new Set(clientesAndroid.map(normalizarFirma));
  const resumen = {
    proyecto: 'adoptpoint', appAndroid: aplicacion.appId, paquete, firmasRegistradas: firmas,
    reglasDesplegadas: true, clienteWeb: web.client_id,
    oauthAndroidCompleto: firmas.every((firma) => huellas.has(normalizarFirma(firma))),
    clientesAndroid
  };
  await writeFile(join(raiz, 'diagnostico-firebase.json'), JSON.stringify(resumen, null, 2) + '\n');
  informar('Listo: firmas Android registradas y reglas de Firestore desplegadas en adoptpoint.');
  if (!resumen.oauthAndroidCompleto) {
    informar('Pendiente: Google aún no entrega los clientes OAuth Android de ambas firmas. Revisa Google Cloud > APIs y servicios > Credenciales para el paquete ' + paquete + '.');
  }
  informar('Diagnóstico guardado en ' + join(raiz, 'diagnostico-firebase.json'));
  return resumen;
}

const esPrincipal = process.argv[1]
  && resolve(process.argv[1]).toLowerCase() === archivo.toLowerCase();
if (esPrincipal) {
  const opciones = process.argv.slice(2);
  if (opciones.some((opcion) => !['--aplicar', '--ayuda'].includes(opcion))) {
    console.error('Opción desconocida. Usa node scripts/finalizar-firebase.mjs [--aplicar].');
    process.exitCode = 1;
  } else if (opciones.includes('--ayuda')) {
    console.log('Uso: node scripts/finalizar-firebase.mjs --aplicar\nRegistra las firmas Android, descarga su configuración y despliega las reglas en adoptpoint.');
  } else {
    finalizarFirebase({ aplicar: opciones.includes('--aplicar') }).catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
  }
}
