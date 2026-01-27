import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function ProfileLightbox({ images }) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Abrir lightbox al hacer click en una imagen con clase .open-lightbox
    useEffect(() => {
        const handleImageClick = (e) => {
            if (e.target.classList.contains('open-lightbox')) {
                const index = parseInt(e.target.dataset.index || '0');
                setCurrentIndex(index);
                setIsOpen(true);
            }
        };

        document.addEventListener('click', handleImageClick);
        return () => document.removeEventListener('click', handleImageClick);
    }, []);

    // Manejo de teclado
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setIsOpen(false);
            if (e.key === 'ArrowLeft') showPrev();
            if (e.key === 'ArrowRight') showNext();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    const showPrev = () => {
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const showNext = () => {
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    if (!isOpen || !images || images.length === 0) return null;

    return createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-95 z-[9999] flex flex-col items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <button
                onClick={() => setIsOpen(false)}
                className="absolute top-5 right-5 text-white text-4xl font-bold hover:text-gray-300 focus:outline-none z-50 transition-colors"
            >
                ×
            </button>

            <div className="relative w-full max-w-4xl h-[70vh] flex items-center justify-center">
                <button
                    onClick={showPrev}
                    className="absolute left-2 text-white text-5xl hover:text-orange-500 transition opacity-70 hover:opacity-100 drop-shadow-lg z-10"
                >
                    ‹
                </button>

                <img
                    src={images[currentIndex]}
                    className="max-w-full max-h-full rounded shadow-2xl object-contain animate-scale-in"
                    alt={`Imagen ${currentIndex + 1}`}
                />

                <button
                    onClick={showNext}
                    className="absolute right-2 text-white text-5xl hover:text-orange-500 transition opacity-70 hover:opacity-100 drop-shadow-lg z-10"
                >
                    ›
                </button>
            </div>

            <div className="mt-4 w-full max-w-4xl overflow-x-auto flex gap-2 p-2 scrollbar-hide bg-white/10 rounded-lg backdrop-blur-md border border-white/20">
                {images.map((img, idx) => (
                    <img
                        key={idx}
                        src={img}
                        onClick={() => setCurrentIndex(idx)}
                        className={`h-16 w-16 object-cover rounded-md cursor-pointer border-2 transition-all ${idx === currentIndex
                                ? 'opacity-100 border-orange-500 scale-105'
                                : 'opacity-60 hover:opacity-100 border-transparent'
                            }`}
                    />
                ))}
            </div>
        </div>,
        document.body
    );
}
