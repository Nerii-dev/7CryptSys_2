import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, query, where, getDocs, onSnapshot, doc } from 'firebase/firestore';

const HOURS = ['08', '10', '12', '14'];

export const ReportsPage = () => {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState<any[]>([]);
  const [totals, setTotals] = useState({ geral: 0, coleta: 0, flex: 0, full: 0 });
  const [hourlyData, setHourlyData] = useState<any>({}); // Dados para o relatório de horários

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    let unsubscribe = () => {};

    const fetchReport = async () => {
      if (startDate === today && endDate === today) {
        unsubscribe = onSnapshot(doc(db, 'contagens_rascunho', today), (docSnap) => {
           if(docSnap.exists()) processData([docSnap.data()]);
           else processData([]);
        });
      } else {
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
    const summaryHourly: any = {}; // { storeId: { h08: {coleta:0, flex:0}, h10: ..., totalColeta: 0, totalFlex: 0 } }

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
                 if(!summaryHourly[store]) summaryHourly[store] = { 
                    name: store, 
                    hours: {}, 
                    totalColeta: 0, 
                    totalFlex: 0,
                    totalGeral: 0
                 };

                 Object.entries(hours).forEach(([hKey, values]: any) => {
                     const coleta = values.coleta || 0;
                     const flex = values.flex || 0;

                     // Sumário Geral
                     tColeta += coleta;
                     tFlex += flex;
                     summaryByStore[store].coleta += coleta;
                     summaryByStore[store].flex += flex;

                     // Sumário Horário
                     if(!summaryHourly[store].hours[hKey]) summaryHourly[store].hours[hKey] = { coleta: 0, flex: 0 };
                     summaryHourly[store].hours[hKey].coleta += coleta;
                     summaryHourly[store].hours[hKey].flex += flex;
                     
                     summaryHourly[store].totalColeta += coleta;
                     summaryHourly[store].totalFlex += flex;
                     summaryHourly[store].totalGeral += (coleta + flex);
                 });
            });
        }
    });

    tGeral = tColeta + tFlex + tFull;
    setTotals({ geral: tGeral, coleta: tColeta, flex: tFlex, full: tFull });
    setReportData(Object.values(summaryByStore));
    setHourlyData(summaryHourly);
  };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
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
            <h3 className="text-gray-500 text-sm font-semibold uppercase">Total Geral</h3>
            <p className="text-3xl font-bold text-gray-800">{totals.geral}</p>
         </div>
         <div className="bg-white p-4 rounded shadow border-l-4 border-gray-500">
            <h3 className="text-gray-500 text-sm font-semibold uppercase">Total Coleta</h3>
            <p className="text-3xl font-bold text-gray-600">{totals.coleta}</p>
         </div>
         <div className="bg-white p-4 rounded shadow border-l-4 border-green-500">
            <h3 className="text-gray-500 text-sm font-semibold uppercase">Total Flex</h3>
            <p className="text-3xl font-bold text-green-600">{totals.flex}</p>
         </div>
         <div className="bg-white p-4 rounded shadow border-l-4 border-purple-500">
            <h3 className="text-gray-500 text-sm font-semibold uppercase">Total Full</h3>
            <p className="text-3xl font-bold text-purple-600">{totals.full}</p>
         </div>
      </div>

      {/* Relatório por Horário (Restauração Solicitada) */}
      <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Relatório Detalhado por Horário</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-center text-sm border-collapse">
            <thead className="bg-gray-100 border-b-2 border-gray-200">
              <tr>
                 <th rowSpan={2} className="p-3 text-left font-bold text-gray-700 border-r">Loja</th>
                 {HOURS.map(h => (
                   <th key={h} colSpan={3} className="p-2 border-r font-semibold text-gray-600">{h}:00</th>
                 ))}
                 <th colSpan={3} className="p-2 font-bold text-gray-800 bg-gray-200">Total Final</th>
              </tr>
              <tr>
                {HOURS.map(h => (
                  <React.Fragment key={`h-${h}`}>
                    <th className="p-1 text-xs text-gray-500 border-r border-l">Col.</th>
                    <th className="p-1 text-xs text-gray-500 border-r">Flex</th>
                    <th className="p-1 text-xs text-gray-700 bg-gray-50 border-r font-semibold">Tot</th>
                  </React.Fragment>
                ))}
                <th className="p-1 text-xs text-gray-600 border-r bg-gray-200">Col.</th>
                <th className="p-1 text-xs text-gray-600 border-r bg-gray-200">Flex</th>
                <th className="p-1 text-xs text-gray-800 bg-gray-300 font-bold">Geral</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(hourlyData).map((store: any) => (
                <tr key={store.name} className="border-b hover:bg-gray-50">
                  <td className="p-2 text-left font-medium border-r capitalize">{store.name.replace(/_/g, ' ')}</td>
                  {HOURS.map(h => {
                    const hData = store.hours[`h${h}`] || { coleta: 0, flex: 0 };
                    const totalHora = hData.coleta + hData.flex;
                    return (
                      <React.Fragment key={`${store.name}-${h}`}>
                        <td className="p-2 border-r text-gray-600">{hData.coleta || 0}</td>
                        <td className="p-2 border-r text-gray-600">{hData.flex || 0}</td>
                        <td className="p-2 border-r font-semibold bg-gray-50">{totalHora}</td>
                      </React.Fragment>
                    );
                  })}
                  <td className="p-2 border-r font-bold bg-gray-100">{store.totalColeta}</td>
                  <td className="p-2 border-r font-bold bg-gray-100">{store.totalFlex}</td>
                  <td className="p-2 font-bold bg-gray-200 text-blue-800">{store.totalGeral}</td>
                </tr>
              ))}
              {Object.keys(hourlyData).length === 0 && (
                <tr>
                  <td colSpan={16} className="p-6 text-gray-500">Nenhum dado de horário encontrado para o período.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detalhamento por Loja */}
      <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
         <h2 className="text-xl font-bold mb-4 text-gray-800">Resumo Consolidado por Loja</h2>
         <div className="overflow-x-auto">
             <table className="min-w-full text-left">
                 <thead className="bg-gray-50 border-b">
                     <tr>
                         <th className="p-3 font-semibold text-gray-600">Loja</th>
                         <th className="p-3 font-semibold text-gray-600">Coleta</th>
                         <th className="p-3 font-semibold text-gray-600">Flex</th>
                         <th className="p-3 font-semibold text-gray-600">Full</th>
                         <th className="p-3 font-bold text-gray-800">Total</th>
                     </tr>
                 </thead>
                 <tbody>
                     {reportData.map((store: any) => (
                         <tr key={store.name} className="border-b hover:bg-gray-50">
                             <td className="p-3 capitalize font-medium">{store.name.replace(/_/g, ' ')}</td>
                             <td className="p-3 text-gray-600">{store.coleta}</td>
                             <td className="p-3 text-gray-600">{store.flex}</td>
                             <td className="p-3 text-gray-600">{store.full}</td>
                             <td className="p-3 font-bold text-gray-800">{store.coleta + store.flex + store.full}</td>
                         </tr>
                     ))}
                 </tbody>
             </table>
         </div>
      </div>
    </div>
  );
};