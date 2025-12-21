import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../services/firebase";
// Importe seu logo aqui, ex:
// import logo from "../../assets/icons/lljoylogo.svg";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // O AuthContext vai detectar a mudança e o App.tsx vai redirecionar
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Erro no login:", err);
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        setError("Email ou senha inválidos.");
      } else {
        setError("Erro ao fazer login. Tente novamente.");
      }
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="text-center mb-8">
          {/* <img src={logo} alt="7CryptSys Logo" className="mx-auto h-20 w-auto mb-4" /> */}
          <h2 className="text-3xl font-bold text-gray-800">7CryptSys</h2>
          <p className="text-gray-500 mt-2">Sistema de Gestão Integrada</p>
        </div>
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Senha</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm"
            />
          </div>
          <div className="flex items-center justify-center">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </div>
          {error && <p className="text-red-500 text-center mt-4 text-sm h-4">{error}</p>}
        </form>
      </div>
    </div>
  );
};