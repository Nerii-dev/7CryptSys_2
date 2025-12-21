import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { Query, onSnapshot, DocumentData, QuerySnapshot } from 'firebase/firestore';

interface QueryState<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
}

/**
 * Hook customizado para buscar dados de uma coleção do Firestore em tempo real.
 * @param query A consulta do Firestore (ex: collection(db, 'orders'))
 * @returns {QueryState<T>} Um objeto contendo os dados, o estado de carregamento e erros.
 */
export const useFirestoreQuery = <T>(query: Query): QueryState<T> => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);

    const unsubscribe = onSnapshot(
      query,
      (querySnapshot: QuerySnapshot<DocumentData>) => {
        const docs: T[] = [];
        querySnapshot.forEach((doc) => {
          docs.push({ id: doc.id, ...doc.data() } as T);
        });
        setData(docs);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Erro no hook useFirestoreQuery:", err);
        setError(err);
        setLoading(false);
      }
    );

    // Limpa a inscrição ao desmontar o componente
    return () => unsubscribe();
  }, [query]); // Reexecuta o efeito se a consulta mudar

  return { data, loading, error };
};