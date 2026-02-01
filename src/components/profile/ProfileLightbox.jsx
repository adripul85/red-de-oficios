import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

export default function ProfileLightbox({ images = [] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Function to handle image clicks
    const handleImageClick = useCallback((e) => {
        const target = e.target.closest('.open-lightbox');
        if (target) {
            const index = parseInt(target.dataset.index || '0');
            setCurrentIndex(index);
            setIsOpen(true);
        }
    }, []);

    // Effect for click listener
    useEffect(() => {
        document.addEventListener('click', handleImageClick);
        return () => document.removeEventListener('click', handleImageClick);
    }, [handleImageClick, images.length]);

    // Handle Prev/Next logic
    const showPrev = useCallback(() => {
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    }, [images.length]);

    const showNext = useCallback(() => {
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }, [images.length]);

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setIsOpen(false);
            if (e.key === 'ArrowLeft') showPrev();
            if (e.key === 'ArrowRight') showNext();
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, showPrev, showNext]);

    if (!isOpen || !images || images.length === 0) return null;

    const getImageUrl = (item) => {
        if (!item) return '';
        return typeof item === 'string' ? item : (item.url || item.URL || '');
    };

    const currentImage = images[currentIndex];

    return createPortal(
        <div className="fixed inset-0 bg-black/95 z-[99999] flex flex-col items-center justify-center p-4 backdrop-blur-md animate-fade-in" style={{ isolation: 'isolate' }}>
            {/* Close Button */}
            <button
                onClick={() => setIsOpen(false)}
                className="absolute top-5 right-5 text-white/80 hover:text-white text-5xl font-light focus:outline-none z-[100000] p-4 transition-all hover:scale-110 active:scale-90"
                aria-label="Cerrar"
            >
                ✕
            </button>

            {/* Main Content Area */}
            <div className="relative w-full max-w-4xl h-[70vh] flex items-center justify-center group bg-black/40 rounded-3xl border border-white/5 shadow-2xl overflow-hidden">
                <button
                    onClick={(e) => { e.stopPropagation(); showPrev(); }}
                    className="absolute left-4 text-white hover:text-orange-500 transition-all opacity-40 group-hover:opacity-100 drop-shadow-2xl z-20 p-6 text-7xl font-thin select-none"
                    aria-label="Anterior"
                >
                    ‹
                </button>

                <div className="w-full h-full flex flex-col items-center justify-center p-8 md:p-12 relative overflow-hidden">
                    <img
                        key={currentIndex}
                        src={getImageUrl(currentImage)}
                        className="max-w-full max-h-full rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] object-contain transition-all animate-scale-in border border-white/5"
                        alt={`Trabajo ${currentIndex + 1}`}
                    />

                    {/* Caption: Title & Description */}
                    {typeof currentImage !== 'string' && (currentImage.titulo || currentImage.descripcion) && (
                        <div className="mt-6 bg-white/10 backdrop-blur-xl px-8 py-4 rounded-3xl border border-white/20 text-center max-w-[80%] shadow-2xl">
                            {currentImage.titulo && <h4 className="text-white font-black text-xl mb-1 tracking-tight">{currentImage.titulo}</h4>}
                            {currentImage.descripcion && <p className="text-white/70 text-sm font-medium leading-relaxed">{currentImage.descripcion}</p>}
                        </div>
                    )}
                </div>

                <button
                    onClick={(e) => { e.stopPropagation(); showNext(); }}
                    className="absolute right-4 text-white hover:text-orange-500 transition-all opacity-40 group-hover:opacity-100 drop-shadow-2xl z-20 p-6 text-7xl font-thin select-none"
                    aria-label="Siguiente"
                >
                    ›
                </button>
            </div>

            {/* Thumbnails Strip */}
            <div className="mt-10 w-full max-w-5xl overflow-x-auto flex gap-4 p-4 scrollbar-hide bg-white/5 rounded-[2rem] backdrop-blur-sm border border-white/10 mx-4">
                {images.map((img, idx) => (
                    <img
                        key={idx}
                        src={getImageUrl(img)}
                        onClick={() => setCurrentIndex(idx)}
                        className={`h-24 w-24 md:h-28 md:w-28 object-cover rounded-2xl cursor-pointer border-4 transition-all shrink-0 hover:scale-105 active:scale-95 ${idx === currentIndex
                            ? 'opacity-100 border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.4)]'
                            : 'opacity-30 hover:opacity-60 border-transparent'
                            }`}
                        alt={`Miniatura ${idx + 1}`}
                    />
                ))}
            </div>
        </div>,
        document.body
    );
}
