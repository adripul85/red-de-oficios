import { useState } from 'react';
import Swal from 'sweetalert2';

export default function ProfileBudgetModal({ services, proName, proRubro, proTel, proMat }) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedServices, setSelectedServices] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);

    // Escuchar eventos para abrir el modal (desde botones externos)
    // Usamos custom events o ids fijos por ahora para compatibilidad con botones existentes
    // En una refactorización mayor, pasaríamos setIsOpen como prop o context
    // PERO para integrarlo rápido en Astro sin migrar todo:
    if (typeof window !== 'undefined') {
        window.openBudgetModal = () => setIsOpen(true);
    }

    const toggleService = (index) => {
        if (selectedServices.includes(index)) {
            setSelectedServices(prev => prev.filter(i => i !== index));
        } else {
            setSelectedServices(prev => [...prev, index]);
        }
    };

    const generatePDF = async () => {
        if (selectedServices.length === 0) {
            return Swal.fire("Atención", "Por favor selecciona al menos un servicio.", "warning");
        }

        setIsGenerating(true);

        try {
            // Import dinámico para no cargar jsPDF al inicio
            const { jsPDF } = await import('jspdf');

            const doc = new jsPDF();
            const selected = selectedServices.map(idx => services[idx]);

            // --- LOGICA DE GENERACION (Migrada del inline script) ---
            const primaryDark = [31, 41, 55];
            const accentOrange = [234, 88, 12];
            const lightGray = [245, 245, 245];
            const textDark = [40, 40, 40];
            const textGray = [100, 100, 100];

            // HEADER
            doc.setFillColor(...primaryDark);
            doc.rect(0, 0, 210, 45, "F");
            doc.setFillColor(...accentOrange);
            doc.rect(0, 45, 210, 3, "F");

            // Titulo
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.setFont(undefined, "bold");
            doc.text("PRESUPUESTO PROFESIONAL", 35, 22);

            // Fecha
            doc.setFontSize(9);
            doc.setFont(undefined, "normal");
            doc.setTextColor(200, 200, 200);
            const fecha = new Date().toLocaleDateString("es-AR", { year: "numeric", month: "long", day: "numeric" });
            doc.text("Emitido: " + fecha, 35, 30);

            // Info Pro
            let y = 60;
            doc.setFillColor(...lightGray);
            doc.roundedRect(15, y, 180, 28, 3, 3, "F");

            doc.setTextColor(...textDark);
            doc.setFontSize(16);
            doc.setFont(undefined, "bold");
            doc.text(proName, 20, y + 8);

            doc.setFontSize(11);
            doc.setFont(undefined, "normal");
            doc.setTextColor(...textGray);
            doc.text(proRubro, 20, y + 15);
            if (proTel) doc.text("Tel: " + proTel, 20, y + 22);
            if (proMat) {
                // Si es objeto, sacar valor
                const mat = typeof proMat === 'object' ? proMat.valor : proMat;
                doc.text("Mat. " + mat, 150, y + 22);
            }

            // Tabla
            y = 100;
            doc.setFillColor(...accentOrange);
            doc.roundedRect(15, y, 180, 12, 2, 2, "F");
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(11);
            doc.setFont(undefined, "bold");
            doc.text("DESCRIPCION DEL SERVICIO", 20, y + 8);
            doc.text("VALOR ESTIMADO", 150, y + 8);

            y += 20;
            let totalMin = 0;
            let totalMax = 0;

            selected.forEach((s, index) => {
                if (index % 2 === 0) {
                    doc.setFillColor(250, 250, 250);
                    doc.rect(15, y - 5, 180, 0, "F");
                }

                const nombre = typeof s === 'object' ? s.nombre : s;
                // Si es string simple, no tiene precios. Fakeamos min/max visual
                const min = s.min || 0;
                const max = s.max || 0;

                doc.setFont(undefined, "bold");
                doc.setFontSize(11);
                doc.setTextColor(...textDark);
                doc.text(nombre, 20, y);

                doc.setTextColor(...accentOrange);
                if (min || max) {
                    doc.text(`$${min.toLocaleString()} - $${max.toLocaleString()}`, 150, y);
                    totalMin += parseInt(min);
                    totalMax += parseInt(max);
                } else {
                    doc.text("A convenir", 150, y);
                }

                y += 8;
                // Descripcion si existe
                if (s.descripcion) {
                    doc.setFontSize(9);
                    doc.setTextColor(...textGray);
                    doc.setFont(undefined, "normal");
                    const lines = doc.splitTextToSize(s.descripcion, 125);
                    doc.text(lines, 20, y);
                    y += lines.length * 4;
                }

                doc.setDrawColor(220, 220, 220);
                doc.setLineWidth(0.3);
                doc.line(15, y + 2, 195, y + 2);
                y += 8;
            });

            // Total
            y += 5;
            doc.setFillColor(...lightGray);
            doc.roundedRect(15, y, 180, 20, 2, 2, "F");
            doc.setFontSize(12);
            doc.setFont(undefined, "bold");
            doc.setTextColor(...textDark);
            doc.text("RANGO TOTAL ESTIMADO:", 20, y + 8);
            doc.setFontSize(14);
            doc.setTextColor(...accentOrange);
            doc.text(`$${totalMin.toLocaleString()} - $${totalMax.toLocaleString()}`, 20, y + 15);

            doc.save(`Presupuesto_${proName.replace(/\s+/g, "_")}.pdf`);
            Swal.fire("¡Listo!", "Tu presupuesto se ha descargado.", "success");
            setIsOpen(false);
        } catch (e) {
            console.error(e);
            Swal.fire("Error", "No se pudo generar el PDF", "error");
        } finally {
            setIsGenerating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-lg mx-4 relative shadow-2xl overflow-hidden animate-fade-in-up">
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-500 to-red-600 p-6 text-white flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-xl">Ver Presupuestos</h3>
                        <p className="text-xs text-orange-100 mt-1">Selecciona los servicios de interés</p>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-white hover:text-gray-200 text-2xl font-bold"
                    >
                        &times;
                    </button>
                </div>

                {/* Lista */}
                <div className="flex-1 overflow-y-auto p-6 space-y-3 max-h-[60vh]">
                    {(!services || services.length === 0) ? (
                        <p className="text-gray-500 text-center py-4">Este profesional no tiene servicios configurados.</p>
                    ) : (
                        services.map((s, idx) => (
                            <div
                                key={idx}
                                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-orange-50 transition cursor-pointer"
                                onClick={() => toggleService(idx)}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedServices.includes(idx)}
                                    onChange={() => { }} // dummy
                                    className="mt-1 w-5 h-5 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
                                />
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-gray-800 text-sm">{typeof s === 'object' ? s.nombre : s}</h4>
                                        {(s.min || s.max) && (
                                            <span className="text-orange-600 font-bold text-sm text-right">
                                                ${s.min?.toLocaleString()} - ${s.max?.toLocaleString()}
                                            </span>
                                        )}
                                    </div>
                                    {s.descripcion && <p className="text-xs text-gray-500 mt-1">{s.descripcion}</p>}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t bg-gray-50 flex gap-3 justify-end">
                    <button
                        onClick={() => setIsOpen(false)}
                        className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={generatePDF}
                        disabled={isGenerating || selectedServices.length === 0}
                        className="px-6 py-2 bg-orange-600 text-white rounded-lg font-bold shadow-md hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isGenerating ? 'Generando...' : 'Descargar PDF'}
                    </button>
                </div>
            </div>
        </div>
    );
}
