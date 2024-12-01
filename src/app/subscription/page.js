"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getUserSubscription, cancelSubscription } from '@/lib/subscription';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useRouter } from 'next/navigation';
import AuthCheck from '@/components/auth-check';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    async function fetchSubscription() {
      if (user) {
        try {
          setLoading(true);
          const sub = await getUserSubscription(user.uid);
          setSubscription(sub);
          
          // Check if this is a redirect from payment
          const urlParams = new URLSearchParams(window.location.search);
          const razorpayPaymentId = urlParams.get('razorpay_payment_id');
          const razorpaySubscriptionId = urlParams.get('razorpay_subscription_id');
          const razorpaySignature = urlParams.get('razorpay_signature');
          
          if (razorpayPaymentId && razorpaySubscriptionId && razorpaySignature) {
            try {
              // Verify the payment
              const response = await fetch('/api/verify-payment', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  paymentId: razorpayPaymentId,
                  subscriptionId: razorpaySubscriptionId,
                  signature: razorpaySignature
                }),
              });

              if (response.ok) {
                toast.success('Subscription activated successfully!');
                // Refresh the subscription data after a short delay
                setTimeout(async () => {
                  const updatedSub = await getUserSubscription(user.uid);
                  setSubscription(updatedSub);
                }, 2000);
              } else {
                toast.error('Error verifying payment');
              }
            } catch (error) {
              console.error('Error verifying payment:', error);
              toast.error('Error verifying payment');
            }
          }
        } catch (error) {
          console.error('Error fetching subscription:', error);
          toast.error('Error loading subscription details');
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

  const handleCancelSubscription = async () => {
    if (!subscription) return;

    try {
      // Call Razorpay API to cancel subscription
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: subscription.subscriptionId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      // Update local state
      setSubscription(prev => ({
        ...prev,
        status: 'cancelled'
      }));

    } catch (error) {
      console.error('Error cancelling subscription:', error);
      // Handle error (show error message to user)
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <AuthCheck>
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-3xl font-bold mb-8">Subscription Management</h1>
        
        {subscription ? (
          <Card>
            <CardHeader>
              <CardTitle>Current Subscription</CardTitle>
              <CardDescription>
                Status: <span className="capitalize">{subscription.status}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <strong>Plan:</strong> {subscription.planId}
                </div>
                {subscription.currentPeriodEnd && (
                  <div>
                    <strong>Renews on:</strong> {format(new Date(subscription.currentPeriodEnd), 'PPP')}
                  </div>
                )}
                <div>
                  <strong>Status:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded-full text-sm ${
                    subscription.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {subscription.status}
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="space-x-4">
              {subscription.status === 'active' && (
                <Button 
                  onClick={handleCancelSubscription}
                  variant="destructive"
                >
                  Cancel Subscription
                </Button>
              )}
              <Button 
                onClick={handleManageSubscription}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {subscription.status === 'active' ? 'Manage Subscription' : 'View Plans'}
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No Active Subscription</CardTitle>
              <CardDescription>
                Subscribe to access premium features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Choose a subscription plan to get started with our premium features.</p>
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