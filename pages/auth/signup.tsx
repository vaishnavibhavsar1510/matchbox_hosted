import React, { useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../../components/AuthContext';

export default function SignUp() {
  const router = useRouter();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    birthdate: '',
    gender: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for the field being changed
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setError(''); // Clear general error
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.birthdate) {
      newErrors.birthdate = 'Birth date is required';
    } else {
      const birthDate = new Date(formData.birthdate);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 18) {
        newErrors.birthdate = 'You must be at least 18 years old';
      }
    }
    
    if (!formData.gender) {
      newErrors.gender = 'Please select your gender';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      await register(
        formData.email,
        formData.password,
        formData.name,
        {
          birthdate: formData.birthdate,
          gender: formData.gender
        }
      );
      
      router.push('/onboarding/user-type');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create account';
      setError(errorMessage);
      
      // Handle specific error cases
      if (errorMessage.includes('already exists')) {
        setErrors(prev => ({
          ...prev,
          email: 'This email is already registered'
        }));
      } else if (errorMessage.includes('password')) {
        setErrors(prev => ({
          ...prev,
          password: 'Please choose a stronger password'
        }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-violet-900 to-purple-900 flex flex-col relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-600/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 -right-32 w-96 h-96 bg-indigo-600/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-1/2 w-96 h-96 bg-violet-600/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-3 h-3 bg-gradient-to-br from-white/30 to-violet-200/20 rounded-full animate-float shadow-lg shadow-white/10`}
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${8 + Math.random() * 4}s`,
              transform: `scale(${1 + Math.random()})` // Random size variation
            }}
          ></div>
        ))}
      </div>

      <Head>
        <title>Sign Up | MatchBox</title>
        <meta name="description" content="Create your MatchBox account" />
        <style>{`
          @keyframes float {
            0%, 100% {
              transform: translateY(0) translateX(0) scale(1);
              opacity: 0;
            }
            25% {
              opacity: 0.7;
              transform: translateY(-20px) translateX(10px) scale(1.1);
            }
            50% {
              transform: translateY(-100px) translateX(50px) scale(1);
              opacity: 0.5;
            }
            75% {
              opacity: 0.7;
              transform: translateY(-50px) translateX(25px) scale(1.05);
            }
          }
          @keyframes blob {
            0%, 100% {
              transform: translate(0, 0) scale(1);
            }
            25% {
              transform: translate(20px, -50px) scale(1.1);
            }
            50% {
              transform: translate(-20px, 20px) scale(0.9);
            }
            75% {
              transform: translate(50px, 50px) scale(1.05);
            }
          }
          .animate-blob {
            animation: blob 15s infinite;
          }
          .animate-float {
            animation: float 8s infinite;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          .animation-delay-4000 {
            animation-delay: 4s;
          }
        `}</style>
      </Head>

      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <h1 className="text-4xl font-bold text-white">MatchBox</h1>
            </Link>
            <p className="text-violet-200/80 mt-2">Create your account to find meaningful connections</p>
          </div>

          <div className="backdrop-blur-lg bg-gradient-to-b from-indigo-950/80 to-purple-950/80 rounded-xl shadow-2xl p-8 border border-violet-700/20">
            <h2 className="text-2xl font-bold text-violet-100 mb-6">Join MatchBox</h2>
            
            {error && (
              <div className="bg-red-950/30 border border-red-500/30 text-red-200 p-4 rounded-lg mb-6">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-violet-200 mb-1">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className={`w-full px-4 py-2 bg-indigo-950/70 border ${errors.name ? 'border-red-500/50' : 'border-violet-600/30'} rounded-lg text-violet-100 placeholder-violet-400/50 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-transparent transition-colors`}
                  value={formData.name}
                  onChange={handleChange}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-400">{errors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-violet-200 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className={`w-full px-4 py-2 bg-indigo-950/70 border ${errors.email ? 'border-red-500/50' : 'border-violet-600/30'} rounded-lg text-violet-100 placeholder-violet-400/50 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-transparent transition-colors`}
                  value={formData.email}
                  onChange={handleChange}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-violet-200 mb-1">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className={`w-full px-4 py-2 bg-indigo-950/70 border ${errors.password ? 'border-red-500/50' : 'border-violet-600/30'} rounded-lg text-violet-100 placeholder-violet-400/50 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-transparent transition-colors`}
                    value={formData.password}
                    onChange={handleChange}
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-400">{errors.password}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-violet-200 mb-1">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    className={`w-full px-4 py-2 bg-indigo-950/70 border ${errors.confirmPassword ? 'border-red-500/50' : 'border-violet-600/30'} rounded-lg text-violet-100 placeholder-violet-400/50 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-transparent transition-colors`}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="birthdate" className="block text-sm font-medium text-violet-200 mb-1">
                    Birth Date
                  </label>
                  <input
                    id="birthdate"
                    name="birthdate"
                    type="date"
                    required
                    className={`w-full px-4 py-2 bg-indigo-950/70 border ${errors.birthdate ? 'border-red-500/50' : 'border-violet-600/30'} rounded-lg text-violet-100 placeholder-violet-400/50 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-transparent transition-colors`}
                    value={formData.birthdate}
                    onChange={handleChange}
                  />
                  {errors.birthdate && (
                    <p className="mt-1 text-sm text-red-400">{errors.birthdate}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-violet-200 mb-1">
                    Gender
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    required
                    className={`w-full px-4 py-2 bg-indigo-950/70 border ${errors.gender ? 'border-red-500/50' : 'border-violet-600/30'} rounded-lg text-violet-100 placeholder-violet-400/50 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-transparent transition-colors`}
                    value={formData.gender}
                    onChange={handleChange}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.gender && (
                    <p className="mt-1 text-sm text-red-400">{errors.gender}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-violet-300/90">
                  Already have an account?{' '}
                  <Link href="/auth/signin" className="text-violet-200 hover:text-violet-100 transition-colors">
                    Sign in
                  </Link>
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700 text-white text-lg rounded-full hover:from-indigo-500 hover:via-violet-500 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 font-medium shadow-xl shadow-indigo-950/60 border border-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}