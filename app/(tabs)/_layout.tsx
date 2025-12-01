import { Tabs } from "expo-router"
import { Text } from "react-native"

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#FF6FAE",
        tabBarInactiveTintColor: "#777",
        tabBarStyle: {
          backgroundColor: "#FFF7E5",
          borderTopWidth: 0,
        },
        tabBarLabelStyle: {
          fontWeight: "800",
        },
      }}
    >
      {/* ✅ HOME — LEFT */}
      <Tabs.Screen
        name="homePage"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>🏠</Text>
          ),
        }}
      />

      {/* ✅ FAVOURITES — RIGHT */}
      <Tabs.Screen
        name="favourites"
        options={{
          title: "Favourites",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>💛</Text>
          ),
        }}
      />
    </Tabs>
  )
}
