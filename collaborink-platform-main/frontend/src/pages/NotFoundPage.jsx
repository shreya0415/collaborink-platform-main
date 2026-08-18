import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="text-center space-y-6">
        <Compass className="mx-auto text-gray-600" size={72} />
        <div>
          <h1 className="text-6xl font-bold text-gray-700 mb-2">404</h1>
          <p className="text-xl text-white font-semibold mb-1">Page not found</p>
          <p className="text-gray-400 text-sm">The page you're looking for doesn't exist.</p>
        </div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
