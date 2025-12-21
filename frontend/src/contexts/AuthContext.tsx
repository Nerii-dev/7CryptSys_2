import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User as FirebaseUser, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../services/firebase";
import { UserProfile } from "../types/User";

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Monitora o estado de autenticação
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) {
        // Se o usuário deslogar, limpa o perfil e para de carregar
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    // Monitora o perfil do usuário no Firestore se estiver logado
    let unsubscribeProfile: () => void = () => {};

    if (currentUser) {
      setLoading(true);
      const userDocRef = doc(db, "users", currentUser.uid);

      unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          setUserProfile(docSnap.data() as UserProfile);
        } else {
          // --- CORREÇÃO AQUI ---
          // Substituímos o logger de backend (functions.logger) pelo logger do navegador (console)
          console.warn(`Usuário ${currentUser.uid} autenticado mas sem perfil no Firestore.`);
          // --- FIM DA CORREÇÃO ---
          
          setUserProfile(null);
          // Força o logout se o perfil não for encontrado
          signOut(auth);
        }
        setLoading(false);
      }, (error) => {
        console.error("Erro ao buscar perfil:", error);
        setUserProfile(null);
        setLoading(false);
      });
    }

    return () => unsubscribeProfile();
  }, [currentUser]);

  const logout = async () => {
    await signOut(auth);
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook customizado para fácil acesso
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};