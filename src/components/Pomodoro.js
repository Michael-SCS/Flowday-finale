import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

export default function PomodoroScreen() {
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;

    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev === 0) {
          clearInterval(interval);
          setRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [running]);

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pomodoro</Text>

      <Text style={styles.timer}>
        {minutes}:{secs.toString().padStart(2, '0')}
      </Text>

      <Pressable
        style={styles.button}
        onPress={() => setRunning(!running)}
      >
        <Text style={styles.buttonText}>
          {running ? 'Pausar' : 'Iniciar'}
        </Text>
      </Pressable>

      <Pressable
        style={[styles.button, styles.reset]}
        onPress={() => {
          setRunning(false);
          setSeconds(25 * 60);
        }}
      >
        <Text style={styles.buttonText}>Reiniciar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 'bold',
  },
  timer: {
    fontSize: 48,
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#6366f1',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    width: 160,
  },
  reset: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
  },
});
