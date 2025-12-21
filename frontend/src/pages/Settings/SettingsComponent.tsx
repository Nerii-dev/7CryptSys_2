import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../services/firebase';
import { useIntegrationStatus } from '../../hooks/useIntegrationStatus';

// --- Cloud Functions com fallback ---
const getMercadoLivreAuthUrl = httpsCallable(functions, 'getMercadoLivreAuthUrl');
const getMercadoLivreAuthUrlML = httpsCallable(functions, 'ml-getMercadoLivreAuthUrl');

export const SettingsComponent = () => {
  const [loadingML, setLoadingML] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Verifica status da integração
  const { loading: loadingStatus, isConnected: isMLConnected } = useIntegrationStatus('mercadolivre');

  // Lê parâmetros da URL (para callback OAuth)
  const [searchParams, setSearchParams] = useSearchParams();

  // Exibe mensagens de retorno do OAuth
  useEffect(() => {
    const status = searchParams.get('status');
    if (status === 'ml-success') {
      console.log("✅ Integração com Mercado Livre realizada com sucesso!");
      setSearchParams({});
    } else if (status === 'ml-error') {
      setError("❌ Falha ao conectar com o Mercado Livre.");
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  // --- Função de conexão com fallback automático ---
  const handleConnectML = async () => {
    setLoadingML(true);
    setError(null);
    try {
      let result: any;

      try {
        // 1️⃣ Tenta nova função (com prefixo ml-)
        result = await getMercadoLivreAuthUrlML();
        console.log('✅ Conectado via ml-getMercadoLivreAuthUrl');
      } catch (mlError) {
        console.warn('⚠️ ml-getMercadoLivreAuthUrl falhou, aplicando fallback:', mlError);
        // 2️⃣ Fallback: tenta função original sem prefixo
        result = await getMercadoLivreAuthUrl();
        console.log('✅ Fallback: conectado via getMercadoLivreAuthUrl');
      }

      if (result?.data?.authUrl) {
        window.location.href = result.data.authUrl;
      } else {
        throw new Error("URL de autorização não recebida do servidor.");
      }

    } catch (err: any) {
      console.error("🔥 Erro na conexão Firebase:", err);
      setError(err.message || "Erro ao iniciar autorização com o Mercado Livre.");
      setLoadingML(false);
    }
  };

  // --- Renderização dos cards ---
  const renderMLCard = () => {
    if (loadingStatus) {
      return <div className="p-4 bg-gray-100 rounded-md animate-pulse h-24"></div>;
    }
    
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
        <h3 className="text-xl font-bold mb-2">Mercado Livre</h3>
        {isMLConnected ? (
          <div className="text-green-600 font-semibold">
            <p>Status: Conectado</p>
            {/* TODO: Adicionar botão de desconectar/revogar */}
          </div>
        ) : (
          <div>
            <p className="text-gray-600 mb-4">
              Autorize o sistema a acessar os dados da sua loja.
            </p>
            <button
              onClick={handleConnectML}
              disabled={loadingML}
              className="bg-yellow-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-yellow-600 disabled:bg-gray-400"
            >
              {loadingML ? "Aguarde..." : "Conectar com Mercado Livre"}
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderBlingCard = () => {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 opacity-60">
        <h3 className="text-xl font-bold mb-2">Bling</h3>
        <p className="text-gray-600 mb-4">
          Configure a API do Bling para sincronizar estoque e status.
        </p>
        <button
          disabled
          className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400 cursor-not-allowed"
        >
          Configurar Bling (Em breve)
        </button>
      </div>
    );
  };

  // --- Render principal ---
  return (
    <div>
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Configurações</h1>
        <p className="text-gray-600 mt-2">Gerencie as integrações de API do sistema.</p>
      </header>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {renderMLCard()}
        {renderBlingCard()}
      </div>
    </div>
  );
};
