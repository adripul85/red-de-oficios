/**
 * Utilidades para manejo de imágenes en Firebase Storage
 * Incluye compresión, validación y upload
 */

import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './client';

/**
 * Comprime una imagen manteniendo aspect ratio
 * @param {File} file - Archivo de imagen original
 * @param {number} maxWidth - Ancho máximo en píxeles (default: 1920)
 * @param {number} quality - Calidad de compresión 0-1 (default: 0.85)
 * @returns {Promise<Blob>} - Imagen comprimida
 */
export async function compressImage(file, maxWidth = 1920, quality = 0.85) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();

            img.onload = () => {
                // Calcular nuevas dimensiones manteniendo aspect ratio
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                // Crear canvas para redimensionar
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Convertir a blob
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Error al comprimir imagen'));
                        }
                    },
                    'image/jpeg',
                    quality
                );
            };

            img.onerror = () => reject(new Error('Error al cargar imagen'));
            img.src = e.target.result;
        };

        reader.onerror = () => reject(new Error('Error al leer archivo'));
        reader.readAsDataURL(file);
    });
}

/**
 * Valida que el archivo sea una imagen válida
 * @param {File} file - Archivo a validar
 * @param {number} maxSizeMB - Tamaño máximo en MB (default: 5)
 * @returns {Object} - {valid: boolean, error: string}
 */
export function validateImage(file, maxSizeMB = 5) {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
        return {
            valid: false,
            error: 'Formato no válido. Solo se permiten JPG, PNG y WebP'
        };
    }

    if (file.size > maxSizeBytes) {
        return {
            valid: false,
            error: `El archivo es muy grande. Máximo ${maxSizeMB}MB`
        };
    }

    return { valid: true, error: null };
}

/**
 * Sanitiza un nombre de archivo
 * @param {string} filename - Nombre original
 * @returns {string} - Nombre sanitizado
 */
function sanitizeFilename(filename) {
    return filename
        .toLowerCase()
        .replace(/[^a-z0-9.]/g, '_')
        .replace(/_+/g, '_')
        .substring(0, 100);
}

/**
 * Sube una imagen al portfolio del usuario en Firebase Storage
 * @param {File} file - Archivo de imagen
 * @param {string} uid - ID del usuario
 * @param {string} categoria - Categoría del portfolio
 * @returns {Promise<string>} - URL de descarga de la imagen
 */
export async function uploadPortfolioImage(file, uid, categoria) {
    try {
        // 1. Validar imagen
        const validation = validateImage(file);
        if (!validation.valid) {
            throw new Error(validation.error);
        }

        // 2. Comprimir imagen
        const compressedBlob = await compressImage(file);

        // 3. Generar nombre único
        const timestamp = Date.now();
        const sanitizedName = sanitizeFilename(file.name);
        const filename = `${timestamp}_${sanitizedName}`;

        // 4. Crear referencia en Storage
        const storagePath = `portfolios/${uid}/${categoria}/${filename}`;
        const storageRef = ref(storage, storagePath);

        // 5. Subir archivo
        await uploadBytes(storageRef, compressedBlob, {
            contentType: 'image/jpeg',
            customMetadata: {
                originalName: file.name,
                uploadedAt: new Date().toISOString()
            }
        });

        // 6. Obtener URL pública
        const downloadURL = await getDownloadURL(storageRef);

        return downloadURL;
    } catch (error) {
        console.error('Error al subir imagen:', error);
        throw error;
    }
}

/**
 * Elimina una imagen del Storage
 * @param {string} imageUrl - URL completa de la imagen
 * @returns {Promise<void>}
 */
export async function deletePortfolioImage(imageUrl) {
    try {
        // Extraer path del Storage desde la URL
        const urlObj = new URL(imageUrl);
        const pathMatch = urlObj.pathname.match(/\/o\/(.+)\?/);

        if (!pathMatch) {
            throw new Error('URL de Storage inválida');
        }

        const path = decodeURIComponent(pathMatch[1]);
        const storageRef = ref(storage, path);

        await deleteObject(storageRef);
    } catch (error) {
        console.error('Error al eliminar imagen:', error);
        throw error;
    }
}

/**
 * Verifica si una URL es de Firebase Storage
 * @param {string} url - URL a verificar
 * @returns {boolean}
 */
export function isStorageUrl(url) {
    return url.includes('firebasestorage.googleapis.com');
}
