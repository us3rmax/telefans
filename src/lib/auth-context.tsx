import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLaunchParams, type User } from '@telegram-apps/sdk-react';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isTelegram: boolean;
  login: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isTelegram, setIsTelegram] = useState(false);
  
  // Tenta pegar os parâmetros de lançamento do Telegram
  let lp: any = null;
  try {
    lp = useLaunchParams();
  } catch (e) {
    // Não está rodando no Telegram
  }

  useEffect(() => {
    if (lp?.initData?.user) {
      const tgUser = lp.initData.user;
      setUser(tgUser);
      setIsTelegram(true);
      // Sincroniza com o banco de dados
      import('@/lib/data-service').then(({ DataService }) => {
        DataService.syncUserProfile(tgUser);
      });
    }
  }, [lp]);

  const login = async () => {
    // Lógica para simular login manual fora do Telegram
    const mockUser = {
      id: 12345678,
      firstName: 'Telefans',
      lastName: 'User',
      username: 'telefans_user',
      languageCode: 'pt-br',
      photoUrl: 'https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/1ee6e615-cd85-4c86-2a35-cb9943d60900/public',
    } as User;
    
    setUser(mockUser);
    
    // Sincroniza com o banco de dados
    try {
      const { DataService } = await import('@/lib/data-service');
      await DataService.syncUserProfile(mockUser);
    } catch (e) {
      console.warn('Database sync skipped during mock login');
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      isTelegram,
      login,
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
