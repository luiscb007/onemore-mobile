import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>OneMore App - Build #20</Text>
      <Text style={styles.subtitle}>Minimal Test Build</Text>
      <Text style={styles.info}>If you see this, the app is working!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF0000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  text: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 24,
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  info: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
