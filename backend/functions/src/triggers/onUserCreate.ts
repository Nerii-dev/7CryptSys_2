import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

const db = admin.firestore();

/**
 * Gatilho que roda automaticamente quando um usuário é criado no Authentication via Painel ou Login Social.
 * Cria o documento correspondente na coleção 'users'.
 */
export const createProfileOnAuth = functions.auth.user().onCreate(async (user) => {
  const { uid, email, displayName } = user;

  // Verifica se o documento já existe para não sobrescrever dados se foi criado manualmente
  const userRef = db.collection("users").doc(uid);
  const doc = await userRef.get();

  if (doc.exists) {
    console.log(`Perfil já existe para ${email}. Pulando criação automática.`);
    return;
  }

  // Define um perfil padrão.
  // IMPORTANTE: Defina uma role segura (ex: 'sales' ou 'pending') para não dar admin automático.
  const defaultRole = "sales"; 

  try {
    await userRef.set({
      uid: uid,
      email: email || "",
      name: displayName || "Novo Usuário",
      role: defaultRole,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      autoCreated: true // Flag para saber que foi criado pelo gatilho
    });
    
    console.log(`Perfil criado automaticamente para ${email} com role ${defaultRole}`);
  } catch (error) {
    console.error("Erro ao criar perfil automático:", error);
  }
});