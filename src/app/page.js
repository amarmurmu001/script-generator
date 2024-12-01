"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Wand2, Rocket, Zap, ChevronDown, ChevronUp, Check } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'

export default function LandingPage() {
  const [email, setEmail] = useState("")
  const [isValid, setIsValid] = useState(true)
  const [openFaq, setOpenFaq] = useState(null)
  const { user } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false)
  const router = useRouter();

  useEffect(() => {
    // Initial theme check
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);

    // Create observer for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const isDark = document.documentElement.classList.contains('dark');
          setIsDarkMode(isDark);
        }
      });
    });

    // Start observing
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    // Cleanup
    return () => observer.disconnect();
  }, []);

  const handleEmailChange = (e) => {
    setEmail(e.target.value)
    setIsValid(e.target.checkValidity())
  }

  const faqs = [
    {
      question: "What is ScriptGenius?",
      answer: "ScriptGenius is an AI-powered script generation tool designed specifically for creating engaging YouTube Shorts CTA scripts. It helps content creators save time and maintain consistency in their content."
    },
    {
      question: "How does the script generation work?",
      answer: "Simply enter your theme, title, or keyword, and our AI will generate a customized script optimized for YouTube Shorts. You can then edit, regenerate, or convert the script to audio as needed."
    },
    {
      question: "Can I customize the generated scripts?",
      answer: "Yes! You can edit any generated script to match your style and preferences. You can also regenerate scripts until you get the perfect content for your needs."
    },
    {
      question: "What about the audio feature?",
      answer: "ScriptGenius includes a text-to-speech feature with multiple voice options. You can convert any script to audio, making it perfect for voice-overs in your YouTube Shorts."
    },
    {
      question: "Is there a limit to how many scripts I can generate?",
      answer: "During the 14-day free trial, you can generate up to 50 scripts. After that, our pricing plans are designed to accommodate different content creation needs."
    }
  ]

  const plans = [
    { 
      id: 'plan_starter',
      razorpayPlanId: process.env.NEXT_PUBLIC_RAZORPAY_PLAN_STARTER_ID,
      title: "Starter", 
      price: "₹499",
      description: "Perfect for individuals getting started",
      features: [
        "50 scripts per month",
        "5 themes",
        "Basic support",
        "24/7 email support",
        "Access to basic templates"
      ],
      accent: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10"
    },
    { 
      id: 'plan_pro',
      razorpayPlanId: process.env.NEXT_PUBLIC_RAZORPAY_PLAN_PRO_ID,
      title: "Pro", 
      price: "₹1999",
      description: "Best for professionals and growing teams",
      features: [
        "Unlimited scripts",
        "All themes",
        "Priority support",
        "Custom themes",
        "Advanced analytics",
        "Custom branding",
        "API access"
      ],
      popular: true,
      accent: "bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/10"
    },
    { 
      id: 'plan_enterprise',
      title: "Enterprise", 
      price: "Custom",
      description: "Custom solutions for large organizations",
      features: [
        "Unlimited everything",
        "Dedicated account manager",
        "24/7 phone support",
        "Custom integrations",
        "SLA guarantees",
        "Custom features",
        "Onboarding assistance"
      ],
      accent: "bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10"
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

      // Store the return URL in localStorage before redirecting
      localStorage.setItem('subscription_return_url', '/subscription');

      // Redirect to Razorpay checkout page
      window.location.href = data.shortUrl;
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error(error.message || 'Failed to create subscription', {
        style: {
          border: '1px solid #f87171',
          padding: '16px',
          color: '#ef4444',
          backgroundColor: isDarkMode ? '#1f2937' : '#fff',
        },
        iconTheme: {
          primary: '#ef4444',
          secondary: '#fff',
        },
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1">
        <section className="relative py-24 overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-transparent" />
            <div className="grid grid-cols-6 gap-6 h-full w-full opacity-20">
              {[...Array(24)].map((_, i) => (
                <div key={i} className="aspect-square bg-orange-500/10 rounded-lg transform hover:scale-105 transition-transform" />
              ))}
            </div>
          </div>

          <div className="container mx-auto">
            <div className="flex flex-col items-center space-y-8 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-4 max-w-3xl"
              >
                <span className="inline-block text-sm font-medium text-orange-500 dark:text-orange-400 mb-2">
                  The future of content creation
                </span>
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
                  Essential tools for <br />
                  <span className="text-gradient">world-changers</span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-[600px] mx-auto">
                  Essential tools that will be provided to empower change-makers to create better content
                </p>
              </motion.div>

              {!user ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="flex flex-col sm:flex-row gap-4"
                >
                  <Link href="/signup">
                    <Button size="lg" className="bg-orange-500 text-white hover:bg-orange-600 min-w-[200px]">
                      Request a Demo
                    </Button>
                  </Link>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Link href="/scriptgenerator">
                    <Button size="lg" className="bg-orange-500 text-white hover:bg-orange-600 min-w-[200px]">
                      Go to Script Generator
                    </Button>
                  </Link>
                </motion.div>
              )}
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="relative rounded-2xl overflow-hidden w-[80%] mx-auto [box-shadow:0_-20px_30px_-15px_rgba(0,0,0,0.1)]"
            >
              <div 
                className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background via-background/80 to-transparent z-10" 
              />
              <img 
                src={isDarkMode ? "/image.png" : "/light.png"}
                alt="ScriptGenius Dashboard" 
                className="w-full h-auto rounded-2xl border border-gray-200 dark:border-gray-800 transition-opacity duration-300"
                key={isDarkMode ? "dark" : "light"}
              />
            </motion.div>
          </div>
        </section>

        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-background">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12 text-gradient">
              Key Features
            </h2>
            <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-3">
              {[
                { icon: Wand2, title: "AI-Powered Generation", description: "Our advanced AI creates unique, engaging scripts tailored to your needs." },
                { icon: Zap, title: "Lightning Fast", description: "Generate scripts in seconds, not hours. Save time and boost productivity." },
                { icon: Rocket, title: "Customizable Themes", description: "Choose from a variety of themes or create your own for perfectly tailored content." }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  className="flex flex-col items-center text-center p-6 bg-card rounded-lg glow"
                >
                  <feature.icon className="h-12 w-12 mb-4 text-gradient" />
                  <h3 className="text-xl font-bold mb-2 text-gradient">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        <section id="pricing" className="py-24 bg-gray-50 dark:bg-[#121212]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Simple, transparent pricing
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Choose the perfect plan for your needs. All plans include a 14-day free trial.
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl overflow-hidden transition-transform duration-300 hover:scale-[1.02] ${
                    plan.popular ? 'ring-2 ring-orange-500 dark:ring-orange-400' : ''
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 left-0 right-0 flex justify-center">
                      <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-1 rounded-b-lg text-sm font-medium shadow-lg">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <div className={`p-8 ${plan.accent} h-full flex flex-col ${plan.popular ? 'pt-12' : ''}`}>
                    <div className="mb-6">
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {plan.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {plan.description}
                      </p>
                    </div>

                    <div className="mb-6">
                      <p className="text-4xl font-bold text-gray-900 dark:text-white">
                        {plan.price}
                        {plan.price !== "Custom" && (
                          <span className="text-lg font-normal text-gray-600 dark:text-gray-400">
                            /month
                          </span>
                        )}
                      </p>
                    </div>

                    <ul className="space-y-4 mb-8 flex-grow">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <div className="rounded-full p-1 bg-orange-100 dark:bg-orange-900/20 mr-3 flex-shrink-0">
                            <Check className="h-4 w-4 text-orange-500 dark:text-orange-400" />
                          </div>
                          <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      onClick={() => handleSubscribe(plan)}
                      className={`w-full ${
                        plan.popular
                          ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg'
                          : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                      }`}
                      disabled={!user}
                    >
                      {plan.id === 'plan_enterprise' ? 'Contact Sales' : 'Get Started'}
                    </Button>
                    {!user && (
                      <p className="text-xs text-center mt-2 text-gray-500 dark:text-gray-400">
                        Please login to subscribe
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section id="faq" className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-[#121212]">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12">
              Frequently Asked Questions
            </h2>
            <div className="max-w-3xl mx-auto space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-[#171717] rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full px-6 py-4 flex justify-between items-center text-left"
                  >
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                      {faq.question}
                    </h3>
                    {openFaq === index ? (
                      <ChevronUp className="w-5 h-5 text-white" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-white" />
                    )}
                  </button>
                  {openFaq === index && (
                    <div className="px-6 pb-4">
                      <p className="text-gray-600 dark:text-gray-300">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
        {!user && (
          <section id="cta" className="w-full py-12 md:py-24 lg:py-32 bg-orange-500 dark:bg-orange-600 text-white">
            <div className="container mx-auto">
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                    Ready to Transform Your Content?
                  </h2>
                  <p className="mx-auto max-w-[600px] text-gray-200 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    Join thousands of content creators who are already using ScriptGenius to create engaging video scripts.
                  </p>
                </div>
                <div className="w-full max-w-sm space-y-2">
                  <form className="flex space-x-2">
                    <Input
                      id="email"
                      className={cn(
                        "flex-1 bg-white/10 text-white placeholder-white/50 border-white/20",
                        "focus:border-white focus:ring-2 focus:ring-white focus:ring-opacity-50",
                        "transition-all duration-200 ease-in-out",
                        !isValid && "border-red-500 focus:border-red-500 focus:ring-red-500"
                      )}
                      placeholder="Enter your email"
                      type="email"
                      value={email}
                      onChange={handleEmailChange}
                      required
                      aria-invalid={!isValid}
                      aria-describedby="email-error"
                    />
                    <Button type="submit" className="bg-white text-purple-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-purple-400 dark:hover:bg-gray-700">
                      Get Started
                    </Button>
                  </form>
                  <p className="text-xs text-gray-300">
                    Start your free 14-day trial. No credit card required.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
      <footer className="py-12 w-full bg-[#121212] text-white">
        <div className="container mx-auto">
          {/* Top Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {/* Brand Column */}
            <div>
              <Link href="/" className="inline-block mb-6">
                <span className="text-2xl font-bold text-white">
                  ScriptGenius
                </span>
              </Link>
              <p className="text-gray-300 text-sm">
                Transform your content creation with AI-powered script generation
              </p>
            </div>

            {/* Products Column */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">
                Products
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/#features" className="text-gray-300 hover:text-white transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/#pricing" className="text-gray-300 hover:text-white transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/#faq" className="text-gray-300 hover:text-white transition-colors">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal Column */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">
                Legal
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/privacy" className="text-gray-300 hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-gray-300 hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>

            {/* Want to buy? Column */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">
                Want to buy?
              </h3>
              <Link 
                href="/signup" 
                className="inline-block px-6 py-2 bg-white text-[#1B3530] rounded-full font-medium hover:bg-gray-100 transition-colors"
              >
                Request a Demo
              </Link>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-300">
              © 2024 ScriptGenius. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-sm text-gray-300 hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-sm text-gray-300 hover:text-white transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}