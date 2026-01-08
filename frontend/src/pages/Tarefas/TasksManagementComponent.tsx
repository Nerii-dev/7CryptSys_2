import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  updateDoc, 
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  CheckSquare, 
  Plus, 
  Calendar, 
  Clock, 
  Trash2, 
  CheckCircle,
  X,
  User,
  AlertTriangle,
  Inbox,
  Send
} from 'lucide-react';

// Interfaces
interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  assignedTo: string; 
  createdBy: string;
  createdAt: any;
}

interface UserOption {
  uid: string;
  name: string;
  email: string;
}

export const TasksManagementComponent = () => {
  const { userProfile, currentUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filtros
  const [viewType, setViewType] = useState<'assigned' | 'created'>('assigned');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'completed'>('pending');

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: new Date().toISOString().split('T')[0],
    assignedTo: ''
  });

  // Helper para formatar data sem conversão de fuso (CORREÇÃO DO ERRO)
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    // Divide a string "2025-12-25" em partes e remonta manualmente
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  // Carregar Usuários
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const usersList = querySnapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        })) as UserOption[];
        setUsers(usersList);
        
        if (currentUser?.email) {
            setNewTask(prev => ({ ...prev, assignedTo: currentUser.email || '' }));
        }
      } catch (error) {
        console.error("Erro ao buscar usuários:", error);
      }
    };
    fetchUsers();
  }, [currentUser]);

  // Carregar Tarefas
  useEffect(() => {
    if (!currentUser?.email) return;

    setLoading(true);
    const tasksRef = collection(db, 'tasks');
    let q;

    if (viewType === 'assigned') {
      q = query(
        tasksRef,
        where('status', '==', statusFilter),
        where('assignedTo', '==', currentUser.email), 
        orderBy('dueDate', 'asc')
      );
    } else {
      q = query(
        tasksRef,
        where('status', '==', statusFilter),
        where('createdBy', '==', currentUser.email),
        orderBy('dueDate', 'asc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
      setTasks(tasksData);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao buscar tarefas:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [viewType, statusFilter, currentUser]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.assignedTo) return alert("Selecione um responsável.");

    try {
      await addDoc(collection(db, 'tasks'), {
        ...newTask,
        status: 'pending',
        createdBy: userProfile?.email || currentUser?.email,
        createdAt: serverTimestamp()
      });
      setIsModalOpen(false);
      setNewTask({ 
        title: '', 
        description: '', 
        priority: 'medium', 
        dueDate: new Date().toISOString().split('T')[0],
        assignedTo: currentUser?.email || ''
      });
      alert("Tarefa criada com sucesso!");
    } catch (error) {
      console.error("Erro ao criar tarefa:", error);
      alert("Erro ao criar tarefa.");
    }
  };

  const toggleTaskStatus = async (task: Task) => {
    const newStatus = task.status === 'pending' ? 'completed' : 'pending';
    try {
      await updateDoc(doc(db, 'tasks', task.id), { status: newStatus });
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir?")) {
      try {
        await deleteDoc(doc(db, 'tasks', id));
      } catch (error) {
        console.error(error);
      }
    }
  };

  // Cores
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getCardStyle = (task: Task) => {
    if (task.status === 'completed') return 'bg-gray-50 border-gray-200 opacity-75';

    // Para cálculo de atraso, usamos T00:00:00 para forçar hora local e evitar problemas de fuso
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.dueDate + 'T00:00:00');
    
    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

    if (diffDays === 1) return 'bg-yellow-50 border-yellow-200 shadow-sm';
    if (diffDays >= 2) return 'bg-red-50 border-red-300 shadow-md';
    return 'bg-white border-gray-200 hover:shadow-md';
  };

  const getDelayText = (task: Task) => {
    if (task.status === 'completed') return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.dueDate + 'T00:00:00');
    
    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
        return (
            <span className="flex items-center gap-1 text-xs font-bold text-red-600 mt-2">
                <AlertTriangle className="w-3 h-3" />
                {diffDays === 1 ? '1 dia de atraso' : `${diffDays} dias de atraso`}
            </span>
        );
    }
    return null;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <CheckSquare className="w-8 h-8 text-blue-600" />
            Gestão de Tarefas
          </h1>
          <p className="text-gray-600">Central de atividades e delegação.</p>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow flex items-center gap-2 transition-transform hover:scale-105"
        >
          <Plus className="w-5 h-5" /> Nova Tarefa
        </button>
      </div>

      <div className="bg-gray-100 p-1 rounded-lg flex gap-1 mb-6 max-w-md">
        <button
            onClick={() => setViewType('assigned')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-bold transition-all ${
                viewType === 'assigned' 
                ? 'bg-white text-blue-700 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
        >
            <Inbox className="w-4 h-4" /> Minhas Tarefas
        </button>
        <button
            onClick={() => setViewType('created')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-bold transition-all ${
                viewType === 'created' 
                ? 'bg-white text-purple-700 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
        >
            <Send className="w-4 h-4" /> Criadas por Mim
        </button>
      </div>

      <div className="flex gap-4 mb-4 border-b border-gray-200">
        <button
          onClick={() => setStatusFilter('pending')}
          className={`pb-2 text-sm font-medium transition-colors border-b-2 ${
            statusFilter === 'pending' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Pendentes
        </button>
        <button
          onClick={() => setStatusFilter('completed')}
          className={`pb-2 text-sm font-medium transition-colors border-b-2 ${
            statusFilter === 'completed' 
              ? 'border-green-600 text-green-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Concluídas
        </button>
      </div>

      <div className="grid gap-4">
        {loading ? (
           <p className="text-gray-500 text-center py-8">Carregando tarefas...</p>
        ) : tasks.length === 0 ? (
           <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
             <CheckSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
             <p className="text-gray-500">
                {viewType === 'assigned' 
                    ? 'Você não tem tarefas nesta lista.' 
                    : 'Você não criou tarefas com este status.'}
             </p>
           </div>
        ) : (
          tasks.map(task => (
            <div 
                key={task.id} 
                className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${getCardStyle(task)}`}
            >
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${getPriorityBadge(task.priority)}`}>
                    {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                  </span>
                  <h3 className={`font-bold text-gray-800 ${task.status === 'completed' ? 'line-through text-gray-400' : ''}`}>
                    {task.title}
                  </h3>
                </div>
                <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                
                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                  {/* AQUI ESTÁ A CORREÇÃO: USAMOS A FUNÇÃO formatDate AO INVÉS DE Date() */}
                  <span className="flex items-center gap-1 bg-white/50 px-2 py-1 rounded">
                    <Calendar className="w-3 h-3" /> Prazo: {formatDate(task.dueDate)}
                  </span>
                  
                  {viewType === 'assigned' ? (
                      <span className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100">
                        <User className="w-3 h-3" /> Criado por: <strong>{task.createdBy}</strong>
                      </span>
                  ) : (
                      <span className="flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-1 rounded border border-purple-100">
                        <User className="w-3 h-3" /> Responsável: <strong>{task.assignedTo}</strong>
                      </span>
                  )}
                </div>

                {getDelayText(task)}
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => toggleTaskStatus(task)}
                  className={`p-2 rounded-full transition-colors ${
                    task.status === 'pending' 
                      ? 'bg-white border border-gray-200 text-gray-400 hover:bg-green-50 hover:text-green-600 hover:border-green-200' 
                      : 'bg-green-100 text-green-600 hover:bg-gray-100 hover:text-gray-500'
                  }`}
                  title={task.status === 'pending' ? "Concluir" : "Reabrir"}
                >
                  <CheckCircle className="w-6 h-6" />
                </button>
                <button 
                  onClick={() => handleDeleteTask(task.id)}
                  className="p-2 rounded-full bg-white border border-gray-200 text-red-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h2 className="text-xl font-bold text-gray-800 mb-4">Atribuir Tarefa</h2>
            
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <input 
                  type="text" 
                  required
                  value={newTask.title}
                  onChange={e => setNewTask({...newTask, title: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Contar estoque..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Atribuir Para</label>
                <select 
                  required
                  value={newTask.assignedTo}
                  onChange={e => setNewTask({...newTask, assignedTo: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>Selecione um usuário...</option>
                  {users.map(user => (
                    <option key={user.uid} value={user.email}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Limite</label>
                  <input 
                    type="date" 
                    required
                    value={newTask.dueDate}
                    onChange={e => setNewTask({...newTask, dueDate: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                  <select 
                    value={newTask.priority}
                    onChange={e => setNewTask({...newTask, priority: e.target.value as any})}
                    className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea 
                  value={newTask.description}
                  onChange={e => setNewTask({...newTask, description: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="Detalhes..."
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow mt-2"
              >
                Confirmar Tarefa
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};