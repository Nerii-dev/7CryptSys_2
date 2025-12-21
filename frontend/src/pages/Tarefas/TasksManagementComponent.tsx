import { useState, useMemo } from 'react';
import { collection, query, where, orderBy, Query } from 'firebase/firestore';
import { db, functions } from '../../services/firebase';
import { httpsCallable } from 'firebase/functions';
import { useAuth } from '../../contexts/AuthContext';
import { useFirestoreQuery } from '../../hooks/useFirestoreQuery';
import { Task, TaskStatus } from '../../types/Task';
import { format } from 'date-fns';
import { CompleteTaskModal } from '../../components/modules/CompleteTaskModal';
// Importaremos o CreateTaskModal quando ele for criado
// import { CreateTaskModal } from '../../components/modules/CreateTaskModal';

const verifyTask = httpsCallable(functions, 'verifyTask');

const TaskItem = ({ task, isAdmin, onSelectTask, onVerifyTask }: any) => {
  const { status, title, dueDate, attachmentUrl, verifiedBy } = task;

  const getStatusClasses = (status: TaskStatus) => {
    if (status === 'completed') return 'border-green-500 bg-green-50';
    if (status === 'overdue') return 'border-red-500 bg-red-50';
    return 'border-gray-300';
  };

  const handleVerify = async () => {
    if (!confirm("Verificar este anexo?")) return;
    await onVerifyTask(task.id);
  };

  return (
    <li className={`p-4 border-l-4 rounded-md shadow-sm bg-white ${getStatusClasses(status)}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="font-bold text-gray-800">{title}</p>
          <p className="text-sm text-gray-500">Vencimento: {format(dueDate.toDate(), 'dd/MM/yyyy')}</p>
          {status === 'overdue' && <span className="text-red-600 font-bold text-sm">ATRASADO</span>}
        </div>
        <div>
          {(status === 'pending' || status === 'overdue') ? (
            <button onClick={() => onSelectTask(task)} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Completar</button>
          ) : (
            <span className="text-green-700 font-semibold text-sm">Concluído</span>
          )}
        </div>
      </div>
      {status === 'completed' && (
        <div className="mt-4 pt-4 border-t">
          {attachmentUrl && <a href={attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline">Ver Anexo</a>}
          {isAdmin && !verifiedBy && (
            <button onClick={handleVerify} className="ml-4 bg-yellow-500 text-white px-3 py-1 rounded text-sm">Verificar</button>
          )}
          {verifiedBy && <p className="text-xs text-green-700 mt-1">Verificado por Admin</p>}
        </div>
      )}
    </li>
  );
};


// Componente Principal da Página
export const TasksManagementComponent = () => {
  const { currentUser, userProfile } = useAuth();
  const [filter, setFilter] = useState<TaskStatus | 'all'>('pending');
  
  // Modal de "Completar Tarefa"
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  
  // Modal de "Criar Tarefa" (para Admin)
  // const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const isAdmin = userProfile?.role === 'admin';

  // Define a query do Firestore
  const tasksQuery = useMemo(() => {
    let q: Query = collection(db, 'tasks');
    
    // Admin vê todas, usuário normal vê apenas as suas [cite: 13]
    if (!isAdmin) {
      q = query(q, where('assignedTo', 'array-contains', currentUser?.uid || ''));
    }
    
    // Filtro de Status
    if (filter !== 'all') {
      q = query(q, where('status', '==', filter));
    }
    
    q = query(q, orderBy('dueDate', 'asc'));
    return q;
  }, [currentUser, isAdmin, filter]);

  const { data: tasks = [], loading, error } = useFirestoreQuery<Task>(tasksQuery);

  const handleVerifyTask = async (taskId: string) => {
    try {
      await verifyTask({ taskId });
      // A lista será atualizada pelo snapshot
    } catch (err) {
      console.error("Erro ao verificar tarefa:", err);
      alert("Erro ao verificar tarefa.");
    }
  };

  const handleOpenCompleteModal = (task: Task) => {
    setSelectedTask(task);
    setIsCompleteModalOpen(true);
  };

  return (
    <div>
      <CompleteTaskModal 
        task={selectedTask}
        isOpen={isCompleteModalOpen}
        onClose={() => setIsCompleteModalOpen(false)}
        onTaskCompleted={() => { /* Snapshot atualiza */ }}
      />
      
      {/* TODO: Adicionar o CreateTaskModal aqui */}
      {/* <CreateTaskModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} /> */}

      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-800">Gestão de Tarefas</h1>
          <p className="text-gray-600 mt-2">Acompanhe e conclua suas tarefas pendentes.</p>
        </div>
        {isAdmin && (
          <button 
            className="bg-blue-600 text-white py-2 px-4 rounded-lg shadow disabled:bg-gray-400"
            disabled // Habilitar quando o CreateTaskModal for feito
          >
            + Criar Tarefa
          </button>
        )}
      </header>

      {/* Filtros */}
      <div className="mb-4">
        <select
          onChange={(e) => setFilter(e.target.value as any)}
          value={filter}
          className="p-2 border rounded-md"
        >
          <option value="pending">Pendentes</option>
          <option value="overdue">Atrasadas</option>
          <option value="completed">Concluídas</option>
          <option value="all">Todas</option>
        </select>
      </div>

      {/* Lista de Tarefas */}
      <div className="space-y-4">
        {loading && <p>Carregando tarefas...</p>}
        {error && <p className="text-red-500">Erro ao carregar tarefas: {error.message}</p>}
        {!loading && tasks.length === 0 && (
          <p className="text-gray-500">Nenhuma tarefa encontrada com este filtro.</p>
        )}
        {!loading && tasks.map(task => (
          <TaskItem 
            key={task.id}
            task={task}
            isAdmin={isAdmin}
            onSelectTask={handleOpenCompleteModal}
            onVerifyTask={handleVerifyTask}
          />
        ))}
      </div>
    </div>
  );
};