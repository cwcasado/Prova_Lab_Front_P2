import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { RotaProtegida } from './components/Comuns';
import { Layout } from './components/Layout';
import { ToastProvider } from './components/Toast';
import { AuthProvider } from './context/AuthContext';
import { ClienteDetalhe } from './pages/ClienteDetalhe';
import { ClienteForm } from './pages/ClienteForm';
import { Clientes } from './pages/Clientes';
import { Login } from './pages/Login';
import { NaoEncontrada } from './pages/NaoEncontrada';
import { Painel } from './pages/Painel';
import { Pedidos } from './pages/Pedidos';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<RotaProtegida />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Painel />} />
                <Route path="/clientes" element={<Clientes />} />
                <Route path="/clientes/novo" element={<ClienteForm />} />
                <Route path="/clientes/:id" element={<ClienteDetalhe />} />
                <Route path="/clientes/:id/editar" element={<ClienteForm />} />
                <Route path="/pedidos" element={<Pedidos />} />
                <Route path="*" element={<NaoEncontrada />} />
              </Route>
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
