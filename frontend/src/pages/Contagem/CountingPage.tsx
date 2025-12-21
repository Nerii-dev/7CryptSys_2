import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../services/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';

// Configurações e Constantes
const STORES = [
  { id: 'joy_ml', label: 'Joy ML', hasHorarios: true, isFull: true },
  { id: 'goro_oficial_ml', label: 'Goro Oficial ML', hasHorarios: true, isFull: true },
  { id: '7788_ml', label: '7788 ML', hasHorarios: true, isFull: true },
  { id: 'joy_shopee', label: 'Joy (Shopee)', hasHorarios: true, isFull: false },
  // ... adicione as outras lojas conforme necessário (Gomez, Yumi, etc)
];

const HOURS = ['08', '10', '12', '14'];

export const CountingPage = () => {
  const { currentUser } = useAuth();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  
  // Estado único para todos os dados
  const [data, setData] = useState<{
    full: Record<string, number>;
    horarios: Record<string, Record<string, { coleta: number; flex: number }>>;
    contagemFlex: Record<string, Record<string, number>>;
  }>({
    full: {},
    horarios: {},
    contagemFlex: {}
  });

  // Carregar dados (Rascunho ou Final)
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
          // Merge seguro para evitar undefined
          setData(prev => ({
            full: loadedData.full || {},
            horarios: loadedData.horarios || {},
            contagemFlex: loadedData.contagemFlex || {}
          }));
          setStatusMsg(`${source} carregado.`);
        } else {
          // Resetar se não houver dados
          setData({ full: {}, horarios: {}, contagemFlex: {} });
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

  // Debounce para salvamento automático de rascunho
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
    }, 1000); // Salva 1 segundo após parar de digitar

    return () => clearTimeout(timer);
  }, [data, date, currentUser]);

  const handleInputChange = (section: 'full' | 'horarios' | 'contagemFlex', path: string[], value: string) => {
    const numValue = value === '' ? 0 : parseInt(value, 10);
    setData(prev => {
      const newData = { ...prev };
      
      if (section === 'full') {
        newData.full = { ...prev.full, [path[0]]: numValue };
      } else if (section === 'horarios') {
        // path: [loja, hora, tipo]
        const [store, hour, type] = path;
        if (!newData.horarios[store]) newData.horarios[store] = {};
        if (!newData.horarios[store][hour]) newData.horarios[store][hour] = { coleta: 0, flex: 0 };
        // @ts-ignore
        newData.horarios[store][hour] = { ...newData.horarios[store][hour], [type]: numValue };
      }
      // Logica similar para contagemFlex se necessário
      return newData;
    });
  };

  const saveFinalReport = async () => {
    if (!window.confirm(`Salvar relatório FINAL para ${date}? Isso consolidará os dados.`)) return;
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
    <div className="p-6">
      <header className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Contagem Diária</h1>
          <p className="text-gray-600">Central unificada de Full e Envios</p>
        </div>
        <div className="flex items-center gap-4">
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)}
            className="p-2 border rounded shadow-sm"
          />
          <button 
            onClick={saveFinalReport}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded shadow"
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Salvar Dia'}
          </button>
        </div>
      </header>
      
      <div className="text-sm text-right mb-4 text-gray-500 italic">{statusMsg}</div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Card FULL */}
        <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
          <h2 className="text-xl font-bold mb-4 text-purple-700">Contagem FULL</h2>
          <div className="grid grid-cols-2 gap-4">
            {STORES.filter(s => s.isFull).map(store => (
              <div key={`full-${store.id}`}>
                <label className="block text-sm font-medium text-gray-700">{store.label}</label>
                <input 
                  type="number" 
                  min="0"
                  value={data.full[store.id] || ''}
                  onChange={(e) => handleInputChange('full', [store.id], e.target.value)}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded shadow-sm focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Card Horários (Coleta/Flex) */}
        <div className="bg-white p-6 rounded-xl shadow border border-gray-200 overflow-x-auto">
          <h2 className="text-xl font-bold mb-4 text-blue-700">Horários (Coleta & Flex)</h2>
          <table className="min-w-full text-center text-sm">
            <thead>
              <tr>
                <th className="text-left">Loja</th>
                {HOURS.map(h => <th key={h} colSpan={2} className="border-l">{h}:00</th>)}
              </tr>
              <tr>
                <th></th>
                {HOURS.map(h => (
                  <React.Fragment key={`sub-${h}`}>
                    <th className="text-xs text-gray-500 border-l">Col.</th>
                    <th className="text-xs text-gray-500">Flex</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {STORES.filter(s => s.hasHorarios).map(store => (
                <tr key={store.id} className="border-t">
                  <td className="text-left font-medium py-2">{store.label}</td>
                  {HOURS.map(h => (
                    <React.Fragment key={`${store.id}-${h}`}>
                      <td className="border-l p-1">
                        <input 
                          type="number" 
                          className="w-12 text-center border rounded" 
                          value={data.horarios[store.id]?.[`h${h}`]?.coleta || ''}
                          onChange={(e) => handleInputChange('horarios', [store.id, `h${h}`, 'coleta'], e.target.value)}
                        />
                      </td>
                      <td className="p-1">
                        <input 
                          type="number" 
                          className="w-12 text-center border rounded"
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
    </div>
  );
};