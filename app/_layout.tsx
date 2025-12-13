import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

/* =======================
   Navigation Guard Component
======================= */
function NavigationGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isGuest } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const isSignIn = segments[0] === "sign-in";
    const isOnboarding = segments[0] === "onboarding";
    const isHomePage = segments[0] === "(tabs)" && segments[1] === "homePage";

    // Check if user has completed onboarding
    const checkOnboarding = async () => {
      const hasName = await AsyncStorage.getItem("childName");
      const hasLanguage = await AsyncStorage.getItem("language");
      const hasCompletedOnboarding = hasName && hasLanguage;

      if (!user) {
        // No user (neither guest nor logged in) -> redirect to sign-in
        // But allow them to stay on sign-in page
        if (!isSignIn && !isOnboarding) {
          router.replace("/sign-in");
        }
      } else {
        // User exists (guest or logged in)
        if (!hasCompletedOnboarding) {
          // Not completed onboarding -> redirect to onboarding
          // But allow them to stay on onboarding or sign-in pages
          if (!isOnboarding && !isSignIn) {
            router.replace("/onboarding");
          }
        } else {
          // Has completed onboarding
          // If logged-in user (not guest) tries to access sign-in, redirect to homepage
          if (isSignIn && !isGuest) {
            router.replace("/homePage");
          }
          // Guests should be able to access sign-in page (to convert to logged-in user)
          // Allow users to navigate to onboarding even after completion (for changing language/name)
        }
      }
    };

    checkOnboarding();
  }, [user, isLoading, segments, isGuest]);

  return <>{children}</>;
}

/* =======================
   Root Layout Component
======================= */
export default function AppLayout() {
  return (
    <AuthProvider>
      <NavigationGuard>
        <Slot />
      </NavigationGuard>
    </AuthProvider>
  );
}
