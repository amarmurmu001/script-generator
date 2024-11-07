"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Wand2, Rocket, Zap, ChevronDown, ChevronUp } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useAuth } from '@/lib/auth-context'

export default function LandingPage() {
  const [email, setEmail] = useState("")
  const [isValid, setIsValid] = useState(true)
  const [openFaq, setOpenFaq] = useState(null)
  const { user } = useAuth();

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

  return (
    <div className={cn(
      "flex flex-col min-h-screen",
      "bg-gradient-to-b from-gray-50 to-white",
      "dark:from-gray-900 dark:to-gray-800",
      "text-gray-900 dark:text-gray-100",
      "transition-colors duration-300"
    )}>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-r from-orange-500 to-orange-700 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="flex flex-col items-center space-y-4 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-2"
              >
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
                  Create Engaging Video Scripts in Minutes
                </h1>
                <p className="mx-auto max-w-[600px] text-gray-200 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Transform your content creation with AI-powered script generation
                </p>
              </motion.div>
              {!user && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="space-x-4"
                >
                  <Link href="/signup">
                    <Button size="lg" className="bg-white text-orange-600 hover:bg-gray-100">
                      Get Started
                    </Button>
                  </Link>
                </motion.div>
              )}
              {user && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="space-x-4"
                >
                  <Link href="/scriptgenerator">
                    <Button size="lg" className="bg-white text-orange-600 hover:bg-gray-100">
                      Go to Script Generator
                    </Button>
                  </Link>
                </motion.div>
              )}
            </div>
          </div>
        </section>
        <section id="features" className="w-full py-12 md:py-24 lg:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12">Key Features</h2>
            <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-3">
              {[
                { icon: Wand2, title: "AI-Powered Generation", description: "Our advanced AI creates unique, engaging scripts tailored to your needs." },
                { icon: Zap, title: "Lightning Fast", description: "Generate scripts in seconds, not hours. Save time and boost productivity." },
                { icon: Rocket, title: "Customizable Themes", description: "Choose from a variety of themes or create your own for perfectly tailored content." }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow-lg dark:bg-gray-800"
                >
                  <feature.icon className="h-12 w-12 mb-4 text-orange-500 dark:text-orange-400" />
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        <section id="pricing" className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12">Simple Pricing</h2>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { title: "Starter", price: "$9", features: ["50 scripts per month", "5 themes", "Basic support"] },
                { title: "Pro", price: "$29", features: ["Unlimited scripts", "All themes", "Priority support", "Custom themes"] },
                { title: "Enterprise", price: "Custom", features: ["Unlimited everything", "Dedicated account manager", "24/7 phone support", "Custom integrations"] }
              ].map((plan, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.03 }}
                  className={cn(
                    "flex flex-col p-6 rounded-lg shadow-lg",
                    index === 1 ? "bg-orange-500 text-white" : "bg-white dark:bg-gray-800"
                  )}
                >
                  <h3 className="text-2xl font-bold mb-4">{plan.title}</h3>
                  <p className="text-4xl font-bold mb-4">{plan.price}<span className="text-xl font-normal">{plan.price !== "Custom" && "/month"}</span></p>
                  <ul className="mb-6 space-y-2">
                    {plan.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-center">
                        <svg
                          className={cn(
                            "w-4 h-4 mr-2",
                            index === 1 ? "text-white" : "text-green-500"
                          )}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link href="/scriptgenerator" className="mt-auto">
                    <Button className={cn(
                      "w-full",
                      index === 1 ? "bg-white text-orange-500 hover:bg-gray-100" : 
                      (index === 2 ? "bg-orange-500 text-white hover:bg-orange-600" : "")
                    )}>
                      {index === 2 ? "Contact Sales" : "Choose Plan"}
                    </Button>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        <section id="faq" className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12">
              Frequently Asked Questions
            </h2>
            <div className="max-w-3xl mx-auto space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full px-6 py-4 flex justify-between items-center text-left"
                  >
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                      {faq.question}
                    </h3>
                    {openFaq === index ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
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
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
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
      <footer className="py-6 w-full shrink-0 border-t bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            © 2024 ScriptGenius. All rights reserved.
          </p>
          <nav className="flex gap-4 sm:gap-6">
            <Link className="text-xs hover:underline underline-offset-4" href="#">
              Terms of Service
            </Link>
            <Link className="text-xs hover:underline underline-offset-4" href="#">
              Privacy Policy
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}