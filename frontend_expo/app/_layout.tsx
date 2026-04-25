import { Stack } from "expo-router";
import { ClerkProvider, ClerkLoaded } from "@clerk/expo";
import "@/global.css";
import { PostHogProviderWrapper, PostHogIdentifier } from "@/providers/posthog";

const PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <ClerkLoaded>
        <PostHogProviderWrapper>
          <PostHogIdentifier />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(proprietaire)" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="ai" options={{ presentation: "fullScreenModal" }} />
            <Stack.Screen name="bien/[id]" />
            <Stack.Screen name="resultats" />
            <Stack.Screen name="location" />
            <Stack.Screen name="search" />
            <Stack.Screen name="reservation" options={{ presentation: "modal" }} />
            <Stack.Screen name="ajouter-bien" options={{ presentation: "modal" }} />
            <Stack.Screen name="confirmation" options={{ presentation: "fullScreenModal", gestureEnabled: false }} />
          </Stack>
        </PostHogProviderWrapper>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
