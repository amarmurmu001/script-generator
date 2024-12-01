"use client";
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { toast } from 'react-hot-toast';

export default function PricingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isAnnual, setIsAnnual] = useState(true);

  const plans = [
    { 
      id: 'plan_starter',
      razorpayPlanId: process.env.NEXT_PUBLIC_RAZORPAY_PLAN_STARTER_ID,
      title: "Starter", 
      price: "₹499",
      monthlyPrice: "₹599",
      features: [
        "50 scripts per month",
        "5 themes",
        "Basic support",
        "24/7 email support",
        "Access to basic templates"
      ],
      popular: false
    },
    { 
      id: 'plan_pro',
      razorpayPlanId: process.env.NEXT_PUBLIC_RAZORPAY_PLAN_PRO_ID,
      title: "Pro", 
      price: "₹1999",
      monthlyPrice: "₹2499",
      features: [
        "Unlimited scripts",
        "All themes",
        "Priority support",
        "Custom themes",
        "Advanced analytics",
        "Custom branding",
        "API access"
      ],
      popular: true
    },
    { 
      id: 'plan_enterprise',
      title: "Enterprise", 
      price: "Custom",
      monthlyPrice: "Custom",
      features: [
        "Unlimited everything",
        "Dedicated account manager",
        "24/7 phone support",
        "Custom integrations",
        "SLA guarantees",
        "Custom features",
        "Onboarding assistance"
      ],
      popular: false
    }
  ];

  const handleSubscribe = async (plan) => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (plan.id === 'plan_enterprise') {
      router.push('/contact');
      return;
    }

    try {
      const response = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: plan.razorpayPlanId,
          userId: user.uid,
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.shortUrl) {
        throw new Error('No checkout URL received');
      }

      // Redirect to Razorpay checkout page
      window.location.href = data.shortUrl;
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error(error.message || 'Failed to create subscription');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Pricing Toggle */}
        <div className="flex flex-col items-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Simple, transparent pricing
          </h1>
          <div className="flex items-center gap-3 bg-gray-100 dark:bg-[#171717] p-1 rounded-lg">
            <span className={`text-sm ${!isAnnual ? 'text-gray-900 dark:text-white font-semibold' : 'text-gray-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                isAnnual ? 'bg-orange-500' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isAnnual ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm ${isAnnual ? 'text-gray-900 dark:text-white font-semibold' : 'text-gray-500'}`}>
              Annual (Save 20%)
            </span>
          </div>
          {isAnnual && (
            <p className="mt-3 text-sm text-orange-500 dark:text-orange-400">
              Save 20% with annual billing
            </p>
          )}
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              className={`relative rounded-2xl bg-white dark:bg-[#171717] shadow-sm transition-all duration-200 ${
                plan.popular ? 'ring-2 ring-orange-500 dark:ring-orange-400' : ''
              }`}
            >
              {plan.popular && (
                <span className="absolute top-0 right-6 -translate-y-1/2 px-3 py-0.5 bg-orange-500 dark:bg-orange-400 text-white text-sm font-medium rounded-full">
                  Popular
                </span>
              )}

              <div className="p-8">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {plan.title}
                </h3>
                <p className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                  {isAnnual ? plan.price : plan.monthlyPrice}
                  {plan.price !== "Custom" && (
                    <span className="text-base font-normal text-gray-500">
                      /{isAnnual ? 'year' : 'month'}
                    </span>
                  )}
                </p>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-3" />
                      <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSubscribe(plan)}
                  className={`w-full ${
                    plan.popular
                      ? 'bg-orange-500 hover:bg-orange-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  disabled={!user}
                >
                  {plan.id === 'plan_enterprise' ? 'Contact Sales' : 'Get Started'}
                </Button>
                {!user && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                    Please login to subscribe
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto space-y-6">
            {[
              {
                question: "How does the billing work?",
                answer: "We offer both monthly and annual billing options. Annual plans come with a 20% discount. You can cancel or change your plan at any time."
              },
              {
                question: "Can I upgrade or downgrade my plan?",
                answer: "Yes, you can upgrade or downgrade your plan at any time. The changes will be reflected in your next billing cycle."
              },
              {
                question: "What payment methods do you accept?",
                answer: "We accept all major credit cards, debit cards, and UPI payments through our secure payment processor, Razorpay."
              }
            ].map((faq, index) => (
              <div
                key={index}
                className="bg-white dark:bg-[#171717] rounded-lg p-6 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {faq.question}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 