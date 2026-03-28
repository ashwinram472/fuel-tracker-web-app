'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginAction } from '@/app/actions/auth';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    try {
      const res = await loginAction(null, formData);
      if (res.error) {
        setError(res.error);
        setLoading(false);
      } else {
        router.push('/vehicles');
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[var(--primary)] rounded-lg flex items-center justify-center ambient-shadow">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 22L12 18L22 22L12 2Z" fill="white"/>
             </svg>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">Flytr</h2>
        </div>
        <h2 className="mt-2 text-center text-xl tracking-tight text-[var(--text-secondary)]">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[var(--surface)] py-8 px-4 ambient-shadow sm:rounded-xl sm:px-10 border border-[var(--card-border)]">
          <form className="space-y-6" action={handleSubmit}>
            {error && (
              <div className="bg-[var(--error)] bg-opacity-10 border border-[var(--error)] border-opacity-20 text-[var(--error)] px-4 py-3 rounded-lg text-sm transition-all">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--text-primary)]">
                Email address
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full appearance-none rounded-lg border border-[var(--outline)] px-3 py-2 text-[var(--text-primary)] placeholder-[var(--text-secondary)] shadow-sm focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] text-sm sm:text-base transition-colors bg-[var(--surface-container)]"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[var(--text-primary)]">
                Password
              </label>
              <div className="mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="block w-full appearance-none rounded-lg border border-[var(--outline)] px-3 py-2 text-[var(--text-primary)] placeholder-[var(--text-secondary)] shadow-sm focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] text-sm sm:text-base transition-colors bg-[var(--surface-container)]"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[var(--primary-container)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
