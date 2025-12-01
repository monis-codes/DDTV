import React, { useEffect, useState } from "react"
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"

import { Link } from "expo-router"


export function ParentalControlModal({
  visible,
  onClose,
}: {
  visible: boolean
  onClose: () => void
}) {
  const [stage, setStage] = useState<"math" | "options">("math")
  const [num1, setNum1] = useState(0)
  const [num2, setNum2] = useState(0)
  const [answer, setAnswer] = useState("")
  const [error, setError] = useState(false)

  useEffect(() => {
    if (visible) generate()
  }, [visible])

  const generate = () => {
    setNum1(Math.floor(Math.random() * 9) + 1)
    setNum2(Math.floor(Math.random() * 9) + 1)
    setAnswer("")
    setError(false)
    setStage("math")
  }

  const check = () => {
    if (Number(answer) === num1 + num2) {
      setStage("options")
    } else {
      setError(true)
      setAnswer("")
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        {stage === "math" ? (
          <View style={styles.boxYellow}>
            <Text style={styles.icon}>🧠</Text>
            <Text style={styles.heading}>Parent Check</Text>

            <View style={styles.problem}>
              <Text style={styles.math}>
                {num1} + {num2} = ?
              </Text>

              <TextInput
                value={answer}
                onChangeText={(t) => {
                  setAnswer(t)
                  setError(false)
                }}
                keyboardType="number-pad"
                placeholder="Your answer"
                style={styles.input}
              />

              {error && <Text style={styles.error}>Try again!</Text>}
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={check}>
              <Text style={styles.btnText}>Check Answer ✓</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.grayBtn} onPress={onClose}>
              <Text style={styles.btnText}>Close</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.boxGreen}>
            <Text style={styles.icon}>✅</Text>
            <Text style={styles.heading}>Great Job!</Text>

          <Link href="/onboarding" asChild>
            <TouchableOpacity style={styles.blueBtn}>
              <Text style={styles.btnText}>🌐 Change Language</Text>
            </TouchableOpacity>
          </Link>

          <Link href="/sign-in" asChild>
            <TouchableOpacity style={styles.redBtn}>
              <Text style={styles.btnText}>🚪 Logout</Text>
            </TouchableOpacity>
          </Link>

            <TouchableOpacity style={styles.grayBtn} onPress={generate}>
              <Text style={styles.btnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 24,
  },
  boxYellow: {
    backgroundColor: "#FFE066",
    borderRadius: 32,
    padding: 24,
  },
  boxGreen: {
    backgroundColor: "#7FFFD4",
    borderRadius: 32,
    padding: 24,
  },
  icon: {
    textAlign: "center",
    fontSize: 56,
    marginBottom: 12,
  },
  heading: {
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 16,
  },
  problem: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
  },
  math: {
    fontSize: 36,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 12,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
  },
  error: {
    color: "red",
    fontWeight: "900",
    textAlign: "center",
    marginTop: 8,
  },
  primaryBtn: {
    backgroundColor: "#FF6FAE",
    padding: 16,
    borderRadius: 20,
    marginBottom: 8,
  },
  blueBtn: {
    backgroundColor: "#4DA6FF",
    padding: 16,
    borderRadius: 20,
    marginBottom: 8,
  },
  redBtn: {
    backgroundColor: "#FF6B6B",
    padding: 16,
    borderRadius: 20,
    marginBottom: 8,
  },
  grayBtn: {
    backgroundColor: "#AAA",
    padding: 14,
    borderRadius: 20,
  },
  btnText: {
    color: "#fff",
    fontWeight: "900",
    textAlign: "center",
    fontSize: 16,
  },
})
