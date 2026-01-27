import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/client'; // Added auth import
import { onAuthStateChanged } from 'firebase/auth'; // Added onAuthStateChanged
import { getPortfolioCategories } from '../data/portfolio-categories';
import PortfolioUploader from './PortfolioUploader';
import { deletePortfolioImage, isStorageUrl } from '../firebase/storage-utils';

interface PortfolioItem {
    id: string;
    url: string;
    tipo: 'storage' | 'url';
    descripcion: string;
    fecha: number;
}

interface PortfolioManagerProps {
    userId?: string; // Optional
    userTrade?: string; // Optional
    userPlan?: string; // Optional
}

export default function PortfolioManager(props: PortfolioManagerProps) {
    const [userId, setUserId] = useState(props.userId || '');
    const [userTrade, setUserTrade] = useState(props.userTrade || '');
    const [userPlan, setUserPlan] = useState(props.userPlan || 'gratuito');

    const [categories, setCategories] = useState<string[]>([]);
    const [activeCategory, setActiveCategory] = useState<string>('');
    const [portfolioData, setPortfolioData] = useState<Record<string, PortfolioItem[]>>({});
    const [loading, setLoading] = useState(true);
    const [showUploader, setShowUploader] = useState(false);
    const [migrating, setMigrating] = useState(false);

    // Auth listener & Data Fetching initialization
    useEffect(() => {
        let unsubscribe: () => void;

        if (!props.userId) {
            // Autoload user if not provided via props
            unsubscribe = onAuthStateChanged(auth, async (user) => {
                if (user) {
                    setUserId(user.uid);
                    // Try fetching user data immediately but don't block
                    try {
                        const docRef = doc(db, 'profesionales', user.uid);
                        const snap = await getDoc(docRef);
                        if (snap.exists()) {
                            const data = snap.data();
                            setUserTrade(data.categoria || 'default');
                            setUserPlan(data.plan || 'gratuito');
                        }
                    } catch (e) {
                        console.error("Error fetching user data:", e);
                    }
                } else {
                    setLoading(false); // No user
                }
            });
        } else {
            // Use props
            setUserId(props.userId);
            setUserTrade(props.userTrade || 'default');
            setUserPlan(props.userPlan || 'gratuito');
        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [props.userId, props.userTrade, props.userPlan]);

    // Load Categories & Portfolio when user data is ready
    useEffect(() => {
        if (!userId || !userTrade) return;

        const cats = getPortfolioCategories(userTrade);
        setCategories(cats);
        if (!activeCategory || !cats.includes(activeCategory)) {
            setActiveCategory(cats[0]);
        }

        loadPortfolio();
    }, [userId, userTrade]);

    const loadPortfolio = async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const docRef = doc(db, 'profesionales', userId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                let pData = data.portfolio_categorizado || {};

                // Migración automática de datos antiguos si no existe estructura nueva
                if (Object.keys(pData).length === 0 && data.portfolio && Array.isArray(data.portfolio)) {
                    setMigrating(true);
                    const oldPhotos = data.portfolio as string[];
                    const defaultCat = "Trabajos Generales"; // O la primera categoría

                    const migratedPhotos: PortfolioItem[] = oldPhotos.filter(url => url).map((url, idx) => ({
                        id: `migrated_${Date.now()}_${idx}`,
                        url,
                        tipo: 'url',
                        descripcion: '',
                        fecha: Date.now()
                    }));

                    pData = { [defaultCat]: migratedPhotos };

                    // Guardar migración
                    await updateDoc(docRef, { portfolio_categorizado: pData });
                    setMigrating(false);
                }

                setPortfolioData(pData);
            }
        } catch (error) {
            console.error("Error loading portfolio:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUploadComplete = async (imageData: { url: string; tipo: 'storage' | 'url'; descripcion: string }) => {
        const newItem: PortfolioItem = {
            id: `img_${Date.now()}`,
            url: imageData.url,
            tipo: imageData.tipo,
            descripcion: imageData.descripcion,
            fecha: Date.now()
        };

        const currentList = portfolioData[activeCategory] || [];
        const newList = [...currentList, newItem];
        const newPortfolioData = { ...portfolioData, [activeCategory]: newList };

        // Update local state
        setPortfolioData(newPortfolioData);
        setShowUploader(false);

        // Save to Firestore
        try {
            await updateDoc(doc(db, 'profesionales', userId), {
                portfolio_categorizado: newPortfolioData
            });
        } catch (e) {
            console.error("Error saving portfolio:", e);
            alert("Error al guardar la imagen en la base de datos.");
        }
    };

    const handleDelete = async (item: PortfolioItem, category: string) => {
        if (!confirm("¿Estás seguro de eliminar esta foto?")) return;

        try {
            // 1. Delete from Storage if needed
            if (item.tipo === 'storage' && isStorageUrl(item.url)) {
                await deletePortfolioImage(item.url);
            }

            // 2. Update Firestore
            const currentList = portfolioData[category] || [];
            const newList = currentList.filter(i => i.id !== item.id);
            const newPortfolioData = { ...portfolioData, [category]: newList };

            setPortfolioData(newPortfolioData);

            await updateDoc(doc(db, 'profesionales', userId), {
                portfolio_categorizado: newPortfolioData
            });

        } catch (e) {
            console.error("Error deleting image:", e);
            alert("Error al eliminar la imagen.");
        }
    };

    // Restricciones por plan
    const canAddMorePhotos = () => {
        const totalPhotos = Object.values(portfolioData).reduce((acc, list) => acc + list.length, 0);

        if (userPlan === 'gratuito') return totalPhotos < 3; // Límite gratuito (ahora igual que antes 3 links)
        if (userPlan === 'profesional') return totalPhotos < 15;
        return true; // Semestral/Expert ilimitado
    };

    const isLocked = userPlan === 'gratuito'; // Podríamos bloquear todo feature categorized para gratis?
    // El usuario pidió: "Que no sea solo un feed... y solo para la ultima categoria, que sienta que le estamos dando todo el amor del mundo"
    // Asumo que el "Dynamic Portfolio" es la feature premium.
    // Pero dejaremos un básico para free.

    if (loading) return <div className="p-4 text-center">Cargando portafolio...</div>;

    return (
        <div className="portfolio-manager-container">
            <div className="portfolio-header">
                <h3>📸 Mi Portafolio Profesional</h3>
                <p className="subtitle">Organiza tus trabajos para mostrar lo mejor a tus clientes.</p>

                {isLocked && (
                    <div className="plan-alert">
                        <p>⚠️ Tu plan actual tiene funciones limitadas. <a href="/planes" target="_blank">Pásate a Profesional</a> para categorías y más fotos.</p>
                    </div>
                )}
            </div>

            <div className="categories-tabs">
                {categories.map(cat => (
                    <button
                        key={cat}
                        className={`tab-btn ${activeCategory === cat ? 'active' : ''}`}
                        onClick={() => setActiveCategory(cat)}
                    >
                        {cat}
                        <span className="count-badge">
                            {(portfolioData[cat] || []).length}
                        </span>
                    </button>
                ))}
            </div>

            <div className="active-category-view">
                <div className="category-header">
                    <h4>{activeCategory}</h4>
                    <div className="actions">
                        <button
                            className="btn-add-photo"
                            onClick={() => setShowUploader(true)}
                            disabled={!canAddMorePhotos()}
                        >
                            + Agregar Foto
                        </button>
                    </div>
                </div>

                {!canAddMorePhotos() && (
                    <p className="limit-msg">Has alcanzado el límite de fotos de tu plan.</p>
                )}

                <div className="photos-grid">
                    {(portfolioData[activeCategory] || []).map((item) => (
                        <div key={item.id} className="photo-card">
                            <div className="img-wrapper">
                                <img src={item.url} alt={item.descripcion || "Foto de trabajo"} />
                                <button
                                    className="btn-delete-photo"
                                    onClick={() => handleDelete(item, activeCategory)}
                                    title="Eliminar foto"
                                >
                                    🗑️
                                </button>
                            </div>
                            {item.descripcion && (
                                <p className="photo-desc">{item.descripcion}</p>
                            )}
                        </div>
                    ))}

                    {(portfolioData[activeCategory] || []).length === 0 && (
                        <div className="empty-state">
                            <p>No hay fotos en esta categoría.</p>
                            <button onClick={() => setShowUploader(true)}>Subir primera foto</button>
                        </div>
                    )}
                </div>
            </div>

            {showUploader && (
                <PortfolioUploader
                    userId={userId}
                    categoria={activeCategory}
                    onUploadComplete={handleUploadComplete}
                    onCancel={() => setShowUploader(false)}
                />
            )}

            <style>{`
        .portfolio-manager-container {
            background: #fff;
            border-radius: 12px;
            border: 1px solid #e5e7eb;
            overflow: hidden;
            border: none;
            box-shadow: none;
        }
        .portfolio-header {
            padding: 20px 0;
            background: #fff;
            border-bottom: 2px solid #f3f4f6;
        }
        .portfolio-header h3 { margin: 0 0 5px 0; color: #1f2937; }
        .subtitle { margin: 0; color: #6b7280; font-size: 0.9rem; }
        
        .categories-tabs {
            display: flex;
            overflow-x: auto;
            gap: 5px;
            padding: 15px 0;
            border-bottom: 1px solid #e5e7eb;
            background: #fff;
        }
        .tab-btn {
            background: none;
            border: none;
            padding: 8px 16px;
            border-radius: 20px;
            cursor: pointer;
            white-space: nowrap;
            font-size: 0.9rem;
            color: #4b5563;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s;
            border: 1px solid transparent;
        }
        .tab-btn:hover { background: #f3f4f6; }
        .tab-btn.active {
            background: #fff7ed;
            color: #ea580c;
            font-weight: 600;
            border-color: #fdba74;
        }
        .count-badge {
            background: #e5e7eb;
            color: #4b5563;
            font-size: 0.75rem;
            padding: 2px 6px;
            border-radius: 10px;
        }
        .tab-btn.active .count-badge {
            background: #fdba74;
            color: #9a3412;
        }

        .active-category-view {
            padding: 20px 0;
        }
        .category-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        .category-header h4 { margin: 0; color: #1f2937; font-size: 1.1rem; }
        
        .btn-add-photo {
            background: #ea580c;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            font-size: 0.9rem;
        }
        .btn-add-photo:hover:not(:disabled) { background: #c2410c; }
        .btn-add-photo:disabled { background: #d1d5db; cursor: not-allowed; }

        .photos-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 15px;
        }
        
        .photo-card {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
            background: #fff;
            position: relative;
        }
        .img-wrapper {
            position: relative;
            height: 150px;
        }
        .img-wrapper img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        .btn-delete-photo {
            position: absolute;
            top: 5px;
            right: 5px;
            background: rgba(255,255,255,0.9);
            border: none;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            cursor: pointer;
            opacity: 0;
            transition: opacity 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.8rem;
        }
        .photo-card:hover .btn-delete-photo { opacity: 1; }
        .btn-delete-photo:hover { background: #fee2e2; color: #dc2626; }

        .photo-desc {
            padding: 8px;
            margin: 0;
            font-size: 0.8rem;
            color: #4b5563;
            border-top: 1px solid #e5e7eb;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .empty-state {
            grid-column: 1 / -1;
            text-align: center;
            padding: 40px;
            color: #9ca3af;
            background: #f9fafb;
            border-radius: 8px;
            border: 2px dashed #e5e7eb;
        }
        .empty-state button {
            margin-top: 10px;
            color: #ea580c;
            text-decoration: underline;
            background: none;
            border: none;
            cursor: pointer;
        }
        .plan-alert {
            background: #fff7ed;
            padding: 10px;
            border-radius: 6px;
            margin-top: 10px;
            font-size: 0.85rem;
            color: #9a3412;
        }
        .limit-msg {
            color: #dc2626;
            font-size: 0.9rem;
            margin-top: 0;
            margin-bottom: 15px;
            font-weight: 600;
        }
      `}</style>
        </div>
    );
}
