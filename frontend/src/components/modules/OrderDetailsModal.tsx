import React, { useState } from 'react';
import { Order, OrderStatus } from '../../types/Order';
import { StatusBadge } from '../common/StatusBadge';
import { format } from 'date-fns';

// --- Imports combinados ---
import { functions, db } from '../../services/firebase';
import { httpsCallable } from 'firebase/functions';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

// --- Função Firebase Cloud Function ---
const updateOrderStatus = httpsCallable(functions, 'updateOrderStatus');

interface OrderDetailsModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onOrderUpdate: () => void;
}

const statusOptions: { value: OrderStatus; label: string }[] = [
  { value: 'pending', label: 'Pendente' },
  { value: 'ready_to_ship', label: 'Pronto para Envio' },
  { value: 'shipped', label: 'Enviado' },
  { value: 'delivered', label: 'Entregue' },
  { value: 'cancelled', label: 'Cancelado' },
];

export const OrderDetailsModal = ({ order, isOpen, onClose, onOrderUpdate }: OrderDetailsModalProps) => {
  const [newStatus, setNewStatus] = useState<OrderStatus>('pending');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !order) return null;

  // Define o status atual quando o modal abre
  React.useEffect(() => {
    if (order) {
      setNewStatus(order.status);
    }
  }, [order]);

  // --- Atualização com fallback: Cloud Function → Firestore ---
  const handleStatusUpdate = async () => {
    if (newStatus === order.status || !order.id) return;
    setLoading(true);
    setError('');

    try {
      try {
        // 1️⃣ Tenta usar a Cloud Function (backend centralizado)
        await updateOrderStatus({ orderId: order.id, newStatus });
        console.log('Status atualizado via Cloud Function.');
      } catch (functionError) {
        console.warn('Cloud Function falhou, aplicando fallback local:', functionError);

        // 2️⃣ Fallback: atualiza diretamente no Firestore
        const orderRef = doc(db, 'orders', order.id);
        await updateDoc(orderRef, {
          status: newStatus,
          updatedAt: serverTimestamp(),
        });
        console.log('Status atualizado diretamente no Firestore.');
      }

      onOrderUpdate(); // Atualiza lista principal
      onClose();
    } catch (err: any) {
      console.error('Erro ao atualizar status:', err);
      setError(err.message || 'Falha ao atualizar status.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const totalValue = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h3 className="text-xl font-bold">Detalhes do Pedido</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">&times;</button>
        </div>

        {/* Detalhes do Pedido */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div><strong>Cliente:</strong> {order.customer.name}</div>
          <div><strong>Email:</strong> {order.customer.email}</div>
          <div><strong>ML Order ID:</strong> <span className="font-mono">{order.mlOrderId}</span></div>
          <div><strong>Criado em:</strong> {format(order.createdAt.toDate(), 'dd/MM/yyyy HH:mm')}</div>
          <div><strong>Valor Total:</strong> <span className="font-bold">{formatCurrency(totalValue)}</span></div>
          <div><strong>Status Atual:</strong> <StatusBadge status={order.status} /></div>
        </div>

        {/* Itens do Pedido */}
        <div className="mb-4">
          <h4 className="font-bold mb-2">Itens:</h4>
          <div className="max-h-40 overflow-y-auto border rounded-md p-2 bg-gray-50">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between border-b last:border-b-0 py-1">
                <span>{item.quantity}x {item.title}</span>
                <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Histórico e Ações */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <h4 className="font-bold mb-2">Histórico:</h4>
            <p className="text-sm text-gray-500 italic">(Implementação do histórico pendente)</p>
          </div>
          <div>
            <label htmlFor="status-select" className="block text-sm font-medium text-gray-700">Alterar Status</label>
            <select
              id="status-select"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

        {/* Botões de Ação */}
        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={onClose}
            className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 font-semibold"
          >
            Fechar
          </button>
          <button
            onClick={handleStatusUpdate}
            disabled={loading || newStatus === order.status}
            className="bg-blue-600 text-white py-2 px-4 rounded-lg shadow hover:bg-blue-700 font-semibold disabled:bg-gray-400"
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
};
