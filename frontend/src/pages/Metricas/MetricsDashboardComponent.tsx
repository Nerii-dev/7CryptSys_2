import React, { useState, useEffect, useMemo } from 'react';
import { functions, db } from '../../services/firebase';
import { httpsCallable } from 'firebase/functions';
import { collection, query, where, Timestamp, getDocs, doc, getDoc } from 'firebase/firestore';

// --- Funções do backend (corrigidas) ---
const getMLReputation = httpsCallable(functions, 'ml-getMercadoLivreReputation');
const getMLSummary = httpsCallable(functions, 'ml-getMercadoLivreAccountSummary');
const getMLFlex = httpsCallable(functions, 'ml-getMercadoLivreShippingPerformanceFlex');
const getMLAgency = httpsCallable(functions, 'ml-getMercadoLivreShippingPerformanceAgency');
// --- Fim das correções ---

// --- Tipos ---
interface ReputationData {
  seller_reputation?: {
    level_id?: string;
    metrics?: {
      claims?: { rate: number; period: string };
      cancellations?: { rate: number; period: string };
      delayed_handling_time?: { rate: number; period: string };
    };
  };
  power_seller_status?: string;
}

interface SummaryData {
  total_amount?: number;
  available_balance?: number;
  unavailable_balance?: number;
  retained_balance?: number;
}

interface PerformanceData {
  currentWeekRate?: number;
  last4WeeksRate?: number;
  predictionStatus?: string;
}

// --- Helpers de formatação ---
const formatCurrency = (value: number | undefined) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

const formatPercentage = (rate: number | undefined | null) => {
  if (rate === null || rate === undefined) return '- %';
  return (rate * 100).toFixed(2).replace('.', ',') + '%';
};

const formatReputationLevel = (levelId?: string, powerStatus?: string) => {
  const level = levelId || powerStatus;
  if (!level) return 'Sem reputação';
  const levels: Record<string, string> = {
    '5_green': 'MercadoLíder Platinum',
    '4_green': 'MercadoLíder Gold',
    '3_green': 'MercadoLíder',
    'green': 'Reputação Verde',
  };
  return levels[level] || level.replace('_', ' ');
};

const getMetricColorClass = (statusOrRate: any) => {
  let status = statusOrRate;
  if (typeof statusOrRate === 'number') {
    status = statusOrRate <= 0.02 ? 'green' : 'red';
  }
  if (!status) return 'text-gray-500';
  if (status.includes('green')) return 'text-green-600';
  if (status.includes('red')) return 'text-red-600';
  if (status.includes('yellow') || status.includes('orange')) return 'text-yellow-600';
  return 'text-gray-500';
};
// --- Fim dos Helpers ---

export const MetricsDashboardComponent = () => {
  const [loading, setLoading] = useState(true);
  const [reputation, setReputation] = useState<ReputationData | null>(null);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [flex, setFlex] = useState<PerformanceData | null>(null);
  const [agency, setAgency] = useState<PerformanceData | null>(null);

  // --- Estados para Relatórios de Faturamento ---
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState<any[]>([]);
  const [reportLoading, setReportLoading] = useState(false);

  // --- Buscar métricas do ML ---
  useEffect(() => {
    const fetchMLMetrics = async () => {
      setLoading(true);
      try {
        const [rep, sum, flx, agy] = await Promise.all([
          getMLReputation(),
          getMLSummary(),
          getMLFlex(),
          getMLAgency(),
        ]);
        setReputation(rep.data as ReputationData);
        setSummary(sum.data as SummaryData);
        setFlex(flx.data as PerformanceData);
        setAgency(agy.data as PerformanceData);
      } catch (err) {
        console.error('Erro ao buscar métricas do ML:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMLMetrics();
  }, []);

  // --- Buscar relatórios internos (corrigido) ---
  const fetchInternalReports = async () => {
    setReportLoading(true);
    try {
      const q = query(
        collection(db, 'faturamento_contagens'),
        where(doc(db, 'faturamento_contagens', startDate).id, '>=', startDate),
        where(doc(db, 'faturamento_contagens', endDate).id, '<=', endDate)
      );

      const querySnapshot = await getDocs(q);
      const documents = querySnapshot.docs.map((doc) => doc.data());
      setReportData(documents);
    } catch (err) {
      console.error('Erro ao buscar relatórios internos:', err);
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    fetchInternalReports();
  }, [startDate, endDate]);

  const repMetrics = reputation?.seller_reputation?.metrics;

  // --- Renderização ---
  return (
    <div>
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Métricas e Relatórios</h1>
        <p className="text-gray-600 mt-2">Indicadores do Mercado Livre e relatórios internos.</p>
      </header>

      {/* Reputação ML */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Reputação Mercado Livre</h2>
        {loading ? (
          <p>Carregando...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="metric-card lg:col-span-1 md:col-span-2">
              <h3 className="text-center">Nível Atual</h3>
              <p
                className={`value text-center mt-2 ${getMetricColorClass(
                  reputation?.seller_reputation?.level_id
                )}`}
              >
                {formatReputationLevel(
                  reputation?.seller_reputation?.level_id,
                  reputation?.power_seller_status
                )}
              </p>
            </div>
            <div className="metric-card">
              <h3>Reclamações</h3>
              <p className={`value ${getMetricColorClass(repMetrics?.claims?.rate)}`}>
                {formatPercentage(repMetrics?.claims?.rate)}
              </p>
              <p className="details">{repMetrics?.claims?.period}</p>
            </div>
            <div className="metric-card">
              <h3>Canceladas</h3>
              <p className={`value ${getMetricColorClass(repMetrics?.cancellations?.rate)}`}>
                {formatPercentage(repMetrics?.cancellations?.rate)}
              </p>
              <p className="details">{repMetrics?.cancellations?.period}</p>
            </div>
            <div className="metric-card">
              <h3>Atrasadas</h3>
              <p className={`value ${getMetricColorClass(repMetrics?.delayed_handling_time?.rate)}`}>
                {formatPercentage(repMetrics?.delayed_handling_time?.rate)}
              </p>
              <p className="details">{repMetrics?.delayed_handling_time?.period}</p>
            </div>
          </div>
        )}
      </div>

      {/* Resumo Financeiro */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Resumo da Conta (Saldo ML)</h2>
        {loading ? (
          <p>Carregando...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="metric-card">
              <h3 className="font-semibold text-gray-600">Saldo Total</h3>
              <p className="value text-green-600 mt-2">
                {formatCurrency(summary?.total_amount)}
              </p>
            </div>
            <div className="metric-card">
              <h3 className="font-semibold text-gray-600">Saldo Disponível</h3>
              <p className="value text-gray-800 mt-2">
                {formatCurrency(summary?.available_balance)}
              </p>
            </div>
            <div className="metric-card">
              <h3 className="font-semibold text-gray-600">A Receber</h3>
              <p className="value text-yellow-600 mt-2">
                {formatCurrency(summary?.unavailable_balance)}
              </p>
              <p className="details mt-1">
                Bloqueado: {formatCurrency(summary?.retained_balance)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Performance de Envio */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Envios Flex</h2>
          {loading ? (
            <p>Carregando...</p>
          ) : (
            <div className="metric-card">
              <h3>Semana Atual (Atrasos)</h3>
              <p className={`value ${getMetricColorClass(flex?.currentWeekRate)}`}>
                {formatPercentage(flex?.currentWeekRate)}
              </p>
            </div>
          )}
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Agências ML (Coleta)</h2>
          {loading ? (
            <p>Carregando...</p>
          ) : (
            <div className="metric-card">
              <h3>Semana Atual (Atrasos)</h3>
              <p className={`value ${getMetricColorClass(agency?.currentWeekRate)}`}>
                {formatPercentage(agency?.currentWeekRate)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Relatórios Internos */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Relatórios de Faturamento Interno</h2>
        <div className="flex gap-4 mb-4">
          <div>
            <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">
              Data Início
            </label>
            <input
              type="date"
              id="start-date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 p-2 border rounded-md"
            />
          </div>
          <div>
            <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">
              Data Fim
            </label>
            <input
              type="date"
              id="end-date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 p-2 border rounded-md"
            />
          </div>
        </div>
        <div>
          {reportLoading ? (
            <p>Carregando relatórios...</p>
          ) : (
            <pre className="bg-gray-100 p-4 rounded-md text-xs overflow-auto">
              {reportData.length > 0
                ? JSON.stringify(reportData, null, 2)
                : 'Nenhum dado encontrado para o período.'}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};
