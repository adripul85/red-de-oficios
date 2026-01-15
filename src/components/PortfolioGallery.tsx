import React, { useState } from 'react';

interface PortfolioItem {
    id: string;
    url: string;
    tipo: 'storage' | 'url';
    descripcion: string;
    fecha: number;
}

interface PortfolioGalleryProps {
    categorizedData?: Record<string, PortfolioItem[]>;
    legacyData?: string[];
}

export default function PortfolioGallery({ categorizedData, legacyData }: PortfolioGalleryProps) {
    // Procesar datos iniciales
    const categories = categorizedData ? Object.keys(categorizedData) : [];
    const hasCategories = categories.length > 0;

    const [activeCategory, setActiveCategory] = useState<string>(
        hasCategories ? categories[0] : 'General'
    );

    const [selectedImage, setSelectedImage] = useState<{ url: string, desc: string } | null>(null);

    // Determinar qué fotos mostrar
    let photosToShow: { url: string; descripcion?: string }[] = [];

    if (hasCategories) {
        photosToShow = categorizedData![activeCategory] || [];
    } else if (legacyData && legacyData.length > 0) {
        photosToShow = legacyData.map(url => ({ url, descripcion: '' }));
    }

    if (photosToShow.length === 0) return null;

    return (
        <div className="info-card">
            <h3 className="title-lg" style={{ marginBottom: '15px' }}>Mis Trabajos 📸</h3>

            {/* Tabs de Categorías */}
            {hasCategories && categories.length > 1 && (
                <div className="gallery-tabs">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            className={`gallery-tab ${activeCategory === cat ? 'active' : ''}`}
                            onClick={() => setActiveCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            )}

            {/* Grid de Fotos */}
            <div className="portfolio-grid">
                {photosToShow.map((photo, idx) => (
                    <div
                        key={idx}
                        className="portfolio-item-wrapper"
                        onClick={() => setSelectedImage({ url: photo.url, desc: photo.descripcion || '' })}
                    >
                        <img
                            src={photo.url}
                            alt={photo.descripcion || "Trabajo realizado"}
                            className="portfolio-img"
                            loading="lazy"
                        />
                        {hasCategories && (
                            <div className="hover-overlay">
                                <span>🔍 Ver</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Modal Lightbox */}
            {selectedImage && (
                <div className="lightbox-overlay" onClick={() => setSelectedImage(null)}>
                    <div className="lightbox-content" onClick={e => e.stopPropagation()}>
                        <img src={selectedImage.url} alt="Full size" />
                        {selectedImage.desc && (
                            <p className="lightbox-desc">{selectedImage.desc}</p>
                        )}
                        <button className="lightbox-close" onClick={() => setSelectedImage(null)}>×</button>
                    </div>
                </div>
            )}

            <style>{`
        .info-card {
            background: white;
            padding: 30px;
            border-radius: 16px;
            border: 1px solid #e5e7eb;
            margin-bottom: 30px;
        }
        .title-lg {
            font-size: 1.6rem;
            margin: 0;
            color: #1f2937;
        }
        
        .gallery-tabs {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            overflow-x: auto;
            padding-bottom: 5px;
        }
        .gallery-tab {
            background: #f3f4f6;
            border: none;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.9rem;
            color: #4b5563;
            cursor: pointer;
            white-space: nowrap;
            transition: all 0.2s;
        }
        .gallery-tab:hover { background: #e5e7eb; }
        .gallery-tab.active {
            background: #ea580c;
            color: white;
            font-weight: 600;
        }

        .portfolio-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 15px;
        }
        .portfolio-item-wrapper {
            position: relative;
            border-radius: 8px;
            overflow: hidden;
            cursor: pointer;
            height: 150px;
        }
        .portfolio-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.3s;
        }
        .portfolio-item-wrapper:hover .portfolio-img {
            transform: scale(1.05);
        }
        .hover-overlay {
            position: absolute;
            top:0; left:0; right:0; bottom:0;
            background: rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            opacity: 0;
            transition: opacity 0.2s;
        }
        .portfolio-item-wrapper:hover .hover-overlay {
            opacity: 1;
        }

        /* Lightbox */
        .lightbox-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.9);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .lightbox-content {
            position: relative;
            max-width: 90vw;
            max-height: 90vh;
        }
        .lightbox-content img {
            max-width: 100%;
            max-height: 85vh;
            border-radius: 4px;
            box-shadow: 0 0 20px rgba(0,0,0,0.5);
        }
        .lightbox-desc {
            color: white;
            text-align: center;
            margin-top: 10px;
            font-size: 1.1rem;
        }
        .lightbox-close {
            position: absolute;
            top: -40px;
            right: 0;
            background: none;
            border: none;
            color: white;
            font-size: 2rem;
            cursor: pointer;
        }
      `}</style>
        </div>
    );
}
