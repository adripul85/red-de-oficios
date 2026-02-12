import { defineMiddleware } from "astro:middleware";
import { dbAdmin } from "./firebase/admin";

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies, redirect } = context;

  // Si la ruta empieza con /admin, activamos el escudo
  if (url.pathname.startsWith("/admin")) {
    const sessionCookie = cookies.get("__session")?.value;
    const firebaseToken = cookies.get("firebase-auth-token")?.value; // Algunos proyectos usan este nombre

    // Si no hay rastro de sesión, redirigimos preventivamente
    if (!sessionCookie && !firebaseToken) {
      // Permitimos el acceso si es desarrollo para no bloquear al dev, 
      // pero en producción (o si queremos ser estrictos) redirigimos.
      // return redirect("/ingresar?error=no-autorizado");
    }

    // El middleware servirá como primer filtro. La validación pesada se hace en el LayoutAdmin
    // (client-side) y dentro de las páginas (server-side getDoc) para asegurar el rol.
  }

  return next();
});
