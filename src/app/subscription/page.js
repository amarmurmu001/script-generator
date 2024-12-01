"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getUserSubscription } from '@/lib/subscription';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useRouter } from 'next/navigation';
import AuthCheck from '@/components/auth-check';
import { format } from 'date-fns';

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    async function fetchSubscription() {
      if (user) {
        try {
          const sub = await getUserSubscription(user.uid);
          setSubscription(sub);
        } catch (error) {
          console.error('Error fetching subscription:', error);
        } finally {
          setLoading(false);
        }
      }
    }

    fetchSubscription();
  }, [user]);

  const handleManageSubscription = () => {
    router.push('/pricing');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <AuthCheck>
      <div className="container mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-8">Subscription Management</h1>
        
        {subscription ? (
          <Card>
            <CardHeader>
              <CardTitle>Current Subscription</CardTitle>
              <CardDescription>Your subscription details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium">Status</p>
                <p className="capitalize">{subscription.status}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Plan</p>
                <p>{subscription.planId}</p>
              </div>
              {subscription.currentPeriodEnd && (
                <div>
                  <p className="text-sm font-medium">Renews On</p>
                  <p>{format(new Date(subscription.currentPeriodEnd), 'PPP')}</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                onClick={handleManageSubscription}
              >
                Manage Subscription
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No Active Subscription</CardTitle>
              <CardDescription>Choose a plan to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <p>You currently don't have an active subscription.</p>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleManageSubscription}
                className="bg-orange-500 hover:bg-orange-600"
              >
                View Plans
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </AuthCheck>
  );
} 