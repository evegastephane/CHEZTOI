import { Stack } from "expo-router";
import "@/global.css";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="ai" options={{ presentation: "fullScreenModal" }} />
      <Stack.Screen name="bien/[id]" />
      <Stack.Screen name="resultats" />
      <Stack.Screen name="location" />
      <Stack.Screen name="search" />
      <Stack.Screen name="reservation" options={{ presentation: "modal" }} />
      <Stack.Screen name="confirmation" options={{ presentation: "fullScreenModal", gestureEnabled: false }} />
    </Stack>
  );
}
