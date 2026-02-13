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

    const password = data.password || '';
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const isPasswordValid = hasMinLength && hasUpperCase && hasNumber;

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
                        <label className="block text-sm font-medium text-gray-700">Contraseña *</label>
                        <input
                            type="password"
                            name="password"
                            required
                            minLength={8}
                            value={data.password || ''}
                            onChange={handleChange}
                            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-orange-500 p-2 border ${isPasswordValid ? 'focus:border-green-500' : 'focus:border-orange-500'}`}
                            placeholder="******"
                        />
                        <div className="mt-2 space-y-1">
                            <p className={`text-[10px] flex items-center gap-1 ${hasMinLength ? 'text-green-600 font-bold' : 'text-gray-400'}`}>
                                {hasMinLength ? '✅' : '⚪'} Mínimo 8 caracteres
                            </p>
                            <p className={`text-[10px] flex items-center gap-1 ${hasUpperCase ? 'text-green-600 font-bold' : 'text-gray-400'}`}>
                                {hasUpperCase ? '✅' : '⚪'} Al menos una mayúscula
                            </p>
                            <p className={`text-[10px] flex items-center gap-1 ${hasNumber ? 'text-green-600 font-bold' : 'text-gray-400'}`}>
                                {hasNumber ? '✅' : '⚪'} Al menos un número
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-gray-100">
                <label className="flex items-start space-x-3 cursor-pointer group">
                    <input
                        type="checkbox"
                        required
                        className="mt-1 h-5 w-5 text-orange-600 rounded focus:ring-orange-500 border-gray-300"
                        onChange={(e) => onChange('acceptedTerms', e.target.checked)}
                        checked={data.acceptedTerms || false}
                    />
                    <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                        Acepto los <a href="/terminos" target="_blank" className="text-orange-600 font-bold hover:underline">Términos y Condiciones</a> *
                    </span>
                </label>

                <label className="flex items-start space-x-3 cursor-pointer group">
                    <input
                        type="checkbox"
                        required
                        className="mt-1 h-5 w-5 text-orange-600 rounded focus:ring-orange-500 border-gray-300"
                        onChange={(e) => onChange('acceptedPrivacy', e.target.checked)}
                        checked={data.acceptedPrivacy || false}
                    />
                    <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                        Acepto la <a href="/privacidad" target="_blank" className="text-orange-600 font-bold hover:underline">Política de Privacidad</a> *
                    </span>
                </label>
            </div>

            <div className="pt-6 flex justify-end">
                <button
                    type="submit"
                    disabled={!data.acceptedTerms || !data.acceptedPrivacy || !isPasswordValid}
                    className={`px-8 py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all shadow-lg ${data.acceptedTerms && data.acceptedPrivacy && isPasswordValid
                        ? 'bg-orange-600 text-white hover:bg-orange-700 hover:-translate-y-0.5 active:scale-95'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                >
                    Siguiente etapa ➡️
                </button>
            </div>
        </form>
    );
}
