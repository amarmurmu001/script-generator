"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Wand2, Rocket, Zap, ChevronDown, ChevronUp, Check, BrainCircuit, Mail, MapPin, Twitter, Linkedin, Youtube, Heart } from "lucide-react"
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
          <div className="container px-4 mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-12 md:mb-20">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-4 text-gradient">
                Powerful Features for Content Creators
              </h2>
              <p className="text-lg text-muted-foreground">
                Everything you need to create engaging YouTube Shorts scripts quickly and efficiently
              </p>
            </div>

            <div className="grid gap-8 sm:gap-12 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: Wand2,
                  title: "AI-Powered Generation",
                  description: "Create compelling scripts in seconds using advanced AI technology that understands your content style and audience preferences.",
                  benefits: ["Contextual understanding", "Style matching", "Tone adaptation"]
                },
                {
                  icon: Zap,
                  title: "Lightning Fast Workflow",
                  description: "Generate, edit, and convert scripts to audio all in one place. Save hours of work with our streamlined content creation process.",
                  benefits: ["Instant generation", "Quick editing", "Batch processing"]
                },
                {
                  icon: Rocket,
                  title: "Customizable Themes",
                  description: "Choose from a variety of pre-built themes or create your own custom templates to maintain consistent branding across all your content.",
                  benefits: ["Multiple templates", "Brand consistency", "Easy customization"]
                },
                {
                  icon: () => (
                    <svg className="h-8 w-8 text-orange-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ),
                  title: "Advanced Settings",
                  description: "Fine-tune your scripts with advanced settings for tone, style, length, and more. Perfect for creating content that resonates with your audience.",
                  benefits: ["Voice customization", "Length control", "Style settings"]
                },
                {
                  icon: () => (
                    <svg className="h-8 w-8 text-orange-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 8V16M8 12H16M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ),
                  title: "Script Library",
                  description: "Build and manage your personal library of scripts. Save, categorize, and reuse your best-performing content for future videos.",
                  benefits: ["Easy organization", "Quick access", "Version history"]
                },
                {
                  icon: () => (
                    <svg className="h-8 w-8 text-orange-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 11L12 14L22 4M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ),
                  title: "Analytics & Insights",
                  description: "Track your script performance with detailed analytics. Understand what works best for your audience and optimize your content strategy.",
                  benefits: ["Performance tracking", "Audience insights", "Content optimization"]
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex flex-col p-6 bg-card rounded-xl border border-gray-200 dark:border-gray-800 hover:border-orange-500 dark:hover:border-orange-500 transition-colors duration-200"
                >
                  <div className="rounded-full w-14 h-14 flex items-center justify-center bg-orange-500/10 dark:bg-orange-500/20 mb-6">
                    {typeof feature.icon === 'function' ? feature.icon() : <feature.icon className="h-8 w-8 text-orange-500" />}
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4 flex-grow">
                    {feature.description}
                  </p>
                  <ul className="space-y-2">
                    {feature.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Check className="h-4 w-4 text-orange-500 mr-2 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
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
      <footer className="w-full bg-[#121212] text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 gap-8 py-12 md:grid-cols-2 lg:grid-cols-5 lg:gap-12">
            {/* Brand Column */}
            <div className="lg:col-span-2">
              <Link href="/" className="inline-flex items-center space-x-2 mb-6">
                <BrainCircuit className="h-6 w-6 text-orange-500" />
                <span className="text-2xl font-bold text-white">
                  ScriptGenius
                </span>
              </Link>
              <p className="text-gray-300 text-sm mb-6 max-w-md">
                Transform your content creation process with AI-powered script generation. Create engaging YouTube Shorts scripts in seconds.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-orange-500" />
                  <a href="mailto:support@scriptgenius.com" className="text-gray-300 hover:text-white transition-colors">
                    support@scriptgenius.com
                  </a>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-orange-500" />
                  <span className="text-gray-300">
                    Mumbai, India
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">
                Quick Links
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
                <li>
                  <Link href="/blog" className="text-gray-300 hover:text-white transition-colors">
                    Blog
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
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
                <li>
                  <Link href="/cookies" className="text-gray-300 hover:text-white transition-colors">
                    Cookie Policy
                  </Link>
                </li>
                <li>
                  <Link href="/gdpr" className="text-gray-300 hover:text-white transition-colors">
                    GDPR
                  </Link>
                </li>
              </ul>
            </div>

            {/* Social & Newsletter */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">
                Stay Connected
              </h3>
              {/* Social Links */}
              <div className="flex space-x-4 mb-6">
                <a 
                  href="https://twitter.com/scriptgenius" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Twitter className="h-6 w-6" />
                  <span className="sr-only">Twitter</span>
                </a>
                <a 
                  href="https://linkedin.com/company/scriptgenius" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Linkedin className="h-6 w-6" />
                  <span className="sr-only">LinkedIn</span>
                </a>
                <a 
                  href="https://youtube.com/@scriptgenius" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Youtube className="h-6 w-6" />
                  <span className="sr-only">YouTube</span>
                </a>
              </div>
              {/* Newsletter */}
              <div>
                <h4 className="text-sm font-medium text-white mb-3">
                  Subscribe to our newsletter
                </h4>
                <form className="flex flex-col space-y-2">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                    Subscribe
                  </Button>
                </form>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 py-6">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <p className="text-sm text-gray-400">
                © {new Date().getFullYear()} ScriptGenius. All rights reserved.
              </p>
              <div className="flex items-center space-x-4">
                <Link href="/sitemap" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Sitemap
                </Link>
                <Link href="/accessibility" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Accessibility
                </Link>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">Made with</span>
                  <Heart className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-gray-400">in India</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}