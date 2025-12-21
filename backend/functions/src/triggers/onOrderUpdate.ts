import * as functions from "firebase-functions";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { Order } from "../types/Order";
import { updateOrderStatusInBling } from "../utils/blingApi";

/**
 * [Função 3 do Prompt]
 * Gatilho do Firestore que executa quando um pedido é atualizado.
 * Se o status mudou, chama a API do Bling.
 */
export const onOrderUpdate = onDocumentUpdated("orders/{orderId}", async (event) => {
  if (!event.data) {
    return;
  }

  const before = event.data.before.data() as Order;
  const after = event.data.after.data() as Order;

  // Verifica se o status mudou
  if (before.status !== after.status) {
    functions.logger.info(`Status do pedido ${event.params.orderId} mudou de ${before.status} para ${after.status}.`);
    
    // Não chama o Bling se o pedido foi apenas criado (pending)
    if (before.status === "pending" && (after.status === "ready_to_ship" || after.status === "shipped")) {
      try {
        await updateOrderStatusInBling(after, after.status);
        functions.logger.info(`Gatilho: Atualização do Bling para ${event.params.orderId} concluída.`);
      } catch (error) {
        functions.logger.error(`Gatilho: Falha ao atualizar Bling para ${event.params.orderId}:`, error);
        // Podemos registrar a falha no próprio documento do pedido para retentativa
        await event.data.after.ref.set({ 
          blingSyncError: (error as Error).message 
        }, { merge: true });
      }
    }
  }
  
  return null;
});