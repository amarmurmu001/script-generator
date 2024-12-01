"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from 'next/link';
import { FcGoogle } from 'react-icons/fc';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { user, login, loginWithGoogle } = useAuth();
  const router = useRouter();

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      router.push('/scriptgenerator');
    }
  }, [user, router]);

  // If user is logged in, don't render the login form
  if (user) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      router.push('/scriptgenerator');
    } catch (error) {
      console.error('Login error:', error);
      setError('Failed to login. Please check your credentials.');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await loginWithGoogle();
      router.push('/scriptgenerator');
    } catch (error) {
      console.error('Google sign-in error:', error);
      setError('Failed to sign in with Google');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#121212] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="text-red-500 text-center bg-red-100 dark:bg-red-900/30 p-3 rounded">
              {error}
            </div>
          )}
          <div className="rounded-md shadow-sm space-y-4">
            <Input
              type="email"
              required
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mb-4 bg-white dark:bg-[#171717] border-gray-300 dark:border-gray-600"
            />
            <Input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-white dark:bg-[#171717] border-gray-300 dark:border-gray-600"
            />
          </div>
          <div className="space-y-4">
            <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600">
              Sign in
            </Button>
            <Button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full bg-white dark:bg-[#171717] text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-[#202020]"
            >
              <FcGoogle className="w-5 h-5 mr-2" />
              Sign in with Google
            </Button>
          </div>
        </form>
        <div className="text-center">
          <Link href="/signup" className="text-orange-500 hover:text-orange-600">
            Don&apos;t have an account? Sign up
          </Link>
        </div>
      </div>
    </div>
  );
} 