
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dice1, Plus, Users, Crown, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function GMDiceControl({ 
  game, 
  characters, 
  stats, 
  onCreateSession,
  activeSessions = [],
  onCloseSession 
}) {
  const [newSession, setNewSession] = useState({
    title: "",
    description: "",
    dice_type: "d20",
    dice_count: 1,
    modifier_stat: "",
    target_players: [],
    auto_close: false
  });
  const [showCreateForm, setShowCreateForm] = useState(false);

  const diceTypes = [
    { value: "d4", label: "W4", color: "from-green-500 to-emerald-600" },
    { value: "d6", label: "W6", color: "from-blue-500 to-cyan-600" },
    { value: "d8", label: "W8", color: "from-purple-500 to-violet-600" },
    { value: "d10", label: "W10", color: "from-yellow-500 to-orange-600" },
    { value: "d12", label: "W12", color: "from-pink-500 to-rose-600" },
    { value: "d20", label: "W20", color: "from-red-500 to-crimson-600" },
    { value: "d100", label: "W100", color: "from-gray-500 to-slate-600" }
  ];

  const handleCreateSession = async () => {
    if (!newSession.title.trim()) {
      alert("Bitte gib einen Titel ein.");
      return;
    }

    try {
      await onCreateSession({
        game_id: game.id,
        gamemaster_email: game.gamemaster_email,
        title: newSession.title,
        description: newSession.description,
        dice_type: newSession.dice_type,
        dice_count: newSession.dice_count,
        modifier_stat: newSession.modifier_stat,
        target_players: newSession.target_players,
        is_active: true,
        auto_close: newSession.auto_close
      });

      // Reset form
      setNewSession({
        title: "",
        description: "",
        dice_type: "d20",
        dice_count: 1,
        modifier_stat: "",
        target_players: [],
        auto_close: false
      });
      setShowCreateForm(false);
    } catch (error) {
      console.error("Fehler beim Erstellen der Würfel-Session:", error);
    }
  };

  const togglePlayerSelection = (playerEmail) => {
    setNewSession(prev => ({
      ...prev,
      target_players: prev.target_players.includes(playerEmail)
        ? prev.target_players.filter(email => email !== playerEmail)
        : [...prev.target_players, playerEmail]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Active Sessions */}
      {activeSessions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-orange-100 flex items-center space-x-2">
            <Dice1 className="w-5 h-5" />
            <span>Aktive Würfel-Sessions</span>
          </h3>
          
          {activeSessions.map((session, index) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-orange-800/20 border-orange-700/30 backdrop-blur">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-orange-100 text-lg">{session.title}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-red-600 text-white">
                      {session.dice_count}x {session.dice_type.toUpperCase()}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onCloseSession(session.id)}
                      className="border-red-600 text-red-400 hover:bg-red-800/30"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {session.description && (
                    <p className="text-orange-300 text-sm mb-3">{session.description}</p>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-orange-400">
                      Spieler: {session.target_players.length === 0 ? 'Alle' : session.target_players.length}
                    </span>
                    {session.modifier_stat && (
                      <span className="text-orange-400">Modifier: {session.modifier_stat}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create New Session Button */}
      {!showCreateForm && (
        <Button
          onClick={() => setShowCreateForm(true)}
          className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold py-4"
          size="lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          Neue Würfel-Session erstellen
        </Button>
      )}

      {/* Create Session Form */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-orange-800/20 border-orange-700/30 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-orange-100 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Crown className="w-5 h-5" />
                    <span>Würfel-Session erstellen</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCreateForm(false)}
                    className="border-orange-600 text-orange-300 hover:bg-orange-800/30"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="title" className="text-orange-200">Titel *</Label>
                  <Input
                    id="title"
                    value={newSession.title}
                    onChange={(e) => setNewSession({...newSession, title: e.target.value})}
                    className="bg-gray-800/50 border-orange-700/30 text-orange-100"
                    placeholder="z.B. Initiativwurf, Angriff auf Goblin"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-orange-200">Beschreibung</Label>
                  <Textarea
                    id="description"
                    value={newSession.description}
                    onChange={(e) => setNewSession({...newSession, description: e.target.value})}
                    className="bg-gray-800/50 border-orange-700/30 text-orange-100"
                    placeholder="Zusätzliche Informationen für die Spieler..."
                    rows={3}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-orange-200">Würfeltyp</Label>
                    <Select
                      value={newSession.dice_type}
                      onValueChange={(value) => setNewSession({...newSession, dice_type: value})}
                    >
                      <SelectTrigger className="bg-gray-800/50 border-orange-700/30 text-orange-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {diceTypes.map((dice) => (
                          <SelectItem key={dice.value} value={dice.value}>
                            <div className="flex items-center space-x-2">
                              <div className={`w-4 h-4 rounded bg-gradient-to-r ${dice.color}`} />
                              <span>{dice.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="dice-count" className="text-orange-200">Anzahl Würfel</Label>
                    <Select
                      value={newSession.dice_count.toString()}
                      onValueChange={(value) => setNewSession({...newSession, dice_count: parseInt(value)})}
                    >
                      <SelectTrigger className="bg-gray-800/50 border-orange-700/30 text-orange-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1,2,3,4,5,6].map(num => (
                          <SelectItem key={num} value={num.toString()}>{num}x</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-orange-200">Stat-Modifier (optional)</Label>
                  <Select
                    value={newSession.modifier_stat}
                    onValueChange={(value) => setNewSession({...newSession, modifier_stat: value})}
                  >
                    <SelectTrigger className="bg-gray-800/50 border-orange-700/30 text-orange-100">
                      <SelectValue placeholder="Kein Modifier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>Kein Modifier</SelectItem>
                      {stats.map((stat) => (
                        <SelectItem key={stat.id} value={stat.stat_name}>
                          {stat.stat_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Player Selection */}
                <div>
                  <Label className="text-orange-200 mb-3 block">Ziel-Spieler (leer = alle)</Label>
                  <div className="space-y-2">
                    {characters.map((char) => (
                      <div key={char.id} className="flex items-center space-x-3 p-2 bg-gray-800/30 rounded-lg">
                        <Switch
                          checked={newSession.target_players.includes(char.player_email)}
                          onCheckedChange={() => togglePlayerSelection(char.player_email)}
                        />
                        <span className="text-orange-200">{char.character_name}</span>
                        <span className="text-orange-400 text-sm">({char.player_email.split('@')[0]})</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={newSession.auto_close}
                      onCheckedChange={(checked) => setNewSession({...newSession, auto_close: checked})}
                    />
                    <Label className="text-orange-200">Auto-schließen nach allen Würfen</Label>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <Button
                    onClick={() => setShowCreateForm(false)}
                    variant="outline"
                    className="flex-1 border-orange-600 text-orange-300 hover:bg-orange-800/30"
                  >
                    Abbrechen
                  </Button>
                  <Button
                    onClick={handleCreateSession}
                    className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold"
                  >
                    Session erstellen
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
