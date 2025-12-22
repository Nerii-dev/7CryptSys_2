import * as dotenv from 'dotenv';
dotenv.config();

import * as admin from "firebase-admin";
import { setGlobalOptions } from "firebase-functions/v2";

admin.initializeApp();

setGlobalOptions({
  region: "us-central1"
});

// Exporta as funções
export * as auth from "./api/auth";
export * as ml from "./api/mercadolivre";
export * as bling from "./api/bling";
export * as tasks from "./api/tasks";
export * as ship from "./api/shipping";
export * from "./triggers/onOrderUpdate";
// ADICIONE ESTA LINHA:
export * from "./triggers/onUserCreate"; 

export * from "./scheduled/syncOrders";
export * from "./scheduled/taskScheduler";
export * from "./scheduled/generateDailyMetrics";