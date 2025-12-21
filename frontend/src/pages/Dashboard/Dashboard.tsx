import { useAuth } from '../../contexts/AuthContext';
import { useFirestoreQuery } from '../../hooks/useFirestoreQuery';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Order } from '../../types/Order';
import { Task } from '../../types/Task';
import { StatCard, IconPlaceholder } from '../../components/common/StatCard';
import { SalesChart } from '../../components/modules/SalesChart';
import { format } from 'date-fns';

export const Dashboard = () => {
  const { userProfile, currentUser } = useAuth();

  // 1. Busca Tarefas pendentes atribuídas ao usuário logado
  const tasksQuery = query(
    collection(db, 'tasks'),
    where('status', 'in', ['pending', 'overdue']),
    where('assignedTo', 'array-contains', currentUser?.uid || '')
  );
  const { data: pendingTasks, loading: loadingTasks } = useFirestoreQuery<Task>(tasksQuery);

  // 2. Busca Vendas dos últimos 7 dias para o gráfico e KPIs
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const startTimestamp = Timestamp.fromDate(sevenDaysAgo);

  const ordersQuery = query(
    collection(db, 'orders'),
    where('status', '!=', 'cancelled'),
    where('createdAt', '>=', startTimestamp)
  );
  const { data: recentOrders, loading: loadingOrders } = useFirestoreQuery<Order>(ordersQuery);

  // 3. Calcula KPIs
  const totalSales = recentOrders.reduce((sum, order) => {
    return sum + order.items.reduce((itemSum, item) => itemSum + item.price * item.quantity, 0);
  }, 0);
  
  const totalOrders = recentOrders.length;
  const averageTicket = totalOrders > 0 ? totalSales / totalOrders : 0;

  // Formata os valores
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div>
      {/* Cabeçalho */}
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800">
          Olá, {userProfile?.name.split(' ')[0] || 'Usuário'}!
        </h1>
        <p className="text-gray-600 mt-2">
          Aqui está um resumo das suas atividades e performance.
        </p>
      </header>

      {/* Cards de Resumo (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Tarefas Pendentes"
          value={pendingTasks.length}
          loading={loadingTasks}
          icon={<IconPlaceholder />}
        />
        <StatCard
          title="Vendas (Últimos 7d)"
          value={formatCurrency(totalSales)}
          loading={loadingOrders}
          icon={<IconPlaceholder />}
        />
        <StatCard
          title="Ticket Médio (Últimos 7d)"
          value={formatCurrency(averageTicket)}
          loading={loadingOrders}
          icon={<IconPlaceholder />}
        />
      </div>

      {/* Gráfico e Lista de Tarefas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gráfico de Performance */}
        <div className="lg:col-span-2">
          <SalesChart orders={recentOrders} loading={loadingOrders} />
        </div>

        {/* Lista de Tarefas Pendentes */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Suas Tarefas Pendentes</h3>
          {loadingTasks ? (
            <p className="text-gray-500">Carregando tarefas...</p>
          ) : pendingTasks.length === 0 ? (
            <p className="text-gray-500">Nenhuma tarefa pendente. Bom trabalho!</p>
          ) : (
            <div className="space-y-4">
              {pendingTasks.map((task) => (
                <div key={task.id} className="border-b pb-2">
                  <p className="font-semibold text-gray-700">{task.title}</p>
                  <p className="text-sm text-gray-500">
                    Vencimento: {format(task.dueDate.toDate(), 'dd/MM/yyyy')}
                    {task.status === 'overdue' && <span className="text-red-500 font-bold ml-2">(Atrasado)</span>}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};