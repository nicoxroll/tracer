import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Dumbbell } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn, signUp } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        if (!username || !fullName) {
          setError('Por favor completa todos los campos');
          setIsSubmitting(false);
          return;
        }
        await signUp(email, password, username, fullName);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocurrió un error');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-sm mb-4">
            <Dumbbell className="w-10 h-10 text-[#0a0a0a]" />
          </div>
          <h1 className="text-4xl font-thin text-white mb-2">TRACER</h1>
          <p className="text-gray-400 text-sm font-light">Track your fitness journey</p>
        </div>

        <div className="bg-[#141414] border border-[#1f1f1f] rounded-sm p-8 shadow-2xl">
          <div className="flex mb-6 bg-[#0a0a0a] rounded-sm p-1">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 text-sm font-light rounded-sm transition-all duration-300 ${
                isLogin
                  ? 'bg-white text-[#0a0a0a]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 text-sm font-light rounded-sm transition-all duration-300 ${
                !isLogin
                  ? 'bg-white text-[#0a0a0a]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Registrarse
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-gray-300 text-sm font-light mb-2">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-sm px-4 py-3 text-white font-light focus:outline-none focus:border-white transition-colors duration-300"
                    required={!isLogin}
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-light mb-2">
                    Nombre de Usuario
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-sm px-4 py-3 text-white font-light focus:outline-none focus:border-white transition-colors duration-300"
                    required={!isLogin}
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-gray-300 text-sm font-light mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-sm px-4 py-3 text-white font-light focus:outline-none focus:border-white transition-colors duration-300"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-light mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-sm px-4 py-3 text-white font-light focus:outline-none focus:border-white transition-colors duration-300"
                required
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-sm px-4 py-3 text-red-400 text-sm font-light">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-white text-[#0a0a0a] py-3 rounded-sm font-light hover:bg-gray-100 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Procesando...' : isLogin ? 'Entrar' : 'Crear Cuenta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
