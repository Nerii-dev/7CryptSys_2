import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { Task } from "../types/Task";

const db = admin.firestore();

const isAdmin = async (uid: string): Promise<boolean> => {
  const userDoc = await db.collection("users").doc(uid).get();
  return userDoc.exists && userDoc.data()?.role === "admin";
};

export const createTask = onCall({ cors: true }, async (request) => {
  if (!request.auth || !(await isAdmin(request.auth.uid))) {
    throw new HttpsError("permission-denied", "Apenas administradores podem criar tarefas.");
  }

  const data = request.data as Omit<Task, 'id' | 'status' | 'createdAt'>;

  if (!data.title || !data.type || !data.assignedTo || !data.dueDate) {
    throw new HttpsError("invalid-argument", "Dados da tarefa incompletos.");
  }

  const newTask: Omit<Task, 'id'> = {
    ...data,
    status: "pending",
    createdAt: FieldValue.serverTimestamp() as Timestamp,
    dueDate: Timestamp.fromDate(new Date(data.dueDate as any)),
  };

  const taskRef = await db.collection("tasks").add(newTask);
  return { result: "Tarefa criada com sucesso.", taskId: taskRef.id };
});

export const completeTask = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Você precisa estar autenticado.");
  }

  const { taskId, attachmentUrl } = request.data;
  if (!taskId || !attachmentUrl) {
    throw new HttpsError("invalid-argument", "ID da tarefa e URL do anexo são obrigatórios.");
  }

  const taskRef = db.collection("tasks").doc(taskId);
  const taskDoc = await taskRef.get();

  if (!taskDoc.exists) {
    throw new HttpsError("not-found", "Tarefa não encontrada.");
  }

  const task = taskDoc.data() as Task;
  const isAdminUser = await isAdmin(request.auth.uid);

  if (!isAdminUser && !task.assignedTo.includes(request.auth.uid)) {
    throw new HttpsError("permission-denied", "Você não tem permissão para completar esta tarefa.");
  }

  await taskRef.update({
    status: "completed",
    completedAt: FieldValue.serverTimestamp(),
    completedBy: request.auth.uid,
    attachmentUrl: attachmentUrl,
  });

  return { result: "Tarefa concluída com sucesso." };
});

export const verifyTask = onCall({ cors: true }, async (request) => {
  if (!request.auth || !(await isAdmin(request.auth.uid))) {
    throw new HttpsError("permission-denied", "Apenas administradores podem verificar tarefas.");
  }

  const { taskId } = request.data;
  if (!taskId) {
    throw new HttpsError("invalid-argument", "ID da tarefa é obrigatório.");
  }

  const taskRef = db.collection("tasks").doc(taskId);
  await taskRef.update({
    verifiedAt: FieldValue.serverTimestamp(),
    verifiedBy: request.auth.uid,
  });

  return { result: "Tarefa verificada." };
});