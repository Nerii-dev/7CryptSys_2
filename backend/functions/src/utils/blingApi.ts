import * as functions from "firebase-functions";
import axios from "axios";
import { Order } from "../types/Order";

// TODO: Armazenar a API Key de forma segura (ex: Firebase Secrets)
const BLING_API_KEY = "SUA_API_KEY_DO_BLING_AQUI";
const BLING_API_URL = "https://bling.com.br/Api/v2";

/**
 * Cliente da API Bling (Stub)
 */
const blingApi = axios.create({
  baseURL: BLING_API_URL,
  params: {
    apikey: BLING_API_KEY,
  },
});

/**
 * Atualiza o status de um pedido no Bling.
 * Esta é uma implementação de exemplo.
 * * @param order O pedido do nosso Firestore
 * @param newStatus O novo status (ex: "Pronto para Envio")
 */
export const updateOrderStatusInBling = async (order: Order, newStatus: string) : Promise<any> => {
  if (!BLING_API_KEY.startsWith("SUA_")) {
    functions.logger.info(`Chamando API Bling para Pedido ${order.mlOrderId} -> ${newStatus}`);
    
    // Constrói o payload XML ou JSON necessário para a API do Bling
    // (A API v2 do Bling usa XML para atualizar pedidos)
    const xmlPayload = `
    <pedido>
      <id>${order.blingId || order.mlOrderId}</id>
      <situacao>${mapStatusToBling(newStatus)}</situacao>
    </pedido>
    `;

    try {
      // Exemplo de chamada (pode ser /pedido/json/ ou /pedido/xml/)
      const response = await blingApi.post(`/pedido/${order.blingId || order.mlOrderId}/json`, null, {
         params: {
           xml: xmlPayload
         }
      });
      
      functions.logger.info(`Bling API: Pedido ${order.id} atualizado.`);
      return response.data;

    } catch (error: any) {
      functions.logger.error(`Bling API Erro: ${error.response?.data || error.message}`);
      throw new Error("Falha ao atualizar pedido no Bling.");
    }
  } else {
    functions.logger.warn("Bling API Key não configurada. Pulando atualização.");
    return { note: "Bling API Key não configurada." };
  }
};

/**
 * Mapeia nosso status interno para o status esperado pelo Bling.
 * (Isto é um exemplo e deve ser ajustado)
 */
const mapStatusToBling = (status: string) => {
  switch (status) {
    case 'ready_to_ship': return 'Em andamento'; // Exemplo
    case 'shipped': return 'Atendido'; // Exemplo
    default: return 'Em aberto';
  }
};