import { readFile, rename, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: { datos: { type: 'string' }, estado: { type: 'string' } }
});
if (!values.datos || !values.estado) {
  throw new Error('Indica --datos y --estado. Guarda el estado de las cuentas en una carpeta privada fuera del repositorio.');
}
const archivoEstado = resolve(values.estado);
const entorno = await readFile(new URL('../src/environments/environment.ts', import.meta.url), 'utf8');
const clave = entorno.match(/apiKey:\s*['"]([^'"]+)['"]/)?.[1];
const proyecto = entorno.match(/projectId:\s*['"]([^'"]+)['"]/)?.[1];
if (proyecto !== 'adoptpoint' || !clave) {
  throw new Error('La configuración de Firebase no corresponde a adoptpoint.');
}
const fichas = JSON.parse(await readFile(resolve(values.datos), 'utf8'));
let estado;
try {
  estado = JSON.parse(await readFile(archivoEstado, 'utf8'));
} catch (error) {
  if (error.code !== 'ENOENT') {
    throw error;
  }
  estado = { cuentas: {} };
}
if (!Array.isArray(fichas) || fichas.length === 0 || fichas.length > 20) {
  throw new Error('La carga debe contener entre 1 y 20 fichas.');
}

async function persistirEstado() {
  await writeFile(archivoEstado + '.tmp', JSON.stringify(estado, null, 2), { mode: 0o600 });
  await rename(archivoEstado + '.tmp', archivoEstado);
}

async function solicitar(url, opciones = {}) {
  const respuesta = await fetch(url, { ...opciones, signal: AbortSignal.timeout(20_000) });
  const datos = await respuesta.json();
  if (!respuesta.ok) {
    const error = new Error(datos.error?.message || 'Falló la solicitud a Firebase.');
    error.codigo = datos.error?.message;
    error.estado = respuesta.status;
    throw error;
  }
  return datos;
}

function autenticar(operacion, datos) {
  return solicitar('https://identitytoolkit.googleapis.com/v1/accounts:' + operacion + '?key=' + clave, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });
}

function convertir(valor) {
  if (valor === null) return { nullValue: null };
  if (typeof valor === 'string') return { stringValue: valor };
  if (typeof valor === 'boolean') return { booleanValue: valor };
  if (typeof valor === 'number') {
    return Number.isInteger(valor) ? { integerValue: String(valor) } : { doubleValue: valor };
  }
  if (Array.isArray(valor)) return { arrayValue: { values: valor.map(convertir) } };
  return { mapValue: { fields: campos(valor) } };
}

function campos(datos) {
  return Object.fromEntries(Object.entries(datos).map(([nombre, valor]) => [nombre, convertir(valor)]));
}

const base = 'https://firestore.googleapis.com/v1/projects/' + proyecto + '/databases/(default)/documents';
const documentos = new Map();
let pagina = '';
do {
  const consulta = new URLSearchParams({ key: clave, pageSize: '100' });
  if (pagina) consulta.set('pageToken', pagina);
  const resultado = await solicitar(base + '/publicaciones?' + consulta);
  for (const documento of resultado.documents ?? []) {
    documentos.set(documento.name.split('/').at(-1), documento);
  }
  pagina = resultado.nextPageToken ?? '';
} while (pagina);

let nuevas = 0;
let existentes = 0;
for (const ficha of fichas) {
  if (!/^[a-z]+$/.test(ficha.id) || !/^3\d{9}$/.test(ficha.datos.telefono)
    || !ficha.publicador || !ficha.datos.descripcion || ficha.fotos.length !== 1
    || ficha.fotos[0].length > 240_000 || !ficha.fotos[0].startsWith('data:image/jpeg;base64,')) {
    throw new Error('La ficha ' + ficha.id + ' tiene datos inválidos.');
  }
  const idDocumento = 'catalogo-' + ficha.id;
  const actual = documentos.get(idDocumento);
  if (actual) {
    if (actual.fields?.datos?.mapValue?.fields?.nombre?.stringValue !== ficha.datos.nombre) {
      throw new Error('Ya existe una ficha distinta con ID ' + idDocumento);
    }
    existentes++;
    console.log('Conservada', idDocumento);
    continue;
  }
  estado.cuentas[ficha.id] ??= {
    correo: 'catalogo.' + ficha.id + '@example.invalid',
    contrasena: randomBytes(24).toString('base64url') + '!Aa9',
    creadaEn: new Date().toISOString()
  };
  const cuenta = estado.cuentas[ficha.id];
  await persistirEstado();
  let sesion;
  try {
    sesion = await autenticar('signUp', { email: cuenta.correo, password: cuenta.contrasena, returnSecureToken: true });
  } catch (error) {
    if (error.codigo !== 'EMAIL_EXISTS') throw error;
    sesion = await autenticar('signInWithPassword', { email: cuenta.correo, password: cuenta.contrasena, returnSecureToken: true });
  }
  cuenta.uid = sesion.localId;
  await persistirEstado();

  await autenticar('update', { idToken: sesion.idToken, displayName: ficha.publicador, returnSecureToken: true });
  const cabeceras = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + sesion.idToken };
  const perfil = { nombre: ficha.publicador, ciudad: ficha.datos.ciudad, telefono: ficha.datos.telefono };
  await solicitar(base + '/usuarios/' + cuenta.uid + '?key=' + clave, {
    method: 'PATCH', headers: cabeceras, body: JSON.stringify({ fields: campos(perfil) })
  });
  const publicacion = {
    usuarioId: cuenta.uid, publicador: ficha.publicador, caso: ficha.caso,
    creadaEn: cuenta.creadaEn, estado: 'activa', datos: ficha.datos, fotos: ficha.fotos
  };
  const nombreDocumento = 'projects/' + proyecto + '/databases/(default)/documents/publicaciones/' + idDocumento;
  await solicitar(base + ':commit?key=' + clave, {
    method: 'POST',
    headers: cabeceras,
    body: JSON.stringify({
      writes: [{ update: { name: nombreDocumento, fields: campos(publicacion) }, currentDocument: { exists: false } }]
    })
  });
  const guardada = await solicitar(base + '/publicaciones/' + idDocumento + '?key=' + clave, { headers: cabeceras });
  if (guardada.fields?.usuarioId?.stringValue !== cuenta.uid) {
    throw new Error('No se pudo verificar la ficha ' + idDocumento);
  }
  cuenta.publicacionId = idDocumento;
  await persistirEstado();
  nuevas++;
  console.log('Publicada', idDocumento);
}
console.log(JSON.stringify({ proyecto, nuevas, existentes }));
