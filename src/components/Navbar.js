"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/lib/auth-context';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BrainCircuit, Menu, X, Moon, Sun, User, LogOut } from "lucide-react";
import { motion } from "framer-motion";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#121212] backdrop-blur">
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
              className="mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-white"
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {user ? (
              <div className="flex items-center gap-4">
                <DropdownMenu>
                  <DropdownMenuTrigger className="focus:outline-none">
                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-orange-500">
                      {user.photoURL ? (
                        <Image
                          src={user.photoURL}
                          alt="Profile"
                          width={32}
                          height={32}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-orange-500 flex items-center justify-center">
                          <span className="text-white text-sm">
                            {user.email?.[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={logout}
                      className="text-red-600 focus:text-red-600"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-4">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-gray-400 hover:text-gray-600 dark:hover:text-white"
              onClick={() => setIsMenuOpen((prev) => !prev)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="md:hidden overflow-hidden w-full bg-white dark:bg-[#121212] border-b border-gray-200 dark:border-gray-800"
        >
          <nav className="flex flex-col items-center py-4">
            {["Features", "Pricing", "FAQ"].map((item) => (
              <Link 
                key={item} 
                className="py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors w-full text-center" 
                href={`/#${item.toLowerCase()}`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item}
              </Link>
            ))}
            {!user && (
              <div className="w-full px-4 mt-4 space-y-2">
                <Link href="/login" className="block">
                  <Button variant="outline" className="w-full">
                    Login
                  </Button>
                </Link>
                <Link href="/signup" className="block">
                  <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </nav>
        </motion.div>
      )}
    </>
  );
} 