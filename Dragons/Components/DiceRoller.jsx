import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Dice1, 
  Dice2, 
  Dice3, 
  Dice4, 
  Dice5, 
  Dice6,
  Sparkles,
  Zap,
  Crown
} from "lucide-react";

const diceIcons = {
  1: Dice1,
  2: Dice2, 
  3: Dice3,
  4: Dice4,
  5: Dice5,
  6: Dice6
};

const DiceAnimation = ({ value, isRolling, diceType }) => {
  const [currentIcon, setCurrentIcon] = useState(1);
  const DiceIcon = diceIcons[currentIcon] || Dice1;

  useEffect(() => {
    if (isRolling) {
      const interval = setInterval(() => {
        setCurrentIcon(Math.floor(Math.random() * 6) + 1);
      }, 100);
      
      return () => clearInterval(interval);
    }
  }, [isRolling]);

  return (
    <motion.div
      className="relative"
      animate={isRolling ? {
        rotateX: [0, 360, 720, 1080],
        rotateY: [0, 180, 360, 540],
        scale: [1, 1.2, 1.1, 1]
      } : {}}
      transition={{ 
        duration: 2,
        ease: "easeOut"
      }}
    >
      <div className={`w-20 h-20 rounded-xl ${
        isRolling 
          ? 'bg-gradient-to-br from-orange-500 to-red-500 shadow-lg shadow-orange-500/50' 
          : 'bg-gradient-to-br from-orange-600 to-red-600'
      } flex items-center justify-center border-2 border-white/20`}>
        {isRolling ? (
          <DiceIcon className="w-12 h-12 text-white animate-spin" />
        ) : (
          <span className="text-2xl font-bold text-white">{value}</span>
        )}
      </div>
      
      {!isRolling && value && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute -top-2 -right-2"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 flex items-center justify-center">
            <span className="text-xs font-bold text-white">{diceType}</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default function DiceRoller({ 
  session, 
  character, 
  onRoll, 
  disabled = false,
  lastResult = null 
}) {
  const [isRolling, setIsRolling] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const rollDice = async () => {
    if (disabled || isRolling) return;
    
    setIsRolling(true);
    setShowResult(false);

    // Simulate rolling animation
    setTimeout(async () => {
      // Calculate base dice results
      const baseResults = [];
      for (let i = 0; i < session.dice_count; i++) {
        const max = parseInt(session.dice_type.substring(1)); // Remove 'd' from 'd20'
        baseResults.push(Math.floor(Math.random() * max) + 1);
      }

      // Calculate modifier from character stats
      let modifier = 0;
      if (session.modifier_stat && character.stats && character.stats[session.modifier_stat]) {
        modifier = parseInt(character.stats[session.modifier_stat]) || 0;
        // Convert stat to D&D modifier (10-11 = 0, 12-13 = +1, 8-9 = -1, etc.)
        modifier = Math.floor((modifier - 10) / 2);
      }

      const total = baseResults.reduce((sum, val) => sum + val, 0) + modifier;
      
      // Check for critical (natural 20 on d20, or max roll on other dice)
      const maxPossible = parseInt(session.dice_type.substring(1)) * session.dice_count;
      const isCritical = session.dice_type === 'd20' 
        ? baseResults.includes(20) || baseResults.includes(1)
        : baseResults.reduce((sum, val) => sum + val, 0) === maxPossible;

      const rollData = {
        game_id: session.game_id,
        session_id: session.id,
        player_email: character.player_email,
        character_name: character.character_name,
        dice_type: session.dice_type,
        dice_count: session.dice_count,
        base_result: baseResults,
        modifier: modifier,
        total_result: total,
        roll_reason: session.title,
        is_critical: isCritical,
        status: 'completed'
      };

      await onRoll(rollData);
      setIsRolling(false);
      setShowResult(true);
    }, 2000);
  };

  const getDiceTypeColor = (diceType) => {
    const colors = {
      'd4': 'from-green-500 to-emerald-600',
      'd6': 'from-blue-500 to-cyan-600', 
      'd8': 'from-purple-500 to-violet-600',
      'd10': 'from-yellow-500 to-orange-600',
      'd12': 'from-pink-500 to-rose-600',
      'd20': 'from-red-500 to-crimson-600',
      'd100': 'from-gray-500 to-slate-600'
    };
    return colors[diceType] || 'from-gray-500 to-gray-600';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full"
    >
      <Card className="bg-orange-800/20 border-orange-700/30 backdrop-blur">
        <CardHeader className="text-center">
          <CardTitle className="text-orange-100 flex items-center justify-center space-x-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <span>{session.title}</span>
          </CardTitle>
          <p className="text-orange-300 text-sm">{session.description}</p>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          {/* Dice Display */}
          <div className="flex justify-center space-x-4">
            {Array.from({ length: session.dice_count }, (_, i) => (
              <DiceAnimation
                key={i}
                value={lastResult?.base_result?.[i]}
                isRolling={isRolling}
                diceType={session.dice_type}
              />
            ))}
          </div>

          {/* Dice Info */}
          <div className="flex justify-center space-x-4 text-sm">
            <Badge className={`bg-gradient-to-r ${getDiceTypeColor(session.dice_type)} text-white`}>
              {session.dice_count}x {session.dice_type.toUpperCase()}
            </Badge>
            {session.modifier_stat && (
              <Badge variant="outline" className="border-orange-600 text-orange-300">
                {session.modifier_stat} Modifier
              </Badge>
            )}
          </div>

          {/* Results */}
          <AnimatePresence>
            {lastResult && showResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-3"
              >
                <div className="text-2xl font-bold text-orange-100">
                  Ergebnis: {lastResult.total_result}
                </div>
                
                <div className="flex justify-center items-center space-x-2 text-sm text-orange-300">
                  <span>Würfel: {lastResult.base_result.join(' + ')}</span>
                  {lastResult.modifier !== 0 && (
                    <span>
                      {lastResult.modifier > 0 ? ' + ' : ' - '}
                      {Math.abs(lastResult.modifier)} ({session.modifier_stat})
                    </span>
                  )}
                </div>

                {lastResult.is_critical && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center justify-center space-x-2 text-yellow-400"
                  >
                    <Crown className="w-5 h-5" />
                    <span className="font-bold">
                      {lastResult.base_result.includes(20) ? 'KRITISCHER ERFOLG!' :
                       lastResult.base_result.includes(1) ? 'KRITISCHER FEHLSCHLAG!' :
                       'PERFEKTER WURF!'}
                    </span>
                    <Crown className="w-5 h-5" />
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Roll Button */}
          <Button
            onClick={rollDice}
            disabled={disabled || isRolling}
            className={`w-full py-6 font-bold text-lg transition-all duration-300 ${
              isRolling 
                ? 'bg-gradient-to-r from-orange-400 to-red-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 transform hover:scale-105'
            }`}
          >
            {isRolling ? (
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 animate-pulse" />
                <span>Würfelt...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Dice1 className="w-5 h-5" />
                <span>WÜRFELN!</span>
              </div>
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
