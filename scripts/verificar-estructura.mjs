import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const normalizar = (ruta) => ruta.replaceAll('\\', '/');
const nombre = (ruta) => normalizar(relative(raiz, ruta));
const errores = [];
const dependencias = new Map();
const recursos = new Set();
const configuracion = ts.readConfigFile(join(raiz, 'tsconfig.json'), ts.sys.readFile);
if (configuracion.error) throw new Error('No se pudo leer tsconfig.json.');
const opciones = ts.convertCompilerOptionsFromJson(configuracion.config.compilerOptions, raiz).options;

function listar(carpeta) {
  return readdirSync(carpeta, { withFileTypes: true }).flatMap((entrada) => {
    const ruta = join(carpeta, entrada.name);
    return entrada.isDirectory() ? listar(ruta) : [ruta];
  });
}

const archivos = listar(join(raiz, 'src'));
const fuentes = archivos.filter((ruta) => ruta.endsWith('.ts'));

for (const archivo of fuentes) {
  const ruta = nombre(archivo);
  const arbol = ts.createSourceFile(archivo, readFileSync(archivo, 'utf8'), ts.ScriptTarget.Latest, true);
  const referencias = [];
  dependencias.set(ruta, referencias);

  function comprobarImportacion(literal) {
    if (!literal.text.startsWith('.')) return;
    const resultado = ts.resolveModuleName(literal.text, archivo, opciones, ts.sys).resolvedModule;
    if (!resultado) {
      errores.push(ruta + ': import no encontrado: ' + literal.text);
      return;
    }
    const destino = nombre(resultado.resolvedFileName);
    referencias.push(destino);
    if (ruta.startsWith('src/app/nucleo/') && /^src\/app\/(paginas|compartido)\//.test(destino)) {
      errores.push(ruta + ': el núcleo no debe depender de la interfaz: ' + destino);
    }
    if (ruta.startsWith('src/app/compartido/') && destino.startsWith('src/app/paginas/')) {
      errores.push(ruta + ': un componente compartido no debe depender de una pantalla: ' + destino);
    }
  }

  function comprobarRecurso(literal) {
    const recurso = resolve(dirname(archivo), literal.text);
    if (!existsSync(recurso)) errores.push(ruta + ': plantilla o estilo no encontrado: ' + literal.text);
    else recursos.add(nombre(recurso));
  }

  function visitar(nodo) {
    if ((ts.isImportDeclaration(nodo) || ts.isExportDeclaration(nodo))
      && nodo.moduleSpecifier && ts.isStringLiteral(nodo.moduleSpecifier)) {
      comprobarImportacion(nodo.moduleSpecifier);
    }
    if (ts.isCallExpression(nodo) && nodo.expression.kind === ts.SyntaxKind.ImportKeyword
      && nodo.arguments[0] && ts.isStringLiteral(nodo.arguments[0])) {
      comprobarImportacion(nodo.arguments[0]);
    }
    if (ts.isPropertyAssignment(nodo)) {
      const propiedad = nodo.name.getText(arbol);
      if (['templateUrl', 'styleUrl'].includes(propiedad) && ts.isStringLiteral(nodo.initializer)) {
        comprobarRecurso(nodo.initializer);
      }
      if (propiedad === 'styleUrls' && ts.isArrayLiteralExpression(nodo.initializer)) {
        nodo.initializer.elements.filter(ts.isStringLiteral).forEach(comprobarRecurso);
      }
    }
    ts.forEachChild(nodo, visitar);
  }
  visitar(arbol);
}

const usados = new Set();
function recorrer(ruta) {
  if (usados.has(ruta)) return;
  usados.add(ruta);
  (dependencias.get(ruta) ?? []).forEach(recorrer);
}
recorrer('src/main.ts');
const angular = JSON.parse(readFileSync(join(raiz, 'angular.json'), 'utf8'));
for (const proyecto of Object.values(angular.projects)) {
  for (const configuracion of Object.values(proyecto.architect.build.configurations)) {
    for (const reemplazo of configuracion.fileReplacements ?? []) recorrer(reemplazo.with);
  }
}
for (const archivo of fuentes.map(nombre)) {
  if (!archivo.endsWith('.spec.ts') && !archivo.endsWith('.d.ts')
    && !archivo.startsWith('src/pruebas/') && !usados.has(archivo)) {
    errores.push(archivo + ': código sin referencia desde la aplicación.');
  }
}
for (const archivo of archivos.map(nombre)) {
  if (archivo.startsWith('src/app/') && /\.(html|scss)$/.test(archivo) && !recursos.has(archivo)) {
    errores.push(archivo + ': plantilla o estilo sin componente.');
  }
}

if (errores.length) {
  errores.forEach((error) => console.error(error));
  process.exitCode = 1;
} else {
  console.log('Estructura correcta: ' + fuentes.length + ' archivos TypeScript, imports y recursos resueltos; sin código huérfano ni dependencias de interfaz en el núcleo.');
}
