import React, { useState } from "react";
import { useAuth } from "../AuthContext";
import { COLOR, Btn, Field, inputStyle, ErrorBanner } from "../ui";

export default function Login() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("sales");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      if (mode === "login") {
        await signIn({ phone, password });
      } else {
        await signUp({ name, phone, password, role });
      }
    } catch (e2) {
      setErr(e2.message || "Terjadi kesalahan.");
    }
    setBusy(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div className="mono" style={{ fontSize: 13, color: COLOR.muted, letterSpacing: 1, marginBottom: 6 }}>sales reporting</div>
        <div style={{ fontSize: 26, fontWeight: 600, marginBottom: 24 }}>Rute</div>

        <div style={{ display: "flex", gap: 0, marginBottom: 18, border: "1px solid " + COLOR.line, borderRadius: 4, overflow: "hidden" }}>
          {["login", "register"].map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setErr(""); }}
              style={{
                flex: 1, padding: "9px 0", border: "none", fontSize: 13.5, fontWeight: 500,
                background: mode === m ? COLOR.ink : "#fff", color: mode === m ? "#fff" : COLOR.text,
              }}
            >
              {m === "login" ? "Masuk" : "Daftar"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} style={{ background: "#fff", border: "1px solid " + COLOR.line, borderRadius: 4, padding: 18 }}>
          <ErrorBanner message={err} />
          {mode === "register" && (
            <>
              <Field label="Nama lengkap">
                <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} required />
              </Field>
              <Field label="Daftar sebagai">
                <select style={inputStyle} value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="sales">Tim Sales</option>
                  <option value="owner">Owner / Admin</option>
                </select>
              </Field>
            </>
          )}
          <Field label="Nomor telepon">
            <input style={inputStyle} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08xxxxxxxxxx" required />
          </Field>
          <Field label="Kata sandi" hint={mode === "register" ? "Minimal 6 karakter." : undefined}>
            <input style={inputStyle} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </Field>
          <Btn type="submit" disabled={busy} style={{ width: "100%", justifyContent: "center", marginTop: 4 }}>
            {busy ? "Memproses\u2026" : mode === "login" ? "Masuk" : "Daftar & Masuk"}
          </Btn>
        </form>
      </div>
    </div>
  );
}
