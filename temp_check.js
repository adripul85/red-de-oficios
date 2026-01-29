            import { db, auth } from "../../firebase/client";
            import {
                collection,
                query,
                where,
                getDocs,
                orderBy,
                limit,
                doc,
                updateDoc,
                arrayUnion,
                getDoc,
            } from "firebase/firestore";
            import { onAuthStateChanged } from "firebase/auth";

            let currentUser: any = null;
            let todasSolicitudes: any[] = [];

            // Execute immediately - IIFE pattern
            (function () {
console.log("ðŸš€ [OPORTUNIDADES] Ejecutando inicializaciÃ³n...");

                // Referencias DOM
                const grid = document.getElementById("oportunidades-grid");
                const loading = document.getElementById("loading");
                const errorState = document.getElementById("error-state");
                const emptyState = document.getElementById("empty-state");
                const emptyTitle = document.getElementById("empty-title");
                const emptyDesc = document.getElementById("empty-desc");
                const tabs = document.querySelectorAll(".tab-btn");

                // Estado local
                let activeTab = "nuevas"; // nuevas | contactadas | descartadas

                onAuthStateChanged(auth, async (user) => {
                    if (user) {
                        currentUser = user;
                        await loadOportunidades();
                    } else {
                        window.location.href = "/ingresar-profesional";
                    }
                });

                // LOGOUT
                document
                    .getElementById("btn-logout")
                    ?.addEventListener("click", () => {
                        auth.signOut().then(() => (window.location.href = "/"));
                    });

                // TABS
                tabs.forEach((btn) => {
                    btn.addEventListener("click", () => {
                        // Update UI
                        tabs.forEach((t) => {
                            t.classList.remove(
                                "border-orange-500",
                                "text-orange-600",
                                "active",
                            );
                            t.classList.add(
                                "border-transparent",
                                "text-slate-500",
                            );
                        });
                        btn.classList.add(
                            "border-orange-500",
                            "text-orange-600",
                            "active",
                        );
                        btn.classList.remove(
                            "border-transparent",
                            "text-slate-500",
                        );

                        // Update Logic
                        activeTab = btn.id.split("-")[1]; // nuevas, contactadas, descartadas
                        renderOportunidades();
                    });
                });

                async function loadOportunidades() {
                    console.log("ðŸš€ [OPORTUNIDADES] Iniciando carga en tiempo real...");

                    // Limpiar listeners anteriores si existen
                    unsubscribers.forEach((unsub) => unsub());
                    unsubscribers = [];


                    // Ocultar todo inicialmente
                    [loading, grid, emptyState, errorState].forEach((el) => {
                        if (el) {
                            el.style.display = "none";
                            el.classList.add("hidden");
                        }
                    });

                    try {
                        if (loading) loading.style.display = "block";
                        if (loading) loading.classList.remove("hidden");

                        console.log(
                            "ðŸ” [OPORTUNIDADES] Consultando Firestore para UID:",
                            currentUser?.uid,
                        );

                        // 1. Primero, obtener el perfil del profesional para saber su rubro y zona
                        const profDoc = await getDoc(
                            doc(db, "profesionales", currentUser.uid),
                        );

                        if (!profDoc.exists()) {
                            console.error(
                                "âŒ No se encontrÃ³ el perfil del profesional",
                            );
                            if (errorState) errorState.style.display = "block";
                            if (errorState)
                                errorState.classList.remove("hidden");
                            return;
                        }

                        const profData = profDoc.data();

                        // OBTENER TODOS LOS RUBROS Y ZONAS DISPONIBLES DEL PERFIL
                        const misRubros =
                            profData.rubros?.length > 0
                                ? profData.rubros
                                : profData.rubro_principal
                                  ? [profData.rubro_principal]
                                  : [];

                        const misZonas =
                            profData.zonas?.length > 0
                                ? profData.zonas
                                : profData.zona
                                  ? [profData.zona]
                                  : [];

                        // 2. CONFIGURAR LISTENERS EN TIEMPO REAL
                        // Usamos onSnapshot en lugar de getDocs
                        const { onSnapshot } =
                            await import("firebase/firestore");

                        const updateUI = () => {
                            // Convertir Map a Array y ordenar por fecha
                            todasSolicitudes = Array.from(
                                allSolicitudes.values(),
                            ).sort((a, b) => {
                                const fechaA =
                                    a.fecha?.toDate?.() ||
                                    new Date(a.fecha || 0);
                                const fechaB =
                                    b.fecha?.toDate?.() ||
                                    new Date(b.fecha || 0);
                                return fechaB - fechaA;
                            });
                            renderOportunidades();
                            if (loading) loading.style.display = "none";
                        };

                        const allSolicitudes = new Map();

                        // Listener 1: Donde soy candidato (el sistema me selecciono)

                        const qCandidato = query(
                            collection(db, "solicitudes"),
                            where(
                                "candidatos",
                                "array-contains",
                                currentUser.uid,
                            ),
                            orderBy("fecha", "desc"),
                            limit(50),
                        );

console.log(
                            "ðŸ” [OPORTUNIDADES] Ejecutando query candidatos...",
                        );
                        const snapCandidato = await getDocs(qCandidato);
                        console.log(
                            "ðŸ” [OPORTUNIDADES] Docs de candidatos:",
                            snapCandidato.size,
                        );

                        snapCandidato.docs.forEach((doc) => {
                            const data = doc.data();
                            // Filter out if I deleted it
                            if (
                                !data.eliminadosPor?.includes(currentUser.uid)
                            ) {
                                allSolicitudes.set(doc.id, {
                                    id: doc.id,
                                    ...data,
                                });
                            }
                        });

                        // Query 2: Donde coincide mi rubro y zona (oportunidades que el sistema no me asignÃ³ pero son relevantes)
                        if (miRubro && miZona) {
                            const qRubroZona = query(
                                collection(db, "solicitudes"),
                                where("rubro", "==", miRubro),
                                where("zona", "==", miZona),
                                where("status", "==", "nueva"),
                                orderBy("fecha", "desc"),
                                limit(50),
                            );

                            console.log(
                                "ðŸ” [OPORTUNIDADES] Ejecutando query rubro/zona...",
                            );
                            try {
                                const snapRubroZona = await getDocs(qRubroZona);
                                console.log(
                                    "ðŸ” [OPORTUNIDADES] Docs de rubro/zona:",
                                    snapRubroZona.size,
                                );

                                snapRubroZona.docs.forEach((doc) => {
                                    if (!allSolicitudes.has(doc.id)) {
                                        const data = doc.data();
                                        if (
                                            !data.eliminadosPor?.includes(
                                                currentUser.uid,
                                            )
                                        ) {
                                            allSolicitudes.set(doc.id, {
                                                id: doc.id,
                                                ...data,
                                            });
                                        }
                                    }
                                });
                            } catch (indexError) {
                                // Si falla por falta de Ã­ndice, solo usar query de candidatos
                                console.warn(
                                    "âš ï¸ Query rubro/zona fallÃ³ (posible Ã­ndice faltante):",
                                    indexError,
                                );
                            }
                        }

                        // Convertir Map a Array y ordenar por fecha
                        todasSolicitudes = Array.from(
                            allSolicitudes.values(),
                        ).sort((a, b) => {
                            const fechaA =
                                a.fecha?.toDate?.() || new Date(a.fecha);
                            const fechaB =
                                b.fecha?.toDate?.() || new Date(b.fecha);
                            return fechaB - fechaA;
                        });

                        console.log(
                            "ðŸ” [OPORTUNIDADES] Total docs combinados:",
                            todasSolicitudes.length,
                        );

                        renderOportunidades();
                    } catch (error) {
                        console.error("âŒ [OPORTUNIDADES] Error:", error);
                        errorState.style.display = "block";
                        errorState.classList.remove("hidden");
                    } finally {
                        loading.style.display = "none";
                        loading.classList.add("hidden");
                        console.log("ðŸ” [OPORTUNIDADES] Carga finalizada");
                    }
                }

                function renderOportunidades() {
console.log("ðŸŽ¨ [RENDER] Iniciando renderOportunidades...");
                    console.log(
                        "ðŸŽ¨ [RENDER] Total solicitudes:",
                        todasSolicitudes.length,
                    );
                    console.log("ðŸŽ¨ [RENDER] Tab activo:", activeTab);

                    // Filtrar segÃºn Tab
                    const filtered = todasSolicitudes.filter((sol) => {
                        const contactado = sol.contactadosPor?.includes(
                            currentUser.uid,
                        );
                        const descartado = sol.descartadosPor?.includes(
                            currentUser.uid,
                        );

                        if (activeTab === "nuevas") {
                            return (
                                !contactado &&
                                !descartado &&
                                (sol.status === "nueva" || !sol.status)
                            );
                        }

                        if (activeTab === "contactadas") return contactado;
                        if (activeTab === "descartadas") return descartado;
                        return false;
                    });

                    console.log(
                        "ðŸŽ¨ [RENDER] Solicitudes filtradas:",
                        filtered.length,
                    );
                    console.log("ðŸŽ¨ [RENDER] Datos filtrados:", filtered);
                    if (filtered.length === 0) {
                        console.log(
                            "âš ï¸ [RENDER] No hay solicitudes filtradas - mostrando empty state",

                        );
                    }

                    // Update count badge
                    const nuevasCount = todasSolicitudes.filter(
                        (s) =>
                            !s.contactadosPor?.includes(currentUser.uid) &&
                            !s.descartadosPor?.includes(currentUser.uid),
                    ).length;

                    const badge = document.getElementById(
                        "badge-oportunidades",
                    );
                    if (badge) {
                        badge.innerText = nuevasCount.toString();
                        if (nuevasCount > 0) {
                            badge.style.display = "inline-block";
                            badge.classList.remove("hidden");
                        } else {
                            badge.style.display = "none";
                            badge.classList.add("hidden");
                        }
                    }

                    // Empty State Logic
                    if (filtered.length === 0) {
                        console.log("âš ï¸ [RENDER] Mostrando empty state");
                        if (grid) grid.style.display = "none";
                        if (emptyState) {
                            emptyState.style.display = "";
                            emptyState.classList.remove("hidden");
                        }

                        if (activeTab === "nuevas") {
                            if (emptyTitle) emptyTitle.innerText = "No hay nuevas oportunidades";
                            if (emptyDesc) emptyDesc.innerText = "Te avisaremos cuando alguien busque un servicio en tu zona.";
                        } else if (activeTab === "contactadas") {
                            if (emptyTitle) emptyTitle.innerText = "AÃºn no has contactado a nadie";
                            if (emptyDesc) emptyDesc.innerText = "Las oportunidades que contactes aparecerÃ¡n aquÃ­.";
                        } else {
                            if (emptyTitle) emptyTitle.innerText = "Papelera vacÃ­a";
                            if (emptyDesc) emptyDesc.innerText = "Las oportunidades descartadas aparecerÃ¡n aquÃ­.";
                        }

                        }
                        return;
                    }

console.log("ðŸŽ¨ [RENDER] Mostrando grid...");
                    emptyState.style.display = "none";
                    grid.style.display = "grid";
                    grid.classList.remove("hidden");

                    console.log(
                        "ðŸŽ¨ [RENDER] Generando HTML para",
                        filtered.length,
                        "items",
                    );
                    grid.innerHTML = filtered
                        .map((sol) => {
                            // Formatear fecha
                            let fechaStr = "Reciente";
                            if (sol.fecha && sol.fecha.seconds) {
                                const date = new Date(sol.fecha.seconds * 1000);
                                fechaStr = new Intl.DateTimeFormat("es-AR", {
                                    day: "numeric",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                }).format(date);
                            }

                            // Badges
                            const urgenteBadge = sol.urgente
                                ? `<span class="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">ðŸš¨ Urgente</span>`
                                : "";

                            const nuevoBadge =
                                !sol.leidoPor?.includes(currentUser.uid) &&
                                activeTab === "nuevas"
                                    ? `<span class="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">Nuevo</span>`
                                    : "";

                            const isAcceptedByMe =
                                sol.profesionalId === currentUser.uid;
                            const acceptedBadge = isAcceptedByMe
                                ? `<span class="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded-full border border-purple-200"> Tu Trabajo</span>`
                                : "";

                            const yaCotice =
                                sol.presupuestadosPor?.includes(
                                    currentUser.uid,
                                );
                            const cotizadoBadge = yaCotice
                                ? `<span class="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-full border border-indigo-200"> Cotizado</span>`
                                : "";

                            return `
                        <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row gap-6 hover:shadow-md transition">
                            <!-- Info Principal -->
                            <div class="flex-1">
                                <div class="flex items-start justify-between mb-3">
                                    <div class="flex flex-wrap gap-2 items-center">
                                        <span class="bg-slate-100 text-slate-700 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide">${sol.rubro}</span>
                                        ${urgenteBadge}
                                        ${nuevoBadge}
                                        ${acceptedBadge}
                                        ${cotizadoBadge}
                                        ${
                                            sol.presupuesto
                                                ? `<span class="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">ðŸ’µ Presupuesto: $${sol.presupuesto}</span>`
                                                : ""
                                        }
                                    </div>
                                    <span class="text-xs text-slate-400 flex items-center gap-1 whitespace-nowrap">
                                        â± ${fechaStr}
                                    </span>
                                </div>
                                
                                <h3 class="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-orange-500"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                    ${sol.zona}
                                </h3>
                                
                                <p class="text-slate-600 mb-4 line-clamp-3 md:line-clamp-none bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm italic">
                                    "${sol.detalle}"
                                </p>

                                <div class="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                                    <span class="flex items-center gap-2 font-medium text-slate-700">
                                        <div class="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs">ðŸ‘¤</div>
                                        ${sol.clienteNombre}
                                    </span>
                                    ${
                                        activeTab === "contactadas"
                                            ? `
                                        <span class="text-green-600 font-bold text-xs bg-green-50 px-2 py-1 rounded">âœ… Contactado</span>
                                    `
                                            : ""
                                    }
                                    ${
                                        sol.profesionalId === currentUser.uid
                                            ? `<span class="text-purple-600 font-bold text-xs bg-purple-50 px-2 py-1 rounded border border-purple-100">ðŸ‘· Presupuestando</span>`
                                            : ""
                                    }
                                </div>
                            </div>

                            <!-- Acciones -->
                            <div class="flex flex-col gap-3 justify-center min-w-[220px] border-t md:border-t-0 md:border-l border-slate-100 pt-5 md:pt-0 md:pl-6">
                                ${
                                    activeTab === "nuevas"
                                        ? `
                                    ${
                                        yaCotice
                                            ? `
                                    <button 
                                        disabled
                                        class="w-full bg-indigo-50 border border-indigo-100 text-indigo-400 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed opacity-80">
                                        Ya Cotizaste
                                    </button>
                                    `
                                            : `
                                    <button 
                                        onclick="abrirModalCotizacion('${sol.id}', '${sol.clienteNombre}')"
                                        class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition shadow-sm hover:shadow active:scale-95">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                                        Pasar Presupuesto
                                    </button>
                                    `
                                    }
                                    
                                    <button 
                                        onclick="contactarCliente('${sol.id}', '${sol.clienteNombre}', '${sol.telefono || ""}')"
                                        class="w-full bg-white border border-green-600 text-green-600 hover:bg-green-50 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition text-sm">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                                        Solo Contactar
                                    </button>
                                    
                                    <button 
                                        onclick="descartarSolicitud('${sol.id}')"
                                        class="w-full text-slate-500 hover:text-red-600 hover:bg-red-50 font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition text-sm">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                                        Descartar
                                    </button>
                                    `
                                        : ""
                                }

                                ${
                                    activeTab === "descartadas"
                                        ? `
                                    <button onclick="eliminarOportunidad('${sol.id}')" class="w-full px-4 py-2 border border-red-200 text-red-600 font-bold rounded-lg hover:bg-red-50 transition flex items-center justify-center gap-2">
                                        ðŸ—‘ï¸ Eliminar permanentemente
                                    </button>
                                    `
                                        : ""
                                }

                                ${
                                    activeTab === "contactadas"
                                        ? `
                                    ${
                                        sol.profesionalId === currentUser.uid
                                            ? `<button onclick="liberarOportunidad('${sol.id}')" class="w-full mb-2 px-4 py-2 border border-orange-200 text-orange-600 font-bold rounded-lg hover:bg-orange-50 transition flex items-center justify-center gap-2 text-xs">
                                         ðŸ”„ Cancelar / Liberar
                                    </button>`
                                            : ""
                                    }
                                    <div class="text-center py-4 bg-green-50 rounded-lg border border-green-100">
                                        <span class="block text-2xl mb-1">ðŸ’¬</span>
                                        <p class="text-green-800 font-bold text-sm">ConversaciÃ³n Iniciada</p>
                                        <a href="https://wa.me/549${sol.telefono?.replace(/\D/g, "")}" target="_blank" class="text-xs text-green-600 hover:underline mt-1 block">Abrir WhatsApp de nuevo</a>
                                    </div>
                                    `
                                        : ""
                                }
                            </div>
                        </div>
                    `;
                            })
                            .join("");

                    console.log(
                        "ðŸŽ¨ [RENDER] HTML generado, longitud:",
                        grid.innerHTML.length,
                    );
                    console.log("ðŸŽ¨ [RENDER] Grid renderizado exitosamente");
                }

                // ACCIONES
                async function contactarCliente(id, nombre, telefono) {
                    if (!currentUser) return;

                    if (!telefono) {
                        alert(
                            "Este cliente no dejÃ³ telÃ©fono (versiÃ³n antigua de solicitud).",
                        );
                        return;
                    }

                    try {
                        // 0. Generar Token de Seguridad
                        const token = Math.floor(
                            100000 + Math.random() * 900000,
                        ).toString();
                        console.log("ðŸš€ [CONTACTAR] Generando token:", token);

                        // 1. Guardar en ColecciÃ³n 'contactos' (Para que ambos vean el cÃ³digo)
                        const solData = todasSolicitudes.find(
                            (s) => s.id === id,
                        );
                        console.log(
                            "ðŸ” [CONTACTAR] Datos de solicitud encontrados:",
                            solData,
                        );

                        if (!solData) {
                            console.error(
                                "âŒ [CONTACTAR] No se encontrÃ³ solData para ID:",
                                id,
                            );
                            alert(
                                "Error interno: No se encontraron datos de la solicitud.",
                            );
                            return;
                        }

                        const contactoData = {
                            clienteId: solData.clienteId || "unknown",
                            clienteNombre: nombre,
                            proId: currentUser.uid,
                            proNombre: currentUser.displayName || "Profesional",
                            rubro: solData.rubro || "Servicio",
                            fecha: new Date(),
                            token: token,
                            solicitudId: id,
                        };
                        console.log(
                            "ðŸš€ [CONTACTAR] Intentando crear contacto:",
                            contactoData,
                        );

                        try {
                            const contactRef = await addDoc(
                                collection(db, "contactos"),
                                contactoData,
                            );
                            console.log(
                                "âœ… [CONTACTAR] Contacto creado con ID:",
                                contactRef.id,
                            );
                        } catch (docError) {
                            console.error(
                                "âŒ [CONTACTAR] Error creando documento en 'contactos':",
                                docError,
                            );
                            alert(
                                "Error al generar cÃ³digo de seguridad. Revisa la consola.",
                            );
                            // Continue anyway to open WhatsApp but warn user
                        }

                        // 2. Marcar como contactado en DB Y Bloquear para mi (status: aceptada)
                        const solRef = doc(db, "solicitudes", id);
                        await updateDoc(solRef, {
                            contactadosPor: arrayUnion(currentUser.uid),
                            status: "aceptada",
                            profesionalId: currentUser.uid,
                            profesionalNombre:
                                currentUser.displayName || "Profesional",
                            profesionalFoto: currentUser.photoURL || "",
                            fechaAceptacion: new Date(),
                        });

                        // Actualizar estado local
                        todasSolicitudes = todasSolicitudes.map((s) => {
                            if (s.id === id) {
                                const prev = s.contactadosPor || [];
                                return {
                                    ...s,
                                    contactadosPor: [...prev, currentUser.uid],
                                    status: "aceptada",
                                    profesionalId: currentUser.uid,
                                };
                            }
                            return s;
                        });

                        renderOportunidades();

                        // 3. Enviar Email NotificaciÃ³n (Simulado)
                        if (solData?.clienteEmail) {
                            fetch("/api/send-email", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    to: solData.clienteEmail,
                                    subject: `${currentUser.displayName || "Un profesional"} ha aceptado tu solicitud! ðŸš€`,
                                    html: `
                                        <h2>Buenas noticias, ${nombre}!</h2>
                                        <p>El profesional <strong>${currentUser.displayName || "DeOficios Pro"}</strong> ha visto tu solicitud para <strong>${solData.rubro}</strong> y quiere contactarte.</p>
                                        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
                                            <p style="margin: 0; font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: bold;">Tu CÃ³digo de Seguridad</p>
                                            <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: 900; letter-spacing: 5px; color: #ea580c;">${token}</p>
                                            <p style="margin: 10px 0 0 0; font-size: 11px; color: #6b7280;">PÃ­dele este cÃ³digo al profesional cuando llegue a tu domicilio.</p>
                                        </div>
                                        <p>Te escribirÃ¡ por WhatsApp a la brevedad.</p>
                                    `,
                                    type: "Solicitud Aceptada",
                                }),
                            }).catch((err) =>
                                console.error("Error enviando email:", err),
                            );
                        }

                        // 4. Abrir WhatsApp
                        const mensaje = `Hola ${nombre}, soy ${currentUser.displayName || "profesional"} de DeOficios. Vi tu pedido de ${solData?.rubro || "trabajo"} y mi cÃ³digo de seguridad es ${token}. Me interesa pasarte un presupuesto.`;
                        const url = `https://wa.me/549${telefono?.replace(/\D/g, "")}?text=${encodeURIComponent(mensaje)}`;
                        window.open(url, "_blank");
                    } catch (e) {
                        console.error(e);
                        alert("Error al procesar contacto");
                    }
                }

                async function descartarSolicitud(id) {
                    if (
                        !confirm(
                            "Â¿Seguro que quieres descartar esta oportunidad?",
                        )
                    )
                        return;

                    try {
                        const solRef = doc(db, "solicitudes", id);
                        await updateDoc(solRef, {
                            descartadosPor: arrayUnion(currentUser.uid),
                        });

                        // Actualizar local
                        todasSolicitudes = todasSolicitudes.map((s) => {
                            if (s.id === id) {
                                const prev = s.descartadosPor || [];
                                return {
                                    ...s,
                                    descartadosPor: [...prev, currentUser.uid],
                                };
                            }
                            return s;
                        });

                        renderOportunidades();
                    } catch (e) {
                        console.error(e);
                        alert("Error al descartar");
                    }
                }

                async function eliminarOportunidad(id) {
                    if (
                        !confirm(
                            "Â¿Eliminar de la lista? No podrÃ¡s recuperarla.",
                        )
                    )
                        return;

                    try {
                        const solRef = doc(db, "solicitudes", id);
                        await updateDoc(solRef, {
                            eliminadosPor: arrayUnion(currentUser.uid),
                        });

                        // Actualizar local
                        todasSolicitudes = todasSolicitudes.map((s) => {
                            if (s.id === id) {
                                const prev = s.eliminadosPor || [];
                                return {
                                    ...s,
                                    eliminadosPor: [...prev, currentUser.uid],
                                };
                            }
                            return s;
                        });

                        renderOportunidades();
                    } catch (error) {
                        console.error("Error eliminando:", error);
                        alert("No se pudo eliminar la oportunidad");
                    }
                }

                async function liberarOportunidad(id) {
                    if (
                        !confirm(
                            "Â¿Liberar esta oportunidad? VolverÃ¡ a estar disponible para otros profesionales.",
                        )
                    )
                        return;

                    try {
                        const solRef = doc(db, "solicitudes", id);

                        await updateDoc(solRef, {
                            status: "nueva",
                            profesionalId: deleteField(),
                            profesionalNombre: deleteField(),
                            profesionalFoto: deleteField(),
                            fechaAceptacion: deleteField(),
                        });

                        // Update local state and remove from view if needed
                        todasSolicitudes = todasSolicitudes.map((s) => {
                            if (s.id === id) {
                                const copy = { ...s };
                                delete copy.profesionalId;
                                copy.status = "nueva";
                                return copy;
                            }
                            return s;
                        });

                        renderOportunidades();
                        alert("Oportunidad liberada correctamente.");
                    } catch (e) {
                        console.error(e);
                        alert("Error al liberar oportunidad");
                    }
                }

                // MODAL SYSTEM
                function showAlert(title, message, icon = "âœ¨") {
                    document.getElementById("alert-title").innerText = title;
                    document.getElementById("alert-message").innerText =
                        message;
                    document.getElementById("alert-icon").innerText = icon;
                    document
                        .getElementById("custom-alert")
                        .classList.add("active");
                }

                window.closeAlert = () => {
                    document
                        .getElementById("custom-alert")
                        .classList.remove("active");
                };

                // Exponer funciones globales
                window.contactarCliente = contactarCliente;
                window.descartarSolicitud = descartarSolicitud;
                window.eliminarOportunidad = eliminarOportunidad;
                (window as any).liberarOportunidad = liberarOportunidad;
                (window as any).abrirModalCotizacion =
                    window.abrirModalCotizacion;
                (window as any).cerrarModalCotizacion =
                    window.cerrarModalCotizacion;
                (window as any).enviarCotizacion = window.enviarCotizacion;
                // --- LÃ“GICA DE COTIZACIÃ“N ---
                let cotizacionActual = { id: null, clienteNombre: null };

                window.abrirModalCotizacion = (id, nombre) => {
                    cotizacionActual = { id, clienteNombre: nombre };

                    const spanNombre =
                        document.getElementById("cot-cliente-nombre");
                    if (spanNombre) spanNombre.innerText = nombre;

                    // Limpiar form
                    (
                        document.getElementById(
                            "form-cotizacion",
                        ) as HTMLFormElement
                    )?.reset();

                    document
                        .getElementById("modal-cotizacion")
                        ?.classList.add("active");
                };

                window.cerrarModalCotizacion = () => {
                    document
                        .getElementById("modal-cotizacion")
                        ?.classList.remove("active");
                    cotizacionActual = { id: null, clienteNombre: null };
                };

                window.enviarCotizacion = async () => {
                    if (!currentUser || !cotizacionActual.id) return;

                    const precioInput = document.getElementById(
                        "cot-precio",
                    ) as HTMLInputElement;
                    const mensajeInput = document.getElementById(
                        "cot-mensaje",
                    ) as HTMLTextAreaElement;
                    const btnEnviar = document.getElementById(
                        "btn-enviar-cotizacion",
                    ) as HTMLButtonElement;

                    const precio = precioInput.value;
                    const mensaje = mensajeInput.value;

                    if (!precio || !mensaje) {
                        alert("Por favor completa el precio y el mensaje.");
                        return;
                    }

                    try {
                        btnEnviar.disabled = true;
                        btnEnviar.innerText = "Enviando...";

                        // 1. Guardar propuesta en subcolecciÃ³n
                        const propuestaData = {
                            proId: currentUser.uid,
                            proNombre: currentUser.displayName || "Profesional",
                            proFoto: currentUser.photoURL || "",
                            precio: Number(precio),
                            mensaje: mensaje,
                            fecha: new Date(),
                            estado: "enviada", // enviada | aceptada | rechazada
                        };

                        // Referencia a la subcolecciÃ³n: solicitudes/{solicitudId}/propuestas
                        await addDoc(
                            collection(
                                db,
                                `solicitudes/${cotizacionActual.id}/propuestas`,
                            ),
                            propuestaData,
                        );

                        console.log("âœ… Propuesta enviada exitosamente");

                        // 2. Marcar solicitud como "Presupuestada" por este PRO (para feedback visual)
                        await updateDoc(
                            doc(db, "solicitudes", cotizacionActual.id),
                            {
                                presupuestadosPor: arrayUnion(currentUser.uid),
                            },
                        );

                        // Actualizar UI Local
                        todasSolicitudes = todasSolicitudes.map((s) => {
                            if (s.id === cotizacionActual.id) {
                                const prev = s.presupuestadosPor || [];
                                return {
                                    ...s,
                                    presupuestadosPor: [
                                        ...prev,
                                        currentUser.uid,
                                    ],
                                };
                            }
                            return s;
                        });

                        window.cerrarModalCotizacion();
                        renderOportunidades(); // Re-render para mostrar badge "Presupuestando"
                        showAlert(
                            "Â¡Presupuesto Enviado!",
                            "El cliente recibirÃ¡ tu propuesta. Si le interesa, te contactarÃ¡.",
                            "ðŸš€",
                        );

                    } catch (error) {
                        console.error("âŒ Error enviando cotizaciÃ³n:", error);
                        alert(
                            "Error al enviar el presupuesto. Intenta nuevamente.",
                        );
                    } finally {
                        btnEnviar.disabled = false;
                        btnEnviar.innerHTML = "<span></span> Enviar";
                    }
                };

                window.restaurarSolicitud = async function (id: any) {
                    showAlert(
                        "PrÃ³ximamente",
                        "La funcionalidad de restaurar estarÃ¡ disponible pronto.",
                        "â³",
                    );
                };
            })(); // End of IIFE
        </script>
    </body>
</html>
