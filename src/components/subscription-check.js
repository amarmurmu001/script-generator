"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function SubscriptionCheck({ children }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Wait for a short delay to ensure auth is fully initialized
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if user has an active subscription
        const subscriptionsRef = collection(db, "subscriptions");
        const q = query(
          subscriptionsRef,
          where("userId", "==", user.uid),
          where("status", "==", "active")
        );
        
        await getDocs(q);
        setLoading(false);
      } catch (error) {
        console.error("Error checking subscription:", error);
        // Don't block the user on subscription check errors
        setLoading(false);
      }
    };

    checkAccess();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <div className="text-center space-y-4 max-w-md mx-auto px-4 sm:px-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Login Required
          </h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Please log in or sign up to access this feature.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <button
              onClick={() => router.push('/login')}
              className="w-full sm:w-auto px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors text-sm sm:text-base"
            >
              Login
            </button>
            <button
              onClick={() => router.push('/signup')}
              className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors text-sm sm:text-base"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
} 