import { useState } from 'react';
import { uploadPortfolioImage, validateImage } from '../firebase/storage-utils';

interface PortfolioUploaderProps {
    userId: string;
    categoria: string;
    onUploadComplete: (imageData: {
        url: string;
        tipo: 'storage' | 'url';
        descripcion: string;
    }) => void;
    onCancel: () => void;
}

export default function PortfolioUploader({
    userId,
    categoria,
    onUploadComplete,
    onCancel
}: PortfolioUploaderProps) {
    const [uploadType, setUploadType] = useState<'storage' | 'url'>('storage');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [externalUrl, setExternalUrl] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState('');

    // Manejar selección de archivo
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validar archivo
        const validation = validateImage(file);
        if (!validation.valid) {
            setError(validation.error || 'Archivo inválido');
            return;
        }

        setSelectedFile(file);
        setError('');

        // Crear preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setPreviewUrl(e.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    // Manejar upload desde Storage
    const handleStorageUpload = async () => {
        if (!selectedFile) {
            setError('Selecciona una imagen primero');
            return;
        }

        setUploading(true);
        setProgress(0);
        setError('');

        try {
            // Simular progreso (Firebase no da progreso real en uploadBytes)
            const progressInterval = setInterval(() => {
                setProgress((prev) => Math.min(prev + 10, 90));
            }, 200);

            const downloadURL = await uploadPortfolioImage(
                selectedFile,
                userId,
                categoria
            );

            clearInterval(progressInterval);
            setProgress(100);

            // Notificar éxito
            onUploadComplete({
                url: downloadURL,
                tipo: 'storage',
                descripcion
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al subir imagen');
            setProgress(0);
        } finally {
            setUploading(false);
        }
    };

    // Manejar upload desde URL
    const handleUrlUpload = () => {
        if (!externalUrl.trim()) {
            setError('Ingresa una URL válida');
            return;
        }

        // Validar que sea una URL
        try {
            new URL(externalUrl);
        } catch {
            setError('URL inválida');
            return;
        }

        onUploadComplete({
            url: externalUrl,
            tipo: 'url',
            descripcion
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (uploadType === 'storage') {
            handleStorageUpload();
        } else {
            handleUrlUpload();
        }
    };

    return (
        <div className="portfolio-uploader-modal">
            <div className="modal-content">
                <button className="modal-close" onClick={onCancel}>
                    ×
                </button>

                <h3>Agregar Foto al Portafolio</h3>
                <p className="modal-subtitle">Categoría: {categoria}</p>

                {/* Selector de tipo de upload */}
                <div className="upload-type-selector">
                    <label className={uploadType === 'storage' ? 'active' : ''}>
                        <input
                            type="radio"
                            name="uploadType"
                            value="storage"
                            checked={uploadType === 'storage'}
                            onChange={() => setUploadType('storage')}
                        />
                        <span>📤 Subir desde mi dispositivo</span>
                    </label>

                    <label className={uploadType === 'url' ? 'active' : ''}>
                        <input
                            type="radio"
                            name="uploadType"
                            value="url"
                            checked={uploadType === 'url'}
                            onChange={() => setUploadType('url')}
                        />
                        <span>🔗 Desde URL (Instagram, etc)</span>
                    </label>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Upload desde Storage */}
                    {uploadType === 'storage' && (
                        <div className="upload-section">
                            <div className="file-input-wrapper">
                                <input
                                    type="file"
                                    id="fileInput"
                                    accept="image/jpeg,image/jpg,image/png,image/webp"
                                    onChange={handleFileSelect}
                                    disabled={uploading}
                                />
                                <label htmlFor="fileInput" className="file-input-label">
                                    {selectedFile ? selectedFile.name : 'Seleccionar archivo...'}
                                </label>
                            </div>

                            {/* Preview */}
                            {previewUrl && (
                                <div className="image-preview">
                                    <img src={previewUrl} alt="Preview" />
                                    <p className="preview-info">
                                        {selectedFile && `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`}
                                    </p>
                                </div>
                            )}

                            {/* Barra de progreso */}
                            {uploading && (
                                <div className="progress-bar">
                                    <div
                                        className="progress-fill"
                                        style={{ width: `${progress}%` }}
                                    />
                                    <span className="progress-text">{progress}%</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Upload desde URL */}
                    {uploadType === 'url' && (
                        <div className="upload-section">
                            <input
                                type="url"
                                className="url-input"
                                placeholder="https://instagram.com/p/..."
                                value={externalUrl}
                                onChange={(e) => setExternalUrl(e.target.value)}
                                disabled={uploading}
                            />
                            <p className="url-hint">
                                💡 Puedes usar enlaces de Instagram, Facebook, Imgur, etc.
                            </p>
                        </div>
                    )}

                    {/* Descripción */}
                    <div className="description-section">
                        <label htmlFor="descripcion">Descripción (opcional):</label>
                        <textarea
                            id="descripcion"
                            placeholder="Ej: Baño completo con porcelanato..."
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                            rows={3}
                            maxLength={200}
                            disabled={uploading}
                        />
                        <span className="char-count">{descripcion.length}/200</span>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="error-message">
                            ⚠️ {error}
                        </div>
                    )}

                    {/* Botones */}
                    <div className="modal-actions">
                        <button
                            type="button"
                            className="btn-cancel"
                            onClick={onCancel}
                            disabled={uploading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn-upload"
                            disabled={uploading || (uploadType === 'storage' && !selectedFile)}
                        >
                            {uploading ? 'Subiendo...' : '📤 Subir Foto'}
                        </button>
                    </div>
                </form>
            </div>

            <style>{`
        .portfolio-uploader-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 20px;
        }

        .modal-content {
          background: white;
          border-radius: 16px;
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
        }

        .modal-content h3 {
          background: linear-gradient(135deg, #ea580c 0%, #f97316 100%);
          color: white;
          margin: 0;
          padding: 24px 30px;
          border-radius: 16px 16px 0 0;
          font-size: 1.5rem;
        }

        .modal-subtitle {
          padding: 12px 30px;
          background: #fff7ed;
          color: #9a3412;
          margin: 0;
          font-weight: 600;
        }

        .modal-close {
          position: absolute;
          top: 20px;
          right: 25px;
          background: none;
          border: none;
          color: white;
          font-size: 32px;
          cursor: pointer;
          z-index: 10;
          line-height: 1;
        }

        .upload-type-selector {
          padding: 20px 30px;
          display: flex;
          gap: 12px;
          flex-direction: column;
        }

        .upload-type-selector label {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .upload-type-selector label:hover {
          border-color: #f97316;
          background: #fff7ed;
        }

        .upload-type-selector label.active {
          border-color: #ea580c;
          background: #fff7ed;
        }

        .upload-type-selector input[type="radio"] {
          width: 20px;
          height: 20px;
          accent-color: #ea580c;
        }

        .upload-type-selector span {
          font-weight: 600;
          font-size: 1rem;
        }

        .upload-section {
          padding: 20px 30px;
        }

        .file-input-wrapper {
          position: relative;
        }

        .file-input-wrapper input[type="file"] {
          position: absolute;
          opacity: 0;
          width: 0;
          height: 0;
        }

        .file-input-label {
          display: block;
          padding: 16px;
          background: #f3f4f6;
          border: 2px dashed #d1d5db;
          border-radius: 12px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s;
        }

        .file-input-label:hover {
          background: #e5e7eb;
          border-color: #f97316;
        }

        .image-preview {
          margin-top: 20px;
          text-align: center;
        }

        .image-preview img {
          max-width: 100%;
          max-height: 300px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .preview-info {
          margin-top: 8px;
          color: #6b7280;
          font-size: 0.9rem;
        }

        .progress-bar {
          margin-top: 20px;
          background: #e5e7eb;
          border-radius: 8px;
          height: 32px;
          position: relative;
          overflow: hidden;
        }

        .progress-fill {
          background: linear-gradient(90deg, #ea580c, #f97316);
          height: 100%;
          transition: width 0.3s;
        }

        .progress-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-weight: 700;
          color: white;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        .url-input {
          width: 100%;
          padding: 14px;
          border: 2px solid #d1d5db;
          border-radius: 12px;
          font-size: 1rem;
          box-sizing: border-box;
        }

        .url-input:focus {
          outline: none;
          border-color: #f97316;
        }

        .url-hint {
          margin-top: 8px;
          color: #6b7280;
          font-size: 0.9rem;
        }

        .description-section {
          padding: 20px 30px;
          border-top: 1px solid #e5e7eb;
        }

        .description-section label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #374151;
        }

        .description-section textarea {
          width: 100%;
          padding: 12px;
          border: 2px solid #d1d5db;
          border-radius: 12px;
          font-family: inherit;
          font-size: 1rem;
          resize: vertical;
          box-sizing: border-box;
        }

        .description-section textarea:focus {
          outline: none;
          border-color: #f97316;
        }

        .char-count {
          display: block;
          text-align: right;
          margin-top: 4px;
          color: #9ca3af;
          font-size: 0.85rem;
        }

        .error-message {
          margin: 0 30px;
          padding: 12px;
          background: #fee2e2;
          border: 1px solid #fca5a5;
          border-radius: 8px;
          color: #991b1b;
          font-weight: 600;
        }

        .modal-actions {
          padding: 20px 30px;
          display: flex;
          gap: 12px;
          background: #f9fafb;
          border-radius: 0 0 16px 16px;
        }

        .modal-actions button {
          flex: 1;
          padding: 14px;
          border: none;
          border-radius: 10px;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s;
        }

        .modal-actions button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-cancel {
          background: #e5e7eb;
          color: #374151;
        }

        .btn-cancel:hover:not(:disabled) {
          background: #d1d5db;
        }

        .btn-upload {
          background: linear-gradient(135deg, #ea580c 0%, #f97316 100%);
          color: white;
        }

        .btn-upload:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(234, 88, 12, 0.3);
        }
      `}</style>
        </div>
    );
}
