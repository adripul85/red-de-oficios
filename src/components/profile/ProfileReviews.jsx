import { useState, useEffect } from 'react';
import { db, auth } from '../../firebase/client';
import {
    collection,
    query,
    orderBy,
    getDocs,
    doc,
    getDoc,
    runTransaction,
    serverTimestamp
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function ProfileReviews({ idProfesional }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hoverRating, setHoverRating] = useState(0);

    // 1. Detectar Auth y Cargar Reseñas
    useEffect(() => {
        // Auth Listener
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Buscar datos de cliente
                const clientSnap = await getDoc(doc(db, "clientes", user.uid));
                if (clientSnap.exists()) {
                    setCurrentUser({ uid: user.uid, ...clientSnap.data(), role: 'cliente' });
                } else {
                    // Verificar si es profesional
                    const proSnap = await getDoc(doc(db, "profesionales", user.uid));
                    if (proSnap.exists()) {
                        setCurrentUser({ uid: user.uid, ...proSnap.data(), role: 'profesional', isPro: true });
                    } else {
                        setCurrentUser({ uid: user.uid, role: 'unknown' });
                    }
                }
            } else {
                setCurrentUser(null);
            }
        });

        // Cargar Reseñas
        loadReviews();

        return () => unsubscribe();
    }, [idProfesional]);

    const loadReviews = async () => {
        if (!idProfesional) {
            console.warn("loadReviews: idProfesional es null o undefined");
            setLoading(false);
            return;
        }

        console.log(`Intentando cargar reseñas desde: profesionales/${idProfesional}/resenas`);
        try {
            const q = query(
                collection(db, `profesionales/${idProfesional}/resenas`),
                orderBy("fecha", "desc")
            );
            const snapshot = await getDocs(q);
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            console.log(`Cargadas ${list.length} reseñas (resenas)`);

            // Si no hay en 'resenas', intentar 'reseñas' como fallback (por migración)
            if (list.length === 0) {
                const q2 = query(
                    collection(db, `profesionales/${idProfesional}/reseñas`),
                    orderBy("fecha", "desc")
                );
                const snapshot2 = await getDocs(q2);
                const list2 = snapshot2.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                if (list2.length > 0) {
                    console.log(`Cargadas ${list2.length} reseñas (reseñas - fallback)`);
                    setReviews(list2);
                } else {
                    setReviews([]);
                }
            } else {
                setReviews(list);
            }
        } catch (error) {
            console.error("Error cargando reseñas:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (rating === 0) return alert("Por favor selecciona las estrellas.");
        if (comment.length < 5) return alert("Escribe un comentario un poco más largo.");
        if (!currentUser || currentUser.role !== 'cliente') return alert("Debes estar registrado como cliente para opinar.");
        if (currentUser.uid === idProfesional) return alert("No puedes dejarte una reseña a ti mismo.");

        setIsSubmitting(true);

        try {
            await runTransaction(db, async (transaction) => {
                const proRef = doc(db, "profesionales", idProfesional);
                const proDoc = await transaction.get(proRef);

                if (!proDoc.exists()) throw "Profesional no existe";

                const data = proDoc.data();
                const nuevoTotal = (data.total_valoraciones || 0) + 1;
                const nuevaSuma = (data.suma_puntuacion || 0) + rating;
                const nuevoPromedio = nuevaSuma / nuevoTotal;

                // 1. Crear reseña
                const reseñaRef = doc(collection(db, `profesionales/${idProfesional}/resenas`));
                transaction.set(reseñaRef, {
                    clienteId: currentUser.uid,
                    clienteNombre: currentUser.nombre,
                    clienteFoto: currentUser.foto || null,
                    estrellas: rating,
                    comentario: comment,
                    fecha: serverTimestamp(),
                });

                // 2. Actualizar profesional
                transaction.update(proRef, {
                    total_valoraciones: nuevoTotal,
                    suma_puntuacion: nuevaSuma,
                    puntuacion: nuevoPromedio,
                });
            });

            alert("¡Gracias! Tu opinión ayuda a la comunidad.");
            setComment("");
            setRating(0);
            loadReviews(); // Recargar lista
        } catch (error) {
            console.error(error);
            alert("Error al publicar. Intenta de nuevo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- RENDER ---

    // Skeleton Loading
    if (loading) {
        return <div className="space-y-4 animate-pulse">
            <div className="h-10 bg-gray-200 rounded w-full"></div>
            <div className="h-20 bg-gray-200 rounded w-full"></div>
        </div>;
    }

    return (
        <section id="reviews-section" className="mb-10">
            <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                🌟 Opiniones y Calificaciones
            </h3>

            {/* FORMULARIO */}
            <div className="mb-10">
                {!currentUser ? (
                    // GUEST VIEW
                    <div className="border border-blue-100 bg-blue-50 p-6 rounded-xl text-center">
                        <p className="text-blue-800 font-medium mb-4">Inicia sesión como cliente para dejar tu opinión.</p>
                        <a href="/ingresar-cliente" className="inline-block bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition">
                            Ingresar / Registrarse
                        </a>
                    </div>
                ) : currentUser.isPro ? (
                    <div className="p-4 bg-yellow-50 text-yellow-800 rounded border border-yellow-200">
                        👀 Estás viendo este perfil con una cuenta de Profesional.
                    </div>
                ) : (
                    // USER VIEW
                    <div className="bg-white p-6 rounded-xl border border-blue-100 shadow-md animate-fade-in">
                        <div className="flex items-center gap-3 mb-4">
                            <img
                                src={currentUser.foto || `https://ui-avatars.com/api/?name=${currentUser.nombre}&background=random`}
                                className="w-10 h-10 rounded-full bg-gray-200 object-cover"
                            />
                            <div>
                                <p className="font-bold text-sm">{currentUser.nombre}</p>
                                <p className="text-xs text-green-600 font-semibold">Cliente Verificado ✅</p>
                            </div>
                        </div>

                        <label className="block font-bold mb-2 text-gray-700">Califica tu experiencia:</label>
                        <div className="flex gap-1 text-4xl mb-4 cursor-pointer" onMouseLeave={() => setHoverRating(0)}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    className={`transition-colors ${(hoverRating || rating) >= star ? 'text-yellow-400' : 'text-gray-300'
                                        }`}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onClick={() => setRating(star)}
                                    type="button"
                                >
                                    ★
                                </button>
                            ))}
                        </div>

                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full border border-gray-300 p-3 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
                            rows={3}
                            placeholder="¿Cumplió con lo pactado? ¿Fue puntual? Cuéntanos..."
                        />

                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="bg-blue-600 text-white font-bold py-2.5 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all w-full md:w-auto"
                        >
                            {isSubmitting ? "Publicando..." : "Publicar Reseña"}
                        </button>
                    </div>
                )}
            </div>

            {/* LISTA DE RESEÑAS */}
            <div className="space-y-4">
                {reviews.length === 0 ? (
                    <p className="text-gray-500 italic text-center py-4">Aún no hay opiniones. ¡Sé el primero!</p>
                ) : (
                    reviews.map((r) => {
                        const fecha = r.fecha ? r.fecha.toDate().toLocaleDateString() : "Reciente";
                        return (
                            <div key={r.id} className="border-b border-gray-100 pb-4 mb-4 last:border-0 hover:bg-gray-50 p-2 rounded transition">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={r.clienteFoto || `https://ui-avatars.com/api/?name=${r.clienteNombre}`}
                                            className="w-8 h-8 rounded-full object-cover"
                                        />
                                        <div>
                                            <p className="font-bold text-sm text-gray-800">{r.clienteNombre}</p>
                                            <div className="text-yellow-400 text-xs">
                                                {"★".repeat(r.estrellas)}{"☆".repeat(5 - r.estrellas)}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-400">{fecha}</span>
                                </div>
                                <p className="mt-2 text-gray-600 text-sm whitespace-pre-wrap">{r.comentario}</p>
                            </div>
                        );
                    })
                )}
            </div>
        </section>
    );
}
