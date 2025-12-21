import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import axios, { AxiosRequestConfig } from "axios";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { HttpsError } from "firebase-functions/v2/https";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getMeliApiAuthHeaders } from "../utils/mlApi";
import { Order, OrderStatus } from "../types/Order";

const db = admin.firestore();

const mapMlStatus = (mlStatus: string): OrderStatus => {
  switch (mlStatus) {
    case 'paid':
    case 'handling':
      return 'pending';
    case 'ready_to_ship':
      return 'ready_to_ship';
    case 'shipped':
      return 'shipped';
    case 'delivered':
      return 'delivered';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'pending';
  }
};

async function fetchAndSaveOrders(authHeaders: AxiosRequestConfig, searchParams: any) {
  let sellerId;
  try {
    const sellerResponse = await axios.get('https://api.mercadolibre.com/users/me', authHeaders);
    sellerId = sellerResponse.data.id;
  } catch (error: any) {
    functions.logger.error("syncOrders: Erro ao buscar ID do vendedor:", error.response?.data || error.message);
    throw new HttpsError('internal', 'Não foi possível obter o ID do vendedor.');
  }

  const finalParams = { seller: sellerId, sort: 'date_desc', limit: 50, ...searchParams };
  const searchUrl = `https://api.mercadolibre.com/orders/search`;
  functions.logger.info("syncOrders: Buscando pedidos com parâmetros:", finalParams);

  try {
    const ordersSearchResponse = await axios.get(searchUrl, { params: finalParams, ...authHeaders });
    const simpleOrders = ordersSearchResponse.data.results;

    if (!simpleOrders || simpleOrders.length === 0) {
      functions.logger.info("syncOrders: Nenhum pedido encontrado.", finalParams);
      return 0;
    }

    const orderDetailsPromises = simpleOrders.map(async (simpleOrder: any) => {
      try {
        const orderDetailResponse = await axios.get(`https://api.mercadolibre.com/orders/${simpleOrder.id}`, authHeaders);
        return orderDetailResponse.data;
      } catch (orderError: any) {
        functions.logger.error(`syncOrders: Erro ao buscar detalhes do pedido ${simpleOrder.id}:`, orderError.response?.data || orderError.message);
        return null;
      }
    });

    const detailedOrders = (await Promise.all(orderDetailsPromises)).filter(order => order !== null);
    functions.logger.info(`syncOrders: ${detailedOrders.length} pedidos com detalhes obtidos.`);

    const batch = db.batch();
    let savedCount = 0;
    
    for (const mlOrder of detailedOrders) {
      // O ID do documento será o ID do pedido do ML
      const orderRef = db.collection('orders').doc(String(mlOrder.id));

      // --- MAPEAMENTO PARA O NOVO SCHEMA 'orders' ---
      const newOrderData: Partial<Order> = {
        mlOrderId: String(mlOrder.id),
        status: mapMlStatus(mlOrder.status),
        customer: {
          name: `${mlOrder.buyer.first_name || ''} ${mlOrder.buyer.last_name || ''}`.trim(),
          email: mlOrder.buyer.email || 'N/A',
          phone: mlOrder.buyer.phone?.number || 'N/A',
        },
        items: mlOrder.order_items.map((item: any) => ({
          id: item.item.id,
          title: item.item.title,
          quantity: item.quantity,
          price: item.unit_price,
        })),
        shipping: {
          trackingNumber: mlOrder.shipping?.tracking_number || null,
          carrier: mlOrder.shipping?.shipping_option?.name || null,
          labelUrl: `https://api.mercadolibre.com/shipments/${mlOrder.shipping?.id}/label`
        },
        createdAt: Timestamp.fromDate(new Date(mlOrder.date_created)),
        updatedAt: FieldValue.serverTimestamp() as Timestamp,
        // blingId: // (será preenchido pela integração do Bling)
      };
      // --- FIM DO MAPEAMENTO ---

      // Usamos set com merge para criar ou atualizar o pedido
      batch.set(orderRef, newOrderData, { merge: true });
      savedCount++;
    }

    await batch.commit();
    functions.logger.info(`syncOrders: ${savedCount} pedidos salvos/atualizados na coleção 'orders'.`);
    return savedCount;

  } catch (error: any) {
    functions.logger.error("syncOrders: Erro no processo:", error.message || error);
    if (error.response) {
      functions.logger.error("syncOrders: Erro da API ML:", { status: error.response.status, data: error.response.data });
    }
    throw new HttpsError('internal', error.message || 'Erro desconhecido ao buscar e salvar pedidos.');
  }
}

export const syncMercadoLivreOrders = onSchedule("every 30 minutes", async (event) => {
  functions.logger.info("scheduled: Iniciando syncMercadoLivreOrders...");
  try {
    const authHeaders = await getMeliApiAuthHeaders();
    
    // Busca pedidos atualizados nos últimos 60 minutos
    const now = new Date();
    const dateTo = now.toISOString();
    const dateFrom = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    
    const searchParams = {
      'order.last_updated.from': dateFrom,
      'order.last_updated.to': dateTo,
    };
    
    const count = await fetchAndSaveOrders(authHeaders, searchParams);
    functions.logger.info(`scheduled: syncMercadoLivreOrders concluída. ${count} pedidos processados.`);
  } catch (error) {
    functions.logger.error("scheduled: Falha em syncMercadoLivreOrders:", error);
  }
});