# Publicar el backend de Cheles.py

## Arquitectura
- GitHub Pages sigue publicando la interfaz en https://yahlpzzzcap.github.io/Juegos/
- Render ejecuta server.js.
- Neon proporciona PostgreSQL persistente.

## 1. Crear la base de datos en Neon
1. Crea un proyecto PostgreSQL en Neon.
2. Copia la cadena de conexión (connection string) desde el panel de Neon.
3. No publiques esa cadena en GitHub ni la compartas en capturas.

El servidor crea automáticamente las tablas players, friendships y friend_requests al iniciar.

## 2. Crear el servicio en Render
1. Crea un Web Service conectado al repositorio YahLpZzzCap/Juegos.
2. Selecciona la rama feature/cloud-database para probar primero.
3. Render puede detectar render.yaml. Si configuras el servicio manualmente:
   - Runtime: Node
   - Build command: npm install
   - Start command: npm start
4. En Environment agrega:
   - DATABASE_URL = cadena de conexión de Neon
   - NODE_ENV = production
   - FRONTEND_ORIGIN = https://yahlpzzzcap.github.io
5. Despliega y copia la URL pública que Render asigne.

## 3. Conectar GitHub Pages con Render
1. Abre api-config.js en esta rama.
2. Reemplaza https://TU-SERVICIO.onrender.com por la URL real de Render.
3. Guarda el cambio.
4. Cuando la rama esté lista, integra los cambios en main para que GitHub Pages los publique.

## 4. Comprobar
Abre https://TU-SERVICIO.onrender.com/api/ping. Debe responder {"ok":1}.
Luego abre la página de GitHub Pages, crea un perfil de prueba y comprueba que aparece un código de jugador.

## Notas
- El código de jugador de cuatro cifras es público; el token de acceso se guarda en el navegador y su hash en PostgreSQL.
- Si se pierde el almacenamiento local del navegador, se pierde el token. Guarda una copia segura del token antes de cambiar de dispositivo; una recuperación de cuenta requerirá implementar un mecanismo adicional.
- Los datos guardados anteriormente solo en localStorage no se migran automáticamente.
- Los perfiles antiguos del servidor db.json tampoco se importan automáticamente. Haz una copia de ese archivo antes de cambiar de backend.
- El plan gratuito de Render puede dormir por inactividad. La primera solicitud posterior puede tardar en responder.
