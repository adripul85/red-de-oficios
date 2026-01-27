import React, { useState, useEffect } from 'react';
import { LOCATIONS } from '../../data/locations';
import { CATEGORIES } from '../../data/categories'; // Asegúrate de tener este import o define CATEGORIES aquí mismo

interface Step2Props {
    data: any;
    onChange: (field: string, value: any) => void;
    onNext: () => void;
    onBack: () => void;
}

const Step2Specialty: React.FC<Step2Props> = ({ data, onChange, onNext, onBack }) => {
    // --- ESTADOS Y LÓGICA ---
    const [selectedGroup, setSelectedGroup] = useState<string>('');

    // Al cargar, si ya hay un rubro seleccionado, buscamos su grupo para pre-llenar
    useEffect(() => {
        if (data.rubro_principal) {
            const foundGroup = CATEGORIES.find(cat =>
                cat.trades.some(t => t.name === data.rubro_principal)
            );
            if (foundGroup) {
                setSelectedGroup(foundGroup.group);
            }
        }
    }, [data.rubro_principal]);

    // Variables derivadas
    const availableTrades = selectedGroup
        ? CATEGORIES.find(c => c.group === selectedGroup)?.trades || []
        : [];

    const selectedTradeObj = data.rubro_principal
        ? availableTrades.find(t => t.name === data.rubro_principal)
        : null;

    const isMatriculado = data.es_matriculado === true || data.es_matriculado === 'true';

    // --- HANDLERS ---

    const handleGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedGroup(e.target.value);
        onChange('rubro_principal', ''); // Reseteamos el oficio al cambiar de grupo
        onChange('especialidades_secundarias', []); // Reseteamos sub-especialidades
    };

    const handleTradeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onChange('rubro_principal', e.target.value);
        onChange('especialidades_secundarias', []);
    };

    const handleSubtradeToggle = (subtrade: string) => {
        const current = data.especialidades_secundarias || [];
        if (current.includes(subtrade)) {
            onChange('especialidades_secundarias', current.filter((s: string) => s !== subtrade));
        } else {
            onChange('especialidades_secundarias', [...current, subtrade]);
        }
    };

    // Handle Zone Change from Dropdown
    const handleZoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const zone = e.target.value;
        onChange('zona', zone); // Primary singular field for profile
        onChange('zona_trabajo', [zone]); // Array compatibility
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Validaciones simples
        if (!data.rubro_principal || !data.zona) {
            alert("Por favor completa el oficio y la zona.");
            return;
        }
        onNext();
    };

    // --- RENDERIZADO (RETURN) ---
    // NOTA: El return debe estar DENTRO de la función del componente
    return (
        <form onSubmit={handleSubmit} className="space-y-6">

            {/* 1. SELECCIÓN DE PROFESIÓN */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-3">1. Tu Profesión</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Sector / Grupo</label>
                        <select
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                            value={selectedGroup}
                            onChange={handleGroupChange}
                        >
                            <option value="">-- Selecciona un grupo --</option>
                            {CATEGORIES.map(c => (
                                <option key={c.group} value={c.group}>{c.group}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Oficio Principal *</label>
                        <select
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border disabled:bg-gray-100"
                            value={data.rubro_principal || ''}
                            onChange={handleTradeChange}
                            required
                            disabled={!selectedGroup}
                        >
                            <option value="">-- Selecciona tu oficio --</option>
                            {availableTrades.map(t => (
                                <option key={t.name} value={t.name}>{t.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* SUB-ESPECIALIDADES */}
                {selectedTradeObj && selectedTradeObj.subtrades.length > 0 && (
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Especialidades (Opcional)</label>
                        <div className="grid grid-cols-2 gap-2">
                            {selectedTradeObj.subtrades.map(sub => (
                                <label key={sub} className="flex items-center space-x-2 text-sm text-gray-600 bg-white p-2 rounded border cursor-pointer hover:bg-orange-50">
                                    <input
                                        type="checkbox"
                                        checked={(data.especialidades_secundarias || []).includes(sub)}
                                        onChange={() => handleSubtradeToggle(sub)}
                                        className="rounded text-orange-600 focus:ring-orange-500"
                                    />
                                    <span>{sub}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {/* OTRAS ESPECIALIDADES */}
                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Otras Especialidades / Detalles</label>
                    <textarea
                        rows={2}
                        value={data.otras_especialidades || ''}
                        onChange={(e) => onChange('otras_especialidades', e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                        placeholder="Si hacés algo más, escribilo acá..."
                    />
                </div>
            </div>

            {/* 2. MATRÍCULA */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-2">2. ¿Tenés Matrícula?</h3>
                <p className="text-xs text-gray-500 mb-3">Fundamental para Gasistas y Electricistas. Suma mucha confianza.</p>

                <div className="flex flex-col">
                    <label className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-white rounded transition">
                        <input
                            type="checkbox"
                            checked={isMatriculado}
                            onChange={(e) => {
                                onChange('es_matriculado', e.target.checked);
                                if (!e.target.checked) onChange('numero_matricula', '');
                            }}
                            className="h-5 w-5 text-orange-600 rounded focus:ring-orange-500"
                        />
                        <span className="text-gray-700 font-medium">Sí, soy matriculado</span>
                    </label>

                    {isMatriculado && (
                        <div className="mt-3 animate-fade-in pl-8">
                            <label className="block text-sm font-medium text-gray-700">Número de Matrícula</label>
                            <input
                                type="text"
                                value={data.numero_matricula || ''}
                                onChange={(e) => onChange('numero_matricula', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-orange-500"
                                placeholder="Ej: MP 12345"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* OTRAS ESPECIALIDADES */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-2">3. Otras Especialidades / Detalles</h3>
                <textarea
                    rows={3}
                    value={data.otras_especialidades || ''}
                    onChange={(e) => onChange('otras_especialidades', e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-orange-500"
                    placeholder="Si haces algo más que no esté en la lista, escribilo acá..."
                />
            </div>

            {/* 4. ZONA Y URGENCIAS */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-2">4. Zona de Trabajo</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Zona de Trabajo Principal *</label>
                        <select
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                            value={data.zona || ''}
                            onChange={handleZoneChange}
                            required
                        >
                            <option value="">-- Seleccioná tu zona --</option>
                            {LOCATIONS.map(l => (
                                <optgroup key={l.group} label={l.group}>
                                    {l.zones.map(z => (
                                        <option key={z} value={z}>{z}</option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Celular (WhatsApp)</label>
                        <input
                            type="tel"
                            value={data.celular || ''}
                            onChange={(e) => onChange('celular', e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                            placeholder="11 1234 5678"
                        />
                    </div>
                </div>

                <div className="flex items-center mt-4">
                    <label className="flex items-center space-x-3 cursor-pointer bg-red-50 p-3 rounded-lg border border-red-100 w-full hover:bg-red-100 transition">
                        <input
                            type="checkbox"
                            checked={data.es_24hs || false}
                            onChange={(e) => onChange('es_24hs', e.target.checked)}
                            className="h-5 w-5 text-red-600 rounded focus:ring-red-500"
                        />
                        <div>
                            <span className="block font-bold text-red-700">🚨 Atiendo Urgencias 24hs</span>
                            <span className="text-xs text-red-600">Marcá esto si salís a cualquier hora.</span>
                        </div>
                    </label>
                </div>
            </div>

            <div className="pt-4 flex justify-between">
                <button
                    type="button"
                    onClick={onBack}
                    className="text-gray-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition"
                >
                    ⬅️ Volver
                </button>
                <button
                    onClick={onNext}
                    disabled={!data.rubro_principal || !data.zona}
                    className="bg-orange-600 text-white px-8 py-2 rounded-lg font-bold hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                    Siguiente ➡️
                </button>
            </div>
        </form>
    );
};

export default Step2Specialty;