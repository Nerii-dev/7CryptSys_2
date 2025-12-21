import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";

const db = admin.firestore();

/**
 * Cria um novo usuário (Auth) e seu perfil (Firestore).
 * Apenas usuários com role 'admin' podem chamar esta função.
 */
export const createNewUser = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Você precisa estar autenticado.");
  }

  // Verifica se o chamador é um administrador
  const adminUserDoc = await db.collection("users").doc(request.auth.uid).get();
  if (!adminUserDoc.exists || adminUserDoc.data()?.role !== "admin") {
    functions.logger.warn(`Tentativa de criação de usuário por não-admin: ${request.auth.uid}`);
    throw new HttpsError("permission-denied", "Apenas administradores podem criar usuários.");
  }

  const { name, email, password, role } = request.data;

  // Validação de dados (baseada no prompt)
  const validRoles = ["admin", "sales", "shipping", "metrics"];
  if (!name || !email || !password || !role || password.length < 6 || !validRoles.includes(role)) {
    throw new HttpsError("invalid-argument", "Dados incompletos ou inválidos.");
  }

  try {
    // Cria o usuário no Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    // Cria o perfil do usuário no Firestore
    await db.collection("users").doc(userRecord.uid).set({
      uid: userRecord.uid,
      name,
      email,
      role, // Armazena a role (setor)
      createdAt: FieldValue.serverTimestamp(),
    });

    functions.logger.info(`Usuário ${email} (UID: ${userRecord.uid}) criado com a role: ${role}.`);
    return { result: `Usuário ${email} criado com sucesso.`, userId: userRecord.uid };
  } catch (error: any) {
    functions.logger.error("Erro ao criar usuário:", error);
    if (error.code === "auth/email-already-exists") {
      throw new HttpsError("already-exists", "Este email já está em uso.");
    }
    throw new HttpsError("internal", "Erro inesperado ao criar usuário.");
  }
});