import React, { useState, useEffect } from 'react';
import Step1Identity from './Step1Identity';
import Step2Specialty from './Step2Specialty';
import Step3Showcase from './Step3Showcase';
import ProfileCardPreview from './ProfileCardPreview';
import { auth, db } from '../../firebase/client';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { calcularPuntosIniciales } from '../../utils/gamification';

export default function RegistrationWizard() {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<any>({
        // Defaults
        nombre: '',
        nombre_fantasia: '',
        dni: '',
        cuit: '', // NEW: CUIT/CUIL
        celular: '',
        email: '',
        password: '', // Only for Step 1
        rubro_principal: '',
        especialidades_secundarias: [],
        otras_especialidades: '', // New field
        es_matriculado: false,
        numero_matricula: '',
        zona: '', // Primary zone for profile match
        zona_trabajo: [],
        es_24hs: false,
        descripcion_servicio: '',
        foto: '', // Match mi-perfil schema (was foto_perfil)
        portfolio: [], // Match mi-perfil schema (was fotos_trabajos)
        medios_pago: [],
        tipo_factura: '',
        is_premium: false, // Default to FREE for preview
        is_verified: false,
        plan: 'gratuito'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Auto-load from local storage
    useEffect(() => {
        const saved = localStorage.getItem('reg_wizard_data');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Ensure old keys are mapped if they exist in cache
                if (parsed.foto_perfil) parsed.foto = parsed.foto_perfil;
                if (parsed.fotos_trabajos) parsed.portfolio = parsed.fotos_trabajos;

                setFormData((prev: any) => ({ ...prev, ...parsed }));
            } catch (e) {
                console.error("Error loading saved data", e);
            }
        }
    }, []);

    // Auto-save
    useEffect(() => {
        localStorage.setItem('reg_wizard_data', JSON.stringify(formData));
    }, [formData]);

    const handleChange = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);

    const handleSubmit = async () => {
        console.log("🚀 [REGISTRO] Iniciando registro...");
        console.log("📋 [REGISTRO] Datos del formulario:", {
            nombre: formData.nombre,
            email: formData.email,
            rubro: formData.rubro_principal,
            zona: formData.zona,
            descripcion: formData.descripcion_servicio?.substring(0, 50)
        });
        setLoading(true);
        setError('');

        try {
            // 1. Create Auth User
            console.log("🔐 [AUTH] Creando usuario en Firebase Auth...");
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;
            console.log("✅ [AUTH] Usuario creado:", user.uid);

            // SEND VERIFICATION EMAIL
            try {
                await sendEmailVerification(user);
                console.log("📧 [AUTH] Email de verificación enviado");
            } catch (emailErr) {
                console.warn("⚠️ [AUTH] No se pudo enviar email de verificación:", emailErr);
                // No bloqueamos el registro por esto, pero lo logueamos
            }

            // 2. Prepare Profile Data (Exclude password, Sanitize Phone)
            const profileData = { ...formData };
            delete profileData.password;

            // Map registration fields to mi-perfil schema
            profileData.descripcion = profileData.descripcion_servicio || '';
            profileData.telefono = profileData.celular || '';
            profileData.formas_pago = profileData.medios_pago || [];
            profileData.emite_factura = profileData.tipo_factura && profileData.tipo_factura !== 'no';

            // New Matrícula Structure Mapping
            profileData.matricula = {
                es_matriculado: !!formData.es_matriculado,
                texto: formData.numero_matricula || ''
            };

            // Sanitize Phone to 549...
            let rawPhone = profileData.celular.replace(/\D/g, ''); // Remove non-digits
            if (rawPhone.startsWith('0')) rawPhone = rawPhone.substring(1);
            if (rawPhone.startsWith('15')) rawPhone = rawPhone.substring(2);

            // Asuma Argentina default if short
            if (!rawPhone.startsWith('54')) {
                rawPhone = '549' + rawPhone;
            }
            profileData.celular = rawPhone;
            profileData.telefono = rawPhone;

            // Map specialties to servicios_lista for profile display
            const secondaryServices = profileData.especialidades_secundarias || [];
            const otherServices = profileData.otras_especialidades ? [profileData.otras_especialidades] : [];
            profileData.servicios_lista = [profileData.rubro_principal, ...secondaryServices, ...otherServices].filter(Boolean);

            // Map specialties to etiquetas (tags) for profile display
            // Limit to 5 tags as per mi-perfil.astro limits
            profileData.etiquetas = [...secondaryServices, ...otherServices].filter(Boolean).slice(0, 5);

            // Add metadata
            profileData.uid = user.uid;
            profileData.createdAt = new Date();
            profileData.plan = 'gratuito'; // Default
            profileData.rol = 'profesional';

            // Initial score and usage limits
            profileData.puntos = calcularPuntosIniciales(profileData); // 👈 Calculamos puntos iniciales
            profileData.promedio = 3.0; // Request: start at 3.0
            profileData.total_votos = 0;
            profileData.whatsapp_restantes = 60; // Lifetime base 60
            profileData.contactos_whatsapp_total = 0;
            profileData.validacion_estado = "pendiente"; // For Admin Panel visibility

            // 90 days trial logic
            const fechaRegistro = new Date();
            const fechaVencimientoPrueba = new Date();
            fechaVencimientoPrueba.setDate(fechaRegistro.getDate() + 90); // 👈 90 días exactos

            profileData.plan = "prueba";
            profileData.trialEndsAt = fechaVencimientoPrueba;

            // 3. Save to Firestore
            console.log("💾 [FIRESTORE] Guardando perfil...");
            console.log("📊 [FIRESTORE] Datos a guardar:", {
                uid: user.uid,
                nombre: profileData.nombre,
                descripcion: profileData.descripcion,
                telefono: profileData.telefono,
                plan: profileData.plan,
                totalCampos: Object.keys(profileData).length
            });
            await setDoc(doc(db, "profesionales", user.uid), profileData);
            console.log("✅ [FIRESTORE] Perfil guardado exitosamente");

            // 3.5 SEND WELCOME EMAIL (Background)
            try {
                fetch("/api/send-welcome", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: profileData.email,
                        name: profileData.nombre,
                        role: "profesional"
                    })
                }).then(res => res.json()).then(data => console.log("📧 [WELCOME] Email response:", data));
            } catch (emailErr) {
                console.warn("⚠️ [WELCOME] No se pudo disparar el email de bienvenida:", emailErr);
            }

            // 4. Notify Telegram (Background)
            try {
                const tgRes = await fetch("/api/notify-registration", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        nombre: profileData.nombre,
                        rubro: profileData.rubro_principal,
                        zona: profileData.zona
                    })
                });
                const tgData = await tgRes.json();
                console.log("📢 [TELEGRAM] Notification result:", tgData);
            } catch (tgErr) {
                console.warn("⚠️ [TELEGRAM] Notification failed:", tgErr);
            }

            // 5. Success UI
            localStorage.removeItem('reg_wizard_data'); // Clear draft
            console.log("🎉 [REGISTRO] Registro completo - Mostrando Modal...");
            setShowSuccessModal(true);
            setLoading(false);

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Error al registrar. Verifica tus datos.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row-reverse">
            {/* RIGHT: FORM WIZARD (Left on mobile, Right on desktop) */}
            <div className="w-full md:w-1/2 p-6 md:p-12 overflow-y-auto bg-white">
                <div className="max-w-lg mx-auto">

                    {/* PROGRESS BAR */}
                    <div className="mb-8">
                        <div className="flex justify-between text-sm font-medium text-gray-500 mb-2">
                            <span className={step >= 1 ? 'text-orange-600' : ''}>1. Identidad</span>
                            <span className={step >= 2 ? 'text-orange-600' : ''}>2. Especialidad</span>
                            <span className={step >= 3 ? 'text-orange-600' : ''}>3. Vidriera</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-orange-600 transition-all duration-500 ease-out"
                                style={{ width: `${(step / 3) * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900 mb-6">
                        {step === 1 && 'Crea tu Cuenta Profesional'}
                        {step === 2 && 'Define tu Oficio'}
                        {step === 3 && 'Muestra tu Trabajo'}
                    </h1>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    {/* STEPS */}
                    {step === 1 && (
                        <Step1Identity
                            data={formData}
                            onChange={handleChange}
                            onNext={handleNext}
                        />
                    )}
                    {step === 2 && (
                        <Step2Specialty
                            data={formData}
                            onChange={handleChange}
                            onNext={handleNext}
                            onBack={handleBack}
                        />
                    )}
                    {step === 3 && (
                        <Step3Showcase
                            data={formData}
                            onChange={handleChange}
                            onSubmit={handleSubmit}
                            onBack={handleBack}
                        />
                    )}

                    {loading && (
                        <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50">
                            <div className="text-orange-600 text-xl font-bold animate-pulse">Registrando... 🚀</div>
                        </div>
                    )}

                </div>
            </div>

            {/* LEFT: LIVE PREVIEW PANEL - Always visible */}
            <div className="flex w-1/2 bg-gradient-to-br from-orange-600 to-orange-800 items-center justify-center p-12 relative overflow-hidden">

                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>

                <div className="max-w-md w-full z-20 relative flex flex-col items-center text-center">

                    {step === 1 && (
                        <div className="animate-fade-in">
                            <div className="bg-white/20 p-8 rounded-full mb-6 inline-block backdrop-blur-sm shadow-xl">
                                <span className="text-6xl">👤</span>
                            </div>
                            <h2 className="text-white text-3xl font-bold mb-4">Tu Identidad Profesional</h2>
                            <p className="text-orange-100 text-lg">
                                Completá tus datos para que los clientes confíen en vos. <br />
                                <span className="font-bold">Un perfil completo recibe 3x más trabajo.</span>
                            </p>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="animate-fade-in">
                            <div className="bg-white/20 p-8 rounded-full mb-6 inline-block backdrop-blur-sm shadow-xl">
                                <span className="text-6xl">🛠️</span>
                            </div>
                            <h2 className="text-white text-3xl font-bold mb-4">Tu Especialidad</h2>
                            <p className="text-orange-100 text-lg">
                                Si sos matriculado, no olvides tildar la opción. <br />
                                Elegí bien tu zona para no viajar de más.
                            </p>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="animate-fade-in w-full">
                            <h2 className="text-white text-opacity-90 mb-4 text-center text-lg font-medium">
                                👁️ Así se verá tu tarjeta
                            </h2>
                            <div className="transform scale-100 transition-all duration-300">
                                <ProfileCardPreview data={formData} />
                            </div>
                            <p className="text-orange-100 text-sm mt-6">
                                Una buena foto de perfil y de tus trabajos es clave para vender más.
                            </p>
                        </div>
                    )}

                </div>
            </div>
            {/* SUCCESS MODAL */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden transform animate-in zoom-in-95 duration-300">
                        {/* Header Gradient */}
                        <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-8 text-center text-white">
                            <div className="text-6xl mb-4">🎉</div>
                            <h2 className="text-3xl font-black mb-2 uppercase tracking-tight">¡Registro completado!</h2>
                            <p className="text-orange-100 font-medium">Ya sos parte de la comunidad de DeOficios.</p>
                        </div>

                        {/* Content */}
                        <div className="p-8">
                            <div className="space-y-6 text-slate-600 leading-relaxed">
                                <p className="text-lg">
                                    Hola <span className="font-bold text-slate-900">{formData.nombre}</span>, ¡gracias por sumarte! Recibimos tus datos correctamente.
                                </p>

                                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                                    <h3 className="text-slate-900 font-bold mb-3 flex items-center gap-2">
                                        🛠️ ¿Qué sigue ahora?
                                    </h3>
                                    <p className="text-sm">
                                        Nuestro equipo está revisando tu información para otorgarte el <span className="text-orange-600 font-bold">Sello de Confianza</span>. Este proceso suele tardar menos de 24 horas.
                                    </p>
                                </div>

                                <div className="flex items-start gap-4 p-2">
                                    <div className="text-2xl mt-1">📲</div>
                                    <div>
                                        <h4 className="text-slate-900 font-bold text-sm">Un último favor:</h4>
                                        <p className="text-xs text-slate-500">
                                            Mientras esperás, seguinos en Instagram. Vamos a estar promocionando a los pioneros de la plataforma.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="mt-8 flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => window.location.href = '/mi-perfil'}
                                    className="flex-1 bg-slate-900 text-white font-black py-4 rounded-xl uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                                >
                                    ENTENDIDO
                                </button>
                                <a
                                    href="https://instagram.com/deoficiosargentina"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 bg-white border-2 border-slate-200 text-slate-900 font-black py-4 rounded-xl uppercase tracking-widest hover:border-orange-500 hover:text-orange-600 transition-all text-center flex items-center justify-center gap-2 active:scale-95"
                                >
                                    <span>INSTAGRAM</span>
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
