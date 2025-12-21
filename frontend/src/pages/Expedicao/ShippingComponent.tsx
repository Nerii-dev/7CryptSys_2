import React, { useState, useMemo } from 'react';
import { QRCodeScanner } from '../../components/modules/QRCodeScanner';
import { functions } from '../../services/firebase';
import { httpsCallable } from 'firebase/functions';
import { useFirestoreQuery } from '../../hooks/useFirestoreQuery';
import { Order } from '../../types/Order';
import { db } from '../../services/firebase';
import { collection, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { StatusBadge } from '../../components/common/StatusBadge';
import { format } from 'date-fns';

// --- CORREÇÃO AQUI ---
// Cloud Function corrigida com prefixo 'ship-'
const processShipmentScan = httpsCallable(functions, 'ship-processShipmentScan');
// --- FIM DA CORREÇÃO ---

export const ShippingComponent = () => {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false); // Controle do scanner
  const [lastScannedValue, setLastScannedValue] = useState('');

  // Busca os últimos 10 pedidos marcados como 'Pronto para Envio' hoje
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startTimestamp = Timestamp.fromDate(startOfDay);

  const recentScansQuery = useMemo(() => query(
    collection(db, 'orders'),
    where('status', '==', 'ready_to_ship'),
    where('updatedAt', '>=', startTimestamp),
    orderBy('updatedAt', 'desc'),
    limit(10)
  ), []);

  const { data: recentScans, loading: loadingScans } = useFirestoreQuery<Order>(recentScansQuery);

  // --- Função principal de sucesso no scan ---
  const onScanSuccess = async (decodedText: string) => {
    // Evita scans repetidos
    if (decodedText === lastScannedValue) {
      return;
    }
    setLastScannedValue(decodedText);
    
    setScanError(null);
    setScanResult(`Processando: ${decodedText}...`);

    try {
      const result: any = await processShipmentScan({ scannedValue: decodedText });
      
      if (result.data.success) {
        setScanResult(result.data.message);
      } else {
        setScanError(result.data.message || "Erro desconhecido ao processar.");
      }
    } catch (err: any) {
      console.error(err);
      setScanError(err.message || "Falha ao comunicar com o servidor.");
    }
    
    // Reseta último scan após 2s
    setTimeout(() => setLastScannedValue(''), 2000);
  };

  // --- Função de falha no scan ---
  const onScanFailure = (error: string) => {
    if (!error.includes("No QR code found")) {
      setScanError(error);
    }
  };

  // --- Renderização ---
  return (
    <div>
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Expedição - Scanner</h1>
        <p className="text-gray-600 mt-2">Leia o código da etiqueta para marcar como "Pronto para Envio".</p>
      </header>

      {/* Área do Scanner */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mb-8 max-w-xl mx-auto">
        <div className="w-full h-80 bg-gray-100 rounded-md overflow-hidden">
          {isScanning ? (
            <QRCodeScanner 
              onScanSuccess={onScanSuccess} 
              onScanFailure={onScanFailure} 
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Scanner pausado.</p>
            </div>
          )}
        </div>
        
        <button 
          onClick={() => setIsScanning(!isScanning)}
          className={`w-full py-3 mt-4 rounded-lg font-semibold text-white ${isScanning ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {isScanning ? 'Parar Scanner' : 'Iniciar Scanner'}
        </button>

        {/* Status do Scan */}
        <div className="mt-4 text-center h-6 font-semibold">
          {scanResult && <p className="text-green-600">{scanResult}</p>}
          {scanError && <p className="text-red-600">{scanError}</p>}
        </div>
      </div>

      {/* Tabela de Últimos Bipados */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Últimos Pedidos Prontos (Hoje)</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="border-b-2 border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Horário Scan</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Pedido ID</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Cliente</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {loadingScans && (
                <tr><td colSpan={4} className="text-center py-10">Carregando...</td></tr>
              )}
              {!loadingScans && recentScans.length === 0 && (
                <tr><td colSpan={4} className="text-center py-10 text-gray-500">Nenhum pedido marcado como pronto hoje.</td></tr>
              )}
              {!loadingScans && recentScans.map(order => (
                <tr key={order.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{format(order.updatedAt.toDate(), 'HH:mm:ss')}</td>
                  <td className="py-3 px-4 font-mono text-sm">{order.id}</td>
                  <td className="py-3 px-4">{order.customer.name}</td>
                  <td className="py-3 px-4 text-center"><StatusBadge status={order.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
