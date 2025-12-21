import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, query, where, getDocs, onSnapshot, doc } from 'firebase/firestore';

export const ReportsPage = () => {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState<any[]>([]);
  const [totals, setTotals] = useState({ geral: 0, coleta: 0, flex: 0, full: 0 });

  useEffect(() => {
    // Se as datas forem iguais e forem hoje, usar realtime listener
    const today = new Date().toISOString().split('T')[0];
    let unsubscribe = () => {};

    const fetchReport = async () => {
      if (startDate === today && endDate === today) {
        // Realtime do Rascunho ou Final de hoje
        unsubscribe = onSnapshot(doc(db, 'contagens_rascunho', today), (docSnap) => {
           if(docSnap.exists()) processData([docSnap.data()]);
           else processData([]);
        });
      } else {
        // Busca histórica
        const q = query(
          collection(db, 'faturamento_contagens'),
          where('__name__', '>=', startDate),
          where('__name__', '<=', endDate)
        );
        const snapshot = await getDocs(q);
        processData(snapshot.docs.map(d => d.data()));
      }
    };

    fetchReport();
    return () => unsubscribe();
  }, [startDate, endDate]);

  const processData = (data: any[]) => {
    let tGeral = 0, tColeta = 0, tFlex = 0, tFull = 0;
    const summaryByStore: any = {};

    data.forEach(day => {
        // Processar Full
        if(day.full) {
            Object.entries(day.full).forEach(([store, qtd]: any) => {
                tFull += qtd;
                if(!summaryByStore[store]) summaryByStore[store] = { name: store, full: 0, coleta: 0, flex: 0 };
                summaryByStore[store].full += qtd;
            });
        }
        // Processar Horarios
        if(day.horarios) {
            Object.entries(day.horarios).forEach(([store, hours]: any) => {
                 if(!summaryByStore[store]) summaryByStore[store] = { name: store, full: 0, coleta: 0, flex: 0 };
                 Object.values(hours).forEach((h: any) => {
                     tColeta += (h.coleta || 0);
                     tFlex += (h.flex || 0);
                     summaryByStore[store].coleta += (h.coleta || 0);
                     summaryByStore[store].flex += (h.flex || 0);
                 });
            });
        }
    });

    tGeral = tColeta + tFlex + tFull;
    setTotals({ geral: tGeral, coleta: tColeta, flex: tFlex, full: tFull });
    setReportData(Object.values(summaryByStore));
  };

  return (
    <div className="p-6 space-y-8">
      <header>
         <h1 className="text-3xl font-bold text-gray-800">Relatórios de Faturamento</h1>
         <div className="flex gap-4 mt-4">
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 border rounded"/>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 border rounded"/>
         </div>
      </header>

      {/* KPIS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <div className="bg-white p-4 rounded shadow border-l-4 border-blue-500">
            <h3 className="text-gray-500">Total Geral</h3>
            <p className="text-3xl font-bold">{totals.geral}</p>
         </div>
         <div className="bg-white p-4 rounded shadow border-l-4 border-gray-500">
            <h3 className="text-gray-500">Coleta</h3>
            <p className="text-3xl font-bold">{totals.coleta}</p>
         </div>
         <div className="bg-white p-4 rounded shadow border-l-4 border-green-500">
            <h3 className="text-gray-500">Flex</h3>
            <p className="text-3xl font-bold">{totals.flex}</p>
         </div>
         <div className="bg-white p-4 rounded shadow border-l-4 border-purple-500">
            <h3 className="text-gray-500">Full</h3>
            <p className="text-3xl font-bold">{totals.full}</p>
         </div>
      </div>

      {/* Detalhamento por Loja (Requisito 1.2: Último no layout) */}
      <div className="bg-white p-6 rounded-xl shadow">
         <h2 className="text-xl font-bold mb-4">Detalhamento por Loja</h2>
         <div className="overflow-x-auto">
             <table className="min-w-full text-left">
                 <thead className="bg-gray-50">
                     <tr>
                         <th className="p-3">Loja</th>
                         <th className="p-3">Coleta</th>
                         <th className="p-3">Flex</th>
                         <th className="p-3">Full</th>
                         <th className="p-3 font-bold">Total</th>
                     </tr>
                 </thead>
                 <tbody>
                     {reportData.map((store: any) => (
                         <tr key={store.name} className="border-b hover:bg-gray-50">
                             <td className="p-3 capitalize">{store.name.replace(/_/g, ' ')}</td>
                             <td className="p-3">{store.coleta}</td>
                             <td className="p-3">{store.flex}</td>
                             <td className="p-3">{store.full}</td>
                             <td className="p-3 font-bold">{store.coleta + store.flex + store.full}</td>
                         </tr>
                     ))}
                 </tbody>
             </table>
         </div>
      </div>
    </div>
  );
};