import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { showToast } from '../../utils/toast'; // Assumindo que você tenha um utilitário de toast, senão use alert

// Lista exata do projeto 7CryptSys para compatibilidade de dados
const STORES_CONFIG = [
  { id: 'joy_ml', label: 'Joy ML', hasHorarios: true, isFull: true },
  { id: 'joy_shopee', label: 'Joy (Shopee)', hasHorarios: true, isFull: false },
  { id: 'joy_vd_frenet', label: 'Joy VD (Frenet)', hasHorarios: true, isFull: false },
  { id: 'joy_vd_flexboys', label: 'Joy VD (FlexBoys)', hasHorarios: true, isFull: false },
  { id: 'joy_vd_retirada', label: 'Joy VD (Retirada)', hasHorarios: true, isFull: false },
  { id: 'goro_oficial_ml', label: 'Goro Oficial ML', hasHorarios: true, isFull: true },
  { id: 'goro_ml_antiga', label: 'Goro ML (Antiga)', hasHorarios: true, isFull: false },
  { id: '7788_ml', label: '7788 ML', hasHorarios: true, isFull: true },
  { id: 'gomez_ml', label: 'Gomez ML', hasHorarios: true, isFull: true },
  { id: 'yumi_ml', label: 'Yumi ML', hasHorarios: true, isFull: true },
  { id: 'império_ll', label: 'Império LL', hasHorarios: true, isFull: true },
  { id: 'l.a', label: 'L.A', hasHorarios: true, isFull: true }
];

const HOURS = ['08', '10', '12', '14'];

export const CountingPage = () => {
  const { currentUser } = useAuth();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'envios' | 'full'>('envios'); // Sub-menu state
  
  const [data, setData] = useState<{
    full: Record<string, number>;
    horarios: Record<string, Record<string, { coleta: number; flex: number }>>;
  }>({
    full: {},
    horarios: {},
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setStatusMsg('Carregando...');
      try {
        const reportRef = doc(db, 'faturamento_contagens', date);
        const draftRef = doc(db, 'contagens_rascunho', date);
        
        let docSnap = await getDoc(reportRef);
        let source = 'Relatório Final';

        if (!docSnap.exists()) {
          docSnap = await getDoc(draftRef);
          source = 'Rascunho';
        }

        if (docSnap.exists()) {
          const loadedData = docSnap.data();
          setData(prev => ({
            full: loadedData.full || {},
            horarios: loadedData.horarios || {},
          }));
          setStatusMsg(`${source} carregado.`);
        } else {
          setData({ full: {}, horarios: {} });
          setStatusMsg('Nenhum dado anterior.');
        }
      } catch (error) {
        console.error(error);
        setStatusMsg('Erro ao carregar.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [date]);

  // Auto-save rascunho
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!currentUser) return;
      try {
        const draftRef = doc(db, 'contagens_rascunho', date);
        await setDoc(draftRef, {
            ...data,
            lastUpdated: serverTimestamp(),
            lastUpdatedBy: currentUser.email
        }, { merge: true });
        setStatusMsg('Rascunho salvo automaticamente.');
      } catch (e) {
        console.error("Erro ao salvar rascunho", e);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [data, date, currentUser]);

  const handleInputChange = (section: 'full' | 'horarios', path: string[], value: string) => {
    const numValue = value === '' ? 0 : parseInt(value, 10);
    setData(prev => {
      const newData = { ...prev };
      
      if (section === 'full') {
        newData.full = { ...prev.full, [path[0]]: numValue };
      } else if (section === 'horarios') {
        const [store, hour, type] = path;
        if (!newData.horarios[store]) newData.horarios[store] = {};
        if (!newData.horarios[store][hour]) newData.horarios[store][hour] = { coleta: 0, flex: 0 };
        // @ts-ignore
        newData.horarios[store][hour] = { ...newData.horarios[store][hour], [type]: numValue };
      }
      return newData;
    });
  };

  const saveFinalReport = async () => {
    if (!window.confirm(`Salvar relatório FINAL para ${date}?`)) return;
    try {
      setLoading(true);
      await setDoc(doc(db, 'faturamento_contagens', date), {
        ...data,
        updatedBy: currentUser?.email,
        lastUpdated: serverTimestamp()
      }, { merge: true });
      alert('Relatório Final Salvo com Sucesso!');
    } catch (e) {
      alert('Erro ao salvar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <header className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Contagem Diária</h1>
          <p className="text-gray-600">Registro de Envios e Full</p>
        </div>
        <div className="flex items-center gap-4">
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)}
            className="p-2 border rounded shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
          <button 
            onClick={saveFinalReport}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded shadow transition-colors"
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Salvar Dia'}
          </button>
        </div>
      </header>
      
      <div className="flex justify-between items-center mb-4">
          {/* Sub-menu (Abas) */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('envios')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'envios' 
                  ? 'bg-white text-blue-700 shadow' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Envios (Coleta / Flex)
            </button>
            <button
              onClick={() => setActiveTab('full')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'full' 
                  ? 'bg-white text-purple-700 shadow' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Contagem FULL
            </button>
          </div>
          
          <div className="text-sm text-gray-500 italic font-medium">{statusMsg}</div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
        
        {/* Conteúdo da Aba Envios */}
        {activeTab === 'envios' && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-bold mb-6 text-blue-700 border-b pb-2">Envios: Coleta & Flex</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-center text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Loja / Plataforma</th>
                    {HOURS.map(h => (
                      <th key={h} colSpan={2} className="px-2 py-3 border-l font-semibold text-gray-700">
                        {h}:00
                      </th>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <th></th>
                    {HOURS.map(h => (
                      <React.Fragment key={`sub-${h}`}>
                        <th className="px-1 py-2 text-xs text-gray-500 uppercase tracking-wider border-l bg-gray-50">Coleta</th>
                        <th className="px-1 py-2 text-xs text-gray-500 uppercase tracking-wider bg-gray-50">Flex</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {STORES_CONFIG.filter(s => s.hasHorarios).map(store => (
                    <tr key={store.id} className="hover:bg-gray-50 transition-colors">
                      <td className="text-left font-medium py-3 px-4 text-gray-800">{store.label}</td>
                      {HOURS.map(h => (
                        <React.Fragment key={`${store.id}-${h}`}>
                          <td className="border-l p-2">
                            <input 
                              type="number" 
                              min="0"
                              placeholder="0"
                              className="w-16 p-1 text-center border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500" 
                              value={data.horarios[store.id]?.[`h${h}`]?.coleta || ''}
                              onChange={(e) => handleInputChange('horarios', [store.id, `h${h}`, 'coleta'], e.target.value)}
                            />
                          </td>
                          <td className="p-2">
                            <input 
                              type="number" 
                              min="0"
                              placeholder="0"
                              className="w-16 p-1 text-center border border-gray-300 rounded focus:ring-green-500 focus:border-green-500"
                              value={data.horarios[store.id]?.[`h${h}`]?.flex || ''}
                              onChange={(e) => handleInputChange('horarios', [store.id, `h${h}`, 'flex'], e.target.value)}
                            />
                          </td>
                        </React.Fragment>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Conteúdo da Aba FULL */}
        {activeTab === 'full' && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-bold mb-6 text-purple-700 border-b pb-2">Contagem FULL</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {STORES_CONFIG.filter(s => s.isFull).map(store => (
                <div key={`full-${store.id}`} className="bg-gray-50 p-4 rounded-lg border border-gray-100 hover:border-purple-200 transition-colors">
                  <label className="block text-sm font-bold text-gray-700 mb-2">{store.label}</label>
                  <input 
                    type="number" 
                    min="0"
                    placeholder="0"
                    value={data.full[store.id] || ''}
                    onChange={(e) => handleInputChange('full', [store.id], e.target.value)}
                    className="block w-full p-2 border border-gray-300 rounded focus:ring-purple-500 focus:border-purple-500 text-lg font-medium text-center"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};