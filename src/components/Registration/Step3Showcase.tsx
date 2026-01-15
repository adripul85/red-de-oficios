import React, { useState } from 'react';

interface Step3Props {
    data: any;
    onChange: (field: string, value: any) => void;
    onSubmit: () => void;
    onBack: () => void;
}

export default function Step3Showcase({ data, onChange, onSubmit, onBack }: Step3Props) {

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
    const isFree = !data.plan || data.plan === 'gratuito';

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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Foto de Perfil (URL)</label>
                    <div className="flex items-center space-x-4">
                        <div className="h-16 w-16 bg-gray-200 rounded-full overflow-hidden flex-shrink-0 border border-gray-300">
                            {data.foto ? (
                                <img src={data.foto} alt="Preview" className="h-full w-full object-cover" />
                            ) : (
                                <span className="flex items-center justify-center h-full text-gray-400 text-2xl">👤</span>
                            )}
                        </div>
                        <input
                            type="text"
                            value={data.foto || ''}
                            onChange={(e) => onChange('foto', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm p-3 border focus:border-orange-500 focus:ring-orange-500"
                            placeholder="https://... (Pegá el link de tu foto)"
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 ml-20">Podés usar el link de tu foto de Facebook, Instagram, LinkedIn o Unsplash.</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fotos de Trabajos (Links)</label>
                    <p className="text-xs text-gray-500 mb-2">Pegá links de fotos de tus trabajos anteriores.</p>

                    {/* ALWAYS LOCKED FOR FREE PLAN (registration default) */}
                    {isFree ? (
                        <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-6 text-center">
                            <span className="text-3xl block mb-2">🔒</span>
                            <p className="text-sm font-bold text-gray-700 mb-1">Portfolio Bloqueado</p>
                            <p className="text-xs text-gray-500">
                                Tu plan inicial es <strong>Gratuito</strong>. <br />
                                Podrás subir fotos de tus trabajos al mejorar a <strong>Premium</strong> desde tu perfil.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <input
                                type="text"
                                value={data.portfolio ? data.portfolio[0] : ''}
                                onChange={(e) => {
                                    const newPhotos = [...(data.portfolio || [])];
                                    newPhotos[0] = e.target.value;
                                    onChange('portfolio', newPhotos);
                                }}
                                className="block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                                placeholder="Link Foto 1"
                            />
                            <input
                                type="text"
                                value={data.portfolio ? data.portfolio[1] : ''}
                                onChange={(e) => {
                                    const newPhotos = [...(data.portfolio || [])];
                                    newPhotos[1] = e.target.value;
                                    onChange('portfolio', newPhotos);
                                }}
                                className="block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                                placeholder="Link Foto 2"
                            />
                        </div>
                    )}
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
