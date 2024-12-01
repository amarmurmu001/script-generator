"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getUserSubscription } from '@/lib/subscription';
import { useRouter } from 'next/navigation';

export default function SubscriptionCheck({ children, requiredPlan = ['plan_pro'] }) {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    async function checkSubscription() {
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const subscription = await getUserSubscription(user.uid);
        if (subscription && subscription.status === 'active' && requiredPlan.includes(subscription.planId)) {
          setHasAccess(true);
        } else {
          router.push('/subscription');
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
        router.push('/subscription');
      } finally {
        setLoading(false);
      }
    }

    checkSubscription();
  }, [user, router, requiredPlan]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return hasAccess ? children : null;
} 