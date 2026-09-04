import React from "react";
import { X } from "lucide-react";

export const COLOR = {
  ink: "#1C2431",
  inkSoft: "#2A3444",
  paper: "#F1EEE7",
  panel: "#FFFFFF",
  line: "#DCD8CC",
  lineSoft: "#EAE7DD",
  muted: "#6D6F73",
  text: "#20242B",
  sale: "#2F6B57",
  saleBg: "#E4EFEA",
  none: "#B4552F",
  noneBg: "#F5E7DE",
  amber: "#B5811C",
  amberBg: "#F6EBD3",
  steel: "#2E5A82",
  steelBg: "#E5EDF3",
  danger: "#A83A3A",
};

export const RADIUS_LIMIT_M = 20;

export function GlobalStyle() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
      * { box-sizing: border-box; }
      body { font-family: 'IBM Plex Sans', sans-serif; color: ${COLOR.text}; background: ${COLOR.paper}; }
      .mono { font-family: 'IBM Plex Mono', monospace; }
      button { font-family: inherit; cursor: pointer; }
      input, select, textarea { font-family: inherit; }
      ::placeholder { color: #9A978C; }
    `}</style>
  );
}

export const inputStyle = {
  width: "100%",
  padding: "9px 10px",
  fontSize: 14,
  border: "1px solid " + COLOR.line,
  borderRadius: 3,
  background: "#fff",
  color: COLOR.text,
};

export function Btn({ children, onClick, variant = "default", type = "button", disabled, style, title }) {
  const base = {
    padding: "9px 16px",
    fontSize: 13.5,
    fontWeight: 500,
    borderRadius: 3,
    border: "1px solid " + COLOR.ink,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    opacity: disabled ? 0.5 : 1,
  };
  const variants = {
    default: { background: COLOR.ink, color: "#fff", borderColor: COLOR.ink },
    ghost: { background: "transparent", color: COLOR.ink, borderColor: COLOR.line },
    danger: { background: "#fff", color: COLOR.danger, borderColor: COLOR.danger },
    steel: { background: COLOR.steel, color: "#fff", borderColor: COLOR.steel },
  };
  return (
    <button type={type} disabled={disabled} onClick={onClick} title={title} style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

export function Field({ label, children, hint }) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <div style={{ fontSize: 12.5, color: COLOR.muted, marginBottom: 5 }}>{label}</div>
      {children}
      {hint && <div style={{ fontSize: 11.5, color: COLOR.muted, marginTop: 4 }}>{hint}</div>}
    </label>
  );
}

export function Modal({ title, onClose, children, width = 480 }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(28,36,49,0.45)", display: "flex",
        alignItems: "flex-start", justifyContent: "center", padding: "5vh 16px", zIndex: 50, overflowY: "auto",
      }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "#fff", width: "100%", maxWidth: width, borderRadius: 4, border: "1px solid " + COLOR.line }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid " + COLOR.lineSoft }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{title}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", padding: 4, color: COLOR.muted }}><X size={18} /></button>
        </div>
        <div style={{ padding: 18 }}>{children}</div>
      </div>
    </div>
  );
}

export function Badge({ children, tone = "sale" }) {
  const map = {
    sale: [COLOR.saleBg, COLOR.sale],
    none: [COLOR.noneBg, COLOR.none],
    amber: [COLOR.amberBg, COLOR.amber],
    steel: [COLOR.steelBg, COLOR.steel],
  };
  const [bg, fg] = map[tone];
  return <span style={{ background: bg, color: fg, fontSize: 11.5, fontWeight: 500, padding: "3px 8px", borderRadius: 3, whiteSpace: "nowrap" }}>{children}</span>;
}

export function EmptyState({ icon: Icon, title, body, actionLabel, onAction }) {
  return (
    <div style={{ textAlign: "center", padding: "56px 20px", color: COLOR.muted }}>
      <Icon size={30} style={{ opacity: 0.5, marginBottom: 10 }} />
      <div style={{ fontSize: 15, fontWeight: 600, color: COLOR.text, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 13.5, maxWidth: 380, margin: "0 auto 16px" }}>{body}</div>
      {actionLabel && <Btn onClick={onAction}>{actionLabel}</Btn>}
    </div>
  );
}

export function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div style={{
      position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", background: COLOR.ink, color: "#fff",
      padding: "10px 18px", borderRadius: 4, fontSize: 13.5, zIndex: 100, boxShadow: "0 4px 14px rgba(0,0,0,.2)",
    }}>{msg}</div>
  );
}

export function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div style={{ background: COLOR.noneBg, color: COLOR.none, fontSize: 13, padding: "9px 12px", borderRadius: 3, marginBottom: 14 }}>
      {message}
    </div>
  );
}
