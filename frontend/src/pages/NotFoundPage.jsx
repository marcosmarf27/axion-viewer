import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-6xl font-bold text-gray-300">404</h1>
      <p className="mt-4 text-lg text-gray-600">Pagina nao encontrada</p>
      <Link
        to="/"
        className="mt-6 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        Voltar ao inicio
      </Link>
    </div>
  );
}
