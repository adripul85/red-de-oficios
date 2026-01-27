import React from 'react';

interface Step1Props {
    data: any;
    onChange: (field: string, value: any) => void;
    onNext: () => void;
}

export default function Step1Identity({ data, onChange, onNext }: Step1Props) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.name, e.target.value);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onNext();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre y Apellido *</label>
                    <input
                        type="text"
                        name="nombre"
                        required
                        value={data.nombre || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 p-2 border"
                        placeholder="Juan Pérez"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre de Fantasía / Empresa</label>
                    <input
                        type="text"
                        name="nombre_fantasia"
                        value={data.nombre_fantasia || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 p-2 border"
                        placeholder="Ej: Plomería El Rayo"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">DNI (Para verificación)</label>
                    <input
                        type="text"
                        name="dni"
                        value={data.dni || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 p-2 border"
                        placeholder="Sin puntos"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">CUIT / CUIL</label>
                    <input
                        type="text"
                        name="cuit"
                        value={data.cuit || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 p-2 border"
                        placeholder="20-12345678-9"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Celular (WhatsApp) *</label>
                    <input
                        type="tel"
                        name="celular"
                        required
                        value={data.celular || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 p-2 border"
                        placeholder="11 1234 5678"
                    />
                    <p className="text-xs text-gray-500 mt-1">Lo usaremos para que los clientes te contacten.</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Email *</label>
                    <input
                        type="email"
                        name="email"
                        required
                        value={data.email || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 p-2 border"
                        placeholder="tu@email.com"
                    />
                </div>
            </div>

            <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Contraseña (Mín. 6 caracteres) *</label>
                        <input
                            type="password"
                            name="password"
                            required
                            minLength={6}
                            value={data.password || ''}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 p-2 border"
                            placeholder="******"
                        />
                    </div>
                </div>
            </div>

            <div className="pt-4 flex justify-end">
                <button
                    type="submit"
                    className="bg-orange-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-orange-700 transition shadow-lg"
                >
                    Siguiente: Especialidad ➡️
                </button>
            </div>
        </form>
    );
}
