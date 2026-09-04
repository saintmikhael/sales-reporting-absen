import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase, phoneToEmail } from "./lib/supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(userId) {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (!error) setProfile(data);
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session) await loadProfile(data.session.user.id);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession) await loadProfile(newSession.user.id);
      else setProfile(null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function signUp({ name, phone, password, role }) {
    const { data, error } = await supabase.auth.signUp({
      email: phoneToEmail(phone),
      password,
      options: { data: { name, phone, role } },
    });
    if (error) throw error;
    // If email confirmation is off (as instructed in the setup README),
    // signUp returns an active session immediately. If not, this will be
    // null and the person needs email confirmation disabled in Supabase.
    if (!data.session) {
      throw new Error("Akun dibuat, tetapi sesi tidak aktif. Pastikan 'Confirm email' dimatikan di pengaturan Supabase Auth.");
    }
  }

  async function signIn({ phone, password }) {
    const { error } = await supabase.auth.signInWithPassword({ email: phoneToEmail(phone), password });
    if (error) throw error;
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ session, profile, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
