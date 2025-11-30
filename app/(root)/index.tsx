import { Link } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function App() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.headerText}>Navigation Menu</Text>

      {/* Root Group Pages */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Root Pages</Text>
        
        <Link href="/onboarding" style={styles.button}>
          <Text style={styles.buttonText}>Go to Onboarding</Text>
        </Link>

        <Link href="/sign-in" style={styles.button}>
          <Text style={styles.buttonText}>Go to Sign In</Text>
        </Link>
      </View>

      {/* Video Group Pages */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Video Pages</Text>

        {/* This corresponds to video/index.tsx */}
        <Link href="/video/1" style={styles.button}>
          <Text style={styles.buttonText}>Go to Video Index</Text>
        </Link>

        <Link href="/homePage" style={styles.button}>
          <Text style={styles.buttonText}>Go to Homepage</Text>
        </Link>

        <Link href="/parentModal" style={styles.button}>
          <Text style={styles.buttonText}>Open Parent Modal</Text>
        </Link>

        <Link href="/settingModal" style={styles.button}>
          <Text style={styles.buttonText}>Open Setting Modal</Text>
        </Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: 'black',
    alignItems: 'center',
    paddingVertical: 60,
  },
  headerText: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  section: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#aaaaaa',
    fontSize: 16,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  button: {
    marginBottom: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#3b82f6', // blue-500
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});