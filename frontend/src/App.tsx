import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Agendar from './pages/Agendar';
import MisReservas from './pages/MisReservas';
import Admin from './pages/Admin';
import Login from './pages/Login';
import NotFound from './pages/NotFound';

function App() {
  return (
    <div className="min-h-screen bg-paper text-ink selection:bg-ink selection:text-paper overflow-x-hidden">
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/agendar" element={<Agendar />} />
        <Route path="/mis-reservas" element={<MisReservas />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;
