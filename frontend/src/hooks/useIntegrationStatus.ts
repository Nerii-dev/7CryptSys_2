import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

interface IntegrationStatus {
  isConnected: boolean;
  loading: boolean;
  data: any | null;
}

/**
 * Hook para verificar o status de uma integração no Firestore.
 * @param integrationName O nome do documento (ex: 'mercadolivre')
 */
export const useIntegrationStatus = (integrationName: string): IntegrationStatus => {
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    const docRef = doc(db, 'integrations', integrationName);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().status === 'active') {
        setIsConnected(true);
        setData(docSnap.data());
      } else {
        setIsConnected(false);
        setData(null);
      }
      setLoading(false);
    }, (error) => {
      console.error(`Erro ao buscar status da integração ${integrationName}:`, error);
      setIsConnected(false);
      setData(null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [integrationName]);

  return { loading, isConnected, data };
};