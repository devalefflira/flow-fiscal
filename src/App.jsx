import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import TasksDashboard from './pages/TasksDashboard';
import FiscalDashboard from './pages/FiscalDashboard';
import EisenhowerMatrix from './pages/EisenhowerMatrix'; // Importando a Matriz
import FiscalClosing from './pages/FiscalClosing';
import AccessoryObligations from './pages/AccessoryObligations';
import InstallmentControl from './pages/InstallmentControl';
import Categories from './pages/Categories';
import Clients from './pages/Clients';
import TaxGuides from './pages/TaxGuides';
import Users from './pages/Users';
import ObligationTypes from './pages/ObligationTypes';
import TaskCategories from './pages/TaskCategories';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
        
        {/* Dashboards */}
        <Route path="/dashboard/tarefas" element={<TasksDashboard />} />
        <Route path="/dashboard/fiscal" element={<FiscalDashboard />} />
        
        {/* Nova Rota: Matriz */}
        <Route path="/tarefas/matriz" element={<EisenhowerMatrix />} />

        {/* Nova Rota Fiscal */}
        <Route path="/processos/fechamento" element={<FiscalClosing />} />

        {/* Nova Rota: Obrigações Acessórias */}
        <Route path="/processos/obrigacoes" element={<AccessoryObligations />} />

        {/* Nova Rota: Parcelamentos */}
        <Route path="/processos/parcelamentos" element={<InstallmentControl />} />

        {/* Nova Rota: Categorias */}
        <Route path="/cadastros/categorias" element={<Categories />} />

        {/* Nova Rota: Clientes */}
        <Route path="/cadastros/clientes" element={<Clients />} />

        {/* Nova Rota: Guias de Tributos */}
        <Route path="/cadastros/guias" element={<TaxGuides />} />

        {/* Nova Rota: Usuários */}
        <Route path="/cadastros/usuarios" element={<Users />} />

        {/* Nova Rota: Categorias de Tarefas (Padronização) */}
        <Route path="/cadastros/categorias-tarefas" element={<TaskCategories />} />

        {/* Nova Rota: Tipos de Obrigações */}
        <Route path="/cadastros/obrigacoes" element={<ObligationTypes />} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;