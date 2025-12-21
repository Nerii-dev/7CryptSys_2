import React from 'react';
import { OrderStatus } from '../../types/Order';

interface StatusBadgeProps {
  status: OrderStatus;
}

const statusMap: Record<OrderStatus, { label: string; className: string }> = {
  pending: {
    label: 'Pendente',
    className: 'bg-gray-200 text-gray-800',
  },
  ready_to_ship: {
    label: 'Pronto p/ Envio',
    className: 'bg-teal-100 text-teal-800',
  },
  shipped: {
    label: 'Enviado',
    className: 'bg-blue-100 text-blue-800',
  },
  delivered: {
    label: 'Entregue',
    className: 'bg-green-100 text-green-800',
  },
  cancelled: {
    label: 'Cancelado',
    className: 'bg-red-100 text-red-800',
  },
};

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const { label, className } = statusMap[status] || statusMap.pending;

  return (
    <span
      className={`font-medium px-3 py-1 rounded-full text-xs capitalize ${className}`}
    >
      {label}
    </span>
  );
};