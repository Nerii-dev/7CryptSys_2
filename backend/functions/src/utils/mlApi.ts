import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import axios, { AxiosRequestConfig } from "axios";
import { HttpsError } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";

const db = admin.firestore();

// Carrega as variáveis de ambiente CORRETAMENTE
const MERCADOLIVRE_CLIENT_ID = process.env.MERCADOLIVRE_CLIENT_ID as string;
const MERCADOLIVRE_CLIENT_SECRET = process.env.MERCADOLIVRE_CLIENT_SECRET as string;

if (!MERCADOLIVRE_CLIENT_ID || !MERCADOLIVRE_CLIENT_SECRET) {
  throw new Error('Variáveis de ambiente do Mercado Livre não configuradas corretamente.');
}

/**
 * Obtém um token de acesso válido do Mercado Livre, renovando-o se necessário.
 * @returns {Promise<string>} O token de acesso.
 */
async function getValidAccessToken(): Promise<string> {
  const mlCredentialsRef = db.collection("integrations").doc("mercadolivre");
  const mlCredentialsDoc = await mlCredentialsRef.get();

  if (!mlCredentialsDoc.exists) {
    functions.logger.error("getValidAccessToken: Credenciais do ML não encontradas.");
    throw new HttpsError("not-found", "A integração com o Mercado Livre não foi autorizada.");
  }

  const { refreshToken, accessToken, updatedAt, expiresIn } = mlCredentialsDoc.data() || {};

  // Verifica se o token atual ainda é válido (com margem de 5 minutos)
  if (accessToken && updatedAt && expiresIn) {
    const expirationTime = updatedAt.toDate().getTime() + (expiresIn * 1000) - (5 * 60 * 1000);
    if (Date.now() < expirationTime) {
      functions.logger.info("getValidAccessToken: Usando access token existente.");
      return accessToken;
    }
  }

  if (!refreshToken) {
    functions.logger.error("getValidAccessToken: Refresh token não encontrado.");
    throw new HttpsError("failed-precondition", "Refresh token não encontrado. Autorize novamente.");
  }

  functions.logger.info("getValidAccessToken: Renovando token de acesso...");
  try {
    const data = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: MERCADOLIVRE_CLIENT_ID,
      client_secret: MERCADOLIVRE_CLIENT_SECRET,
      refresh_token: refreshToken,
    });

    const tokenResponse = await axios.post("https://api.mercadolibre.com/oauth/token", data, {
      headers: { "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json" }
    });

    const { access_token, refresh_token: new_refresh_token, expires_in } = tokenResponse.data;

    await mlCredentialsRef.set({
      accessToken: access_token,
      refreshToken: new_refresh_token || refreshToken, // ML pode não retornar um novo refresh
      expiresIn: expires_in,
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });

    functions.logger.info("getValidAccessToken: Token renovado com sucesso.");
    return access_token;
  } catch (error: any) {
    functions.logger.error("Erro ao renovar o token do ML:", error.response?.data || error.message);
    throw new HttpsError("internal", "Falha ao renovar o token de acesso do ML.");
  }
}

/**
 * Retorna os cabeçalhos de autorização prontos para o Axios.
 */
export async function getMeliApiAuthHeaders(): Promise<AxiosRequestConfig> {
  try {
    const token = await getValidAccessToken();
    return {
      headers: { "Authorization": `Bearer ${token}` }
    };
  } catch (error) {
    throw error;
  }
}