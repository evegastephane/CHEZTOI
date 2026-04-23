import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";

function TabBarBackground() {
  return (
    <BlurView tint="systemChromeMaterial" intensity={80} style={StyleSheet.absoluteFill} />
  );
}

export default function TabsLayout() {
  const isIOS = Platform.OS === "ios";
  const router = useRouter();

  return (
    <View style={{ flex: 1 }}>
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

      {/* Bouton flottant IA */}
      <TouchableOpacity
        style={s.fab}
        onPress={() => router.push("/ai")}
        activeOpacity={0.85}
      >
        <Ionicons name="sparkles" size={22} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  fab: {
    position:        "absolute",
    right:           20,
    bottom:          96,
    width:           52,
    height:          52,
    borderRadius:    16,
    backgroundColor: "#208AEF",
    alignItems:      "center",
    justifyContent:  "center",
    shadowColor:     "#208AEF",
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.4,
    shadowRadius:    12,
    elevation:       8,
  },
});
