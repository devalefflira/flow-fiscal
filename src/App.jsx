import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Imports das Páginas
import Login from './pages/Login';
import Home from './pages/Home';
import TasksDashboard from './pages/TasksDashboard';
import FiscalDashboard from './pages/FiscalDashboard';
import EisenhowerMatrix from './pages/EisenhowerMatrix';
import FiscalClosing from './pages/FiscalClosing';
import AccessoryObligations from './pages/AccessoryObligations';
import Reports from './pages/Reports';
import InstallmentControl from './pages/InstallmentControl';
import Categories from './pages/Categories';
import Clients from './pages/Clients';
import TaxGuides from './pages/TaxGuides';
import Users from './pages/Users';
import ObligationTypes from './pages/ObligationTypes';
import TaskCategories from './pages/TaskCategories';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* --- ROTA PÚBLICA (LOGIN) --- */}
          <Route path="/login" element={<Login />} />
          
          {/* Redirecionamento da raiz para home (o ProtectedRoute vai jogar pro login se precisar) */}
          <Route path="/" element={<Navigate to="/home" replace />} />

          {/* --- ROTAS PROTEGIDAS (Apenas Logados) --- */}
          
          {/* Home */}
          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          
          {/* Tarefas */}
          <Route path="/tarefas/matriz" element={<ProtectedRoute><EisenhowerMatrix /></ProtectedRoute>} />
          <Route path="/dashboard/tarefas" element={<ProtectedRoute><TasksDashboard /></ProtectedRoute>} />

          {/* Processos */}
          <Route path="/processos/fechamento" element={<ProtectedRoute><FiscalClosing /></ProtectedRoute>} />
          <Route path="/processos/obrigacoes" element={<ProtectedRoute><AccessoryObligations /></ProtectedRoute>} />
          <Route path="/processos/parcelamentos" element={<ProtectedRoute><InstallmentControl /></ProtectedRoute>} />
          <Route path="/processos/relatorios" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          
          {/* Dashboard Fiscal */}
          <Route path="/dashboard/fiscal" element={<ProtectedRoute><FiscalDashboard /></ProtectedRoute>} />

          {/* Cadastros */}
          <Route path="/cadastros/categorias-tarefas" element={<ProtectedRoute><TaskCategories /></ProtectedRoute>} />
          <Route path="/cadastros/categorias" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
          <Route path="/cadastros/clientes" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
          <Route path="/cadastros/guias" element={<ProtectedRoute><TaxGuides /></ProtectedRoute>} />
          <Route path="/cadastros/usuarios" element={<ProtectedRoute><Users /></ProtectedRoute>} />
          <Route path="/cadastros/obrigacoes" element={<ProtectedRoute><ObligationTypes /></ProtectedRoute>} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}