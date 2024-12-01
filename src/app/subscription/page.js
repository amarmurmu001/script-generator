"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import AuthCheck from '@/components/auth-check';
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { toast } from 'react-hot-toast';

export default function SubscriptionPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);

  useEffect(() => {
    const fetchSubscriptionAndPayments = async () => {
      if (!user) return;

      try {
        // Fetch subscription
        const subscriptionsRef = collection(db, "subscriptions");
        const q = query(
          subscriptionsRef,
          where("userId", "==", user.uid),
          where("status", "in", ["active", "trialing"])
        );
        
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const subData = querySnapshot.docs[0].data();
          setSubscription({
            ...subData,
            id: querySnapshot.docs[0].id
          });

          // Fetch payment history
          const paymentsRef = collection(db, "payments");
          const paymentsQuery = query(
            paymentsRef,
            where("userId", "==", user.uid),
            where("subscriptionId", "==", querySnapshot.docs[0].id),
            orderBy("createdAt", "desc")
          );

          const paymentsSnapshot = await getDocs(paymentsQuery);
          const payments = paymentsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setPaymentHistory(payments);
        }
      } catch (error) {
        console.error("Error fetching subscription:", error);
        toast.error("Failed to load subscription data");
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionAndPayments();
  }, [user]);

  const handleUpgrade = () => {
    router.push('/pricing');
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;

    try {
      setLoading(true);
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: subscription.id,
          userId: user.uid
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel subscription');
      }

      // Update local state
      setSubscription(prev => ({
        ...prev,
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        planName: 'Free',
        planDetails: {
          name: 'Free',
          limit: 5,
          limitType: 'total'
        }
      }));
      
      toast.success('Subscription cancelled successfully');
      setConfirmCancel(false);
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error(error.message || 'Failed to cancel subscription');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { icon: CheckCircle2, className: "text-orange-500 dark:text-orange-400" },
      cancelled: { icon: XCircle, className: "text-red-500 dark:text-red-400" },
      pending: { icon: AlertCircle, className: "text-yellow-500 dark:text-yellow-400" }
    };
    const BadgeIcon = badges[status]?.icon || AlertCircle;
    return (
      <span className={`flex items-center gap-1 ${badges[status]?.className || ''}`}>
        <BadgeIcon className="w-4 h-4" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <AuthCheck>
      <div className="min-h-screen bg-gray-50 dark:bg-[#121212] py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-[#171717] shadow rounded-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Subscription Management
            </h1>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 dark:border-orange-400"></div>
              </div>
            ) : subscription ? (
              <div className="space-y-6">
                {/* Current Plan Details */}
                <div className="p-6 bg-gray-50 dark:bg-[#202020] rounded-lg">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                        Current Plan
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {subscription.planName || 'Free Plan'}
                      </p>
                    </div>
                    {getStatusBadge(subscription.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Billing Period</p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {subscription.interval || 'Monthly'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Next Payment</p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {subscription.currentPeriodEnd ? 
                          new Date(subscription.currentPeriodEnd).toLocaleDateString() : 
                          'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Amount</p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        ₹{subscription.amount || '0'}/month
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {subscription.status || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-4">
                    {subscription.status === 'active' && (
                      <>
                        <Button
                          onClick={handleUpgrade}
                          className="bg-orange-500 hover:bg-orange-600 text-white"
                        >
                          Upgrade Plan
                        </Button>
                        <div>
                          {!confirmCancel ? (
                            <Button
                              onClick={() => setConfirmCancel(true)}
                              variant="destructive"
                              className="bg-red-500 hover:bg-red-600 text-white"
                            >
                              Cancel Subscription
                            </Button>
                          ) : (
                            <div className="mt-4 p-4 border rounded-lg bg-red-50 dark:bg-red-900/20">
                              <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                                Are you sure you want to cancel your subscription? You'll lose access to premium features.
                              </p>
                              <div className="flex space-x-4">
                                <Button
                                  onClick={handleCancelSubscription}
                                  variant="destructive"
                                  className="bg-red-500 hover:bg-red-600 text-white"
                                  disabled={loading}
                                >
                                  {loading ? 'Cancelling...' : 'Yes, Cancel'}
                                </Button>
                                <Button
                                  onClick={() => setConfirmCancel(false)}
                                  variant="outline"
                                  disabled={loading}
                                >
                                  No, Keep Subscription
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                    {subscription.status === 'cancelled' && (
                      <Button
                        onClick={handleUpgrade}
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                      >
                        Resubscribe
                      </Button>
                    )}
                  </div>
                </div>

                {/* Payment History */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Payment History
                  </h2>
                  <div className="bg-gray-50 dark:bg-[#202020] rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-100 dark:bg-[#171717]">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {paymentHistory.length > 0 ? (
                            paymentHistory.map((payment) => (
                              <tr key={payment.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                                  {new Date(payment.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                                  ₹{payment.amount}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  {getStatusBadge(payment.status)}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                No payment history available
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400 mb-4">No active subscription found</p>
                <Button
                  onClick={() => router.push('/pricing')}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  View Plans
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthCheck>
  );
} 