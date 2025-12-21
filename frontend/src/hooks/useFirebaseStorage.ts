import { useState } from 'react';
import { storage, auth } from '../services/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid'; // Instale uuid: npm install uuid @types/uuid

export const useFirebaseStorage = () => {
  const [progress, setProgress] = useState<number>(0);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);

  const uploadFile = (file: File) => {
    if (!file) return;

    const uid = auth.currentUser?.uid;
    if (!uid) {
      setError(new Error("Usuário não autenticado."));
      return;
    }

    setLoading(true);
    setError(null);
    setProgress(0);
    setUrl(null);

    // Caminho no Storage: attachments/{userId}/{fileId}
    const fileId = uuidv4();
    const storageRef = ref(storage, `attachments/${uid}/${fileId}-${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const prog = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        setProgress(prog);
      },
      (err) => {
        console.error("Erro no upload:", err);
        setError(err);
        setLoading(false);
      },
      async () => {
        // Sucesso
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        setUrl(downloadURL);
        setLoading(false);
      }
    );
  };

  return { progress, url, error, loading, uploadFile };
};