import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User, City } from '../types';
import { INITIAL_ADMIN } from '../constants';

const getLocalStorage = <T,>(key: string, defaultValue: T): T => {
    try {
        const storedValue = localStorage.getItem(key);
        return storedValue ? JSON.parse(storedValue) : defaultValue;
    } catch {
        return defaultValue;
    }
};

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<User | null>;
  logout: () => void;
  getUsersByCity: (city: City) => User[];
  addUser: (user: Omit<User, 'id' | 'role'>, city: City) => void;
  updateUser: (user: User, city: City) => void;
  deleteUser: (userId: number, city: City) => void;
  updateAdmin: (admin: User) => void;
  findUserByPlate: (plate: string, city: City) => User | undefined;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => getLocalStorage<User | null>('fuel-log-user', null));
  const [allUsers, setAllUsers] = useState<Record<City, User[]>>(() => {
      const saleUsers = getLocalStorage<User[]>(`users_Salé`, []);
      const zemamraUsers = getLocalStorage<User[]>(`users_Zemamra`, []);
      return { 'Salé': saleUsers, 'Zemamra': zemamraUsers };
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('fuel-log-user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('fuel-log-user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(`users_Salé`, JSON.stringify(allUsers['Salé']));
    localStorage.setItem(`users_Zemamra`, JSON.stringify(allUsers['Zemamra']));
  }, [allUsers]);

  const login = async (username: string, password: string): Promise<User | null> => {
    if (username === INITIAL_ADMIN.username && password === INITIAL_ADMIN.password) {
      const adminUser = getLocalStorage<User>('fuel-log-admin', INITIAL_ADMIN);
      setCurrentUser(adminUser);
      return adminUser;
    }
    
    for (const city of ['Salé', 'Zemamra'] as City[]) {
        const cityUsers = allUsers[city];
        const foundUser = cityUsers.find(u => u.username === username && u.password === password);
        if (foundUser) {
            setCurrentUser(foundUser);
            return foundUser;
        }
    }
    return null;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const getUsersByCity = (city: City) => allUsers[city] || [];
  
  const findUserByPlate = (plate: string, city: City) => {
    return allUsers[city]?.find(u => u.username === plate);
  }

  const addUser = (newUser: Omit<User, 'id' | 'role'>, city: City) => {
    const userWithId: User = { ...newUser, id: Date.now(), role: 'driver' };
    setAllUsers(prev => ({...prev, [city]: [...(prev[city] || []), userWithId]}));
  };
  
  const updateUser = (updatedUser: User, city: City) => {
    setAllUsers(prev => ({...prev, [city]: prev[city].map(u => u.id === updatedUser.id ? updatedUser : u)}));
  };

  const deleteUser = (userId: number, city: City) => {
    setAllUsers(prev => ({...prev, [city]: prev[city].filter(u => u.id !== userId)}));
  };
  
  const updateAdmin = (admin: User) => {
    localStorage.setItem('fuel-log-admin', JSON.stringify(admin));
    setCurrentUser(admin);
  }

  return (
    <AuthContext.Provider value={{ user: currentUser, login, logout, getUsersByCity, addUser, updateUser, deleteUser, updateAdmin, findUserByPlate }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
