import React from 'react';

interface ProfileCardPreviewProps {
    data: {
        nombre: string;
        nombre_fantasia?: string;
        rubro_principal: string;
        zona_trabajo: string[];
        es_24hs: boolean;
        descripcion_servicio: string;
        foto_perfil: string;
        is_premium?: boolean;
        is_verified?: boolean;
    };
}

export default function ProfileCardPreview({ data }: ProfileCardPreviewProps) {
    const {
        nombre,
        nombre_fantasia,
        rubro_principal,
        zona_trabajo = [],
        es_24hs,
        descripcion_servicio,
        foto_perfil,
        is_premium = true, // Default to true for preview motivation
        is_verified = false,
    } = data;

    const displayName = nombre_fantasia || nombre || "Nombre Profesional";
    const displayCategory = rubro_principal || "Rubro";
    const displayZone = zona_trabajo.length > 0 ? zona_trabajo.join(', ') : "Zona de trabajo";

    // Extract initials from real name (nombre) - first and last name
    const getInitials = () => {
        if (!nombre || nombre.trim() === '') return 'U';

        const nameParts = nombre.trim().split(' ').filter(part => part.length > 0);

        if (nameParts.length === 1) {
            // Only one name, use first letter
            return nameParts[0][0].toUpperCase();
        } else {
            // Multiple names, use first letter of first and last name
            const firstInitial = nameParts[0][0].toUpperCase();
            const lastInitial = nameParts[nameParts.length - 1][0].toUpperCase();
            return firstInitial + lastInitial;
        }
    };

    return (
        <div className={`pro-card-horizontal ${is_premium ? 'border-amber-400 border-2' : 'border-gray-200 border'}`} style={{
            display: 'flex',
            background: 'white',
            borderRadius: '16px',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            maxWidth: '100%'
        }}>
            <div className="card-image" style={{ width: '140px', background: '#f3f4f6', position: 'relative', flexShrink: 0 }}>
                {foto_perfil ? (
                    <img src={foto_perfil} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', color: '#cbd5e1', fontWeight: 'bold', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                        <span style={{ color: 'white' }}>{getInitials()}</span>
                    </div>
                )}
                {is_premium && (
                    <span style={{ position: 'absolute', top: '10px', left: '10px', background: '#fbbf24', color: '#1f2937', padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                        DESTACADO
                    </span>
                )}
            </div>

            <div className="card-content" style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '5px' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                            {displayName}
                            {is_verified && <span title="Identidad Verificada">✅</span>}
                        </h2>
                        <span style={{ color: '#ea580c', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                            {displayCategory}
                        </span>
                    </div>
                    <div style={{ background: '#fffbeb', color: '#b45309', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.9rem' }}>
                        ⭐ 5.0
                    </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', margin: '10px 0' }}>
                    <span style={{ fontSize: '0.85rem', color: '#4b5563', background: '#f3f4f6', padding: '4px 10px', borderRadius: '6px' }}>
                        📍 {displayZone}
                    </span>
                    {es_24hs && (
                        <span style={{ fontSize: '0.85rem', background: '#fee2e2', color: '#991b1b', fontWeight: 'bold', padding: '4px 10px', borderRadius: '6px' }}>
                            🚨 Urgencias 24hs
                        </span>
                    )}
                </div>

                <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: '5px 0 15px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {descripcion_servicio || "Descripción breve de tus servicios para que los clientes te conozcan."}
                </p>

                <div style={{ display: 'flex', gap: '5px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280', border: '1px solid #e5e7eb', padding: '2px 8px', borderRadius: '20px' }}>
                        Presupuesto sin cargo
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280', border: '1px solid #e5e7eb', padding: '2px 8px', borderRadius: '20px' }}>
                        Garantía
                    </span>
                </div>
            </div>
        </div>
    );
}
