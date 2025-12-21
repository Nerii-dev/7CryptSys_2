import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { onSchedule, ScheduledEvent } from "firebase-functions/v2/scheduler";
import { Timestamp } from "firebase-admin/firestore";

const db = admin.firestore();

export const handleTaskRollover = onSchedule(
  { schedule: "every 1 hours" },
  async (event: ScheduledEvent) => {
    functions.logger.info("Executando handleTaskRollover...");

    const now = Timestamp.now();

    const overdueTasksQuery = db
      .collection("tasks")
      .where("status", "==", "pending")
      .where("dueDate", "<", now);

    const snapshot = await overdueTasksQuery.get();

    if (snapshot.empty) {
      functions.logger.info("Nenhuma tarefa pendente para marcar como atrasada.");
      return;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      functions.logger.info(`Marcando tarefa ${doc.id} como 'overdue'.`);
      batch.update(doc.ref, { status: "overdue" });
    });

    await batch.commit();
    functions.logger.info(`Rollover concluído. ${snapshot.size} tarefas atualizadas.`);
    return;
  }
);