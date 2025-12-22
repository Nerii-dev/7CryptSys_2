import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  updateDoc, 
  doc, 
  arrayUnion, 
  serverTimestamp
} from 'firebase/firestore';
import { 
  AlertTriangle, 
  Package, 
  Calendar, 
  Clock, 
  FileText, 
  History,
  Save,
  Store,
  Truck
} from 'lucide-react';

// Interfaces
interface LogEntry {
  action: string;
  user: string;
  timestamp: string;
}

interface Claim {
  id: string;
  store: string;
  category: 'Marketplace' | 'Venda Direta'; // Nova categoria para filtro
  shippingMethod: string;
  orderId: string;
  saleId: string;
  date: string;
  type: string;
  status: string;
  description: string;
  createdBy: string;
  createdAt: any;
  history: LogEntry[];
}

// Configuração das Lojas
const STORES_MARKETPLACE = [
  { id: '7788_ml', label: '7788 ML' },
  { id: 'joy_ml', label: 'Joy ML' },
  { id: 'joy_shopee', label: 'Joy (Shopee)' },
  { id: 'goro_oficial_ml', label: 'Goro Oficial ML' },
  { id: 'goro_ml_antiga', label: 'Goro ML (Antiga)' },
  { id: 'gomez_ml', label: 'Gomez ML' },
  { id: 'yumi_ml', label: 'Yumi ML' },
  { id: 'império_ll', label: 'Império LL' },
  { id: 'l.a', label: 'L.A' }
];

const STORES_DIRECT = [
  { id: 'joy_vd_frenet', label: 'Joy VD (Frenet)' },
  { id: 'joy_vd_flexboys', label: 'Joy VD (FlexBoys)' },
  { id: 'joy_vd_retirada', label: 'Joy VD (Retirada)' }
];

export const ClaimsPage = () => {
  const { userProfile, currentUser } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Estado para alternar entre Marketplace e Venda Direta
  const [activeTab, setActiveTab] = useState<'Marketplace' | 'Venda Direta'>('Marketplace');

  const [formData, setFormData] = useState({
    store: STORES_MARKETPLACE[0].id, // Seleciona a primeira loja por padrão
    shippingMethod: 'Coleta',
    orderId: '',
    saleId: '',
    date: new Date().toISOString().split('T')[0],
    type: 'Divergência',
    description: '',
    status: 'Pendente'
  });

  // Atualiza a loja padrão quando troca a aba
  useEffect(() => {
    if (activeTab === 'Marketplace') {
      setFormData(prev => ({ ...prev, store: STORES_MARKETPLACE[0].id }));
    } else {
      setFormData(prev => ({ ...prev, store: STORES_DIRECT[0].id }));
    }
  }, [activeTab]);

  // Carregar dados
  useEffect(() => {
    const q = query(collection(db, 'sinistros_divergencias'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setClaims(snap.docs.map(d => ({ id: d.id, ...d.data() } as Claim)));
    });
    return () => unsubscribe();
  }, []);

  const getUserLabel = () => {
    return userProfile?.name || userProfile?.email || currentUser?.email || 'Usuário Desconhecido';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return alert("Você precisa estar logado.");
    
    setLoading(true);
    try {
      const userLabel = getUserLabel();
      const initialLog: LogEntry = {
        action: 'Registro Criado',
        user: userLabel,
        timestamp: new Date().toLocaleString('pt-BR')
      };

      await addDoc(collection(db, 'sinistros_divergencias'), {
        ...formData,
        category: activeTab, // Salva se foi Marketplace ou Venda Direta
        createdBy: userLabel,
        createdAt: serverTimestamp(),
        history: [initialLog] 
      });

      setFormData(prev => ({
        ...prev,
        orderId: '',
        saleId: '',
        description: '',
        status: 'Pendente'
      }));
      
      alert("Ocorrência registrada com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar registro. Verifique as permissões.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (!window.confirm(`Deseja alterar o status para "${newStatus}"?`)) return;

    try {
      const userLabel = getUserLabel();
      const docRef = doc(db, 'sinistros_divergencias', id);
      const changeLog: LogEntry = {
        action: `Status alterado para: ${newStatus}`,
        user: userLabel,
        timestamp: new Date().toLocaleString('pt-BR')
      };

      await updateDoc(docRef, {
        status: newStatus,
        history: arrayUnion(changeLog)
      });
    } catch (error) {
      console.error(error);
      alert("Erro ao atualizar status.");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Concluído': return 'bg-green-100 text-green-800 border-green-200';
      case 'Em Análise': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Cancelado': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  // Determina qual lista de lojas exibir no select
  const currentStoreList = activeTab === 'Marketplace' ? STORES_MARKETPLACE : STORES_DIRECT;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      
      <div className="flex items-center gap-4 border-b border-gray-200 pb-6">
        <div className="p-3 bg-red-100 rounded-lg">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Controle de Divergências e Sinistros</h1>
          <p className="text-gray-600">Gestão de ocorrências de Marketplace e Venda Direta</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* === COLUNA DA ESQUERDA: FORMULÁRIO === */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 sticky top-6">
            
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Novo Registro
            </h2>

            {/* ABAS DE SELEÇÃO (Estilo Botão) */}
            <div className="flex p-1 bg-gray-100 rounded-lg mb-6">
              <button
                type="button"
                onClick={() => setActiveTab('Marketplace')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-md transition-all ${
                  activeTab === 'Marketplace' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Store className="w-4 h-4" /> Marketplace
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('Venda Direta')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-md transition-all ${
                  activeTab === 'Venda Direta' 
                    ? 'bg-white text-green-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Truck className="w-4 h-4" /> Venda Direta
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Loja (Lista dinâmica baseada na aba) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loja / Origem</label>
                <select 
                  value={formData.store}
                  onChange={e => setFormData({...formData, store: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {currentStoreList.map(store => (
                    <option key={store.id} value={store.id}>{store.label}</option>
                  ))}
                </select>
              </div>

              {/* Método de Envio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Método de Envio</label>
                <select 
                  value={formData.shippingMethod}
                  onChange={e => setFormData({...formData, shippingMethod: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="Coleta">Coleta</option>
                  <option value="Flex">Flex</option>
                  <option value="Agência">Agência</option>
                  <option value="Full">Full</option>
                  <option value="Motoboy">Motoboy (VD)</option>
                  <option value="Correios">Correios (VD)</option>
                </select>
              </div>

              {/* IDs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pedido / NFe</label>
                  <input 
                    type="text" 
                    value={formData.orderId}
                    onChange={e => setFormData({...formData, orderId: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="Ex: 12345"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nº Venda</label>
                  <input 
                    type="text" 
                    value={formData.saleId}
                    onChange={e => setFormData({...formData, saleId: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="Ex: 20000..."
                  />
                </div>
              </div>

              {/* Data e Tipo */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                  <input 
                    type="date" 
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select 
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                  >
                    <option value="Divergência">Divergência</option>
                    <option value="Sinistro">Sinistro</option>
                    <option value="Extravio">Extravio</option>
                    <option value="Devolução Incorreta">Devolução Incorreta</option>
                    <option value="Defeito">Defeito</option>
                  </select>
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="Detalhes do ocorrido..."
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className={`w-full text-white font-bold py-3 px-4 rounded-lg shadow transition-colors flex items-center justify-center gap-2 ${
                  activeTab === 'Marketplace' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {loading ? 'Salvando...' : (
                  <>
                    <Save className="w-5 h-5" /> Registrar ({activeTab})
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* === COLUNA DA DIREITA: LISTA E HISTÓRICO === */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
             <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
               <History className="w-5 h-5 text-gray-500" />
               Histórico Recente
             </h2>
             <span className="text-sm text-gray-500">{claims.length} registros encontrados</span>
          </div>

          {claims.length === 0 ? (
            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Nenhum registro encontrado.</p>
              <p className="text-sm text-gray-400">Use o formulário ao lado para registrar.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {claims.map((item) => (
                <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  {/* Cabeçalho do Card */}
                  <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-wrap justify-between items-start gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${getStatusColor(item.status)}`}>
                        {item.status}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800 capitalize">{item.store?.replace(/_/g, ' ')}</h3>
                        {/* Mostra se é MP ou VD no card */}
                        <span className="text-[10px] text-gray-500 uppercase font-semibold">
                          {item.category || 'Geral'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                       <label className="text-xs text-gray-500 font-medium">Status:</label>
                       <select 
                         value={item.status}
                         onChange={(e) => handleStatusChange(item.id, e.target.value)}
                         className="text-sm p-1.5 border border-gray-300 rounded shadow-sm focus:ring-blue-500 cursor-pointer bg-white"
                       >
                         <option value="Pendente">Pendente</option>
                         <option value="Em Análise">Em Análise</option>
                         <option value="Aguardando Reembolso">Aguardando Reembolso</option>
                         <option value="Concluído">Concluído</option>
                         <option value="Cancelado">Cancelado</option>
                       </select>
                    </div>
                  </div>

                  {/* Corpo do Card */}
                  <div className="p-4 grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <div className="flex items-center gap-2 text-sm text-gray-600">
                         <Package className="w-4 h-4 text-gray-400" />
                         <span>Pedido: <strong>{item.orderId || '-'}</strong></span>
                       </div>
                       <div className="flex items-center gap-2 text-sm text-gray-600">
                         <FileText className="w-4 h-4 text-gray-400" />
                         <span>Venda: <strong>{item.saleId || '-'}</strong></span>
                       </div>
                       <div className="flex items-center gap-2 text-sm text-gray-600">
                         <Calendar className="w-4 h-4 text-gray-400" />
                         <span>Ocorrido em: {item.date ? new Date(item.date).toLocaleDateString('pt-BR') : '-'}</span>
                       </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                         <Truck className="w-4 h-4 text-gray-400" />
                         <span>Envio: {item.shippingMethod}</span>
                       </div>
                    </div>
                    
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                      <p className="text-xs font-bold text-blue-700 uppercase mb-1">{item.type}</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.description}</p>
                    </div>
                  </div>

                  {/* Rodapé: Logs do Sistema */}
                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                    <p className="text-xs font-bold text-gray-500 mb-2 uppercase flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Auditoria / Logs
                    </p>
                    <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                      {item.history && item.history.length > 0 ? (
                        [...item.history].reverse().map((log, index) => (
                          <div key={index} className="text-xs flex justify-between text-gray-600 border-b border-gray-100 last:border-0 pb-1">
                            <span>
                              <span className="font-semibold text-gray-800">{log.user}</span>: {log.action}
                            </span>
                            <span className="text-gray-400">{log.timestamp}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400 italic">Criado por {item.createdBy}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};