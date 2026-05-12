# IG Non-Followers

Encontrá qué cuentas de Instagram seguís que no te siguen de vuelta, comparando los archivos de la **exportación oficial de datos** de tu propia cuenta.

> **Todo corre local en tu navegador. Cero servidor, cero API de Instagram, cero scraping.**

---

## Cómo funciona

La idea es simple: Instagram te deja descargar tus datos en JSON desde el Centro de cuentas. Adentro vienen dos archivos —`following.json` y `followers_1.json`— con la gente que seguís y la que te sigue. La app cruza las dos listas y te muestra:

- **Seguís y no te devuelven** — la gente que vos seguís y no te sigue de vuelta.
- **Te siguen y vos no** — la inversa, por si te interesa.

Por cada cuenta tenés botones para abrir el perfil en una pestaña nueva, y podés tildar varias para abrirlas todas de una y desseguirlas manualmente en Instagram.

---

## Privacidad

- **Nada se sube a ningún servidor.** Aunque la app esté hecha con Next.js, el "servidor" solo sirve los archivos HTML y JavaScript. Después de que la página cargó, podés desconectar internet y todo sigue funcionando: el parsing de los JSON, la comparación de listas y la UI corren en tu propia pestaña.
- **No usa la API de Instagram.** No hay login, no hay tokens, no hay scraping de perfiles. Solo lee los archivos que vos descargaste desde el Centro de cuentas.
- **Persistencia 100% local.** El progreso (listas parseadas, cuentas que marcaste como hechas) se guarda en `localStorage` de tu propio navegador. Si limpiás el storage, no queda nada en ningún lado.
- **Sin tracking ni analytics.** No hay scripts de terceros, ni cookies, ni telemetría.

Podés verificarlo vos mismo abriendo la pestaña Network del DevTools mientras usás la app: las únicas requests son a `localhost` (los assets de la página). No hay tráfico saliente.

---

## Pasos para usarla

### 1. Pedile a Instagram tus datos

Desde la app de Instagram o desde [instagram.com](https://www.instagram.com):

1. **Configuración → Centro de cuentas → Tu información y permisos → Descargar tu información**
2. Elegí tu cuenta.
3. En *Tipo de información* tildá **Seguidores y seguidos**.
4. Formato: **JSON**. Rango: **Todo el tiempo**. Calidad: la que prefieras.
5. Solicitá la descarga. Te llega un mail con un link cuando esté listo (a veces tarda minutos, a veces horas).

### 2. Extraé el ZIP

Cuando llegue el ZIP, extraelo. Los archivos que necesita la app están en:

```
<carpeta-del-zip>/connections/followers_and_following/
├── following.json       # gente que seguís
└── followers_1.json     # gente que te sigue
```

> Si tenés más de unos miles de seguidores, Instagram parte el archivo en `followers_1.json`, `followers_2.json`, etc. Subí todos los `followers_N.json` que aparezcan.

### 3. Correr la app

```bash
npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000), arrastrá los archivos al uploader y listo.

---

## Features

- **Stats al toque:** seguís, te siguen, no te devuelven, vos no los seguís.
- **Buscador** por username.
- **Multi-selección con checkboxes** para procesar varias cuentas de una.
- **"Abrir N en pestañas"** abre los perfiles seleccionados en pestañas nuevas con un pequeño delay (para esquivar el bloqueador de popups del navegador) y los oculta automáticamente de la lista.
- **Persistencia automática** en `localStorage` — refrescás o cerrás el browser y tu progreso sigue ahí.
- **Botón "Borrar todo guardado"** para empezar de cero.

---

## ¿Por qué no automatiza el "Dejar de seguir"?

Investigué y no se puede hacer desde una app web sin ponerte en riesgo:

- El endpoint para desseguir requiere cookie de sesión + token CSRF de `instagram.com`. Por CORS no podés tocarlo desde otra app.
- Aunque pudieras (vía extensión de navegador que corra dentro de instagram.com), Instagram detecta patrones de bulk-unfollow y suspende cuentas.

Por eso el flujo es: tildás varios, le das *Abrir N en pestañas*, y desseguís manualmente cada uno en su pestaña. Es más lento pero no te arriesga la cuenta.

---

## Stack

- [Next.js 15](https://nextjs.org) (App Router)
- [React 19](https://react.dev)
- [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS](https://tailwindcss.com)

Sin dependencias de runtime adicionales — todo el parsing es vanilla JS.

---

## Licencia

[MIT](LICENSE). Hacé lo que quieras con esto.

---

## Disclaimer

Este proyecto **no está afiliado, asociado, autorizado, respaldado, ni de ninguna forma conectado oficialmente con Meta Platforms, Inc. o Instagram.** "Instagram" y los logos relacionados son marcas registradas de sus respectivos dueños.

La app solo procesa archivos que vos descargás voluntariamente desde tu propia cuenta mediante la herramienta oficial de exportación de datos que ofrece Instagram. No accede ni interactúa de ninguna manera con los servidores de Instagram.

---

### English summary

This tool compares your `following.json` and `followers_1.json` from Instagram's official data export to show who you follow that doesn't follow you back. Everything runs locally in your browser — no server, no Instagram API, no scraping. Download your data from Instagram → Settings → Accounts Center → Download your information (JSON format) → drag the two files into the uploader.
