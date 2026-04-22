import { Platform, StyleSheet } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";

function TabBarBackground() {
  return (
    <BlurView tint="systemChromeMaterial" intensity={80} style={StyleSheet.absoluteFill} />
  );
}

export default function TabsLayout() {
  const isIOS = Platform.OS === "ios";

  return (
    <Tabs
      screenOptions={{
        headerShown:             false,
        tabBarActiveTintColor:   "#18181B",
        tabBarInactiveTintColor: "#A1A1AA",
        tabBarLabelStyle:        { fontSize: 10, fontWeight: "600" },
        tabBarStyle:             { backgroundColor: "#FFFFFF", borderTopWidth: 1, borderTopColor: "#E4E4E7", height: 80, paddingBottom: 8, paddingTop: 8 },
        ...(isIOS ? { tabBarVariant: "uikit" } : {
          tabBarBackground: () => <TabBarBackground />,
          tabBarStyle: { position: "absolute", backgroundColor: "transparent", borderTopWidth: 0, elevation: 0 },
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="favori"
        options={{
          title: "Favoris",
          tabBarIcon: ({ color, size }) => <Ionicons name="heart" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}