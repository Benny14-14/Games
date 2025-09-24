import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/entities/User";
import { 
  Dice1, 
  Monitor, 
  Trophy, 
  Gamepad2, 
  Users, 
  Zap,
  ArrowRight,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

const categories = [
  {
    title: "DnD Games",
    description: "Tauche ein in epische Rollenspiel-Abenteuer und erschaffe deine eigenen Geschichten",
    icon: Dice1,
    url: createPageUrl("DnDGames"),
    color: "from-purple-600 to-pink-600",
    games: ["Charakter Generator", "Würfel Simulator", "Quest Builder"],
    comingSoon: false
  },
  {
    title: "Web Games",
    description: "Klassische Browser-Spiele neu interpretiert mit modernem Design",
    icon: Monitor,
    url: createPageUrl("WebGames"),
    color: "from-cyan-500 to-blue-600",
    games: ["Snake", "Tetris", "Pong", "Space Invaders"],
    comingSoon: false
  },
  {
    title: "Andere Games",
    description: "Entdecke eine vielfältige Sammlung einzigartiger Spiele",
    icon: Trophy,
    url: createPageUrl("OtherGames"),
    color: "from-green-500 to-teal-600",
    games: ["Puzzle Games", "Strategy Games", "Card Games"],
    comingSoon: true
  }
];

const features = [
  {
    icon: Users,
    title: "Multiplayer Support",
    description: "Spiele mit Freunden oder fordere andere Spieler heraus"
  },
  {
    icon: Zap,
    title: "Instant Play",
    description: "Keine Downloads - alle Spiele laufen direkt im Browser"
  },
  {
    icon: Star,
    title: "Highscores",
    description: "Verfolge deine Bestleistungen und konkurriere mit anderen"
  }
];

export default function Home() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900/20 to-cyan-900/20"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center justify-center space-x-4 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 flex items-center justify-center">
                <Gamepad2 className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-5xl lg:text-7xl font-bold">
                <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  GameHub
                </span>
              </h1>
            </div>
            
            <p className="text-xl lg:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Willkommen in der ultimativen Gaming-Plattform. Entdecke klassische Arcade-Games, 
              epische DnD-Abenteuer und vieles mehr - alles an einem Ort.
            </p>

            {!isLoading && !user && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Button 
                  onClick={handleLogin}
                  size="lg"
                  className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all duration-300 transform hover:scale-105"
                >
                  Jetzt anmelden und losspielen
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Wähle deine 
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                {" "}Gaming-Kategorie
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Von klassischen Arcade-Games bis hin zu epischen Rollenspielen - 
              hier findest du dein perfektes Gaming-Erlebnis.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((category, index) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all duration-300 game-card-hover group relative overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                  
                  <CardHeader className="relative">
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${category.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <category.icon className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl text-white group-hover:text-cyan-400 transition-colors duration-300">
                      {category.title}
                      {category.comingSoon && (
                        <span className="ml-2 text-xs bg-purple-600 text-white px-2 py-1 rounded-full">
                          Demnächst
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription className="text-gray-400 text-base leading-relaxed">
                      {category.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="space-y-2 mb-6">
                      <p className="text-sm font-medium text-gray-300">Verfügbare Spiele:</p>
                      <div className="flex flex-wrap gap-2">
                        {category.games.map((game, gameIndex) => (
                          <span 
                            key={gameIndex}
                            className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full"
                          >
                            {game}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {!category.comingSoon ? (
                      <Link to={category.url}>
                        <Button 
                          className="w-full bg-gradient-to-r from-gray-700 to-gray-600 hover:from-cyan-600 hover:to-purple-600 text-white transition-all duration-300"
                        >
                          Kategorie erkunden
                          <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                      </Link>
                    ) : (
                      <Button 
                        disabled
                        className="w-full bg-gray-700 text-gray-400 cursor-not-allowed"
                      >
                        Bald verfügbar
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-800/30">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Warum 
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                {" "}GameHub?
              </span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="text-center"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 flex items-center justify-center mx-auto mb-6">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
