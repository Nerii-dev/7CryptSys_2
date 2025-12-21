import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';

export const useTaskAlerts = () => {
  const { currentUser } = useAuth();
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    if (!currentUser) return;

    // Busca tarefas atribuídas ao usuário que estão pendentes ou atrasadas
    const q = query(
      collection(db, 'tasks'),
      where('assignedTo', 'array-contains', currentUser.uid),
      where('status', 'in', ['pending', 'overdue'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        // Filtra logicamente se necessário (ex: data vencida hoje ou antes)
        // Aqui contamos todas as não concluídas
        setAlertCount(snapshot.size);
    });

    return () => unsubscribe();
  }, [currentUser]);

  return { alertCount };
};