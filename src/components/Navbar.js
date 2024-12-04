"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/lib/auth-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { BrainCircuit, Menu, X, Moon, Sun, User, LogOut, CreditCard, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useSubscription } from '@/lib/subscription-context';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { subscription, limits, updateSubscriptionData } = useSubscription();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (user) {
      updateSubscriptionData(user.uid);
    }
  }, [user, updateSubscriptionData]);

  // Use subscription and limits from context instead of local state
  const remainingScripts = limits?.remaining || 0;
  const totalScripts = limits?.total || 0;
  const planName = subscription?.planName || 'Free';

  // Handle dark mode
  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(isDark);
    document.documentElement.classList.toggle('dark', isDark);

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

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#121212] backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex h-14 sm:h-16 items-center justify-between">
          <div className="flex items-center space-x-2">
            <Link href="/" className="flex items-center space-x-2">
              <BrainCircuit className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
              <span className="font-bold text-lg sm:text-xl text-gray-900 dark:text-white">ScriptGenius</span>
            </Link>
          </div>

          <nav className="hidden md:flex gap-4 lg:gap-6 flex-grow justify-center">
            {["Features", "Pricing", "FAQ"].map((item) => (
              <Link 
                key={item} 
                className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors relative group py-2 px-1" 
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
              className="h-8 w-8 sm:h-9 sm:w-9 text-gray-400 hover:text-white dark:hover:text-white"
            >
              {isDarkMode ? <Sun className="h-4 w-4 sm:h-5 sm:w-5" /> : <Moon className="h-4 w-4 sm:h-5 sm:w-5" />}
            </Button>

            {user && (
              <div className="hidden sm:flex items-center mr-4">
                <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-1">
                  <Zap className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {planName} Plan
                  </span>
                  {remainingScripts > 0 && (
                    <>
                      <div className="h-4 w-[1px] bg-gray-300 dark:bg-gray-600" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {remainingScripts}/{totalScripts} {limits?.limitType === 'daily' ? 'today' : 'total'}
                      </span>
                    </>
                  )}
                </div>
                {planName === 'Free' && (
                  <Link href="/pricing">
                    <Button 
                      variant="ghost"
                      size="sm"
                      className="ml-2 text-orange-500 hover:text-orange-600"
                    >
                      Upgrade
                    </Button>
                  </Link>
                )}
              </div>
            )}

            {user ? (
              <div className="flex items-center gap-2 sm:gap-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-gray-200 dark:border-gray-700 p-0 overflow-hidden"
                    >
                      {user?.photoURL ? (
                        <div className="absolute inset-0 bg-orange-500">
                          <img
                            src={user.photoURL}
                            alt="Profile"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.parentElement.innerHTML = `
                                <div class="w-full h-full flex items-center justify-center bg-orange-500 text-white text-sm sm:text-base">
                                  ${user.email?.[0]?.toUpperCase() || 'U'}
                                </div>
                              `;
                            }}
                          />
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-orange-500 text-white text-sm sm:text-base font-medium">
                          {user.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.displayName || 'User'}</p>
                        <p className="text-xs leading-none text-gray-500">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span className="text-sm">Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/subscription" className="flex items-center cursor-pointer">
                        <CreditCard className="mr-2 h-4 w-4" />
                        <span className="text-sm">Subscription</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span className="text-sm">Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2 sm:gap-4">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-sm">
                    Login
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white text-sm">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-8 w-8 sm:h-9 sm:w-9 text-gray-400 hover:text-gray-600 dark:hover:text-white"
              onClick={() => setIsMenuOpen((prev) => !prev)}
            >
              {isMenuOpen ? <X className="h-5 w-5 sm:h-6 sm:w-6" /> : <Menu className="h-5 w-5 sm:h-6 sm:w-6" />}
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
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="md:hidden fixed inset-x-0 top-[3.5rem] sm:top-16 z-40 overflow-hidden bg-white dark:bg-[#121212] border-b border-gray-200 dark:border-gray-800 shadow-lg"
        >
          {user && (
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {planName} Plan
                  </span>
                </div>
                {remainingScripts > 0 && (
                  <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-1">
                    <span className="text-xs font-medium text-gray-900 dark:text-white">
                      {remainingScripts}/{totalScripts} {limits?.limitType === 'daily' ? 'today' : 'total'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
          <nav className="flex flex-col py-4">
            {["Features", "Pricing", "FAQ"].map((item) => (
              <Link 
                key={item} 
                className="py-3 px-6 text-base font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors active:bg-gray-100 dark:active:bg-gray-700" 
                href={`/#${item.toLowerCase()}`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item}
              </Link>
            ))}
            {!user && (
              <div className="px-4 py-4 space-y-2 border-t border-gray-200 dark:border-gray-700 mt-2">
                <Link href="/login" className="block">
                  <Button variant="ghost" className="w-full justify-center text-base">
                    Login
                  </Button>
                </Link>
                <Link href="/signup" className="block">
                  <Button className="w-full justify-center bg-orange-500 hover:bg-orange-600 text-white text-base">
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