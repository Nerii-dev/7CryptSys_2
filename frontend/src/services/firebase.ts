import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

// Configuração do Firebase (substitua pela sua)
const firebaseConfig = {
  apiKey: "AIzaSyCyyM2PQBE1Ojb9tju7hGKwwwWNZgWIuDw",
  authDomain: "grupo-gomez-a6654.firebaseapp.com",
  projectId: "grupo-gomez-a6654",
  storageBucket: "grupo-gomez-a6654.firebasestorage.app",
  messagingSenderId: "132122400826",
  appId: "1:132122400826:web:95f354858daab26b78fd03",
  measurementId: "G-12FDXY2N36"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta os serviços
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, "us-central1"); // Garante a região

// Conecta aos Emuladores em ambiente de desenvolvimento
if (import.meta.env.DEV) {
  console.log("Conectando aos emuladores...");
  
  // IP do host para emuladores (use 127.0.0.1 ou localhost)
  const host = "127.0.0.1";

  connectAuthEmulator(auth, `http://${host}:9099`);
  connectFirestoreEmulator(db, host, 8080);
  connectStorageEmulator(storage, host, 9199);
  connectFunctionsEmulator(functions, host, 5001);
}