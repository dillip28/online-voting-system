import { Link, Outlet } from 'react-router-dom';
import { Shield } from 'lucide-react';

export default function AuthLayout({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 bg-gradient-to-br from-primary-600 to-primary-800 lg:flex lg:flex-col lg:items-center lg:justify-center">
        <div className="flex flex-col items-center gap-6 px-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-center text-4xl font-bold text-white">VoteSecure</h1>
          <p className="text-center text-lg text-primary-100">
            Secure. Transparent. Simple.
          </p>
          <div className="mt-8 grid max-w-sm grid-cols-2 gap-4 text-sm">
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
              <p className="font-semibold text-white">End-to-End</p>
              <p className="mt-1 text-primary-200">Encrypted voting</p>
            </div>
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
              <p className="font-semibold text-white">Real-Time</p>
              <p className="mt-1 text-primary-200">Live results</p>
            </div>
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
              <p className="font-semibold text-white">Transparent</p>
              <p className="mt-1 text-primary-200">Audit trail</p>
            </div>
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
              <p className="font-semibold text-white">Accessible</p>
              <p className="mt-1 text-primary-200">Vote anywhere</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col items-center justify-center bg-white px-4 dark:bg-gray-950 lg:w-1/2 lg:px-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
              <span className="text-sm font-bold text-white">V</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              VoteSecure
            </span>
          </div>

          {children || <Outlet />}

          <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
            <Link to="/" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400">
              Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
