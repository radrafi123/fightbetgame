import React, { useState, useEffect, useRef } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, Animated, StyleSheet, Image 
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";

const characters = [
  { name: "Ryu", image: require("./assets/ryu.png") },
  { name: "Ken", image: require("./assets/ken.png") },
  { name: "Chun-Li", image: require("./assets/chunli.png") },
  { name: "Akuma", image: require("./assets/akuma.png") },
];

const FightBetGame = () => {
  const [bet, setBet] = useState("");
  const [selectedBet, setSelectedBet] = useState(null);
  const [balance, setBalance] = useState(1000);
  const [result, setResult] = useState(null);
  const [winAmount, setWinAmount] = useState(0);
  const [selectedCharacter, setSelectedCharacter] = useState(characters[0]);
  
  const fighter1Anim = useRef(new Animated.Value(0)).current;
  const fighter2Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadBalance();
  }, []);

  const loadBalance = async () => {
    const savedBalance = await AsyncStorage.getItem("balance");
    if (savedBalance) {
      setBalance(parseFloat(savedBalance));
    }
  };

  const saveBalance = async (newBalance) => {
    await AsyncStorage.setItem("balance", newBalance.toString());
  };

  const fightOutcomes = [
    { result: "Player 1 Wins", chance: 45.8 },
    { result: "Player 2 Wins", chance: 44.6 },
    { result: "Tie", chance: 9.6 },
  ];

  const playSound = async (soundFile) => {
    const { sound } = await Audio.Sound.createAsync(soundFile);
    await sound.playAsync();
  };

  const startFight = () => {
    if (!bet || !selectedBet) {
      alert("Please enter a bet and select a fighter!");
      return;
    }

    const betAmount = parseFloat(bet);
    if (betAmount > balance) {
      alert("Insufficient balance!");
      return;
    }

    Animated.sequence([
      Animated.timing(fighter1Anim, { toValue: -50, duration: 500, useNativeDriver: true }),
      Animated.timing(fighter1Anim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(fighter2Anim, { toValue: 50, duration: 500, useNativeDriver: true }),
      Animated.timing(fighter2Anim, { toValue: 0, duration: 200, useNativeDriver: true })
    ]).start(() => resolveFight(betAmount));
  };

  const resolveFight = (betAmount) => {
    let rand = Math.random() * 100;
    let cumulative = 0;
    let finalResult = "Player 1 Wins";

    for (let outcome of fightOutcomes) {
      cumulative += outcome.chance;
      if (rand < cumulative) {
        finalResult = outcome.result;
        break;
      }
    }

    let winnings = 0;
    if (selectedBet === finalResult) {
      winnings = betAmount * (finalResult === "Tie" ? 6 : 2);
    }

    const newBalance = balance - betAmount + winnings;
    setBalance(newBalance);
    saveBalance(newBalance);
    setWinAmount(winnings);
    setResult(finalResult);

    if (finalResult === "Tie") {
      playSound(require("./assets/tie-sound.mp3"));
    } else {
      playSound(require("./assets/hit-sound.mp3"));
    }

    Animated.sequence([
      Animated.timing(fighter1Anim, { toValue: -20, duration: 200, useNativeDriver: true }),
      Animated.timing(fighter1Anim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(fighter2Anim, { toValue: 20, duration: 200, useNativeDriver: true }),
      Animated.timing(fighter2Anim, { toValue: 0, duration: 200, useNativeDriver: true })
    ]).start();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fight Bet Game</Text>
      <Text style={styles.balance}>Balance: ${balance.toFixed(2)}</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter your bet"
        keyboardType="numeric"
        value={bet}
        onChangeText={setBet}
      />

      <TouchableOpacity style={styles.fightButton} onPress={startFight}>
        <Text style={styles.fightText}>Start Fight</Text>
      </TouchableOpacity>

      {result && (
        <Text style={styles.resultText}>
          {result}! {winAmount > 0 ? `You won $${winAmount.toFixed(2)}!` : "You lost your bet."}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#222" },
  title: { fontSize: 30, fontWeight: "bold", color: "white", marginBottom: 20 },
  balance: { fontSize: 18, color: "white", marginBottom: 10 },
  input: { width: 200, padding: 10, backgroundColor: "white", borderRadius: 5, marginBottom: 20 },
  fightButton: { padding: 15, backgroundColor: "red", borderRadius: 10, marginTop: 10 },
  fightText: { color: "white", fontWeight: "bold", fontSize: 18 },
  resultText: { color: "white", fontSize: 20, fontWeight: "bold", marginTop: 20 },
});

export default FightBetGame;
