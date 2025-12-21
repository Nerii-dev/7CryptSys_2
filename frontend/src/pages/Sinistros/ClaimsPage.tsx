import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';

export const ClaimsPage = () => {
  const { currentUser } = useAuth();
  const [claims, setClaims] = useState<any[]>([]);
  const [newClaim, setNewClaim] = useState({
      orderId: '',
      type: 'divergencia', // ou 'sinistro'
      description: '',
      status: 'pendente'
  });

  useEffect(() => {
    const q = query(collection(db, 'sinistros_divergencias'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
        setClaims(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!newClaim.orderId || !newClaim.description) return;
      
      try {
          await addDoc(collection(db, 'sinistros_divergencias'), {
              ...newClaim,
              createdAt: serverTimestamp(),
              createdBy: currentUser?.email,
              createdById: currentUser?.uid
          });
          setNewClaim({ orderId: '', type: 'divergencia', description: '', status: 'pendente' });
          alert('Registro adicionado!');
      } catch(err) {
          alert('Erro ao salvar.');
      }
  };

  return (
      <div className="p-6">
          <h1 className="text-3xl font-bold mb-6 text-red-700">Controle de Divergências e Sinistros</h1>
          
          <div className="grid md:grid-cols-3 gap-6">
              {/* Formulário */}
              <div className="bg-white p-6 rounded shadow h-fit">
                  <h2 className="text-xl font-bold mb-4">Novo Registro</h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium">Nº Pedido / ID</label>
                          <input 
                            type="text" 
                            className="w-full border p-2 rounded" 
                            value={newClaim.orderId}
                            onChange={e => setNewClaim({...newClaim, orderId: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium">Tipo</label>
                          <select 
                            className="w-full border p-2 rounded"
                            value={newClaim.type}
                            onChange={e => setNewClaim({...newClaim, type: e.target.value})}
                          >
                              <option value="divergencia">Divergência (Estoque/Envio)</option>
                              <option value="sinistro">Sinistro (Roubo/Extravio/Dano)</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-sm font-medium">Descrição</label>
                          <textarea 
                             className="w-full border p-2 rounded" 
                             rows={3}
                             value={newClaim.description}
                             onChange={e => setNewClaim({...newClaim, description: e.target.value})}
                          ></textarea>
                      </div>
                      <button type="submit" className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 font-bold">
                          Registrar
                      </button>
                  </form>
              </div>

              {/* Lista */}
              <div className="md:col-span-2 space-y-4">
                  {claims.map(claim => (
                      <div key={claim.id} className={`p-4 bg-white rounded shadow border-l-4 ${claim.type === 'sinistro' ? 'border-red-600' : 'border-orange-500'}`}>
                          <div className="flex justify-between">
                              <span className="font-bold text-gray-700">Pedido: {claim.orderId}</span>
                              <span className={`text-xs px-2 py-1 rounded text-white ${claim.type === 'sinistro' ? 'bg-red-600' : 'bg-orange-500'}`}>
                                  {claim.type.toUpperCase()}
                              </span>
                          </div>
                          <p className="mt-2 text-gray-600">{claim.description}</p>
                          <div className="mt-3 text-xs text-gray-400 flex justify-between">
                              <span>Por: {claim.createdBy}</span>
                              <span>Status: {claim.status}</span>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </div>
  );
};