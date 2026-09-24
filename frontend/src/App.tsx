import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Agendar from './pages/Agendar';
import MisReservas from './pages/MisReservas';
import AdminReservas from './pages/AdminReservas';
import AdminServicios from './pages/AdminServicios';
import AdminUsuarios from './pages/AdminUsuarios';
import Login from './pages/Login';
import NotFound from './pages/NotFound';

function App() {
  return (
    <div className="min-h-screen bg-paper text-ink selection:bg-ink selection:text-paper overflow-x-hidden">
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/agendar" element={<Agendar />} />
        <Route
          path="/mis-reservas"
          element={
            <ProtectedRoute>
              <MisReservas />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireRol="admin">
              <AdminReservas />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/servicios"
          element={
            <ProtectedRoute requireRol="admin">
              <AdminServicios />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/usuarios"
          element={
            <ProtectedRoute requireRol="admin">
              <AdminUsuarios />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;
