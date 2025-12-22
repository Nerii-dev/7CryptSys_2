import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';

// Lista em ordem alfabética conforme solicitado
const STORES_ALPHABETICAL = [
    "7788",
    "Gomez/Shark",
    "Goro Antiga",
    "Goro Nova",
    "Imperío", // Mantendo acentuação se foi pedido, senão Império
    "Joy",
    "L.A",
    "Yumi"
];

export const ClaimsPage = () => {
  const { currentUser } = useAuth();
  const [claims, setClaims] = useState<any[]>([]);
  const [category, setCategory] = useState<'marketplace' | 'venda_direta'>('marketplace');
  
  const [formData, setFormData] = useState({
      store: STORES_ALPHABETICAL[0],
      shippingMethod: 'Coleta', // Default Marketplace
      orderId: '', // Serve para NFe ou Pedido
      saleNumber: '', // Apenas Marketplace
      date: new Date().toISOString().split('T')[0],
      type: 'divergencia',
      status: 'pendente',
      description: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'sinistros_divergencias'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
        setClaims(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, []);

  // Resetar método de envio ao trocar categoria
  const handleCategoryChange = (newCat: 'marketplace' | 'venda_direta') => {
      setCategory(newCat);
      setFormData(prev => ({
          ...prev,
          shippingMethod: newCat === 'marketplace' ? 'Coleta' : 'FlexBoys',
          saleNumber: '' // Limpa numero da venda se for VD
      }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!formData.orderId || !formData.description) return alert("Preencha os campos obrigatórios.");
      
      try {
          await addDoc(collection(db, 'sinistros_divergencias'), {
              ...formData,
              category,
              createdAt: serverTimestamp(),
              createdBy: currentUser?.email,
          });
          setFormData(prev => ({ ...prev, orderId: '', saleNumber: '', description: '' }));
          alert('Registro adicionado com sucesso!');
      } catch(err) {
          console.error(err);
          alert('Erro ao salvar registro.');
      }
  };

  return (
      <div className="p-6 max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-red-700 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Controle de Divergências e Sinistros
          </h1>
          
          <div className="grid lg:grid-cols-3 gap-8">
              {/* Formulário */}
              <div className="bg-white p-6 rounded-xl shadow border border-gray-200 h-fit">
                  <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">Novo Registro</h2>
                  
                  {/* Seletor de Categoria */}
                  <div className="mb-4 flex bg-gray-100 p-1 rounded-lg">
                      <button 
                        type="button"
                        onClick={() => handleCategoryChange('marketplace')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${category === 'marketplace' ? 'bg-white shadow text-blue-700' : 'text-gray-500'}`}
                      >
                          Marketplace
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleCategoryChange('venda_direta')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${category === 'venda_direta' ? 'bg-white shadow text-green-700' : 'text-gray-500'}`}
                      >
                          Venda Direta
                      </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                      {/* Loja */}
                      <div>
                          <label className="block text-sm font-medium text-gray-700">Loja</label>
                          <select 
                            className="mt-1 block w-full p-2 border border-gray-300 rounded shadow-sm"
                            value={formData.store}
                            onChange={e => setFormData({...formData, store: e.target.value})}
                          >
                              {STORES_ALPHABETICAL.map(store => <option key={store} value={store}>{store}</option>)}
                          </select>
                      </div>

                      {/* Método de Envio */}
                      <div>
                          <label className="block text-sm font-medium text-gray-700">Método de Envio</label>
                          <select 
                            className="mt-1 block w-full p-2 border border-gray-300 rounded shadow-sm"
                            value={formData.shippingMethod}
                            onChange={e => setFormData({...formData, shippingMethod: e.target.value})}
                          >
                              {category === 'marketplace' ? (
                                  <>
                                    <option value="Coleta">Coleta</option>
                                    <option value="Flex">Flex</option>
                                  </>
                              ) : (
                                  <>
                                    <option value="FlexBoys">FlexBoys</option>
                                    <option value="Frenet">Frenet</option>
                                    <option value="Retirada">Retirada</option>
                                  </>
                              )}
                          </select>
                      </div>

                      {/* IDs */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nº Pedido / NFe</label>
                            <input 
                                type="text" 
                                className="mt-1 block w-full p-2 border border-gray-300 rounded shadow-sm" 
                                value={formData.orderId}
                                onChange={e => setFormData({...formData, orderId: e.target.value})}
                                required
                            />
                        </div>
                        {category === 'marketplace' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nº Venda</label>
                                <input 
                                    type="text" 
                                    className="mt-1 block w-full p-2 border border-gray-300 rounded shadow-sm" 
                                    value={formData.saleNumber}
                                    onChange={e => setFormData({...formData, saleNumber: e.target.value})}
                                />
                            </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Data Ocorrência</label>
                            <input 
                                type="date" 
                                className="mt-1 block w-full p-2 border border-gray-300 rounded shadow-sm"
                                value={formData.date}
                                onChange={e => setFormData({...formData, date: e.target.value})}
                            />
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Tipo</label>
                            <select 
                                className="mt-1 block w-full p-2 border border-gray-300 rounded shadow-sm"
                                value={formData.type}
                                onChange={e => setFormData({...formData, type: e.target.value})}
                            >
                                <option value="divergencia">Divergência</option>
                                <option value="sinistro">Sinistro</option>
                            </select>
                         </div>
                      </div>

                      <div>
                          <label className="block text-sm font-medium text-gray-700">Status</label>
                          <select 
                              className="mt-1 block w-full p-2 border border-gray-300 rounded shadow-sm"
                              value={formData.status}
                              onChange={e => setFormData({...formData, status: e.target.value})}
                          >
                              <option value="pendente">Pendente</option>
                              <option value="concluido">Concluído</option>
                              <option value="rejeitado">Rejeitado</option>
                          </select>
                      </div>

                      <div>
                          <label className="block text-sm font-medium text-gray-700">Descrição</label>
                          <textarea 
                             className="mt-1 block w-full p-2 border border-gray-300 rounded shadow-sm" 
                             rows={3}
                             value={formData.description}
                             onChange={e => setFormData({...formData, description: e.target.value})}
                             placeholder="Detalhes do ocorrido..."
                             required
                          ></textarea>
                      </div>

                      <button type="submit" className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 font-bold shadow transition-colors">
                          Registrar
                      </button>
                  </form>
              </div>

              {/* Lista de Registros */}
              <div className="lg:col-span-2">
                  <h2 className="text-xl font-bold mb-4 text-gray-700">Histórico</h2>
                  <div className="space-y-4">
                      {claims.map(claim => (
                          <div key={claim.id} className="bg-white p-4 rounded-lg shadow border-l-4 border-l-red-500 border border-gray-100">
                              <div className="flex justify-between items-start mb-2">
                                  <div>
                                      <span className="font-bold text-gray-800 text-lg mr-2">{claim.store}</span>
                                      <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                          {claim.category === 'marketplace' ? 'MktPlace' : 'Venda Direta'}
                                      </span>
                                  </div>
                                  <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase
                                      ${claim.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' : ''}
                                      ${claim.status === 'concluido' ? 'bg-green-100 text-green-800' : ''}
                                      ${claim.status === 'rejeitado' ? 'bg-gray-100 text-gray-800' : ''}
                                  `}>
                                      {claim.status}
                                  </div>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600 mb-3">
                                  <div><span className="font-semibold">Pedido/NF:</span> {claim.orderId}</div>
                                  {claim.saleNumber && <div><span className="font-semibold">Venda:</span> {claim.saleNumber}</div>}
                                  <div><span className="font-semibold">Envio:</span> {claim.shippingMethod}</div>
                                  <div><span className="font-semibold">Data:</span> {new Date(claim.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</div>
                              </div>

                              <div className="bg-gray-50 p-3 rounded text-gray-700 text-sm italic">
                                  "{claim.description}"
                              </div>
                              
                              <div className="mt-2 text-xs text-gray-400 text-right">
                                  Registrado por: {claim.createdBy}
                              </div>
                          </div>
                      ))}
                      {claims.length === 0 && <p className="text-gray-500 text-center py-10">Nenhum registro encontrado.</p>}
                  </div>
              </div>
          </div>
      </div>
  );
};