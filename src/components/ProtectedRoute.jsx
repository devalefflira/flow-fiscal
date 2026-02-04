import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children }) {
  const { session } = useAuth();

  if (!session) {
    // Se não tem sessão, chuta para o Login
    return <Navigate to="/login" replace />;
  }

  // Se tem sessão, deixa entrar
  return children;
}