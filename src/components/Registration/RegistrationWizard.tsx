import React, { useState, useEffect } from 'react';
import Step1Identity from './Step1Identity';
import Step2Specialty from './Step2Specialty';
import Step3Showcase from './Step3Showcase';
import ProfileCardPreview from './ProfileCardPreview';
import { auth, db } from '../../firebase/client';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

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

            // Add metadata
            profileData.uid = user.uid;
            profileData.createdAt = new Date();
            profileData.plan = 'gratuito'; // Default
            profileData.rol = 'profesional';

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

            // 4. Success / Redirect
            localStorage.removeItem('reg_wizard_data'); // Clear draft
            console.log("🎉 [REGISTRO] Registro completo - Redirigiendo a mi-perfil");
            window.location.href = '/mi-perfil'; // Redirect to dashboard

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
        </div>
    );
}
