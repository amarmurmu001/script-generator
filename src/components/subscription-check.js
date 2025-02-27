"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'react-hot-toast';

export default function SubscriptionCheck({ children }) {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) {
        setLoading(false);
        router.push('/login');
        return;
      }

      try {
        // Check for active subscription
        const subscriptionsRef = collection(db, 'subscriptions');
        const q = query(
          subscriptionsRef,
          where('userId', '==', user.uid),
          where('status', '==', 'active')
        );

        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          // No active subscription found
          setHasAccess(false);
          toast.error('Please subscribe to access this feature', {
            duration: 5000,
            position: 'top-center',
          });
          router.push('/pricing');
          return;
        }

        // Check subscription expiry
        const subscription = querySnapshot.docs[0].data();
        const now = new Date();
        const expiryDate = subscription.expiryDate?.toDate();

        if (expiryDate && expiryDate < now) {
          setHasAccess(false);
          toast.error('Your subscription has expired', {
            duration: 5000,
            position: 'top-center',
          });
          router.push('/pricing');
          return;
        }

        // All checks passed
        setHasAccess(true);
      } catch (error) {
        console.error('Error checking subscription:', error);
        toast.error('Error verifying subscription status');
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkSubscription();
  }, [user, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return children;
} 