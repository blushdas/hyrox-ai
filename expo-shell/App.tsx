import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL;

export default function App() {
  const [loading, setLoading] = useState(true);

  if (!WEB_URL) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.center}>
          <Text style={styles.warn}>EXPO_PUBLIC_WEB_URL not set</Text>
          <Text style={styles.hint}>
            Set it in expo-shell/.env to your Mac's LAN IP running{"\n"}
            `npm run dev -- -H 0.0.0.0`, e.g.{"\n"}
            EXPO_PUBLIC_WEB_URL=http://192.168.1.23:3000
          </Text>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <SafeAreaView style={styles.flex} edges={["top", "bottom"]}>
        {loading && (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#22C55E" />
          </View>
        )}
        <WebView
          source={{ uri: WEB_URL }}
          style={styles.flex}
          onLoadEnd={() => setLoading(false)}
          allowsBackForwardNavigationGestures
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#0F1A0E" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#0F1A0E",
  },
  warn: {
    color: "#22C55E",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  hint: { color: "#ffffff", fontSize: 14, textAlign: "center" },
  loader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
});
