import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="min-h-screen pt-32 px-10 text-ink">
      <h1 className="font-serif italic text-3xl mb-4">Página no encontrada</h1>
      <Link to="/" className="font-mono text-sm underline">
        Volver al inicio
      </Link>
    </main>
  );
}
