import { Platform, StyleSheet, View, Text } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";

// ─── shadcn/ui zinc palette ───────────────────────────────────────────────────
const C = {
  bg:       "#FFFFFF",
  border:   "#E4E4E7",   // zinc-200
  active:   "#18181B",   // zinc-950
  inactive: "#A1A1AA",   // zinc-400
};

// ─── Tab bar background (Android) ────────────────────────────────────────────
function TabBarBackground() {
  return (
    <BlurView tint="systemChromeMaterial" intensity={80} style={StyleSheet.absoluteFill} />
  );
}

// ─── Label personnalisé shadcn ────────────────────────────────────────────────
function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={{
      fontSize:      10,
      fontWeight:    focused ? "600" : "400",
      color:         focused ? C.active : C.inactive,
      letterSpacing: 0.1,
      marginTop:     2,
    }}>
      {label}
    </Text>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function TabsLayout() {
  const isIOS = Platform.OS === "ios";

  return (
    <Tabs
      screenOptions={{
        headerShown:             false,
        tabBarActiveTintColor:   C.active,
        tabBarInactiveTintColor: C.inactive,
        tabBarShowLabel:         false,

        ...(isIOS
          ? { tabBarVariant: "uikit" }
          : {
              tabBarBackground: () => <TabBarBackground />,
              tabBarStyle: {
                position:        "absolute",
                backgroundColor: "transparent",
                borderTopWidth:  0,
                elevation:       0,
              },
            }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarIcon: ({ color, focused, size }) => (
            <View style={{ alignItems: "center", gap: 2 }}>
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={22}
                color={color}
              />
              <TabLabel label="Accueil" focused={focused} />
              {focused && (
                <View style={{
                  width: 4, height: 4, borderRadius: 2,
                  backgroundColor: C.active, marginTop: 2,
                }} />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="favori"
        options={{
          title: "Favoris",
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: "center", gap: 2 }}>
              <Ionicons
                name={focused ? "heart" : "heart-outline"}
                size={22}
                color={color}
              />
              <TabLabel label="Favoris" focused={focused} />
              {focused && (
                <View style={{
                  width: 4, height: 4, borderRadius: 2,
                  backgroundColor: C.active, marginTop: 2,
                }} />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: "center", gap: 2 }}>
              <Ionicons
                name={focused ? "chatbubbles" : "chatbubbles-outline"}
                size={22}
                color={color}
              />
              <TabLabel label="Messages" focused={focused} />
              {focused && (
                <View style={{
                  width: 4, height: 4, borderRadius: 2,
                  backgroundColor: C.active, marginTop: 2,
                }} />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: "center", gap: 2 }}>
              <Ionicons
                name={focused ? "person" : "person-outline"}
                size={22}
                color={color}
              />
              <TabLabel label="Profil" focused={focused} />
              {focused && (
                <View style={{
                  width: 4, height: 4, borderRadius: 2,
                  backgroundColor: C.active, marginTop: 2,
                }} />
              )}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}