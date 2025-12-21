import React, { useState, useMemo } from 'react';
import { collection, query, where, orderBy, Timestamp, Query } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useFirestoreQuery } from '../../hooks/useFirestoreQuery';
import { Order, OrderStatus } from '../../types/Order';
import { StatusBadge } from '../../components/common/StatusBadge';
import { OrderDetailsModal } from '../../components/modules/OrderDetailsModal';
import { format } from 'date-fns';

type StatusFilter = OrderStatus | 'all';

export const SalesManagementComponent = () => {
  // --- Estados de Filtro ---
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7); // Padrão 7 dias atrás
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  // --- Estados do Modal ---
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- Lógica de Query ---
  const ordersQuery = useMemo(() => {
    let q: Query = query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc')
    );

    // Filtro de Status 
    if (statusFilter !== 'all') {
      q = query(q, where('status', '==', statusFilter));
    }

    // Filtro de Data 
    try {
      const start = Timestamp.fromDate(new Date(startDate + 'T00:00:00'));
      const end = Timestamp.fromDate(new Date(endDate + 'T23:59:59'));
      q = query(q, where('createdAt', '>=', start), where('createdAt', '<=', end));
    } catch (e) {
      console.error("Data inválida:", e);
    }
    
    return q;
  }, [statusFilter, startDate, endDate]);

  const { data: orders, loading } = useFirestoreQuery<Order>(ordersQuery);

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };
  
  const handleOrderUpdate = () => {
    // A query será re-executada automaticamente pelo onSnapshot
    // Mas podemos fechar o modal
    handleModalClose();
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div>
      <OrderDetailsModal 
        order={selectedOrder}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onOrderUpdate={handleOrderUpdate}
      />
    
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Gestão de Vendas</h1>
        <p className="text-gray-600 mt-2">Filtre e gerencie todos os pedidos do sistema.</p>
      </header>

      {/* Painel de Filtros  */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">Data Início</label>
            <input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
          </div>
          <div>
            <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">Data Fim</label>
            <input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
          </div>
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700">Status</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as StatusFilter)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
            >
              <option value="all">Todos</option>
              <option value="pending">Pendente</option>
              <option value="ready_to_ship">Pronto p/ Envio</option>
              <option value="shipped">Enviado</option>
              <option value="delivered">Entregue</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabela de Pedidos */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="border-b-2 border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Data</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Cliente</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">ML Order ID</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-600">Status</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600">Valor</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="text-center py-10 text-gray-500">Carregando pedidos...</td></tr>
              )}
              {!loading && orders.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-gray-500">Nenhum pedido encontrado com estes filtros.</td></tr>
              )}
              {!loading && orders.map(order => (
                <tr key={order.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm">{format(order.createdAt.toDate(), 'dd/MM/yy')}</td>
                  <td className="py-3 px-4">{order.customer.name || 'N/A'}</td>
                  <td className="py-3 px-4 font-mono text-xs">{order.mlOrderId}</td>
                  <td className="py-3 px-4 text-center"><StatusBadge status={order.status} /></td>
                  <td className="py-3 px-4 text-right font-medium">
                    {formatCurrency(order.items.reduce((sum, i) => sum + i.price * i.quantity, 0))}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleSelectOrder(order)}
                      className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
                    >
                      Detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};