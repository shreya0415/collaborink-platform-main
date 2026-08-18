import { useState, useRef, useEffect, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { Mail, Lock, User, Eye, EyeOff, Loader, Boxes, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

/* ═══════════════════════════════════════════════════
   3D SCENE — floating wireframe geometry
   ═══════════════════════════════════════════════════ */

function WireframeMesh({ geometry, position, color, speed = 1, opacity = 0.2, scale = 1 }) {
  const ref = useRef();

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.x = clock.elapsedTime * 0.12 * speed;
    ref.current.rotation.y = clock.elapsedTime * 0.18 * speed;
  });

  return (
    <Float speed={1.4 * speed} rotationIntensity={0.7} floatIntensity={0.9}>
      <mesh ref={ref} position={position} scale={scale}>
        {geometry}
        <meshStandardMaterial color={color} wireframe transparent opacity={opacity} />
      </mesh>
    </Float>
  );
}

function Scene3D() {
  const groupRef = useRef();
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth  - 0.5) * 2;
      mouse.current.y = (e.clientY / window.innerHeight - 0.5) * -2;
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += (mouse.current.x * 0.3 - groupRef.current.rotation.y) * 0.04;
    groupRef.current.rotation.x += (mouse.current.y * 0.2 - groupRef.current.rotation.x) * 0.04;
  });

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.5} />
      <pointLight position={[4, 4, 4]}  intensity={1.4} color="#2dd4bf" />
      <pointLight position={[-4, -3, 2]} intensity={0.8} color="#6366f1" />
      <pointLight position={[0, 6, -4]}  intensity={0.5} color="#8b5cf6" />

      {/* Primary large dodecahedron */}
      <WireframeMesh
        geometry={<dodecahedronGeometry args={[1]} />}
        position={[-1.8, 0.6, -2.5]}
        color="#2dd4bf"
        speed={0.7}
        opacity={0.22}
        scale={1.9}
      />

      {/* Icosahedron */}
      <WireframeMesh
        geometry={<icosahedronGeometry args={[1, 0]} />}
        position={[2.2, -1.5, -1.5]}
        color="#6366f1"
        speed={1.2}
        opacity={0.26}
        scale={1.1}
      />

      {/* Small octahedron top */}
      <WireframeMesh
        geometry={<octahedronGeometry args={[1]} />}
        position={[0.5, 2.4, -3]}
        color="#8b5cf6"
        speed={1.8}
        opacity={0.32}
        scale={0.65}
      />

      {/* Torus ring */}
      <Float speed={0.8} rotationIntensity={0.4} floatIntensity={0.5}>
        <mesh position={[2.8, 1.8, -4.5]} rotation={[0.6, 0, 0.4]} scale={1.3}>
          <torusGeometry args={[1, 0.22, 10, 32]} />
          <meshStandardMaterial color="#2dd4bf" wireframe transparent opacity={0.15} />
        </mesh>
      </Float>

      {/* Background sphere — very faint atmosphere */}
      <mesh position={[0, 0, -7]} scale={5}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#6366f1" wireframe transparent opacity={0.04} />
      </mesh>
    </group>
  );
}

/* ═══════════════════════════════════════════════════
   ANIMATION VARIANTS
   ═══════════════════════════════════════════════════ */

const CARD_IN = {
  hidden:  { opacity: 0, y: 24, scale: 0.97 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
  },
};

const CONTAINER = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.065, delayChildren: 0.05 } },
};

const FIELD = {
  hidden:  { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
};

const ERROR_FIELD = {
  hidden:  { opacity: 0, height: 0, marginTop: 0 },
  visible: { opacity: 1, height: 'auto', marginTop: '0.25rem', transition: { duration: 0.2 } },
};

/* ═══════════════════════════════════════════════════
   REUSABLE FIELD COMPONENTS
   ═══════════════════════════════════════════════════ */

function Field({ label, icon: Icon, error, right, children }) {
  return (
    <motion.div variants={FIELD} className="space-y-1.5">
      {label && <label className="label">{label}</label>}
      <div className="relative">
        {Icon && (
          <Icon
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none z-10"
          />
        )}
        <div className={Icon ? 'pl-10' : ''}>
          {children}
        </div>
        {right && (
          <div className="absolute right-0 top-0 bottom-0 flex items-center pr-3">
            {right}
          </div>
        )}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            key="error"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={ERROR_FIELD}
            className="text-xs text-red-400/90"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════ */

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { login, signup } = useAuthStore();
  const navigate = useNavigate();

  /* ─── business logic (unchanged) ─── */
  const validateForm = () => {
    const newErrors = {};
    if (!formData.email)
      newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = 'Invalid email format';

    if (!formData.password)
      newErrors.password = 'Password is required';
    else if (formData.password.length < 6)
      newErrors.password = 'Password must be at least 6 characters';

    if (!isLogin) {
      if (!formData.firstName) newErrors.firstName = 'First name is required';
      if (!formData.lastName)  newErrors.lastName  = 'Last name is required';
      if (formData.password !== formData.confirmPassword)
        newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      if (isLogin) {
        await login(formData.email, formData.password);
        toast.success('Welcome back!');
      } else {
        await signup({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
        });
        toast.success('Account created — welcome to Collaborink!');
      }
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (login) => {
    setIsLogin(login);
    setErrors({});
    setFormData({ email: '', password: '', firstName: '', lastName: '', confirmPassword: '' });
    setShowPassword(false);
  };

  /* ─── shared input props helper ─── */
  const inputProps = (name, type = 'text', extra = {}) => ({
    name,
    type,
    value: formData[name],
    onChange: handleChange,
    className: `control ${errors[name] ? 'border-red-500/40 focus:border-red-400/60 focus:shadow-[0_0_0_3px_rgba(239,68,68,.1)]' : ''}`,
    autoComplete: name,
    ...extra,
  });

  const passwordType = showPassword ? 'text' : 'password';
  const eyeToggle = (
    <button
      type="button"
      onClick={() => setShowPassword(v => !v)}
      tabIndex={-1}
      className="text-slate-500 hover:text-slate-300 transition-colors -mr-1 p-1"
      aria-label={showPassword ? 'Hide password' : 'Show password'}
    >
      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
    </button>
  );

  return (
    <div
      className="relative flex min-h-screen overflow-hidden"
      style={{ background: 'var(--bg)' }}
    >
      {/* ── Aurora decoration blobs ── */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 overflow-hidden"
        style={{ zIndex: 0 }}
      >
        <div
          className="aurora-blob"
          style={{
            width: '38rem', height: '38rem',
            background: 'radial-gradient(circle, rgba(99,102,241,.22) 0%, transparent 70%)',
            top: '-8rem', left: '-6rem',
            animationDelay: '0s',
          }}
        />
        <div
          className="aurora-blob"
          style={{
            width: '32rem', height: '32rem',
            background: 'radial-gradient(circle, rgba(45,212,191,.18) 0%, transparent 70%)',
            top: '10%', right: '-4rem',
            animationDelay: '-7s',
          }}
        />
        <div
          className="aurora-blob"
          style={{
            width: '28rem', height: '28rem',
            background: 'radial-gradient(circle, rgba(139,92,246,.14) 0%, transparent 70%)',
            bottom: '-4rem', left: '30%',
            animationDelay: '-13s',
          }}
        />
      </div>

      {/* ══════════════════════════════════════════
          LEFT PANEL — 3D scene + branding (lg+)
         ══════════════════════════════════════════ */}
      <div className="relative hidden lg:flex lg:w-[52%] flex-col" style={{ zIndex: 1 }}>
        {/* 3D canvas fills the left panel */}
        <div className="absolute inset-0">
          <Suspense fallback={null}>
            <Canvas
              camera={{ position: [0, 0, 5], fov: 55 }}
              dpr={[1, 1.5]}
              gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
              style={{ background: 'transparent' }}
            >
              <Scene3D />
            </Canvas>
          </Suspense>
        </div>

        {/* Gradient fade on the right edge so form blends in */}
        <div
          className="absolute inset-y-0 right-0 w-32 pointer-events-none"
          style={{ background: 'linear-gradient(to right, transparent, var(--bg))' }}
        />

        {/* Branding content */}
        <div className="relative z-10 flex flex-col justify-between h-full p-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <span
              className="grid h-10 w-10 place-items-center rounded-xl"
              style={{
                background: 'linear-gradient(135deg, #2dd4bf, #06b6d4)',
                boxShadow: '0 8px 24px -6px rgba(45,212,191,.55)',
              }}
            >
              <Boxes size={20} strokeWidth={2.4} color="#042f2e" />
            </span>
            <span className="text-[15px] font-bold tracking-tighter text-white">
              collaborink
            </span>
          </div>

          {/* Hero text */}
          <div className="space-y-5 max-w-xs">
            <p className="text-[11px] font-semibold tracking-[.18em] uppercase text-teal-400/80">
              Team Collaboration
            </p>
            <h1
              className="text-4xl font-bold leading-[1.15] tracking-tight text-white"
              style={{ textShadow: '0 2px 30px rgba(45,212,191,.2)' }}
            >
              Work flows
              <br />
              <span className="gradient-text">beautifully.</span>
            </h1>
            <p className="text-sm leading-relaxed text-slate-400">
              Projects, kanban boards, real-time chat, and file sharing —
              everything your team needs in one place.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2 pt-2">
              {['Real-time boards', 'Team chat', 'File sharing', 'Calendars'].map(f => (
                <span key={f} className="badge badge-slate text-[11px]">{f}</span>
              ))}
            </div>
          </div>

          {/* Bottom quote */}
          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} Collaborink. Built for modern teams.
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          RIGHT PANEL — auth form
         ══════════════════════════════════════════ */}
      <div
        className="relative z-10 flex flex-1 items-center justify-center p-6 lg:p-12"
      >
        <motion.div
          initial="hidden"
          animate="visible"
          variants={CARD_IN}
          className="w-full max-w-[400px]"
        >
          {/* Mobile-only logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <span
              className="grid h-9 w-9 place-items-center rounded-xl"
              style={{
                background: 'linear-gradient(135deg, #2dd4bf, #06b6d4)',
                boxShadow: '0 8px 20px -6px rgba(45,212,191,.5)',
              }}
            >
              <Boxes size={18} strokeWidth={2.4} color="#042f2e" />
            </span>
            <span className="text-[15px] font-bold tracking-tighter text-white">
              collaborink
            </span>
          </div>

          {/* Card */}
          <div
            className="glass rounded-3xl overflow-hidden"
            style={{
              boxShadow:
                '0 0 0 1px rgba(255,255,255,0.06) inset, 0 40px 80px -24px rgba(0,0,0,0.8), 0 0 60px -20px rgba(45,212,191,0.06)',
            }}
          >
            {/* Teal accent line at top */}
            <div
              className="h-px w-full"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(45,212,191,.5), transparent)' }}
            />

            <div className="p-8">
              {/* Heading */}
              <div className="mb-7">
                <h2 className="text-xl font-bold tracking-tight text-white">
                  {isLogin ? 'Welcome back' : 'Create your account'}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  {isLogin
                    ? 'Sign in to continue to your workspace.'
                    : 'Start collaborating with your team today.'}
                </p>
              </div>

              {/* Mode toggle — animated pill */}
              <div
                className="relative flex rounded-xl p-1 mb-7"
                style={{
                  background: 'rgba(7,11,22,0.6)',
                  border: '1px solid rgba(71,85,105,0.4)',
                }}
              >
                <motion.div
                  layoutId="auth-tab-indicator"
                  className="absolute top-1 bottom-1 rounded-lg pointer-events-none"
                  animate={{ left: isLogin ? '4px' : '50%', right: isLogin ? '50%' : '4px' }}
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  style={{
                    background: 'rgba(45,212,191,.1)',
                    border: '1px solid rgba(45,212,191,.2)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => switchMode(true)}
                  className={`relative flex-1 py-2 text-sm font-medium rounded-lg transition-colors z-10 ${
                    isLogin ? 'text-teal-300' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => switchMode(false)}
                  className={`relative flex-1 py-2 text-sm font-medium rounded-lg transition-colors z-10 ${
                    !isLogin ? 'text-teal-300' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} noValidate>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={isLogin ? 'login-fields' : 'signup-fields'}
                    variants={CONTAINER}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }}
                    className="space-y-4"
                  >
                    {/* Name row — signup only */}
                    {!isLogin && (
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="First name" icon={User} error={errors.firstName}>
                          <input
                            {...inputProps('firstName', 'text', { placeholder: 'John', autoFocus: !isLogin })}
                          />
                        </Field>
                        <Field label="Last name" error={errors.lastName}>
                          <input
                            {...inputProps('lastName', 'text', { placeholder: 'Doe' })}
                          />
                        </Field>
                      </div>
                    )}

                    {/* Email */}
                    <Field label="Email address" icon={Mail} error={errors.email}>
                      <input
                        {...inputProps('email', 'email', {
                          placeholder: 'you@example.com',
                          autoFocus: isLogin,
                        })}
                      />
                    </Field>

                    {/* Password */}
                    <Field
                      label="Password"
                      icon={Lock}
                      error={errors.password}
                      right={eyeToggle}
                    >
                      <input
                        {...inputProps('password', passwordType, {
                          placeholder: '••••••••',
                          style: { paddingRight: '2.5rem' },
                        })}
                      />
                    </Field>

                    {/* Confirm password — signup only */}
                    {!isLogin && (
                      <Field
                        label="Confirm password"
                        icon={Lock}
                        error={errors.confirmPassword}
                        right={eyeToggle}
                      >
                        <input
                          {...inputProps('confirmPassword', passwordType, {
                            placeholder: '••••••••',
                            style: { paddingRight: '2.5rem' },
                          })}
                        />
                      </Field>
                    )}

                    {/* Submit */}
                    <motion.div variants={FIELD} className="pt-1">
                      <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full py-3 text-sm"
                        style={{ borderRadius: '0.75rem' }}
                      >
                        {loading ? (
                          <Loader size={16} className="animate-spin" />
                        ) : (
                          <>
                            {isLogin ? 'Sign in to Collaborink' : 'Create account'}
                            <ArrowRight size={15} />
                          </>
                        )}
                      </button>
                    </motion.div>
                  </motion.div>
                </AnimatePresence>
              </form>

              {/* Footer copy */}
              <p className="mt-6 text-center text-xs text-slate-600">
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <button
                  type="button"
                  onClick={() => switchMode(!isLogin)}
                  className="text-teal-400 hover:text-teal-300 font-medium transition-colors"
                >
                  {isLogin ? 'Sign up for free' : 'Sign in instead'}
                </button>
              </p>
            </div>
          </div>

          {/* Trust badges below the card */}
          <div className="flex items-center justify-center gap-5 mt-6">
            {['End-to-end encrypted', 'SOC 2 ready', 'GDPR compliant'].map(text => (
              <span key={text} className="flex items-center gap-1.5 text-[10px] text-slate-600">
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: 'rgba(45,212,191,.4)' }}
                />
                {text}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
