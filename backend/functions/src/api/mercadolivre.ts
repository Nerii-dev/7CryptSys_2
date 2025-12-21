import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import axios from "axios";
import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { getMeliApiAuthHeaders } from "../utils/mlApi"; // Importa o helper de autenticação

const db = admin.firestore();

// Carrega as variáveis de ambiente CORRETAMENTE
const MERCADOLIVRE_CLIENT_ID = process.env.MERCADOLIVRE_CLIENT_ID;
const MERCADOLIVRE_CLIENT_SECRET = process.env.MERCADOLIVRE_CLIENT_SECRET;
const MERCADOLIVRE_REDIRECT_URI = process.env.MERCADOLIVRE_REDIRECT_URI;
// URL do frontend (use uma variável de ambiente em produção)
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

/**
 * Retorna a URL de autorização do Mercado Livre.
 */
export const getMercadoLivreAuthUrl = onCall({ cors: true }, (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Você precisa estar autenticado.");
  }
  
  if (!MERCADOLIVRE_CLIENT_ID || !MERCADOLIVRE_REDIRECT_URI) {
    functions.logger.error("getMercadoLivreAuthUrl: CLIENT_ID ou REDIRECT_URI não definidos.");
    throw new HttpsError("internal", "Configuração do servidor incompleta.");
  }
  const scopes = "read write offline_access read_finance read_reputation";
  const authUrl = `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${MERCADOLIVRE_CLIENT_ID}&redirect_uri=${MERCADOLIVRE_REDIRECT_URI}&scope=${scopes}`;
  return { authUrl };
});

/**
 * Callback de autenticação do Mercado Livre.
 */
export const mercadoLivreAuthCallback = onRequest(async (req, res) => {
  const { code, error, error_description } = req.query;

  if (error) {
    functions.logger.error("Callback ML Erro:", { error, error_description });
    res.redirect(`${FRONTEND_URL}/settings?status=ml-error`); // Redireciona para o frontend React
    return;
  }

  if (!code || typeof code !== 'string') {
    res.status(400).send("Código de autorização não encontrado.");
    return;
  }

  if (!MERCADOLIVRE_CLIENT_ID || !MERCADOLIVRE_CLIENT_SECRET || !MERCADOLIVRE_REDIRECT_URI) {
    functions.logger.error("Callback ML: CLIENT_ID, CLIENT_SECRET ou REDIRECT_URI não definidos.");
    res.redirect(`${FRONTEND_URL}/settings?status=ml-error`);
    return;
  }
  try {
    const data = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: MERCADOLIVRE_CLIENT_ID,
      client_secret: MERCADOLIVRE_CLIENT_SECRET,
      code: code,
      redirect_uri: MERCADOLIVRE_REDIRECT_URI,
    });
    const tokenResponse = await axios.post("https://api.mercadolibre.com/oauth/token", data, {
      headers: { "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json" }
    });
    const { access_token, refresh_token, expires_in, user_id } = tokenResponse.data;
    functions.logger.info("Callback ML: Token recebido para user_id:", user_id);
    await db.collection("integrations").doc("mercadolivre").set({
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresIn: expires_in,
      userId: user_id,
      updatedAt: FieldValue.serverTimestamp(),
      status: "active"
    }, { merge: true });
    res.redirect(`${FRONTEND_URL}/settings?status=ml-success`);
  } catch (err: any) {
    functions.logger.error("Callback ML: Erro ao obter/salvar token:", err.response?.data || err.message);
    res.redirect(`${FRONTEND_URL}/settings?status=ml-error`);
  }
});

// --- NOVAS FUNÇÕES MIGRADAS ---

/**
 * Busca a reputação do vendedor (migrado de index.js)
 */
export const getMercadoLivreReputation = onCall({ cors: true }, async (request) => {
    if (!request.auth) { throw new HttpsError('unauthenticated', 'Você precisa estar logado.'); }
    functions.logger.info("getMercadoLivreReputation: Buscando reputação...");
    try {
        const authHeaders = await getMeliApiAuthHeaders();
        const { data: seller } = await axios.get('https://api.mercadolibre.com/users/me', authHeaders);
        const { data: reputation } = await axios.get(`https://api.mercadolibre.com/users/${seller.id}/seller_reputation`, authHeaders);
        return reputation;
    } catch (error: any) {
        functions.logger.error("getMercadoLivreReputation: Erro:", error.response?.data || error.message);
        if (error instanceof HttpsError) throw error;
        throw new HttpsError('internal', 'Não foi possível buscar a reputação.');
    }
});

/**
 * Busca o resumo da conta Mercado Pago (migrado de index.js)
 */
export const getMercadoLivreAccountSummary = onCall({ cors: true }, async (request) => {
    if (!request.auth) { throw new HttpsError('unauthenticated', 'Você precisa estar logado.'); }
    functions.logger.info("getMercadoLivreAccountSummary: Buscando resumo...");
    try {
        const authHeaders = await getMeliApiAuthHeaders();
        const { data: seller } = await axios.get('https://api.mercadolibre.com/users/me', authHeaders);
        const { data: account } = await axios.get(`https://api.mercadolibre.com/users/${seller.id}/mercadopago_account/balance`, authHeaders);
        return account;
    } catch (error: any) {
        functions.logger.error("getMercadoLivreAccountSummary: Erro:", error.response?.data || error.message);
        if (error instanceof HttpsError) throw error;
        throw new HttpsError('internal', 'Não foi possível buscar o resumo da conta.');
    }
});

/**
 * Helper interno para buscar performance (migrado de index.js)
 */
async function getShippingPerformance(mode: 'flex' | 'me2') {
    functions.logger.info(`Buscando performance para ${mode}`);
    try {
        const authHeaders = await getMeliApiAuthHeaders();
        const { data: seller } = await axios.get('https://api.mercadolibre.com/users/me', authHeaders);
        const sellerId = seller.id;

        const performanceUrl = `https://api.mercadolibre.com/users/${sellerId}/shipping_performance`;
        const params = { mode: mode };
        const { data: performanceData } = await axios.get(performanceUrl, { ...authHeaders, params });
        
        functions.logger.info(`Dados brutos recebidos para ${mode}:`, performanceData);

        let currentWeekRate = null;
        let last4WeeksRate = null;
        let predictionStatus = 'Sem calcular';

        if (performanceData?.metrics?.late_shipping_rate) {
            currentWeekRate = performanceData.metrics.late_shipping_rate.current_period?.rate || null;
            last4WeeksRate = performanceData.metrics.late_shipping_rate.comparison_period?.rate || null;
            // A API de predição parece ter sido descontinuada, usaremos os dados brutos.
            predictionStatus = performanceData.status || "N/A";
        }

        return {
            currentWeekRate: currentWeekRate,
            last4WeeksRate: last4WeeksRate,
            predictionStatus: predictionStatus,
            raw: performanceData
        };

    } catch (error: any) {
        if (error.response && error.response.status === 404) {
            functions.logger.warn(`Dados de performance não encontrados para ${mode} (404).`);
            return { predictionStatus: 'Não aplicável', currentWeekRate: null, last4WeeksRate: null, raw: null };
        }
        functions.logger.error(`Erro ao buscar performance (${mode}):`, error.response?.data || error.message);
        throw new HttpsError('internal', `Não foi possível buscar a performance (${mode}).`);
    }
}

/**
 * Busca performance de envio Flex (migrado de index.js)
 */
export const getMercadoLivreShippingPerformanceFlex = onCall({ cors: true }, async (request) => {
    if (!request.auth) { throw new HttpsError('unauthenticated', 'Você precisa estar logado.'); }
    try {
        return await getShippingPerformance('flex');
    } catch (error: any) {
        if (error instanceof HttpsError) throw error;
        throw new HttpsError('internal', error.message || 'Erro ao buscar performance Flex.');
    }
});

/**
 * Busca performance de envio Agência (migrado de index.js)
 */
export const getMercadoLivreShippingPerformanceAgency = onCall({ cors: true }, async (request) => {
    if (!request.auth) { throw new HttpsError('unauthenticated', 'Você precisa estar logado.'); }
    try {
        return await getShippingPerformance('me2');
    } catch (error: any) {
        if (error instanceof HttpsError) throw error;
        throw new HttpsError('internal', error.message || 'Erro ao buscar performance de Agências.');
    }
});