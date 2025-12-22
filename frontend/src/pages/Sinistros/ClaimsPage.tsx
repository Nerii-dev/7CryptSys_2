import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { AlertTriangle, Package, Truck, Calendar, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';

const STORES_ALPHABETICAL = [
    "7788",
    "Gomez/Shark",
    "Goro Antiga",
    "Goro Nova",
    "Imperío",
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
      shippingMethod: 'Coleta',
      orderId: '', 
      saleNumber: '',
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

  const handleCategoryChange = (newCat: 'marketplace' | 'venda_direta') => {
      setCategory(newCat);
      setFormData(prev => ({
          ...prev,
          shippingMethod: newCat === 'marketplace' ? 'Coleta' : 'FlexBoys',
          saleNumber: ''
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
              createdBy: currentUser?.email || 'Desconhecido',
          });
          setFormData(prev => ({ ...prev, orderId: '', saleNumber: '', description: '' }));
          alert('Registro adicionado com sucesso!');
      } catch(err) {
          console.error(err);
          alert('Erro ao salvar registro.');
      }
  };

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'concluido': return 'bg-green-100 text-green-800 border-green-200';
          case 'rejeitado': return 'bg-red-100 text-red-800 border-red-200';
          default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      }
  };

  return (
      <div className="p-6 max-w-full mx-auto bg-gray-50 min-h-screen">
          <header className="mb-8 flex items-center gap-3 border-b pb-4">
            <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Controle de Divergências e Sinistros</h1>
                <p className="text-gray-500">Gestão de ocorrências de Marketplace e Venda Direta</p>
            </div>
          </header>
          
          <div className="grid lg:grid-cols-12 gap-8 items-start">
              {/* Formulário (Coluna Esquerda - Sticky) */}
              <div className="lg:col-span-4 bg-white p-6 rounded-xl shadow-sm border border-gray-200 sticky top-6">
                  <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      Novo Registro
                  </h2>
                  
                  {/* Seletor de Categoria */}
                  <div className="mb-6 flex bg-gray-100 p-1.5 rounded-lg shadow-inner">
                      <button 
                        type="button"
                        onClick={() => handleCategoryChange('marketplace')}
                        className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${category === 'marketplace' ? 'bg-white shadow text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                          Marketplace
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleCategoryChange('venda_direta')}
                        className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${category === 'venda_direta' ? 'bg-white shadow text-green-700' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                          Venda Direta
                      </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Loja</label>
                          <select 
                            className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.store}
                            onChange={e => setFormData({...formData, store: e.target.value})}
                          >
                              {STORES_ALPHABETICAL.map(store => <option key={store} value={store}>{store}</option>)}
                          </select>
                      </div>

                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Método de Envio</label>
                          <select 
                            className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pedido / NFe</label>
                            <input 
                                type="text" 
                                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.orderId}
                                onChange={e => setFormData({...formData, orderId: e.target.value})}
                                required
                            />
                        </div>
                        {category === 'marketplace' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nº Venda</label>
                                <input 
                                    type="text" 
                                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.saleNumber}
                                    onChange={e => setFormData({...formData, saleNumber: e.target.value})}
                                />
                            </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                            <input 
                                type="date" 
                                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.date}
                                onChange={e => setFormData({...formData, date: e.target.value})}
                            />
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                            <select 
                                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.type}
                                onChange={e => setFormData({...formData, type: e.target.value})}
                            >
                                <option value="divergencia">Divergência</option>
                                <option value="sinistro">Sinistro</option>
                            </select>
                         </div>
                      </div>

                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                          <select 
                              className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                              value={formData.status}
                              onChange={e => setFormData({...formData, status: e.target.value})}
                          >
                              <option value="pendente">Pendente</option>
                              <option value="concluido">Concluído</option>
                              <option value="rejeitado">Rejeitado</option>
                          </select>
                      </div>

                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                          <textarea 
                             className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                             rows={3}
                             value={formData.description}
                             onChange={e => setFormData({...formData, description: e.target.value})}
                             placeholder="Detalhes do ocorrido..."
                             required
                          ></textarea>
                      </div>

                      <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-bold shadow-md hover:shadow-lg transition-all flex justify-center items-center gap-2">
                          <CheckCircle className="w-5 h-5" />
                          Registrar Ocorrência
                      </button>
                  </form>
              </div>

              {/* Lista (Coluna Direita - Scrollável) */}
              <div className="lg:col-span-8">
                  <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-gray-600" />
                      Histórico Recente
                  </h2>
                  
                  <div className="space-y-4 max-h-[85vh] overflow-y-auto pr-2 custom-scrollbar">
                      {claims.map(claim => (
                          <div key={claim.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                              <div className="flex justify-between items-start mb-3">
                                  <div className="flex items-center gap-3">
                                      <span className={`p-2 rounded-lg ${claim.category === 'marketplace' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
                                          <Package className="w-5 h-5" />
                                      </span>
                                      <div>
                                          <h3 className="font-bold text-gray-800 text-lg">{claim.store}</h3>
                                          <span className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                                              {claim.category === 'marketplace' ? 'Marketplace' : 'Venda Direta'}
                                          </span>
                                      </div>
                                  </div>
                                  <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getStatusColor(claim.status)} flex items-center gap-1`}>
                                      {claim.status === 'concluido' && <CheckCircle className="w-3 h-3" />}
                                      {claim.status === 'rejeitado' && <XCircle className="w-3 h-3" />}
                                      {claim.status === 'pendente' && <Clock className="w-3 h-3" />}
                                      {claim.status}
                                  </div>
                              </div>
                              
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded-lg">
                                  <div>
                                      <span className="block text-xs text-gray-400 uppercase font-semibold">Pedido/NF</span>
                                      <span className="font-medium text-gray-800">{claim.orderId}</span>
                                  </div>
                                  {claim.saleNumber && (
                                    <div>
                                        <span className="block text-xs text-gray-400 uppercase font-semibold">Venda</span>
                                        <span className="font-medium text-gray-800">{claim.saleNumber}</span>
                                    </div>
                                  )}
                                  <div>
                                      <span className="block text-xs text-gray-400 uppercase font-semibold">Envio</span>
                                      <div className="flex items-center gap-1">
                                          <Truck className="w-3 h-3" />
                                          <span className="font-medium text-gray-800">{claim.shippingMethod}</span>
                                      </div>
                                  </div>
                                  <div>
                                      <span className="block text-xs text-gray-400 uppercase font-semibold">Data</span>
                                      <div className="flex items-center gap-1">
                                          <Calendar className="w-3 h-3" />
                                          <span className="font-medium text-gray-800">{new Date(claim.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</span>
                                      </div>
                                  </div>
                              </div>

                              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-gray-700 text-sm">
                                  <span className="font-semibold text-yellow-800 block mb-1">Descrição do Ocorrido:</span>
                                  "{claim.description}"
                              </div>
                              
                              <div className="mt-3 flex justify-between items-center text-xs text-gray-400 border-t pt-2">
                                  <span>ID: {claim.id.substring(0, 8)}...</span>
                                  <span>Registrado por: <span className="text-gray-600 font-medium">{claim.createdBy}</span></span>
                              </div>
                          </div>
                      ))}
                      {claims.length === 0 && (
                          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                              <p className="text-gray-500 font-medium">Nenhum registro encontrado.</p>
                              <p className="text-gray-400 text-sm">Use o formulário ao lado para registrar.</p>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      </div>
  );
};