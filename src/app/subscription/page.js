"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import AuthCheck from '@/components/auth-check';
import { getUserSubscription } from '@/lib/subscription';
import { checkScriptGenerationLimit } from '@/lib/script-limits';
import { Zap, CreditCard, Calendar, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function Subscription() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subscription, setSubscription] = useState(null);
  const [generationLimit, setGenerationLimit] = useState(null);

  useEffect(() => {
    const fetchSubscriptionAndLimits = async () => {
      if (!user) return;

      try {
        setLoading(true);
        // Add a small delay to ensure auth is fully initialized
        await new Promise(resolve => setTimeout(resolve, 500));

        // Get user's subscription and limits in parallel
        const [sub, limits] = await Promise.all([
          getUserSubscription(user.uid, true).catch(error => {
            console.error('Error fetching subscription:', error);
            return {
              userId: user.uid,
              planName: 'Free',
              status: 'active'
            };
          }),
          checkScriptGenerationLimit(user.uid).catch(error => {
            console.error('Error checking generation limit:', error);
            return {
              remaining: 5,
              total: 5,
              limitType: 'total'
            };
          })
        ]);
        
        setSubscription(sub);
        setGenerationLimit(limits);
      } catch (error) {
        console.error('Error fetching subscription data:', error);
        setError('Failed to load subscription data');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionAndLimits();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#121212] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <AuthCheck>
      <div className="min-h-screen bg-gray-50 dark:bg-[#121212] py-6 sm:py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-[#171717] shadow rounded-lg">
            <div className="px-4 py-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  Subscription Details
                </h2>
                {subscription?.planName === 'Free' && (
                  <Link href="/pricing">
                    <Button className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600">
                      Upgrade Plan
                    </Button>
                  </Link>
                )}
              </div>

              {error && (
                <div className="mb-4 p-3 text-sm sm:text-base bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <div className="space-y-6">
                {/* Current Plan */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Zap className="h-5 w-5 text-orange-500" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Current Plan
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Plan Name</p>
                      <p className="text-base font-medium text-gray-900 dark:text-white">
                        {subscription?.planName || 'Free'} Plan
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Script Limit</p>
                      <p className="text-base font-medium text-gray-900 dark:text-white">
                        {generationLimit?.remaining}/{generationLimit?.total} {generationLimit?.limitType === 'daily' ? 'per day' : 'total'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Plan Features */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <CreditCard className="h-5 w-5 text-orange-500" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Plan Features
                    </h3>
                  </div>
                  <ul className="space-y-2">
                    {subscription?.planDetails?.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-orange-500"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Billing Info - Only show for paid plans */}
                {subscription?.planName !== 'Free' && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <Calendar className="h-5 w-5 text-orange-500" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Billing Information
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Amount</p>
                        <p className="text-base font-medium text-gray-900 dark:text-white">
                          ₹{subscription?.planDetails?.price || 0}/month
                        </p>
                      </div>
                      {subscription?.currentPeriodEnd && (
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Next Billing Date</p>
                          <p className="text-base font-medium text-gray-900 dark:text-white">
                            {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthCheck>
  );
} 