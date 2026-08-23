import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors } from "../theme/colors";

export function LoginScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Tela de Login desativada (autenticação desabilitada)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  text: {
    color: Colors.textPrimary,
    fontSize: 16,
  },
});
