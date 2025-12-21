import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Html5QrcodeScannerConfig } from 'html5-qrcode/html5-qrcode-scanner';

interface QRCodeScannerProps {
  onScanSuccess: (decodedText: string, decodedResult: any) => void;
  onScanFailure?: (error: string) => void;
  config?: Html5QrcodeScannerConfig;
}

const scannerConfig: Html5QrcodeScannerConfig = {
  fps: 10,
  qrbox: { width: 250, height: 250 },
  rememberLastUsedCamera: true,
};

const scannerContainerId = "qr-code-scanner";

export const QRCodeScanner = ({
  onScanSuccess,
  onScanFailure = (err) => console.warn("Falha no scan:", err),
  config = scannerConfig,
}: QRCodeScannerProps) => {
  
  // Usamos useRef para garantir que o scanner só seja instanciado uma vez
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // Inicializa o scanner apenas uma vez
    if (!scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        scannerContainerId,
        config,
        /* verbose= */ false
      );
    }
    
    const scanner = scannerRef.current;
    
    // Inicia o scanner
    scanner.render(onScanSuccess, onScanFailure);

    // Função de limpeza para parar o scanner quando o componente for desmontado
    return () => {
      if (scanner) {
        scanner.clear().catch((error) => {
          console.error("Falha ao limpar o Html5QrcodeScanner.", error);
        });
      }
    };
  }, [onScanSuccess, onScanFailure, config]); // Dependências

  return <div id={scannerContainerId} />;
};