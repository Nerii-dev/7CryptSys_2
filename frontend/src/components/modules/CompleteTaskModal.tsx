import React, { useState, useEffect } from 'react';
import { Task } from '../../types/Task';
import { useFirebaseStorage } from '../../hooks/useFirebaseStorage';
import { functions } from '../../services/firebase';
import { httpsCallable } from 'firebase/functions';

// --- CORREÇÃO AQUI ---
// Cloud Function atualizada com prefixo correto
const completeTask = httpsCallable(functions, 'tasks-completeTask');
// --- FIM DA CORREÇÃO ---

interface CompleteTaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskCompleted: () => void;
}

export const CompleteTaskModal = ({ task, isOpen, onClose, onTaskCompleted }: CompleteTaskModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { progress, url, error: uploadError, loading: uploading, uploadFile } = useFirebaseStorage();

  useEffect(() => {
    if (url && submitting) {
      submitCompletion(url);
    }
  }, [url, submitting]);

  if (!isOpen || !task) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    setSubmitError('');
    if (!file) {
      setSubmitError('Anexo obrigatório para concluir a tarefa.');
      return;
    }
    setSubmitting(true);
    uploadFile(file);
  };

  const submitCompletion = async (attachmentUrl: string) => {
    try {
      await completeTask({ taskId: task.id, attachmentUrl });
      onTaskCompleted();
      resetState();
      onClose();
    } catch (err: any) {
      setSubmitError(err.message || "Erro ao salvar conclusão.");
    } finally {
      setSubmitting(false);
    }
  };
  
  const resetState = () => {
    setFile(null);
    setSubmitError('');
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
        <h3 className="text-xl font-bold mb-4">Concluir Tarefa</h3>
        <p className="font-semibold">{task.title}</p>
        <p className="text-sm text-gray-600 mb-4">{task.description}</p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Anexo Obrigatório</label>
          <input type="file" onChange={handleFileChange} className="mt-1 block w-full text-sm" />
          {uploading && (
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
          )}
          {uploadError && <p className="text-red-500 text-sm mt-1">{uploadError.message}</p>}
        </div>

        {submitError && <p className="text-red-500 text-sm mt-2">{submitError}</p>}

        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={onClose}
            className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={uploading || submitting}
            className="bg-green-600 text-white py-2 px-4 rounded-lg disabled:bg-gray-400"
          >
            {submitting ? "Concluindo..." : "Concluir Tarefa"}
          </button>
        </div>
      </div>
    </div>
  );
};
