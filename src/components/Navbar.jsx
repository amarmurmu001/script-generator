"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { BrainCircuit, Menu, X, Moon, Sun } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true'
    setIsDarkMode(isDark)
    document.documentElement.classList.toggle('dark', isDark)
  }, [])

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode
    setIsDarkMode(newDarkMode)
    localStorage.setItem('darkMode', newDarkMode.toString())
    document.documentElement.classList.toggle('dark', newDarkMode)
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0B0F1A]/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex h-16 items-center justify-between">
          <div className="flex items-center space-x-2">
            <Link href="/" className="flex items-center space-x-2">
              <BrainCircuit className="h-6 w-6 text-orange-500" />
              <span className="font-bold text-xl text-gray-900 dark:text-white">ScriptGenius</span>
            </Link>
          </div>
          <nav className="hidden md:flex gap-6 flex-grow justify-center">
            {["Features", "Pricing", "FAQ"].map((item) => (
              <Link 
                key={item} 
                className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors relative group py-2" 
                href={`/#${item.toLowerCase()}`}
              >
                {item}
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 ease-out"></span>
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="mr-2 text-gray-400 hover:text-white"
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Link href="/scriptgenerator" className="hidden md:block">
              <Button size="lg" className="bg-orange-500 text-white hover:bg-orange-600">Get Started</Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-gray-400 hover:text-white"
              onClick={() => setIsMenuOpen((prev) => !prev)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </header>
      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="md:hidden overflow-hidden w-full bg-[#0B0F1A] border-b border-gray-800"
        >
          <nav className="flex flex-col items-center py-4">
            {["Features", "Pricing", "FAQ"].map((item) => (
              <Link 
                key={item} 
                className="py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors w-full text-center" 
                href={`/#${item.toLowerCase()}`}
              >
                {item}
              </Link>
            ))}
            <Link href="/scriptgenerator" className="w-full px-4 mt-4">
              <Button className="w-full bg-orange-500 text-white hover:bg-orange-600">Get Started</Button>
            </Link>
          </nav>
        </motion.div>
      )}
    </>
  )
} 