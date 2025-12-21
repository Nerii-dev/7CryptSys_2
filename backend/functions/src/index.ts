import * as dotenv from 'dotenv';
dotenv.config(); // Carrega as variáveis do .env para process.env

import * as admin from "firebase-admin";
import { setGlobalOptions } from "firebase-functions/v2";

admin.initializeApp();

// Configuração global SEM o cors
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
export * from "./scheduled/syncOrders";
export * from "./scheduled/taskScheduler";
export * from "./scheduled/generateDailyMetrics";