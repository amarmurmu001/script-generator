"use client"
import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BrainCircuit, Wand2, Rocket, Zap, Menu, X } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <div className="flex items-center flex-col min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between mx-auto"> {/* Keep justify-between for spacing */}
          <div className="flex items-center space-x-2"> {/* Group logo items */}
            <BrainCircuit className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">ScriptGenius</span>
          </div>
          <nav className="hidden md:flex gap-6 flex-grow justify-center"> {/* Center nav items */}
            <Link className="text-sm font-medium hover:text-primary transition-colors" href="#features">
              Features
            </Link>
            <Link className="text-sm font-medium hover:text-primary transition-colors" href="#pricing">
              Pricing
            </Link>
            <Link className="text-sm font-medium hover:text-primary transition-colors" href="#faq">
              FAQ
            </Link>
          </nav>
          <div className="flex items-center"> {/* Group buttons */}
            <Link href="/scriptgenerator">
              <Button size="lg" className="bg-black text-white hover:bg-gray-900">Get Started</Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </header>
      {isMenuOpen && (
        <div className="md:hidden">
          <nav className="flex flex-col items-center py-4 bg-background">
            <Link className="py-2 text-sm font-medium hover:text-primary transition-colors" href="#features">
              Features
            </Link>
            <Link className="py-2 text-sm font-medium hover:text-primary transition-colors" href="#pricing">
              Pricing
            </Link>
            <Link className="py-2 text-sm font-medium hover:text-primary transition-colors" href="#faq">
              FAQ
            </Link>
            <Link href="/scriptgenerator">
              <Button className="mt-4">Get Started</Button>
            </Link>
          </nav>
        </div>
      )}
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-r from-purple-700 to-indigo-800 text-white">
          <div className="container px-4 md:px-6">
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
                <p className="mx-auto max-w-[700px] text-lg md:text-xl text-gray-200">
                  ScriptGenius uses AI to generate captivating video scripts for your content. Save time, boost
                  engagement, and never run out of ideas.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="space-x-4"
              >
                <Link href="/scriptgenerator">
                  <Button size="lg" className="bg-white text-purple-700 hover:bg-gray-100">Get Started</Button>
                </Link>
                <Button size="lg" variant="outline" className="text-white bg-purple border-white hover:bg-white/10 hover:text-white">Learn More</Button>
              </motion.div>
            </div>
          </div>
        </section>
        <section id="features" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12">Key Features</h2>
            <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-3">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow-lg dark:bg-gray-800"
              >
                <Wand2 className="h-12 w-12 mb-4 text-purple-600" />
                <h3 className="text-xl font-bold mb-2">AI-Powered Generation</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Our advanced AI creates unique, engaging scripts tailored to your needs.
                </p>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow-lg dark:bg-gray-800"
              >
                <Zap className="h-12 w-12 mb-4 text-purple-600" />
                <h3 className="text-xl font-bold mb-2">Lightning Fast</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Generate scripts in seconds, not hours. Save time and boost productivity.
                </p>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow-lg dark:bg-gray-800"
              >
                <Rocket className="h-12 w-12 mb-4 text-purple-600" />
                <h3 className="text-xl font-bold mb-2">Customizable Themes</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Choose from a variety of themes or create your own for perfectly tailored content.
                </p>
              </motion.div>
            </div>
          </div>
        </section>
        <section id="pricing" className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-900">
          <div className="container px-4 md:px-6">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12">Simple Pricing</h2>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <motion.div
                whileHover={{ scale: 1.03 }}
                className="flex flex-col p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg"
              >
                <h3 className="text-2xl font-bold mb-4">Starter</h3>
                <p className="text-4xl font-bold mb-4">$9<span className="text-xl font-normal">/month</span></p>
                <ul className="mb-6 space-y-2">
                  <li className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    50 scripts per month
                  </li>
                  <li className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    5 themes
                  </li>
                  <li className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Basic support
                  </li>
                </ul>
                <Link href="/scriptgenerator">
                  <Button className="mt-auto">Choose Plan</Button>
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.03 }}
                className="flex flex-col p-6 bg-purple-600 text-white rounded-lg shadow-lg"
              >
                <h3 className="text-2xl font-bold mb-4">Pro</h3>
                <p className="text-4xl font-bold mb-4">$29<span className="text-xl font-normal">/month</span></p>
                <ul className="mb-6 space-y-2">
                  <li className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Unlimited scripts
                  </li>
                  <li className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    All themes
                  </li>
                  <li className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Priority support
                  </li>
                  <li className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Custom themes
                  </li>
                </ul>
                <Link href="/scriptgenerator">
                  <Button className="mt-auto bg-white text-purple-600 hover:bg-gray-100">Choose Plan</Button>
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.03 }}
                className="flex flex-col p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg"
              >
                <h3 className="text-2xl font-bold mb-4">Enterprise</h3>
                <p className="text-4xl font-bold mb-4">Custom</p>
                <ul className="mb-6 space-y-2">
                  <li className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Unlimited everything
                  </li>
                  <li className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Dedicated account manager
                  </li>
                  <li className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    24/7 phone support
                  </li>
                  <li className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Custom integrations
                  </li>
                </ul>
                <Link href="/scriptgenerator">
                  <Button variant="outline" className="mt-auto">Contact Sales</Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </section>
        <section id="cta" className="w-full py-12 md:py-24 lg:py-32 bg-purple-700 text-white">
          <div className="container px-4 md:px-6">
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
                  <Input className="max-w-lg flex-1 bg-white/10 text-white placeholder-gray-300" placeholder="Enter your email" type="email" />
                  <Link href="/scriptgenerator">
                    <Button type="submit" className="bg-white text-purple-700 hover:bg-gray-100">Get Started</Button>
                  </Link>
                </form>
                <p className="text-xs text-gray-300">
                  Start your free 14-day trial. No credit card required.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="py-6 w-full shrink-0 border-t bg-background">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 px-4 md:px-6">
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