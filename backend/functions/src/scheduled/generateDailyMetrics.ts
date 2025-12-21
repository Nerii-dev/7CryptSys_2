import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { onSchedule, ScheduledEvent } from "firebase-functions/v2/scheduler";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { format } from 'date-fns-tz';

const db = admin.firestore();

export const generateDailyMetrics = onSchedule("every day 01:00", async (event: ScheduledEvent) => {
  functions.logger.info("Executando generateDailyMetrics...");

  const now = new Date();
  const yesterday = new Date(now.setDate(now.getDate() - 1));
  const dateKey = format(yesterday, 'yyyy-MM-dd', { timeZone: 'America/Sao_Paulo' });

  // Define o intervalo de 24h do dia anterior
  const startOfDay = new Date(yesterday.setHours(0, 0, 0, 0));
  const endOfDay = new Date(yesterday.setHours(23, 59, 59, 999));

  const startTimestamp = Timestamp.fromDate(startOfDay);
  const endTimestamp = Timestamp.fromDate(endOfDay);

  try {
    const ordersQuery = db.collection("orders")
      .where("createdAt", ">=", startTimestamp)
      .where("createdAt", "<=", endTimestamp)
      .where("status", "in", ["ready_to_ship", "shipped", "delivered"]); // Apenas pedidos concluídos

    const snapshot = await ordersQuery.get();

    if (snapshot.empty) {
      functions.logger.info(`Nenhum pedido concluído encontrado para ${dateKey}.`);
      return;
    }

    let totalSales = 0;
    const totalOrders = snapshot.size;
    const byCategory: Record<string, number> = {};

    snapshot.docs.forEach(doc => {
      const order = doc.data();
      let orderTotal = 0;
      
      order.items.forEach((item: any) => {
        orderTotal += (item.price * item.quantity);
        // Accumulate sales by category
        const category = item.category || 'uncategorized';
        byCategory[category] = (byCategory[category] || 0) + (item.price * item.quantity);
      });
      totalSales += orderTotal;
    });

    const averageTicket = totalOrders > 0 ? totalSales / totalOrders : 0;
    const conversionRate = 0;

    const metricsRef = db.collection("metrics").doc(dateKey);
    await metricsRef.set({
      date: startTimestamp,
      totalSales,
      totalOrders,
      averageTicket,
      conversionRate,
      byCategory,
      updatedAt: FieldValue.serverTimestamp(),
    });

    functions.logger.info(`Métricas de ${dateKey} salvas com sucesso.`);
    return;

  } catch (error) {
    functions.logger.error("Falha ao gerar métricas diárias:", error);
    return;
  }
});