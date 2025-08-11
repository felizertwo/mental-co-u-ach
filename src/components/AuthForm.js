"use client";

import { useState } from "react";
import styled from "styled-components";
import { supabase } from "@/lib/supabase-client";

const AuthContainer = styled.div`
  min-height: 100vh;
  background-image: url("/images/chair.jpg");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1;
  }
`;

const AuthCard = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 3rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  max-width: 400px;
  width: 100%;
  position: relative;
  z-index: 2;
`;

const Title = styled.h1`
  text-align: center;
  color: #4f46e5;
  margin-bottom: 2rem;
  font-size: 2rem;
  font-weight: 700;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Input = styled.input`
  padding: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  font-size: 1rem;
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: #4f46e5;
  }
`;

const Button = styled.button`
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: white;
  border: none;
  border-radius: 10px;
  padding: 1rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(79, 70, 229, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const SecondaryButton = styled(Button)`
  background: transparent;
  color: #4f46e5;
  border: 2px solid #4f46e5;

  &:hover {
    background: #4f46e5;
    color: white;
  }
`;

const ErrorMessage = styled.div`
  background: #fef2f2;
  color: #dc2626;
  padding: 1rem;
  border-radius: 10px;
  border: 1px solid #fecaca;
  text-align: center;
`;

const SuccessMessage = styled.div`
  background: #f0fdf4;
  color: #16a34a;
  padding: 1rem;
  border-radius: 10px;
  border: 1px solid #bbf7d0;
  text-align: center;
`;

const SwitchText = styled.p`
  text-align: center;
  margin-top: 1.5rem;
  color: #6b7280;

  button {
    background: none;
    border: none;
    color: #4f46e5;
    text-decoration: underline;
    cursor: pointer;
    font-weight: 600;
  }
`;

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // User wird automatisch weitergeleitet durch den Auth Listener
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName || null, // Optional first name
            },
          },
        });

        if (error) throw error;

        setMessage("Registrierung erfolgreich! Bitte überprüfe deine E-Mail.");
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContainer>
      <AuthCard>
        <Title>🧠 Mental Co(u)ach</Title>
        <Form onSubmit={handleSubmit}>
          <Input
            type="email"
            placeholder="E-Mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Passwort"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {!isLogin && (
            <Input
              type="text"
              placeholder="Vorname (optional)"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          )}

          {error && <ErrorMessage>{error}</ErrorMessage>}
          {message && <SuccessMessage>{message}</SuccessMessage>}

          <Button type="submit" disabled={loading}>
            {loading
              ? "Wird verarbeitet..."
              : isLogin
              ? "Anmelden"
              : "Registrieren"}
          </Button>

          <SecondaryButton type="button" onClick={() => setIsLogin(!isLogin)}>
            {isLogin
              ? "Neuen Account erstellen"
              : "Bereits registriert? Anmelden"}
          </SecondaryButton>
        </Form>
      </AuthCard>
    </AuthContainer>
  );
}
