"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import styled from "styled-components";
import { useAuth } from "@/providers/AuthProvider";
import AuthForm from "@/components/AuthForm";

// Styled Components
const Container = styled.div`
  padding: 2rem;
  min-height: 100vh;
  background-image: url("/images/chair.jpg");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: "Inter", sans-serif;
  position: relative;

  /* Overlay für bessere Lesbarkeit */
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 1;
  }

  /* Alle Kinder über das Overlay legen */
  > * {
    position: relative;
    z-index: 2;
  }
`;

const LogoutButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(239, 68, 68, 0.5);
  color: white;
  border: none;
  border-radius: 10px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(239, 68, 68, 1);
    transform: translateY(-1px);
  }
`;

const UserInfo = styled.div`
  position: absolute;
  top: 1rem;
  left: 1rem;
  background: rgba(255, 255, 255, 0.9);
  color: #374151;
  padding: 0.5rem 1rem;
  border-radius: 10px;
  font-weight: 600;
  backdrop-filter: blur(10px);
`;

const CircleButton = styled.button.withConfig({
  shouldForwardProp: (prop) => !["isRecording", "isProcessing"].includes(prop),
})`
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: ${(props) => {
    if (props.isProcessing)
      return "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";
    if (props.isRecording)
      return "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)";
    return "linear-gradient(135deg, #10b981 0%, #059669 100%)";
  }};
  color: white;
  border: none;
  font-size: 1.2rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4);
  }

  &:active {
    transform: translateY(-2px);
  }

  ${(props) =>
    props.isRecording &&
    `
    animation: recordPulse 1.5s infinite;
  `}

  ${(props) =>
    props.isProcessing &&
    `
    animation: processPulse 2s infinite;
  `}
  
  @keyframes recordPulse {
    0% {
      transform: scale(1);
      box-shadow: 0 10px 30px rgba(239, 68, 68, 0.3);
    }
    50% {
      transform: scale(1.05);
      box-shadow: 0 15px 40px rgba(239, 68, 68, 0.5);
    }
    100% {
      transform: scale(1);
      box-shadow: 0 10px 30px rgba(239, 68, 68, 0.3);
    }
  }

  @keyframes processPulse {
    0% {
      transform: scale(1);
      box-shadow: 0 10px 30px rgba(245, 158, 11, 0.3);
    }
    50% {
      transform: scale(1.02);
      box-shadow: 0 15px 40px rgba(245, 158, 11, 0.5);
    }
    100% {
      transform: scale(1);
      box-shadow: 0 10px 30px rgba(245, 158, 11, 0.3);
    }
  }
`;

const StatusText = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== "isBlinking",
})`
  margin-top: 3rem;
  font-size: 1.5rem;
  color: white;
  text-align: center;
  font-weight: 600;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  background: rgba(0, 0, 0, 0.3);
  padding: 1rem 2rem;
  border-radius: 25px;
  backdrop-filter: blur(10px);

  ${(props) =>
    props.isBlinking &&
    `
    animation: blink 1.5s infinite;
  `}

  @keyframes blink {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
    100% {
      opacity: 1;
    }
  }
`;

const Title = styled.h1`
  position: absolute;
  top: 7rem;
  font-size: 2rem;
  color: white;
  text-align: center;
  margin: 0;
  text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.8);
  background: rgba(0, 0, 0, 0.3);
  padding: 1rem 2rem;
  border-radius: 20px;
  backdrop-filter: blur(10px);
`;

const VoiceSelectorContainer = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  z-index: 100;
  width: 90%;
  max-width: 500px;
`;

const VoiceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
  margin: 1.5rem 0;
`;

const VoiceCard = styled.button.withConfig({
  shouldForwardProp: (prop) => prop !== "isSelected",
})`
  background: ${(props) =>
    props.isSelected
      ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
      : "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)"};
  color: ${(props) => (props.isSelected ? "white" : "#374151")};
  border: 2px solid ${(props) => (props.isSelected ? "#059669" : "#e2e8f0")};
  border-radius: 15px;
  padding: 1.5rem 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  }
`;

const VoiceEmoji = styled.div`
  font-size: 2rem;
  margin-bottom: 0.5rem;
`;

const VoiceName = styled.div`
  font-size: 0.9rem;
  text-align: center;
`;

const VoiceDescription = styled.div`
  font-size: 0.75rem;
  opacity: 0.8;
  text-align: center;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: bold;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(239, 68, 68, 0.2);
    transform: scale(1.1);
  }
`;

const VoiceSelectButton = styled.button`
  position: absolute;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.9);
  color: #374151;
  border: 2px solid rgba(16, 185, 129, 0.3);
  border-radius: 12px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  font-size: 0.9rem;

  &:hover {
    background: rgba(16, 185, 129, 0.1);
    border-color: rgba(16, 185, 129, 0.6);
    transform: translateX(-50%) translateY(-2px);
  }
`;

// Client-only Komponente
const AudioRecorderComponent = dynamic(() => Promise.resolve(AudioRecorder), {
  ssr: false,
});

function AudioRecorder() {
  const { user, signOut } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Klicken zum Sprechen");
  const [audioBlob, setAudioBlob] = useState(null);
  const [selectedVoice, setSelectedVoice] = useState("alloy");
  const [showVoiceSelector, setShowVoiceSelector] = useState(false);
  const recorderRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const vadCheckRef = useRef(null);
  const autoStopTimerRef = useRef(null);

  // Voice Activity Detection Parameter - ULTRA SCHNELL
  const SILENCE_THRESHOLD = -20; // dB - Nur echte laute Sprache
  const SILENCE_DURATION = 400; // 0.4 Sekunden - SEHR schnell
  const MAX_RECORDING_TIME = 10000; // 10 Sekunden maximale Aufnahmezeit

  // Coach Voice Options
  const voiceOptions = [
    {
      id: "alloy",
      name: "Alex",
      emoji: "👨‍💼",
      description: "Professionell & ruhig",
      gender: "neutral",
    },
    {
      id: "nova",
      name: "Petra",
      emoji: "👩‍⚕️",
      description: "Warmherzig & einfühlsam",
      gender: "female",
    },
    {
      id: "echo",
      name: "Emma",
      emoji: "👩‍🎓",
      description: "Klar & motivierend",
      gender: "female",
    },
    {
      id: "fable",
      name: "Felix",
      emoji: "�‍🎭",
      description: "Lebhaft & ausdrucksstark",
      gender: "male",
    },
    {
      id: "onyx",
      name: "Ludwig",
      emoji: "👨‍🔬",
      description: "TIEF & männlich (Grandpa)",
      gender: "male",
    },
    {
      id: "shimmer",
      name: "Luna",
      emoji: "👩‍🌾",
      description: "Sanft & beruhigend",
      gender: "female",
    },
  ];

  // Audio nur im Browser abspielen
  useEffect(() => {
    if (
      audioBlob &&
      typeof window !== "undefined" &&
      window.URL &&
      window.URL.createObjectURL
    ) {
      try {
        const audioUrl = window.URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play().catch((e) => console.log("Audio play failed:", e));
        setAudioBlob(null);
        setStatusMessage("🎵 Antwort läuft...");

        // Sehr kurze Rückkehr zum Bereit-Status
        setTimeout(() => {
          setStatusMessage("Klicken zum Sprechen");
        }, 1500); // Nur 1.5 Sekunden
      } catch (e) {
        console.log("Audio creation failed:", e);
        setStatusMessage("Klicken zum Sprechen");
      }
    }
  }, [audioBlob]);

  // Voice Activity Detection
  function startVoiceActivityDetection(stream) {
    try {
      console.log("Starte SCHNELLE Voice Activity Detection...");
      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);

      // Sehr responsive Einstellungen
      analyserRef.current.fftSize = 128; // Klein für Geschwindigkeit
      analyserRef.current.smoothingTimeConstant = 0.1; // Sehr wenig Glättung

      source.connect(analyserRef.current);

      console.log("SCHNELLE VAD Setup erfolgreich");
      checkVoiceActivity();
    } catch (error) {
      console.error("VAD setup failed:", error);
    }
  }

  function checkVoiceActivity() {
    if (!analyserRef.current || !isRecording) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // ULTRA schnelle Lautstärke-Messung
    const average =
      dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    const decibels = 20 * Math.log10(average / 255);

    // SEHR aggressive Sprach-Erkennung
    if (decibels > SILENCE_THRESHOLD) {
      // Sprache erkannt - Timer sofort zurücksetzen
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      setStatusMessage("Höre zu...");
    } else {
      // Stille erkannt - SOFORTIGER Timer start
      if (!silenceTimerRef.current) {
        console.log(
          `ULTRA SCHNELLER Stop in ${SILENCE_DURATION}ms bei ${decibels.toFixed(
            1
          )}dB`
        );
        setStatusMessage("Stop in 0.4s...");
        silenceTimerRef.current = setTimeout(() => {
          console.log("⚡ BLITZ-STOP!");
          if (recorderRef.current && streamRef.current) {
            triggerAutoStop();
          }
        }, SILENCE_DURATION);
      }
    }

    // Sehr häufige Überprüfung für maximale Reaktionszeit
    vadCheckRef.current = requestAnimationFrame(checkVoiceActivity);
  }

  function stopVoiceActivityDetection() {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }
    if (vadCheckRef.current) {
      cancelAnimationFrame(vadCheckRef.current);
      vadCheckRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }

  // Cleanup beim Unmount
  useEffect(() => {
    return () => {
      stopVoiceActivityDetection();
    };
  }, []);

  // Separate Funktion für automatischen Stop durch VAD
  function triggerAutoStop() {
    console.log("triggerAutoStop aufgerufen durch VAD");
    setStatusMessage("Stoppe automatisch...");
    setIsRecording(false);
    setIsProcessing(true);

    // Voice Activity Detection stoppen
    stopVoiceActivityDetection();

    recorderRef.current.stopRecording(async () => {
      console.log("⚡ SCHNELLE Verarbeitung startet...");
      try {
        const blob = recorderRef.current.getBlob();
        const formData = new FormData();
        formData.append("audio", blob, "voice.wav");

        // PARALLEL: STT und Chat vorbereiten
        setStatusMessage("Schnelle Verarbeitung...");

        // Speech-to-Text
        const sttRes = await fetch("/api/stt", {
          method: "POST",
          body: formData,
        });
        if (!sttRes.ok) throw new Error("STT failed");
        const { text } = await sttRes.json();
        console.log("STT fertig:", text);

        // Chat API (sofort nach STT)
        const [chatRes] = await Promise.all([
          fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: text,
              sessionId: user?.id || "anonymous",
              userId: user?.id || null,
            }),
          }),
          // Kurze Pause für bessere UX
          new Promise((resolve) => setTimeout(resolve, 100)),
        ]);

        if (!chatRes.ok) {
          const errorText = await chatRes.text();
          console.error("Chat API Error:", errorText);
          throw new Error(`Chat failed: ${chatRes.status} - ${errorText}`);
        }
        const { reply } = await chatRes.json();
        console.log("Chat fertig:", reply);

        // TTS (sofort nach Chat)
        setStatusMessage("Generiere Audio...");
        console.log("🎤 Sende TTS Request mit Voice:", selectedVoice);
        const ttsRes = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: reply,
            voice: selectedVoice,
          }),
        });
        if (!ttsRes.ok) throw new Error("TTS failed");
        const responseAudioBlob = await ttsRes.blob();
        console.log("TTS fertig - Audio bereit!");

        // Audio sofort abspielen
        setAudioBlob(responseAudioBlob);
      } catch (error) {
        console.error("Error:", error);
        setStatusMessage("Fehler bei der Verarbeitung");
        setTimeout(() => {
          setStatusMessage("Klicken zum Sprechen");
        }, 2000); // Kürzere Error-Anzeige
      } finally {
        setIsProcessing(false);
        stopVoiceActivityDetection();
      }
    });
  }

  async function startRecording() {
    try {
      console.log("startRecording aufgerufen");

      // Cleanup previous timers
      if (autoStopTimerRef.current) {
        clearTimeout(autoStopTimerRef.current);
        autoStopTimerRef.current = null;
      }

      const { default: RecordRTC } = await import("recordrtc");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      recorderRef.current = new RecordRTC(stream, { type: "audio" });
      recorderRef.current.startRecording();
      setIsRecording(true);
      setStatusMessage("Spreche LAUT - stoppt in 0.4s bei Pause!");
      console.log("⚡ ULTRA-SCHNELLE VAD aktiviert!");

      // Voice Activity Detection starten
      startVoiceActivityDetection(stream);

      // Fallback: Maximale Aufnahmezeit (30 Sekunden)
      autoStopTimerRef.current = setTimeout(() => {
        console.log("Maximale Aufnahmezeit erreicht - automatischer Stop");
        if (recorderRef.current && streamRef.current) {
          triggerAutoStop();
        }
      }, MAX_RECORDING_TIME);
    } catch (error) {
      console.error("Recording start failed:", error);
      setStatusMessage("Fehler beim Starten der Aufnahme");
    }
  }

  async function stopRecording() {
    if (!recorderRef.current || !isRecording) {
      console.log("stopRecording: Keine aktive Aufnahme");
      return;
    }

    console.log("⚡ Manueller SCHNELL-Stop!");

    // Timer stoppen falls noch aktiv
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }

    setIsRecording(false);
    setIsProcessing(true);
    setStatusMessage("Schnelle Verarbeitung...");

    // Voice Activity Detection stoppen
    stopVoiceActivityDetection();

    recorderRef.current.stopRecording(async () => {
      console.log("⚡ TURBO Verarbeitung startet...");
      try {
        const blob = recorderRef.current.getBlob();
        const formData = new FormData();
        formData.append("audio", blob, "voice.wav");

        // TURBO: Alles so schnell wie möglich
        const sttRes = await fetch("/api/stt", {
          method: "POST",
          body: formData,
        });
        if (!sttRes.ok) throw new Error("STT failed");
        const { text } = await sttRes.json();
        console.log("⚡ STT TURBO fertig:", text);

        // Chat sofort nach STT
        const chatRes = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            sessionId: user?.id || "anonymous",
            userId: user?.id || null,
          }),
        });

        if (!chatRes.ok) {
          const errorText = await chatRes.text();
          console.error("Chat API Error:", errorText);
          throw new Error(`Chat failed: ${chatRes.status} - ${errorText}`);
        }
        const { reply } = await chatRes.json();
        console.log("⚡ Chat TURBO fertig:", reply);

        // TTS sofort nach Chat
        console.log("🎤 TURBO TTS Request mit Voice:", selectedVoice);
        const ttsRes = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: reply,
            voice: selectedVoice,
          }),
        });
        if (!ttsRes.ok) throw new Error("TTS failed");
        const responseAudioBlob = await ttsRes.blob();
        console.log("⚡ TTS TURBO fertig - Audio bereit!");

        // Audio sofort setzen
        setAudioBlob(responseAudioBlob);
      } catch (error) {
        console.error("Error:", error);
        setStatusMessage("Fehler bei der Verarbeitung");
        setTimeout(() => {
          setStatusMessage("Klicken zum Sprechen");
        }, 2000);
      } finally {
        setIsProcessing(false);
        stopVoiceActivityDetection();
      }
    });
  }

  function getButtonText() {
    if (isProcessing) return "Verarbeitet...";
    if (isRecording) return "Fertig sprechen";
    return "Sprechen";
  }

  function handleButtonClick() {
    if (isProcessing) return; // Keine Aktion während Verarbeitung

    if (isRecording) {
      // Optional: Manueller Stop ist weiterhin möglich
      stopRecording();
    } else {
      startRecording();
    }
  }

  return (
    <Container>
      {/* <UserInfo>Willkommen, {user?.email}</UserInfo> */}

      <LogoutButton onClick={signOut}>Abmelden</LogoutButton>

      <VoiceSelectButton onClick={() => setShowVoiceSelector(true)}>
        🎤 Coach wählen:{" "}
        {voiceOptions.find((v) => v.id === selectedVoice)?.name}
      </VoiceSelectButton>

      <Title>Mental 🧠 Co(u)ach</Title>

      {showVoiceSelector && (
        <VoiceSelectorContainer>
          <CloseButton onClick={() => setShowVoiceSelector(false)}>
            ×
          </CloseButton>
          <h3
            style={{
              textAlign: "center",
              color: "#374151",
              marginBottom: "1rem",
            }}
          >
            Wähle deinen Mental Coach
          </h3>
          <VoiceGrid>
            {voiceOptions.map((voice) => (
              <VoiceCard
                key={voice.id}
                isSelected={selectedVoice === voice.id}
                onClick={() => {
                  console.log(
                    "🎭 Voice gewählt:",
                    voice.name,
                    "(" + voice.id + ")"
                  );
                  setSelectedVoice(voice.id);
                  setShowVoiceSelector(false);
                }}
              >
                <VoiceEmoji>{voice.emoji}</VoiceEmoji>
                <VoiceName>{voice.name}</VoiceName>
                <VoiceDescription>{voice.description}</VoiceDescription>
              </VoiceCard>
            ))}
          </VoiceGrid>
        </VoiceSelectorContainer>
      )}

      <CircleButton
        onClick={handleButtonClick}
        isRecording={isRecording}
        isProcessing={isProcessing}
        disabled={isProcessing}
      >
        {getButtonText()}
      </CircleButton>

      <StatusText isBlinking={isProcessing}>{statusMessage}</StatusText>
    </Container>
  );
}

export default function Home() {
  const { user, loading } = useAuth();

  // Loading state
  if (loading) {
    return (
      <Container>
        <StatusText>Lade...</StatusText>
      </Container>
    );
  }

  // Show auth form if not logged in
  if (!user) {
    return <AuthForm />;
  }

  // Show main app if logged in
  return <AudioRecorderComponent />;
}
