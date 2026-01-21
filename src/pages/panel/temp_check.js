        import { auth, db } from "../../firebase/client";
        import { onAuthStateChanged, signOut } from "firebase/auth";
        import {
            doc,
            getDoc,
            getDocFromServer,
            collection,
            query,
            where,
            getDocs,
            orderBy,
            limit,
            Timestamp,
            onSnapshot,
        } from "firebase/firestore";

        console.log("💡 [DASHBOARD] Script loaded, executing immediately...");

        // Execute immediately - don't wait for event
        // (function () {
        console.log(
            "🚀 [DASHBOARD] v2.1 - Running dashboard initialization...",
        );

        const nameEl = document.getElementById("user-name");
        const avatarEl = document.getElementById("user-avatar");
        const logoutBtn = document.getElementById("btn-logout");
        const badgeOportunidades = document.getElementById(
            "badge-oportunidades",
        );

        console.log("📋 [DASHBOARD] DOM elements:", {
            nameEl,
            avatarEl,
            logoutBtn,
            badgeOportunidades,
        });

        onAuthStateChanged(auth, async (user) => {
            console.log(
                "🔐 [DASHBOARD] onAuthStateChanged fired, user:",
                user ? user.uid : "NO USER",
            );

            if (user) {
                try {
                    console.log(
                        "👤 [DASHBOARD] User authenticated, fetching data...",
                    );
                    // Initial DB Check
                    console.log("🔍 [DASHBOARD] DB Debug:", {
                        type: typeof db,
                        isNull: db === null,
                        isUndefined: db === undefined,
                        keys: db ? Object.keys(db) : [],
                        constructor: db ? db.constructor.name : "N/A",
                    });

                    if (!db) {
                        console.error(
                            "🔥 [DASHBOARD] CRITICAL: DB Object is missing/undefined",
                            { db },
                        );
                        throw new Error("Firestore DB not initialized");
                    }
                    // Verificar si es profesional (seguridad básica frontend)
                    const docRef = doc(db, "profesionales", user.uid);
                    // OPTIMIZATION: Use getDoc for cache first strategy
                    const docSnap = await getDoc(docRef);

                    console.log(
                        "📄 [DASHBOARD] Document snapshot exists:",
                        docSnap.exists(),
                    );

                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        console.log("✅ [DASHBOARD] User data loaded:", {
                            nombre: data.nombre,
                            plan: data.plan,
                        });

                        if (nameEl) nameEl.textContent = data.nombre;

                        const planLabel =
                            document.getElementById("user-plan-label");
                        if (planLabel)
                            planLabel.textContent =
                                data.plan || "Plan Profesional";

                        if (avatarEl) {
                            const newSrc =
                                data.foto ||
                                `https://ui-avatars.com/api/?name=${data.nombre}`;
                            avatarEl.setAttribute("src", newSrc);
                        }

                        // GAMIFICACION (Immediate UI update)
                        console.log(
                            "🎮 [DASHBOARD] Calling calculateGamification...",
                        );
                        calculateGamification(user.uid, data);

                        // Cargar datos del dashboard (Parallel)
                        console.log(
                            "📊 [DASHBOARD] Calling loadDashboardData...",
                        );
                        // Remove await to let it load in background while UI is responsive
                        loadDashboardData(user.uid, data).then(() => {
                            console.log(
                                "✅ [DASHBOARD] loadDashboardData completed",
                            );
                        });

                        // === SISTEMA DE NOTIFICACIONES ===
                        setupNotifications(user.uid);
                    } else {
                        window.location.href = "/";
                    }
                } catch (error) {
                    console.error("Error cargando perfil:", error);
                    // Si hay error de permisos, intentar recargar después de un delay
                    if (error.code === "permission-denied") {
                        console.log(
                            "Error de permisos detectado. Reintentando en 2 segundos...",
                        );
                        setTimeout(() => {
                            window.location.reload();
                        }, 2000);
                    }
                }
            } else {
                // No logueado
                window.location.href = "/ingresar";
            }
        });

        // === FUNCIÓN PARA CARGAR DATOS DEL DASHBOARD ===
        async function loadDashboardData(uid, userData) {
            // Removed dynamic imports (already at top)

            try {
                // 1. KPI: Visitas al perfil (Sync)
                const visitas = userData.vistas_perfil || 0;
                const kpiVisitas = document.getElementById("kpi-visitas");
                if (kpiVisitas) {
                    kpiVisitas.textContent = visitas.toLocaleString();
                }

                // 2. Parallelize heavy tasks
                const tasks = [];

                // Task: Ingresos Reales
                tasks.push(
                    (async () => {
                        const { currentTotal, percent } =
                            await getIncomeGrowth(uid);

                        const kpiIngresos =
                            document.getElementById("kpi-ingresos");
                        const badgeIngresos = document.getElementById(
                            "badge-ingresos-percent",
                        );

                        if (kpiIngresos)
                            kpiIngresos.textContent =
                                "$" + currentTotal.toLocaleString();

                        if (badgeIngresos) {
                            const symbol = percent >= 0 ? "+" : "";
                            badgeIngresos.textContent = `${symbol}${percent.toFixed(0)}%`;
                            // Color logic
                            if (percent >= 0) {
                                badgeIngresos.className =
                                    "text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full";
                            } else {
                                badgeIngresos.className =
                                    "text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full";
                            }
                        }
                    })(),
                );

                // Task: Presupuestos Activos
                tasks.push(
                    (async () => {
                        const qPresupuestos = query(
                            collection(
                                db,
                                "profesionales",
                                uid,
                                "presupuestos",
                            ),
                            where("estado", "in", ["Pendiente", "Aprobado"]),
                        );
                        const totalPresupuestos = (await getDocs(qPresupuestos))
                            .size;
                        const kpiPresupuestos =
                            document.getElementById("kpi-presupuestos");
                        if (kpiPresupuestos)
                            kpiPresupuestos.textContent =
                                totalPresupuestos.toString();
                    })(),
                );

                // Task: External Loaders
                tasks.push(loadLatestBudgets(uid));
                tasks.push(loadTeamWidget(uid));
                tasks.push(loadPerformanceChart(uid, 6));

                await Promise.all(tasks);

                // Event listener para cambio de período
                const periodSelect = document.getElementById(
                    "chart-period-select",
                );
                periodSelect?.addEventListener("change", async (e) => {
                    const months = parseInt(e.target.value);
                    await loadPerformanceChart(uid, months);
                });
            } catch (error) {
                console.error("Error cargando datos del dashboard:", error);
            }
        }

        // === FUNCIÓN PARA CARGAR EL GRÁFICO DE RENDIMIENTO ===
        async function loadPerformanceChart(uid, months) {
            // Removed dynamic imports

            try {
                const chartContainer =
                    document.getElementById("performance-chart");
                const labelsContainer = document.getElementById("chart-labels");
                const totalEl = document.getElementById("chart-total");

                if (!chartContainer) return;

                // Calcular fecha de inicio según los meses seleccionados
                const startDate = new Date();
                startDate.setMonth(startDate.getMonth() - months + 1);
                startDate.setDate(1);
                startDate.setHours(0, 0, 0, 0);

                // Obtener finanzas del período
                const q = query(
                    collection(db, "profesionales", uid, "finanzas"),
                    where("fecha", ">=", startDate),
                    where("tipo", "==", "ingreso"),
                );

                const snapshot = await getDocs(q);

                // Agrupar por mes
                const monthlyData = {};
                const monthNames = [
                    "Ene",
                    "Feb",
                    "Mar",
                    "Abr",
                    "May",
                    "Jun",
                    "Jul",
                    "Ago",
                    "Sep",
                    "Oct",
                    "Nov",
                    "Dic",
                ];

                // Inicializar todos los meses con 0
                for (let i = 0; i < months; i++) {
                    const d = new Date();
                    d.setMonth(d.getMonth() - (months - 1 - i));
                    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                    monthlyData[key] = 0;
                }

                // Sumar ingresos por mes
                let totalEarnings = 0;
                snapshot.docs.forEach((doc) => {
                    const data = doc.data();
                    const fecha =
                        data.fecha?.toDate?.() || new Date(data.fecha);
                    const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
                    if (monthlyData.hasOwnProperty(key)) {
                        monthlyData[key] += data.monto || 0;
                    }
                    totalEarnings += data.monto || 0;
                });

                // Encontrar el máximo para escalar las barras
                const values = Object.values(monthlyData);
                const maxValue = Math.max(...values, 1); // Evitar división por 0

                // Encontrar el mes actual para resaltarlo
                const currentMonth = new Date();
                const currentKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}`;

                // Generar barras del gráfico
                const sortedKeys = Object.keys(monthlyData).sort();
                const barsHTML = sortedKeys
                    .map((key) => {
                        const value = monthlyData[key];
                        const heightPercent = Math.max(
                            (value / maxValue) * 100,
                            5,
                        ); // Mínimo 5% para visualización
                        const isCurrentMonth = key === currentKey;
                        const [year, month] = key.split("-");
                        const monthLabel = monthNames[parseInt(month) - 1];

                        const barClass = isCurrentMonth
                            ? "w-full bg-orange-500 rounded-t-lg shadow-lg shadow-orange-200 relative group cursor-pointer transition-all"
                            : "w-full bg-orange-100 rounded-t-lg hover:bg-orange-200 transition-all relative group cursor-pointer";

                        return `
                                <div class="${barClass}" style="height: ${heightPercent}%">
                                    <span class="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                                        $${value.toLocaleString()}
                                    </span>
                                </div>
                            `;
                    })
                    .join("");

                // Generar labels de meses
                const labelsHTML =
                    sortedKeys
                        .map((key) => {
                            const [year, month] = key.split("-");
                            return monthNames[parseInt(month) - 1];
                        })
                        .join("</span><span>") || "";

                // Renderizar
                chartContainer.innerHTML =
                    barsHTML ||
                    '<div class="w-full h-full flex items-center justify-center text-slate-400">Sin datos de ingresos</div>';

                if (labelsContainer) {
                    labelsContainer.innerHTML = labelsHTML
                        ? `<span>${labelsHTML}</span>`
                        : "";
                }

                if (totalEl) {
                    totalEl.textContent = `$${totalEarnings.toLocaleString()} total`;
                }
            } catch (error) {
                console.error("Error cargando gráfico de rendimiento:", error);
                const chartContainer =
                    document.getElementById("performance-chart");
                if (chartContainer) {
                    chartContainer.innerHTML =
                        '<div class="w-full h-full flex items-center justify-center text-slate-400">Error cargando datos</div>';
                }
            }
        }

        // === FUNCIÓN PARA CARGAR ÚLTIMOS PRESUPUESTOS ===
        async function loadLatestBudgets(uid) {
            // Removed dynamic imports

            try {
                const q = query(
                    collection(db, "profesionales", uid, "presupuestos"),
                    orderBy("fecha", "desc"),
                    limit(5),
                );

                const snapshot = await getDocs(q);
                const tbody = document.getElementById("latest-budgets-tbody");

                if (!tbody) return;

                if (snapshot.empty) {
                    tbody.innerHTML = `
                            <tr>
                                <td colspan="4" class="text-center py-8 text-slate-500">
                                    No tienes presupuestos aún. <a href="/panel/presupuestos" class="text-orange-600 font-bold hover:underline">Crear uno</a>
                                </td>
                            </tr>
                        `;
                    return;
                }

                const statusColors = {
                    Pendiente: "bg-yellow-100 text-yellow-700",
                    Aprobado: "bg-green-100 text-green-700",
                    Cobrado: "bg-blue-100 text-blue-700",
                    Rechazado: "bg-red-100 text-red-700",
                };

                tbody.innerHTML = snapshot.docs
                    .map((doc) => {
                        const data = doc.data();
                        const fecha = data.createdAt
                            ? new Date(
                                  data.createdAt.seconds * 1000,
                              ).toLocaleDateString()
                            : "Sin fecha";
                        const statusClass =
                            statusColors[data.estado] ||
                            "bg-slate-100 text-slate-700";

                        return `
                                <tr class="border-b border-slate-100 hover:bg-slate-50 transition">
                                    <td class="py-3 px-4 font-medium text-slate-800">${data.cliente}</td>
                                    <td class="py-3 px-4 text-slate-600">$${(data.total || 0).toLocaleString()}</td>
                                    <td class="py-3 px-4">
                                        <span class="px-2 py-1 rounded-full text-xs font-bold ${statusClass}">
                                            ${data.estado}
                                        </span>
                                    </td>
                                    <td class="py-3 px-4 text-slate-500 text-sm">${fecha}</td>
                                </tr>
                            `;
                    })
                    .join("");
            } catch (error) {
                console.error("Error cargando presupuestos:", error);
            }
        }

        // === FUNCIÓN PARA CARGAR WIDGET DE EQUIPO ===
        async function loadTeamWidget(uid) {
            // Removed dynamic imports

            try {
                const q = query(
                    collection(db, "profesionales", uid, "equipo"),
                    where("activo", "==", true),
                );

                const snapshot = await getDocs(q);
                const teamList = document.getElementById("team-members-list");

                if (!teamList) return;

                if (snapshot.empty) {
                    teamList.innerHTML = `
                            <p class="text-slate-500 text-sm text-center py-4">
                                No tienes miembros en tu equipo. <a href="/panel/mi-equipo" class="text-orange-600 font-bold hover:underline">Agregar</a>
                            </p>
                        `;
                    return;
                }

                let totalPendiente = 0;
                const membersHTML = snapshot.docs
                    .slice(0, 3)
                    .map((doc) => {
                        const data = doc.data();
                        totalPendiente += data.pendientePago || 0;
                        const initial = data.nombre
                            ? data.nombre.charAt(0).toUpperCase()
                            : "?";

                        return `
                                <div class="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors -mx-2 px-2 rounded-lg">
                                    <div class="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold border border-indigo-100 shadow-sm">
                                        ${initial}
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <p class="font-bold text-slate-800 text-sm truncate">${data.nombre}</p>
                                        <p class="text-[10px] text-slate-400 uppercase tracking-wider font-bold">${data.rol}</p>
                                    </div>
                                    <div class="text-right whitespace-nowrap">
                                        ${
                                            data.pendientePago > 0
                                                ? `<p class="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full border border-orange-100">$${data.pendientePago.toLocaleString()}</p>`
                                                : `<p class="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">✓ Al día</p>`
                                        }
                                    </div>
                                </div>
                            `;
                    })
                    .join("");

                const teamContainer =
                    document.getElementById("team-members-list");
                if (teamContainer) {
                    if (snapshot.empty) {
                        teamContainer.innerHTML = `
                                        <div class="text-center py-6">
                                            <div class="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-2 text-xl">👷</div>
                                            <p class="text-slate-500 text-sm">Aún no tienes equipo</p>
                                        </div>
                                    `;
                    } else {
                        teamContainer.innerHTML = membersHTML;
                    }
                }

                // Actualizar total pendiente
                const totalPendienteEl =
                    document.getElementById("team-total-pending");
                if (totalPendienteEl) {
                    totalPendienteEl.textContent =
                        "$" + totalPendiente.toLocaleString();
                }
            } catch (error) {
                console.error("Error cargando equipo:", error);
            }
        }

        // === HELPER: MARK SINGLE NOTIF AS READ ===
        async function markAsRead(uid, notifId) {
            try {
                const { updateDoc, doc } = await import("firebase/firestore");
                const ref = doc(
                    db,
                    "profesionales",
                    uid,
                    "notificaciones",
                    notifId,
                );
                await updateDoc(ref, { leido: true });
            } catch (e) {
                console.error("Error marking read:", e);
            }
        }

        // === HELPER: CALCULATE INCOME GROWTH ===
        async function getIncomeGrowth(uid) {
            try {
                const now = new Date();
                const currentMonthStart = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    1,
                );
                const prevMonthStart = new Date(
                    now.getFullYear(),
                    now.getMonth() - 1,
                    1,
                );
                const prevMonthEnd = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    0,
                ); // Last day of prev month

                const { getDocs, query, where, collection, Timestamp } =
                    await import("firebase/firestore");

                // Current Month
                const qCurrent = query(
                    collection(db, "profesionales", uid, "finanzas"),
                    where("tipo", "==", "ingreso"),
                    where("fecha", ">=", Timestamp.fromDate(currentMonthStart)),
                );

                // Prev Month
                const qPrev = query(
                    collection(db, "profesionales", uid, "finanzas"),
                    where("tipo", "==", "ingreso"),
                    where("fecha", ">=", Timestamp.fromDate(prevMonthStart)),
                    where("fecha", "<=", Timestamp.fromDate(prevMonthEnd)),
                );

                const [snapCurrent, snapPrev] = await Promise.all([
                    getDocs(qCurrent),
                    getDocs(qPrev),
                ]);

                let currentTotal = 0;
                snapCurrent.forEach(
                    (d) => (currentTotal += d.data().monto || 0),
                );

                let prevTotal = 0;
                snapPrev.forEach((d) => (prevTotal += d.data().monto || 0));

                // Calculate %
                let percent = 0;
                if (prevTotal === 0) {
                    percent = currentTotal > 0 ? 100 : 0;
                } else {
                    percent = ((currentTotal - prevTotal) / prevTotal) * 100;
                }

                return { currentTotal, percent };
            } catch (e) {
                console.error("Error calculating income:", e);
                return { currentTotal: 0, percent: 0 };
            }
        }

        // === FUNCIÓN DE NOTIFICACIONES ===
        async function setupNotifications(uid) {
            // 1. Registrar Service Worker
            if ("serviceWorker" in navigator) {
                try {
                    const registration =
                        await navigator.serviceWorker.register("/sw.js");
                    console.log("[Panel] Service Worker registrado");
                } catch (error) {
                    console.error("[Panel] Error registrando SW:", error);
                }
            }

            // 2. Fetch Profile for Badge Logic (Rubros/Zonas)
            let misRubros = [];
            let misZonas = [];
            try {
                const pDoc = await getDoc(doc(db, "profesionales", uid));
                if (pDoc.exists()) {
                    const pd = pDoc.data();
                    misRubros =
                        pd.rubros?.length > 0
                            ? pd.rubros
                            : pd.rubro_principal
                              ? [pd.rubro_principal]
                              : [];
                    misZonas =
                        pd.zonas?.length > 0
                            ? pd.zonas
                            : pd.zona
                              ? [pd.zona]
                              : [];
                }
            } catch (e) {
                console.error("Error fetching profile for badges", e);
            }

            // 3. Listener Notificaciones (Campana / Lista)
            const qNotifs = query(
                collection(db, "profesionales", uid, "notificaciones"),
                where("leido", "==", false),
                orderBy("fecha", "desc"),
                limit(10),
            );

            let isFirstLoad = true;

            // Referencias UI
            const btnBell = document.getElementById("btn-notifications");
            const dropdown = document.getElementById("notification-dropdown");
            const notifList = document.getElementById("notification-list");
            const badgeBell = document.getElementById("badge-bell");
            const badgeSidebar = document.getElementById("badge-oportunidades");
            const markReadBtn = document.getElementById("mark-all-read");

            // Toggle Dropdown
            btnBell?.addEventListener("click", (e) => {
                e.stopPropagation();
                dropdown?.classList.toggle("hidden");
            });

            // Close on click outside
            document.addEventListener("click", (e) => {
                if (
                    dropdown &&
                    !dropdown.classList.contains("hidden") &&
                    !dropdown.contains(e.target) &&
                    !btnBell?.contains(e.target)
                ) {
                    dropdown.classList.add("hidden");
                }
            });

            // Mark all read
            markReadBtn?.addEventListener("click", async () => {
                try {
                    const { writeBatch } = await import("firebase/firestore");
                    const batch = writeBatch(db);
                    const unreadQ = query(
                        collection(db, "profesionales", uid, "notificaciones"),
                        where("leido", "==", false),
                    );
                    const unreadSnaps = await getDocs(unreadQ);

                    if (unreadSnaps.empty) {
                        dropdown?.classList.add("hidden");
                        return;
                    }

                    unreadSnaps.forEach((d) => {
                        batch.update(
                            doc(
                                db,
                                "profesionales",
                                uid,
                                "notificaciones",
                                d.id,
                            ),
                            { leido: true },
                        );
                    });

                    await batch.commit();
                    console.log(
                        "[Panel] Todas las notificaciones marcadas como leídas",
                    );
                    dropdown?.classList.add("hidden");
                } catch (e) {
                    console.error("Error marking all read:", e);
                }
            });

            onSnapshot(qNotifs, (snapshot) => {
                const count = snapshot.size;

                // Update Bell Badge Only
                if (badgeBell) {
                    if (count > 0) {
                        badgeBell.classList.remove("hidden");
                        console.log(
                            "🔔 [NOTIFICATIONS] Badge ON. Unread count:",
                            count,
                        );
                        snapshot.docs.forEach((d) =>
                            console.log("   - Unread:", d.id, d.data().titulo),
                        );
                    } else {
                        badgeBell.classList.add("hidden");
                        console.log("🔕 [NOTIFICATIONS] Badge OFF. Count is 0");
                    }
                }

                if (notifList) {
                    if (count === 0) {
                        notifList.innerHTML =
                            '<div class="p-4 text-center text-slate-400 text-xs">No tienes notificaciones nuevas</div>';
                    } else {
                        notifList.innerHTML = snapshot.docs
                            .map((doc) => {
                                const data = doc.data();
                                const time = data.fecha
                                    ? new Date(
                                          data.fecha.seconds * 1000,
                                      ).toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                      })
                                    : "";

                                // Make item distinct and clickable
                                return `
                                    <div class="notif-item px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer" data-id="${doc.id}" data-link="/panel/oportunidades">
                                        <div class="flex justify-between items-start mb-1">
                                            <p class="text-xs font-bold text-slate-800">${data.titulo || "Nueva Notificación"}</p>
                                            <span class="text-[10px] text-slate-400">${time}</span>
                                        </div>
                                        <p class="text-xs text-slate-500 line-clamp-2">${data.mensaje || ""}</p>
                                    </div>
                                `;
                            })
                            .join("");

                        // Add event listeners to new items
                        notifList
                            .querySelectorAll(".notif-item")
                            .forEach((item) => {
                                item.addEventListener("click", async (e) => {
                                    // Prevent propagation if needed
                                    const id = item.getAttribute("data-id");
                                    const link = item.getAttribute("data-link");
                                    if (id && link) {
                                        // Mark as read
                                        await markAsRead(uid, id);
                                        // Navigate
                                        window.location.href = link;
                                    }
                                });
                            });
                    }
                }

                // Browser Notification
                if (isFirstLoad) {
                    isFirstLoad = false;
                    return;
                }

                snapshot.docChanges().forEach((change) => {
                    if (change.type === "added") {
                        const notif = change.doc.data();
                        if (Notification.permission === "granted") {
                            new Notification(
                                notif.titulo || "¡Nueva oportunidad!",
                                {
                                    body:
                                        notif.mensaje ||
                                        "Tienes una nueva solicitud",
                                    icon: "/icon-192.png",
                                    // @ts-ignore
                                    badge: "/favicon.svg",
                                    tag: "notif-" + change.doc.id,
                                },
                            );
                        }
                    }
                });
            });

            // 4. Opportunities Badge Listener (REAL COUNT)
            if (misRubros.length > 0) {
                try {
                    const qBadge = query(
                        collection(db, "solicitudes"),
                        where("rubro", "in", misRubros),
                        where("status", "==", "nueva"),
                    );

                    onSnapshot(qBadge, (snap) => {
                        let badgeCount = 0;
                        snap.docs.forEach((d) => {
                            const data = d.data();
                            const zonaMatch =
                                misZonas.length === 0 ||
                                misZonas.includes(data.zona);
                            const notDeleted =
                                !data.eliminadosPor?.includes(uid);
                            if (zonaMatch && notDeleted) badgeCount++;
                        });

                        // Update Sidebar Badge
                        const badgeMobile = document.getElementById(
                            "badge-oportunidades-mobile",
                        );
                        [badgeSidebar, badgeMobile].forEach((b) => {
                            if (b) {
                                if (badgeCount > 0) {
                                    b.textContent = badgeCount.toString();
                                    b.classList.remove("hidden");
                                } else {
                                    b.classList.add("hidden");
                                }
                            }
                        });
                    });
                } catch (e) {
                    console.error("Error referencing opportunities badge:", e);
                }
            }

            // If they read the notification or click it, we should mark it as read eventually.
            // For now this implementation only shows *unread* notifications in the badge.

            // Initialize FCM
            if (uid) {
                initMessaging(uid);
            }

            async function initMessaging(uid) {
                try {
                    if (
                        typeof window === "undefined" ||
                        !("serviceWorker" in navigator)
                    )
                        return;

                    const { messaging } = await import("../../firebase/client");
                    if (!messaging) return;

                    const { getToken } = await import("firebase/messaging");
                    const { doc, setDoc } = await import("firebase/firestore");

                    const permission = await Notification.requestPermission();
                    if (permission !== "granted") return;

                    const token = await getToken(messaging, {
                        vapidKey:
                            "BHSe6NiGcSqBkQw7vpb_jqUh87IpYX5jj8ZiZmbDBS7ekm5NIgP3IxqU3mdpiVefN2VTebf8ol_BYVGN0gWLN-k",
                        serviceWorkerRegistration:
                            await navigator.serviceWorker.ready,
                    });

                    if (token) {
                        const tokenRef = doc(
                            db,
                            "profesionales",
                            uid,
                            "fcmTokens",
                            token,
                        );
                        await setDoc(tokenRef, {
                            token: token,
                            device: navigator.userAgent,
                            updatedAt: new Date(),
                        });
                    }
                } catch (e) {
                    console.log("[FCM] Error:", e);
                }
            }
        }

        logoutBtn?.addEventListener("click", async () => {
            await signOut(auth);
            window.location.href = "/";
        });

        // === GAMIFICATION LOGIC ===
        async function calculateGamification(uid, userData) {
            console.log("🎮 [GAMIFICATION] Calculating for XP...");
            let xp = 0;

            // 1. Calculate Points
            const hasPhoto =
                userData.foto && !userData.foto.includes("ui-avatars");
            const hasRubro = !!userData.rubro || !!userData.rubro_principal;
            const hasZona = !!userData.zona;

            if (hasPhoto) xp += 100;
            if (hasRubro) xp += 50;
            if (hasZona) xp += 50;

            const dailyMissions = [
                {
                    id: "profile",
                    text: "Completa tu perfil",
                    xp: 200,
                    done: hasPhoto && hasRubro && hasZona,
                },
                {
                    id: "photos",
                    text: "Sube 3 fotos a Galería",
                    xp: 150,
                    done: (userData.portfolio?.length || 0) >= 3,
                },
                {
                    id: "review",
                    text: "Consigue 5 estrellas",
                    xp: 300,
                    done: (userData.rating || 0) >= 4.5,
                },
            ];

            dailyMissions.forEach((m) => {
                if (m.done) xp += m.xp;
            });

            console.log("🎮 [GAMIFICATION] Final XP:", xp);

            // 2. Levels
            const levels = [
                { name: "Novato 🌱", threshold: 0 },
                { name: "Aprendiz 🔨", threshold: 500 },
                { name: "Profesional 👷", threshold: 1500 },
                { name: "Experto 🦁", threshold: 5000 },
                { name: "Maestro 👑", threshold: 50000 },
            ];

            let currentLevel = levels[0];
            let nextLevel = levels[1];

            for (let i = 0; i < levels.length; i++) {
                if (xp >= levels[i].threshold) {
                    currentLevel = levels[i];
                    nextLevel = levels[i + 1] || levels[i];
                } else {
                    break;
                }
            }

            // 3. UI Updates
            const lvlName = document.getElementById("level-name");
            const lvlNum = document.getElementById("level-number");
            const lvlProgress = document.getElementById("level-progress");
            const lvlNext = document.getElementById("level-next");
            const totalPointsCard =
                document.getElementById("total-points-card");

            if (lvlName) lvlName.textContent = currentLevel.name;
            if (lvlNum)
                lvlNum.textContent = `Lvl ${levels.indexOf(currentLevel) + 1}`;

            if (lvlProgress) {
                const range = nextLevel.threshold - currentLevel.threshold;
                const progress =
                    range > 0
                        ? ((xp - currentLevel.threshold) / range) * 100
                        : 100;
                lvlProgress.style.width = `${Math.min(100, progress)}%`;
            }

            if (lvlNext) {
                if (nextLevel === currentLevel) {
                    lvlNext.textContent = "¡Nivel máximo alcanzado!";
                } else {
                    lvlNext.textContent = `${nextLevel.threshold - xp} XP para el siguiente nivel`;
                }
            }

            if (totalPointsCard) {
                totalPointsCard.textContent = xp.toLocaleString();
            }

            // Update Missions Sidebar
            const missionsHtml = dailyMissions
                .map(
                    (m) => `
                <div class="flex items-center gap-3">
                     <div class="w-5 h-5 rounded-full border-2 ${m.done ? "border-green-400 bg-green-400" : "border-white/30"} flex items-center justify-center text-indigo-900 text-xs font-bold">
                        ${m.done ? "✓" : ""}
                     </div>
                     <p class="text-sm ${m.done ? "text-indigo-200 line-through" : "text-white"}">
                         ${m.text} (+${m.xp}xp)
                     </p>
                </div>
            `,
                )
                .join("");

            const missionsList = document.getElementById("misiones-list");
            if (missionsList) missionsList.innerHTML = missionsHtml;
        }

        // Service Worker logic outside functions
        if ("serviceWorker" in navigator) {
            window.addEventListener("load", () => {
                navigator.serviceWorker
                    .register("/sw.js")
                    .then((reg) => console.log("✅ SW registrado:", reg.scope))
                    .catch((err) => console.log("❌ Error SW:", err));
            });
        }