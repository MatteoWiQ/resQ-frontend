# ResQ — Frontend (Angular)

Aplicación web (frontend) del proyecto **ResQ**, hecha con **Angular**. ResQ conecta personas
con refugios, veterinarias y voluntarios para reportar y rescatar animales en situación de
riesgo.

Esta guía explica **cómo instalar el proyecto desde cero**, pensada para alguien que recién
empieza en Angular y en el desarrollo frontend. No necesitas ser experto: ve paso a paso.

> **Orden recomendado:** para usar la app con datos (login, reportes, mapa) primero levanta
> el **backend** siguiendo su README: <https://github.com/fatolaa/resQ-backend>. Después
> sigue esta guía. Sin backend la app abre igual, pero las pantallas con datos fallan.

---

## 1. Conceptos básicos (lee esto primero)

Antes de instalar, conviene entender cuatro palabras que vas a ver todo el tiempo:

- **Frontend**: la parte de la aplicación que se ejecuta en el navegador del usuario (lo que ves
  y con lo que haces clic). Este repositorio es la parte de "adelante".
- **Backend**: el servidor que guarda los datos y aplica las reglas de negocio. Es otro proyecto
  aparte que corre en `http://localhost:8080`. El frontend le pide información por internet.
- **Node.js**: un programa que permite ejecutar JavaScript fuera del navegador. Las herramientas
  de desarrollo (como Angular) lo necesitan para funcionar.
- **npm**: el "gestor de paquetes" que viene con Node.js. Se encarga de descargar e instalar las
  librerías (dependencias) que el proyecto necesita.

También usarás:

- **Angular**: el framework con el que está hecho el proyecto. Te da la estructura y las
  herramientas para construir la interfaz.
- **TypeScript**: una versión de JavaScript con "tipos". Es lo que se escribe en el código
  (archivos `.ts`).

> Todas las dependencias son **paquetes que otros ya programaron** y que reutilizamos. `npm`
> las descarga por ti; no las escribes ni las copias a mano.

---

## 2. Requisitos previos

Antes de empezar necesitas tener instalado en tu computadora:

| Herramienta | Para qué sirve | Versión recomendada |
| ----------- | -------------- | ------------------- |
| **Node.js** | Ejecutar las herramientas de desarrollo | 20.19+, 22.12+ o 24+ |
| **npm** | Instalar dependencias (viene con Node.js) | 11.x |
| **Git** | Descargar el código del repositorio | Cualquier versión reciente |
| **Editor de código** | Escribir el código | VS Code (recomendado) |

### 2.1 Instalar Node.js

1. Entra a <https://nodejs.org> y descarga la versión **LTS** (la que dice "Recommended").
2. Ejecuta el instalador y acepta las opciones por defecto. En Windows, deja marcada la opción
   **"Add to PATH"** (agregar al PATH) para poder usar `node` y `npm` desde la terminal.
3. **Cierra y vuelve a abrir** la terminal para que reconozca la instalación.

Verifica que quedó bien instalado abriendo una terminal y escribiendo:

```bash
node --version
npm --version
```

Debe mostrar algo como `v24.14.0` y `11.19.0`. Si dice "no se reconoce el comando", cierra la
terminal y ábrela de nuevo; si sigue igual, reinstala Node.js aceptando agregarlo al PATH.

> **Consejo:** si trabajas en varios proyectos con distintas versiones de Node, usa un gestor de
> versiones como [nvm](https://github.com/nvm-sh/nvm) (macOS/Linux) o
> [nvm-windows](https://github.com/coreybutler/nvm-windows) (Windows).

### 2.2 Instalar un editor de código

Recomendamos **Visual Studio Code**: <https://code.visualstudio.com>. Al abrirlo, instala estas
extensiones (te ahorran mucho tiempo):

- **Angular Language Service** (autocompletado e indicaciones en las plantillas HTML).
- **Prettier – Code formatter** (para formatear el código de forma uniforme).

### 2.3 Verificar Git

```bash
git --version
```

Si no lo tienes, descárgalo de <https://git-scm.com>.

---

## 3. Descargar el proyecto (clonar)

"Clonar" significa copiar el repositorio a tu computadora. Abre una terminal en la carpeta donde
quieras guardar el proyecto y ejecuta:

```bash
git clone <URL-del-repositorio>
```

Luego entra a la carpeta del proyecto (donde está este `README.md`):

```bash
cd resQ-frontend
```

---

## 4. Instalar las dependencias (el paso más importante)

Con la terminal ubicada en la carpeta del proyecto, ejecuta **un solo comando**:

```bash
npm install
```

### ¿Qué hace `npm install`?

1. Lee el archivo **`package.json`**, que lista todas las librerías que el proyecto necesita.
2. Las descarga desde internet y las guarda en una carpeta llamada **`node_modules/`**.
3. Genera/actualiza **`package-lock.json`**, que fija las versiones exactas instaladas para que
   todos los desarrolladores tengan lo mismo.

Cuando termine, ya tienes todo lo necesario. **No necesitas instalar cada dependencia a mano**:
`package.json` ya las declara todas.

> **Alternativa: `npm ci`.** Instala exactamente las versiones de `package-lock.json` sin
> modificarlo. Es útil si quieres tener lo mismo que el resto del equipo (es lo que usa Netlify
> al desplegar).

> **Es normal** que al final `npm install` diga algo como `13 vulnerabilities (...)`. Son avisos
> de `npm audit` sobre dependencias y **no impiden trabajar**. No ejecutes `npm audit fix --force`
> sin consultarlo con el equipo: puede actualizar Angular a otra versión y romper el proyecto.

> ⚠️ **Importante:** la carpeta `node_modules/` puede pesar cientos de MB y **no se sube al
> repositorio** (está en `.gitignore`). No la copies ni la borres a la ligera. Si algo se corrompe,
> puedes borrarla y volver a ejecutar `npm install`.

### Dependencias que instala el proyecto

Estas son las principales que verás en `package.json` (no hace falta instalarlas una por una,
`npm install` ya las trae):

**De ejecución (la app las usa para funcionar):**

| Paquete | Para qué sirve |
| ------- | -------------- |
| `@angular/core`, `@angular/common`, `@angular/forms`, `@angular/router`, `@angular/platform-browser` | El framework Angular y sus módulos base (componentes, formularios, rutas). |
| `rxjs` | Manejo de datos "en el tiempo" (peticiones HTTP, eventos); es la base reactiva de Angular. |
| `zone.js` | Permite a Angular detectar cambios y actualizar la pantalla automáticamente. |
| `tslib` | Utilidades que TypeScript necesita en tiempo de ejecución. |
| `leaflet` + `@types/leaflet` | Librería de mapas interactivos (para mostrar casos en el mapa). |

**De desarrollo (solo se usan mientras programas, no van a producción):**

| Paquete | Para qué sirve |
| ------- | -------------- |
| `@angular/cli` | La "Angular CLI": comandos como `ng serve`, `ng build`, `ng generate`. |
| `@angular/build`, `@angular/compiler-cli` | Herramientas que compilan y empaquetan la app. |
| `typescript` | El compilador de TypeScript a JavaScript. |
| `vitest` + `jsdom` | Ejecutor de pruebas unitarias y un navegador simulado. |
| `prettier` | Formateador de código para mantener un estilo uniforme. |

---

## 5. El backend y el "proxy" (para que funcione completo)

El frontend no guarda datos por sí solo: se los pide al **backend**. En desarrollo, el backend
corre en `http://localhost:8080`. Para evitar problemas de conexión, el proyecto tiene un archivo
**`proxy.conf.json`** que redirige todas las peticiones que empiezan con `/api` hacia ese backend:

```json
{
  "/api": {
    "target": "http://localhost:8080",
    "secure": false,
    "changeOrigin": true
  }
}
```

Esto significa que cuando el frontend llama a `/api/usuarios`, en realidad el backend lo recibe
en `http://localhost:8080/api/usuarios`. **No tienes que configurar nada**: ya está enganchado al
comando de desarrollo (lo verás en `angular.json`, en `serve → options → proxyConfig`).

> Para probar funciones que usan datos (login, listados, etc.) el **backend debe estar corriendo**
> en `http://localhost:8080`. Si el backend está apagado, verás errores de red en el navegador.

### ¿Y el `DB_PASSWORD` / la base de datos?

Los datos viven en la base de datos del backend. Para el frontend **no necesitas configurar nada**;
es responsabilidad del equipo de backend. Solo asegúrate de que el backend esté levantado.

---

## 6. Levantar el servidor de desarrollo

Ahora sí, enciende la aplicación. Dos opciones equivalentes:

```bash
npm start
```

o, si prefieres el comando de Angular directamente:

```bash
npx ng serve
```

Cuando termine de compilar, abre tu navegador en:

```text
http://localhost:4200/
```

La aplicación **se recarga sola** cada vez que guardas un archivo del código: no hace falta
reiniciar el servidor. Para detenerlo, presiona `Ctrl + C` en la terminal.

> La primera vez tarda un poco más porque compila todo. Las siguientes son más rápidas.

---

## 7. Compilar para producción (build)

Para generar la versión optimizada que se publica en un servidor:

```bash
npm run build
```

El resultado queda en la carpeta **`dist/`**. Esa es la carpeta que se sube a un hosting. La
compilación de producción aplica optimizaciones (minifica el código, etc.).

> **Es normal** ver avisos amarillos `[WARNING]` como `bundle initial exceeded maximum budget`
> o `Module 'leaflet' ... is not ESM`. Son advertencias de tamaño y no detienen la compilación.
> Si al final aparece `Output location: ...dist/angular-frontend`, el build salió bien.

Para compilar automáticamente cada vez que cambias algo, en modo desarrollo:

```bash
npm run watch
```

---

## 8. Ejecutar las pruebas (tests)

El proyecto usa **Vitest** como ejecutor de pruebas:

```bash
npm test
```

Esto ejecuta las pruebas (archivos `*.spec.ts`) y te dice si algo se rompió. Ejecutarlas antes de
subir cambios ayuda a no romper el trabajo de los demás.

---

## 9. Comandos útiles de Angular CLI

La Angular CLI genera archivos con la estructura correcta. Como el proyecto la tiene instalada,
puedes usarla con `npx ng <comando>` (o `npm run ng -- <comando>`):

```bash
# Crear un componente nuevo
npx ng generate component features/mi-componente

# Crear un servicio
npx ng generate service core/services/mi-servicio

# Ver todas las opciones disponibles
npx ng generate --help
```

> Usar la CLI para crear archivos evita errores de tipeo y sigue las convenciones del proyecto.

---

## 10. Estructura del proyecto

```text
src/
├── app/
│   ├── core/            # Lo global: servicios (API), interceptores, guards, i18n (traducciones)
│   │   ├── guards/          # Controlan el acceso a rutas (ej. solo admin)
│   │   ├── interceptors/    # Añaden el token a las peticiones, manejan errores de auth
│   │   ├── services/        # Lógica de comunicación con el backend (usuario, reporte...)
│   │   └── i18n/            # Textos/traducciones de la app
│   ├── features/        # Funcionalidades por "pantalla grande"
│   │   ├── auth/            # Login y registro
│   │   ├── landing/         # Página de inicio y mapa
│   │   ├── profile/         # Perfil y crear reporte
│   │   └── admin/           # Panel de administración
│   └── shared/          # Reutilizable en varias partes: componentes, modelos, constantes
│       ├── components/      # Componentes pequeños reutilizables
│       ├── constants/       # Valores fijos (roles, tipos de caso, filtros)
│       └── models/          # Interfaces de datos (Usuario, Reporte...)
├── main.ts              # Punto de entrada de la aplicación
└── styles.css           # Estilos globales
```

En pocas palabras: **`core`** es lo transversal (servicios y configuración), **`features`** son las
pantallas/funcionalidades, y **`shared`** es lo que se reutiliza.

---

## 11. Archivos de configuración que verás

| Archivo | Qué es |
| ------- | ------ |
| `package.json` | Lista de dependencias y comandos (`scripts`) del proyecto. |
| `package-lock.json` | Versiones exactas instaladas. **Se sube al repo**; no lo edites a mano. |
| `angular.json` | Configuración de Angular: cómo compilar, servir y testear. |
| `tsconfig.json` | Cómo se compila TypeScript. |
| `proxy.conf.json` | Redirige `/api` al backend en `localhost:8080`. |
| `.prettierrc` | Reglas de formato del código. |
| `.editorconfig` | Ajustes de estilo (indentación, saltos de línea). |

---

## 12. Problemas comunes (y cómo resolverlos)

**`node` o `npm` no se reconocen como comando**
→ Cierra y abre la terminal. Si sigue, reinstala Node.js dejando marcada la opción "Add to PATH".

**Errores raros al compilar, tras cambiar de rama o de Node**
→ Borra `node_modules` y reinstala:
```bash
rm -rf node_modules package-lock.json   # En Windows PowerShell: Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
```

**El puerto 4200 está ocupado**
→ Cierra la app que lo usa, o levántala en otro puerto:
```bash
npx ng serve --port 4300
```

**Los errores al llamar a la API (login, listados) no responden**
→ Verifica que el **backend esté corriendo** en `http://localhost:8080`.

**PowerShell no deja ejecutar scripts (`npm.ps1` no se puede cargar)**
→ Abre PowerShell como administrador y ejecuta una vez:
```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

**`npm install` se queda pegado o falla por red**
→ Revisa tu conexión; prueba de nuevo. Si persiste, limpia la caché:
```bash
npm cache clean --force
npm install
```

---

## 13. Recursos para aprender Angular

- Documentación oficial de Angular: <https://angular.dev>
- Tutorial "Tour of Heroes": <https://angular.dev/tutorials/tour-of-heroes>
- Guía de TypeScript: <https://www.typescriptlang.org/docs/>

---

## Resumen rápido (para quien ya instaló todo)

```bash
npm install     # 1. instalar dependencias (una vez)
npm start       # 2. levantar la app en http://localhost:4200
npm test        # 3. correr las pruebas
npm run build   # 4. compilar para producción (carpeta dist/)
```

> Recuerda: para que la app funcione contra datos reales, el **backend debe estar corriendo** en
> `http://localhost:8080`.
