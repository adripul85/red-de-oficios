import React, { useState, useRef } from 'react';
import { uploadAnonymousImage } from '../../firebase/storage-utils';

interface Step3Props {
    data: any;
    onChange: (field: string, value: any) => void;
    onSubmit: () => void;
    onBack: () => void;
}

export default function Step3Showcase({ data, onChange, onSubmit, onBack }: Step3Props) {
    const [isUploading, setIsUploading] = useState<Record<string, boolean>>({});
    const profFileRef = useRef<HTMLInputElement>(null);
    const portFileRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

    const handleUpload = async (file: File, field: string, index?: number) => {
        if (!file) return;

        const uploadKey = index !== undefined ? `${field}_${index}` : field;
        setIsUploading(prev => ({ ...prev, [uploadKey]: true }));

        try {
            const url = await uploadAnonymousImage(file, field === 'foto' ? 'avatar' : 'portfolio');

            if (field === 'foto') {
                onChange('foto', url);
            } else if (field === 'portfolio') {
                const newPhotos = [...(data.portfolio || [])];
                newPhotos[index!] = url;
                onChange('portfolio', newPhotos);
            }
        } catch (error: any) {
            alert("Error al subir imagen: " + error.message);
        } finally {
            setIsUploading(prev => ({ ...prev, [uploadKey]: false }));
        }
    };

    const handlePaymentToggle = (method: string) => {
        const current = (data.medios_pago as string[]) || [];
        if (current.includes(method)) {
            onChange('medios_pago', current.filter(m => m !== method));
        } else {
            onChange('medios_pago', [...current, method]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit();
    };

    // Check if user is on free plan (default for registration)
    const isFree = !data.plan || data.plan === 'gratuito' || data.plan === 'prueba';

    return (
        <form onSubmit={handleSubmit} className="space-y-6">

            {/* DESCRIPCIÓN */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex justify-between items-center">
                    <span>Descripción del Servicio *</span>
                    <button
                        type="button"
                        onClick={() => {
                            const rubro = data.rubro_principal || "Profesional";
                            const nombre = data.nombre || "Profesional";
                            const zona = data.zona || "tu zona";

                            const templates: Record<string, string> = {
                                "Plomería": `¡Hola! Soy ${nombre}, plomero matriculado con experiencia en ${zona}. Especialista en reparaciones urgentes, instalaciones y destapaciones. Materiales premium, garantía escrita. Emergencias 24/7. ¡Presupuesto gratis!`,
                                "Electricidad": `Electricista ${nombre} en ${zona}. Instalaciones, reparaciones, puestas a tierra. Matriculado, materiales normalizados. Emergencias 24hs.`,
                                "Gasista": `Gasista matriculado ${nombre}. Instalación/reparación de artefactos en ${zona}, certificaciones Metrogas. ¡Tu seguridad primero!`,
                                "Construcción": `Constructor ${nombre} en ${zona}. Refacciones, ampliaciones, obra nueva. Equipo propio, trabajo llave en mano.`,
                                "Pintura": `Pintor ${nombre} en ${zona}. Interior/exterior, revestimientos, altura. Materiales de calidad.`,
                                "Carpintería": `Carpintero ${nombre} en ${zona}. Muebles a medida: placares, cocinas, deck. Diseño personalizado.`,
                                "Jardinería": `Jardinero ${nombre} en ${zona}. Mantenimiento, poda, diseño paisajístico, riego automático.`,
                                "Limpieza": `Limpieza profesional ${nombre} en ${zona}. Hogares, oficinas, post-obra. Productos ecológicos.`,
                            };

                            let generatedText = templates["default"] || `¡Hola! Soy ${nombre}, ${rubro} con experiencia en ${zona}. Calidad, puntualidad y atención personalizada. Materiales premium, garantía en todos mis servicios. ¡Presupuesto gratis!`;

                            for (const [key, template] of Object.entries(templates)) {
                                if (rubro.toLowerCase().includes(key.toLowerCase())) {
                                    generatedText = template;
                                    break;
                                }
                            }

                            if (!data.descripcion_servicio || confirm("¿Reemplazar el texto actual?")) {
                                onChange('descripcion_servicio', generatedText);
                            }
                        }}
                        className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded flex items-center gap-1 hover:bg-indigo-200 transition"
                    >
                        <span>✨</span> Mejorar con IA
                    </button>
                </label>
                <textarea
                    required
                    rows={4}
                    value={data.descripcion_servicio || ''}
                    onChange={(e) => onChange('descripcion_servicio', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-3 border focus:border-orange-500 focus:ring-orange-500"
                    placeholder="Más de 10 años de experiencia, trabajos con garantía y presupuesto sin cargo..."
                />
                <p className="text-xs text-gray-500 mt-1">Tip: Sé breve pero contundente. Esto es lo primero que leen.</p>
            </div>

            {/* FOTOS */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-3">📸 Tu Imagen</h3>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2 font-bold">Foto de Perfil</label>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="h-20 w-20 bg-gray-200 rounded-full overflow-hidden flex-shrink-0 border-2 border-orange-200 relative group">
                            {data.foto ? (
                                <img src={data.foto} alt="Preview" className="h-full w-full object-cover" />
                            ) : (
                                <span className="flex items-center justify-center h-full text-gray-400 text-3xl">👤</span>
                            )}
                            {isUploading['foto'] && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 w-full space-y-2">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={data.foto || ''}
                                    onChange={(e) => onChange('foto', e.target.value)}
                                    className="flex-1 rounded-md border-gray-300 shadow-sm text-sm p-2 border focus:border-orange-500 focus:ring-orange-500"
                                    placeholder="Pegá el link de tu foto o subí una →"
                                />
                                <input
                                    type="file"
                                    ref={profFileRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'foto')}
                                />
                                <button
                                    type="button"
                                    disabled={isUploading['foto']}
                                    onClick={() => profFileRef.current?.click()}
                                    className="bg-white border-2 border-orange-500 text-orange-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-orange-50 transition flex items-center gap-2 whitespace-nowrap min-w-[120px] justify-center"
                                >
                                    {isUploading['foto'] ? 'Subiendo...' : '📁 Subir Foto'}
                                </button>
                            </div>
                            <p className="text-[10px] text-gray-500">Podés usar el link de Facebook/Instagram o subir una desde tu celular.</p>
                        </div>
                    </div>
                </div>

                <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2 font-bold">Fotos de Trabajos (Portfolio)</label>
                    <p className="text-[10px] text-gray-500 mb-2">Muestra tus mejores trabajos para generar confianza.</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[0, 1].map((idx) => (
                            <div key={idx} className="space-y-2">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={data.portfolio ? data.portfolio[idx] : ''}
                                        onChange={(e) => {
                                            const newPhotos = [...(data.portfolio || [])];
                                            newPhotos[idx] = e.target.value;
                                            onChange('portfolio', newPhotos);
                                        }}
                                        className="flex-1 rounded-md border-gray-300 shadow-sm text-sm p-2 border focus:border-orange-500 focus:ring-orange-500"
                                        placeholder={`Link Foto ${idx + 1}`}
                                    />
                                    <input
                                        type="file"
                                        ref={portFileRefs[idx]}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'portfolio', idx)}
                                    />
                                    <button
                                        type="button"
                                        disabled={isUploading[`portfolio_${idx}`]}
                                        onClick={() => portFileRefs[idx].current?.click()}
                                        className="bg-gray-100 border border-gray-300 text-gray-600 p-2 rounded-lg hover:bg-gray-200 transition"
                                        title="Subir archivo"
                                    >
                                        {isUploading[`portfolio_${idx}`] ? '⌛' : '📁'}
                                    </button>
                                </div>
                                {data.portfolio?.[idx] && (
                                    <div className="h-32 w-full bg-gray-200 rounded-lg overflow-hidden border border-gray-100 shadow-inner group relative">
                                        <img src={data.portfolio[idx]} alt="Preview" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newPhotos = [...(data.portfolio || [])];
                                                newPhotos[idx] = '';
                                                onChange('portfolio', newPhotos);
                                            }}
                                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full text-[10px] opacity-0 group-hover:opacity-100 transition"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* PAGOS Y FACTURA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Medios de Pago</label>
                    <div className="space-y-2">
                        {['Efectivo', 'Transferencia', 'Mercado Pago', 'Tarjeta Crédito/Débito'].map(method => (
                            <label key={method} className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={(data.medios_pago || []).includes(method)}
                                    onChange={() => handlePaymentToggle(method)}
                                    className="rounded text-orange-600 focus:ring-orange-500"
                                />
                                <span className="text-sm text-gray-700">{method}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">¿Emitís Factura?</label>
                    <select
                        value={data.tipo_factura || ''}
                        onChange={(e) => onChange('tipo_factura', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                    >
                        <option value="">Seleccionar...</option>
                        <option value="C">Factura C (Monotributo)</option>
                        <option value="A">Factura A (Resp. Inscripto)</option>
                        <option value="B">Factura B (Resp. Inscripto)</option>
                        <option value="no">No emito factura</option>
                    </select>
                </div>
            </div>

            <div className="pt-4 flex justify-between items-center">
                <button
                    type="button"
                    onClick={onBack}
                    className="text-gray-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition"
                >
                    ⬅️ Volver
                </button>
                <button
                    type="submit"
                    className="bg-orange-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-orange-700 transition shadow-lg transform hover:scale-105"
                >
                    🎉 FINALIZAR REGISTRO
                </button>
            </div>
        </form>
    );
}
