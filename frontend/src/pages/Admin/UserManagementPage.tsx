import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../services/firebase';
import { UserPlus, Mail, Lock, User, Shield, CheckCircle, AlertCircle } from 'lucide-react';

export const UserManagementPage = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'sales' // Valor padrão
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Chama a função do Backend (auth-createNewUser)
      // O nome 'auth-createNewUser' vem do agrupamento no index.ts (export * as auth)
      const createUserFn = httpsCallable(functions, 'auth-createNewUser');
      
      await createUserFn({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role
      });

      setSuccess(`Usuário ${formData.email} criado com sucesso!`);
      setFormData({ name: '', email: '', password: '', role: 'sales' }); // Limpa form
    } catch (err: any) {
      console.error(err);
      // Tenta pegar a mensagem de erro amigável do backend ou usa uma genérica
      const msg = err.message || 'Erro ao criar usuário.';
      if (msg.includes('already-exists')) setError('Este e-mail já está cadastrado.');
      else if (msg.includes('permission-denied')) setError('Permissão negada.');
      else setError('Erro ao criar usuário. Verifique os dados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <UserPlus className="w-8 h-8 text-blue-600" />
          Gestão de Usuários
        </h1>
        <p className="text-gray-600 mt-2">Cadastre novos membros da equipe e defina suas permissões.</p>
      </header>

      <div className="bg-white rounded-xl shadow border border-gray-200 p-6 md:p-8">
        <h2 className="text-xl font-bold mb-6 text-gray-800 border-b pb-2">Novo Cadastro</h2>

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5" /> {success}
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="pl-10 block w-full p-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: João Silva"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail de Acesso</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10 block w-full p-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="joao@empresa.com"
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha Temporária</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10 block w-full p-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
            </div>

            {/* Role / Permissão */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Setor / Permissão</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Shield className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="pl-10 block w-full p-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="sales">Vendas</option>
                  <option value="shipping">Expedição</option>
                  <option value="metrics">Métricas / Relatórios</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg text-white font-bold shadow transition-all ${
                loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
              }`}
            >
              {loading ? (
                <span>Criando...</span>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" /> Criar Usuário
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};