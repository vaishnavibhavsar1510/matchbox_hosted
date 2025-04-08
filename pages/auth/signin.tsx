import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../../components/AuthContext';
import { useUser } from '../../components/UserContext';

export default function SignIn() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuth();
  const { userData, isLoading: userLoading } = useUser();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Only redirect when authentication is complete and user data is loaded
    if (!isLoading && !userLoading) {
      console.log('Auth state check:', { 
        isAuthenticated, 
        isLoading, 
        hasUserData: !!userData 
      });

      if (isAuthenticated) {
        if (!userData?.interests?.length) {
          console.log('User needs to complete preferences');
          router.replace('/onboarding/preferences');
        } else {
          console.log('User is authenticated, redirecting to dashboard');
          router.replace('/dashboard');
        }
      }
    }
  }, [isLoading, userLoading, isAuthenticated, userData, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      console.log('Attempting login...');
      await login(formData.email, formData.password);
      console.log('Login successful, waiting for auth state update');
    } catch (err) {
      console.error('Login error:', err);
      setError('Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while checking authentication or loading user data
  if (isLoading || userLoading) {
    return (
      <div className="min-h-screen bg-[#0A0F29] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4">
            <div className="w-full h-full rounded-full bg-gradient-to-r from-purple-700 via-violet-800 to-indigo-900 animate-pulse"></div>
          </div>
          <h2 className="text-2xl font-semibold text-purple-200 mb-4">Loading...</h2>
          <p className="text-purple-200/70">Please wait while we verify your account.</p>
        </div>
      </div>
    );
  }

  // Don't show sign-in form if already authenticated
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0A0F29] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4">
            <div className="w-full h-full rounded-full bg-gradient-to-r from-purple-700 via-violet-800 to-indigo-900 animate-pulse"></div>
          </div>
          <h2 className="text-2xl font-semibold text-purple-200 mb-4">Redirecting...</h2>
          <p className="text-purple-200/70">Please wait while we redirect you.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>Sign In - MatchBox</title>
        <meta name="description" content="Sign in to your MatchBox account" />
      </Head>

      <div className="aurora-waves"></div>

      <main className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-aurora-dark">
              Welcome Back
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to continue your journey
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="form-label">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="input-field"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="input-field"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-aurora-blue focus:ring-aurora-teal border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link href="/auth/forgot-password" className="text-aurora-blue hover:text-aurora-teal">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link href="/auth/signup" className="text-aurora-blue hover:text-aurora-teal">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
} 