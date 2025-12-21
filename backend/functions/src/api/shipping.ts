import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";

const db = admin.firestore();

/**
 * Processa um código de barras escaneado, encontra o pedido correspondente
 * e atualiza seu status para 'ready_to_ship'.
 * Migra a lógica de 'findOrderDocument' de js/bipagem_pedidos.js
 */
export const processShipmentScan = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Você precisa estar autenticado.");
  }
  
  const { scannedValue } = request.data;
  if (!scannedValue) {
    throw new HttpsError("invalid-argument", "Nenhum valor escaneado recebido.");
  }

  const userEmail = request.auth.token.email || request.auth.uid;
  let orderRef: admin.firestore.DocumentReference | null = null;
  let orderData: admin.firestore.DocumentData | null = null;

  try {
    // Tentativa 1: Buscar como ID do Documento na coleção 'orders'
    const docRef = db.collection("orders").doc(scannedValue);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      orderRef = docRef;
      orderData = docSnap.data() ?? null;
      functions.logger.info(`Scan: Pedido ${docSnap.id} encontrado por ID de Documento.`);
    }

    // Tentativa 2: Buscar por 'mlOrderId' (substituindo a busca antiga por shipping.id)
    if (!orderRef) {
      const querySnap = await db.collection("orders")
        .where("mlOrderId", "==", scannedValue)
        .limit(1).get();
      if (!querySnap.empty) {
        orderRef = querySnap.docs[0].ref;
        orderData = querySnap.docs[0].data();
        functions.logger.info(`Scan: Pedido ${orderRef.id} encontrado por mlOrderId.`);
      }
    }
    
    // Tentativa 3: Buscar por 'shipping.trackingNumber' (lógica robusta adicional)
     if (!orderRef) {
      const trackingQuery = await db.collection("orders")
        .where("shipping.trackingNumber", "==", scannedValue)
        .limit(1).get();
      if (!trackingQuery.empty) {
        orderRef = trackingQuery.docs[0].ref;
        orderData = trackingQuery.docs[0].data();
        functions.logger.info(`Scan: Pedido ${orderRef.id} encontrado por Tracking Number.`);
      }
    }

    // Verifica se o pedido foi encontrado
    if (!orderRef || !orderData) {
      throw new HttpsError("not-found", `ERRO: Código ${scannedValue} não encontrado.`);
    }

    // Validações de status
    if (orderData.status === "ready_to_ship") {
      return { success: true, message: `AVISO: Pedido ${orderRef.id} já estava Pronto para Envio.` };
    }
    if (["shipped", "delivered", "cancelled"].includes(orderData.status)) {
      return { success: false, message: `ERRO: Pedido ${orderRef.id} já foi ${orderData.status}.` };
    }

    // Atualiza o status do pedido
    await orderRef.update({
      status: "ready_to_ship",
      updatedAt: FieldValue.serverTimestamp(),
      lastScan: {
        scannedBy: userEmail,
        scannedAt: FieldValue.serverTimestamp(),
        value: scannedValue,
      }
    });

    return { success: true, message: `OK: Pedido ${orderRef.id} marcado como Pronto para Envio.` };

  } catch (error: any) {
    functions.logger.error("Erro ao processar scan:", error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", "Erro interno ao processar o scan.");
  }
});