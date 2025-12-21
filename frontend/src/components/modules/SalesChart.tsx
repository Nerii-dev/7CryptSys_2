import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Order } from '../../types/Order';
import { format } from 'date-fns';

// Registra os componentes necessários do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface SalesChartProps {
  orders: Order[];
  loading: boolean;
}

export const SalesChart = ({ orders, loading }: SalesChartProps) => {
  if (loading) {
    return <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 h-96 flex items-center justify-center text-gray-500">Carregando gráfico...</div>;
  }

  // Processa os dados dos pedidos para o gráfico
  const salesByDate = orders.reduce((acc, order) => {
    const date = format(order.createdAt.toDate(), 'dd/MM');
    const total = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    
    if (!acc[date]) {
      acc[date] = 0;
    }
    acc[date] += total;
    return acc;
  }, {} as Record<string, number>);

  const chartData = {
    labels: Object.keys(salesByDate),
    datasets: [
      {
        label: 'Faturamento Diário',
        data: Object.values(salesByDate),
        fill: false,
        backgroundColor: 'rgb(59, 130, 246)',
        borderColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Performance de Vendas (Últimos Pedidos)',
      },
    },
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 h-96">
      <Line options={options} data={chartData} />
    </div>
  );
};