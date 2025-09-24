
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/entities/User";
import { 
  Gamepad2, 
  Home, 
  Dice1, 
  Monitor, 
  Trophy, 
  User as UserIcon, 
  LogOut,
  Menu,
  X,
  BookOpen // Added for Bestiary
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const navigationItems = [
  {
    title: "Startseite",
    url: createPageUrl("Home"),
    icon: Home,
  },
  {
    title: "DnD Games",
    url: createPageUrl("DnDGames"),
    icon: Dice1,
  },
  {
    title: "Web Games",
    url: createPageUrl("WebGames"),
    icon: Monitor,
  },
  {
    title: "Andere Games",
    url: createPageUrl("OtherGames"),
    icon: Trophy,
  },
  {
    title: "Bestiarium",
    url: createPageUrl("Bestiary"),
    icon: BookOpen,
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
    } catch (error) {
      setUser(null);
    }
    setIsLoading(false);
  };

  const handleLogin = async () => {
    await User.loginWithRedirect(window.location.href);
  };

  const handleLogout = async () => {
    await User.logout();
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <style>{`
        :root {
          --gaming-primary: #0a0a0a;
          --gaming-secondary: #1a1a2e;
          --gaming-accent: #00ffff;
          --gaming-purple: #8b5cf6;
          --gaming-dark: #0f0f23;
        }
        
        .gaming-gradient {
          background: linear-gradient(135deg, var(--gaming-dark) 0%, var(--gaming-secondary) 100%);
        }
        
        .neon-text {
          color: var(--gaming-accent);
          text-shadow: 0 0 10px var(--gaming-accent);
        }
        
        .neon-border {
          border: 1px solid var(--gaming-accent);
          box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
        }
        
        .game-card-hover {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .game-card-hover:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 40px rgba(0, 255, 255, 0.1);
        }
      `}</style>

      {/* Navigation */}
      <nav className="gaming-gradient border-b border-gray-800 sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to={createPageUrl("Home")} className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 flex items-center justify-center">
                <Gamepad2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold neon-text">GameHub</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <Link
                    key={item.title}
                    to={item.url}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                      isActive
                        ? "bg-cyan-500/20 text-cyan-400 neon-border"
                        : "text-gray-300 hover:text-cyan-400 hover:bg-gray-800/50"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="font-medium">{item.title}</span>
                  </Link>
                );
              })}
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {!isLoading && (
                <>
                  {user ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="flex items-center space-x-2 text-cyan-400 hover:bg-gray-800/50">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 flex items-center justify-center">
                            <span className="text-xs font-bold">
                              {user.full_name?.[0] || user.email[0].toUpperCase()}
                            </span>
                          </div>
                          <span className="hidden md:inline font-medium">
                            {user.full_name || user.email}
                          </span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56 bg-gray-800 border-gray-700" align="end">
                        <DropdownMenuItem className="text-gray-300 hover:bg-gray-700 focus:bg-gray-700">
                          <UserIcon className="w-4 h-4 mr-2" />
                          Profil
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-gray-700" />
                        <DropdownMenuItem 
                          className="text-red-400 hover:bg-gray-700 focus:bg-gray-700"
                          onClick={handleLogout}
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Abmelden
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Button 
                      onClick={handleLogin}
                      className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-medium px-6 py-2 rounded-lg transition-all duration-200"
                    >
                      Anmelden
                    </Button>
                  )}
                </>
              )}

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-gray-300 hover:text-cyan-400"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-800 bg-gray-900">
            <div className="px-4 py-3 space-y-2">
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <Link
                    key={item.title}
                    to={item.url}
                    className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? "bg-cyan-500/20 text-cyan-400"
                        : "text-gray-300 hover:text-cyan-400 hover:bg-gray-800/50"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.title}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="gaming-gradient border-t border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Gamepad2 className="w-6 h-6 text-cyan-400" />
            <span className="text-xl font-bold neon-text">GameHub</span>
          </div>
          <p className="text-gray-400">
            Deine ultimative Gaming-Plattform für alle Arten von Spielen
          </p>
        </div>
      </footer>
    </div>
  );
}
