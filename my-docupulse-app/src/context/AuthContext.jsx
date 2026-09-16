import React, { createContext, useContext, useState } from 'react';

export const AUTHORIZED_USERS = {
  usr_ops_01: {
    id: 'usr_ops_01',
    name: 'Jane Doe',
    email: 'jane.doe@docupulse.internal',
    department: 'Operations',
    role: 'Senior Operations Lead',
    authorized: true,
    avatar: 'JD'
  },
  usr_it_02: {
    id: 'usr_it_02',
    name: 'Alex Rivera',
    email: 'alex.rivera@docupulse.internal',
    department: 'Information Technology',
    role: 'Infrastructure Specialist',
    authorized: true,
    avatar: 'AR'
  },
  usr_guest_03: {
    id: 'usr_guest_03',
    name: 'Visitor / Contractor',
    email: 'guest@contractor.internal',
    department: 'External',
    role: 'Guest',
    authorized: false, // Unauthorized guest
    avatar: 'VC'
  }
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUserId, setCurrentUserId] = useState(() => {
    return localStorage.getItem('docupulse_active_user') || 'usr_ops_01';
  });

  const currentUser = AUTHORIZED_USERS[currentUserId] || AUTHORIZED_USERS.usr_ops_01;
  const isAuthorized = Boolean(currentUser && currentUser.authorized);

  const switchUser = (userId) => {
    if (AUTHORIZED_USERS[userId]) {
      setCurrentUserId(userId);
      localStorage.setItem('docupulse_active_user', userId);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthorized,
        switchUser,
        availableUsers: Object.values(AUTHORIZED_USERS)
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}