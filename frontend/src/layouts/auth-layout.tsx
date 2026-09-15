import { Link, Outlet } from 'react-router-dom';
import { Shield, Lock, Eye, BarChart3, Globe } from 'lucide-react';

const features = [
  { icon: Lock, label: 'End-to-End Encrypted', desc: 'Bank-grade security' },
  { icon: Eye, label: 'Transparent Auditing', desc: 'Full audit trail' },
  { icon: BarChart3, label: 'Real-Time Results', desc: 'Instant tallies' },
  { icon: Globe, label: 'Vote Anywhere', desc: 'Access from anywhere' },
];

export default function AuthLayout({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 bg-primary-500 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-400/30">
            <Shield className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-bold text-white">VoteSecure</span>
        </div>

        <div className="flex flex-col gap-10">
          <div>
            <h1 className="text-3xl font-bold leading-tight text-white">
              Secure Digital Voting
            </h1>
            <p className="mt-3 text-base text-primary-200">
              A transparent, tamper-proof platform for modern elections.
            </p>
          </div>

          <div className="grid max-w-sm grid-cols-2 gap-4">
            {features.map((feature) => (
              <div
                key={feature.label}
                className="rounded-lg border border-primary-400/20 bg-primary-600/30 p-4"
              >
                <feature.icon className="h-5 w-5 text-accent-300" strokeWidth={2} />
                <p className="mt-2.5 text-sm font-semibold text-white">
                  {feature.label}
                </p>
                <p className="mt-0.5 text-xs text-primary-200">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-primary-300">
          Trusted by organizations worldwide for secure and verifiable elections.
        </p>
      </div>

      <div className="flex w-full flex-col items-center justify-center bg-white px-4 py-10 dark:bg-surface-950 lg:w-1/2 lg:px-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500">
              <Shield className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-bold text-primary-500 dark:text-white">
              VoteSecure
            </span>
          </div>

          {children || <Outlet />}

          <p className="mt-8 text-center text-sm text-surface-500 dark:text-surface-400">
            <Link
              to="/"
              className="font-medium text-primary-500 hover:text-primary-600 dark:text-primary-400"
            >
              Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
