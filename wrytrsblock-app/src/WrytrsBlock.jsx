import { useState } from "react";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GLOBAL STYLES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const globalStyles = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
* { box-sizing: border-box; margin: 0; padding: 0; }
input, textarea, button { font-family: 'Inter', sans-serif; }
::-webkit-scrollbar { display: none; }
@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.55; transform: scale(0.85); }
}
@keyframes glow-breath {
  0%, 100% { box-shadow: 0 8px 24px rgba(123,58,237,0.45), 0 0 0 0 rgba(155,92,246,0.4); }
  50% { box-shadow: 0 8px 28px rgba(123,58,237,0.55), 0 0 0 6px rgba(155,92,246,0.08); }
}
`;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TOKENS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const T = {
  bg: "#0d0d1a",
  surface: "rgba(255,255,255,0.06)",
  surface2: "rgba(255,255,255,0.05)",
  surface3: "rgba(255,255,255,0.08)",
  border: "rgba(255,255,255,0.1)",
  text: "#ffffff",
  textSub: "rgba(255,255,255,0.7)",
  textDim: "rgba(255,255,255,0.4)",
  blue: "#8b9dff",
  purple: "#c4a7ff",
  green: "#22c55e",
  red: "#ef4444",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DEMO ARTISTS (seeded so testers see a populated market)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const MARKET_ARTISTS = [
  { name: "Clint Spark", roles: ["Producer","Beatmaker"], location: "Atlanta, GA", genres: ["Hip-Hop","Trap"], score: 4.9, collabs: 24, badge: "Verified", initials: "CS", color: "#7c3aed", bio: "Atlanta-bred producer crafting hard-hitting trap with melodic flourishes. Always down to push sound boundaries.", online: true, tracks: [{ platform: "SoundCloud", color: "#ff5500", url: "https://soundcloud.com/discover" }] },
  { name: "Lela Producer", roles: ["Producer"], location: "Toronto, ON", genres: ["R&B","Soul"], score: 4.8, collabs: 18, badge: null, initials: "LP", color: "#4a7fff", bio: "R&B producer with a soul foundation. Building warm, vintage-inspired records.", online: true, tracks: [{ platform: "Spotify", color: "#1db954", url: "https://open.spotify.com/" }] },
  { name: "Stephen Vince", roles: ["Songwriter","Topliner"], location: "Los Angeles, CA", genres: ["Pop","R&B"], score: 4.7, collabs: 31, badge: "Top Collab", initials: "SV", color: "#9b5cf6", bio: "Topliner and lyricist. 31 placements and counting. Send beats, I send hooks.", online: false, tracks: [{ platform: "YouTube", color: "#ff0000", url: "https://www.youtube.com/" }] },
  { name: "Maya R.", roles: ["Vocalist","Songwriter"], location: "Brooklyn, NY", genres: ["Neo-Soul","Jazz"], score: 4.9, collabs: 12, badge: null, initials: "MR", color: "#ec4899", bio: "Brooklyn vocalist drawing from jazz, soul, and bedroom-pop. Voice with a story.", online: true, tracks: [{ platform: "SoundCloud", color: "#ff5500", url: "https://soundcloud.com/discover" }] },
  { name: "DJ Halo", roles: ["Mixing Engineer"], location: "Houston, TX", genres: ["Hip-Hop","R&B"], score: 5.0, collabs: 47, badge: "Verified", initials: "DH", color: "#14b8a6", bio: "Mix engineer with 47 completed Blocks. Fast turnaround, label-quality finish.", online: false, tracks: [{ platform: "Spotify", color: "#1db954", url: "https://open.spotify.com/" }] },
  { name: "Kai West", roles: ["Artist","Rapper"], location: "Chicago, IL", genres: ["Hip-Hop","Drill"], score: 4.6, collabs: 9, badge: null, initials: "KW", color: "#f59e0b", bio: "Chicago drill artist. Sharp lyricism, unfiltered energy.", online: true, tracks: [{ platform: "SoundCloud", color: "#ff5500", url: "https://soundcloud.com/discover" }] },
  { name: "Jordan Rae", roles: ["Vocalist","Songwriter"], location: "Toronto, ON", genres: ["R&B","Pop"], score: 0, collabs: 0, badge: null, initials: "JR", color: "#06b6d4", bio: "New voice from Toronto. Looking to build my first credits with serious collaborators.", online: true, tracks: [] },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HELPERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RATING — shows ★ score + Block count, or "New" badge if collabs < 3
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function RatingDisplay({ score, collabs, size }) {
  const sz = size || "sm";  // "sm" or "lg"
  const isNew = collabs < 3;

  if (sz === "lg") {
    return (
      <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: 14, overflow: "hidden", border: "1px solid " + T.border, marginBottom: 24 }}>
        {isNew ? (
          <div style={{ flex: 1, padding: "16px 12px", textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#fbbf24", marginBottom: 4 }}>✨ New Collaborator</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>Rating unlocks after 3 completed Blocks ({collabs}/3)</div>
          </div>
        ) : (
          <>
            <div style={{ flex: 1, padding: "14px 8px", textAlign: "center", borderRight: "1px solid " + T.border }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#fbbf24" }}>{score.toFixed(1)}★</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>Rating</div>
            </div>
            <div style={{ flex: 1, padding: "14px 8px", textAlign: "center", borderRight: "1px solid " + T.border }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>{collabs}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>Blocks</div>
            </div>
            <div style={{ flex: 1, padding: "14px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>24h</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>Replies</div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Small inline version for cards
  if (isNew) {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "2px 8px", borderRadius: 99,
        background: "rgba(251,191,36,0.15)", color: "#fbbf24",
        fontSize: 11, fontWeight: 700,
      }}>✨ New</span>
    );
  }
  return (
    <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 11 }}>
      ⭐ {score.toFixed(1)} · {collabs} {collabs === 1 ? "Block" : "Blocks"}
    </span>
  );
}

function ProgressDots({ total, current }) {
  const dots = [];
  for (let i = 0; i < total; i++) {
    dots.push(
      <div key={i} style={{
        width: i === current ? 24 : 8,
        height: 8,
        borderRadius: 4,
        background: i <= current ? T.blue : "rgba(255,255,255,0.2)",
      }} />
    );
  }
  return <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 36 }}>{dots}</div>;
}

function BackButton({ onClick }) {
  return (
    <button onClick={onClick} style={{ background: "none", border: "none", cursor: "pointer", padding: 8 }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M19 12H5M5 12l7-7M5 12l7 7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
}

function ScreenHeader({ title, onBack }) {
  return (
    <div style={{ display: "flex", alignItems: "center", paddingTop: 20, marginBottom: 32 }}>
      <BackButton onClick={onBack} />
      <div style={{ flex: 1, textAlign: "center", fontSize: 16, fontWeight: 700, color: "#fff" }}>{title}</div>
      <div style={{ width: 36 }} />
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// BOTTOM NAV — 3 tabs only (Market, Blocks, Profile)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function BottomNav({ active, setTab, pendingInvites }) {
  const tabs = [
    { id: "market", label: "Market", icon: function(a) { return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="11" cy="11" r="7" stroke={a ? T.blue : "rgba(255,255,255,0.6)"} strokeWidth="1.8"/>
        <path d="M17 17l3 3" stroke={a ? T.blue : "rgba(255,255,255,0.6)"} strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ); } },
    { id: "blocks", label: "Blocks", icon: function(a) { return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="7" height="7" rx="1.5" stroke={a ? T.blue : "rgba(255,255,255,0.6)"} fill={a ? T.blue : "none"} strokeWidth="1.8"/>
        <rect x="14" y="3" width="7" height="7" rx="1.5" stroke={a ? T.blue : "rgba(255,255,255,0.6)"} strokeWidth="1.8"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5" stroke={a ? T.blue : "rgba(255,255,255,0.6)"} strokeWidth="1.8"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5" stroke={a ? T.blue : "rgba(255,255,255,0.6)"} fill={a ? T.purple : "none"} strokeWidth="1.8"/>
      </svg>
    ); } },
    { id: "profile", label: "Profile", icon: function(a) { return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" stroke={a ? T.blue : "rgba(255,255,255,0.6)"} strokeWidth="1.8"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={a ? T.blue : "rgba(255,255,255,0.6)"} strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ); } },
  ];

  return (
    <div style={{
      position: "absolute", bottom: 0, left: 0, right: 0, height: 72,
      background: "rgba(13,13,26,0.92)",
      borderTop: "1px solid rgba(255,255,255,0.08)",
      display: "flex", alignItems: "center",
      justifyContent: "space-around", padding: "0 8px 10px",
      zIndex: 200,
    }}>
      {tabs.map(t => {
        const isActive = active === t.id;
        const showBadge = t.id === "blocks" && pendingInvites > 0;
        return (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: "none", border: "none", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center",
            gap: 4, padding: "4px 16px", flex: 1, position: "relative",
          }}>
            <div style={{ position: "relative" }}>
              {t.icon(isActive)}
              {showBadge && (
                <div style={{
                  position: "absolute", top: -4, right: -8,
                  minWidth: 16, height: 16, borderRadius: 8,
                  background: T.red, color: "#fff",
                  fontSize: 10, fontWeight: 800,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: "0 5px",
                  border: "2px solid #0d0d1a",
                }}>{pendingInvites}</div>
              )}
            </div>
            <span style={{
              fontSize: 10, fontWeight: isActive ? 700 : 500,
              color: isActive ? "#fff" : "rgba(255,255,255,0.6)",
              letterSpacing: isActive ? "0.3px" : "0",
            }}>{t.label}</span>
            {isActive && (
              <span style={{
                position: "absolute", bottom: -2,
                width: 4, height: 4, borderRadius: "50%",
                background: T.blue,
              }} />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// BRAND LOGO (real PNG embedded as base64)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const APP_ICON = "data:image/png;base64,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";


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SPLASH SCREEN — original two-section design
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function SplashScreen({ onSignUp, onLogin }) {
  return (
    <div style={{
      height: "100%",
      overflow: "hidden",
      background: "radial-gradient(ellipse at 50% 30%, #2d1a5c 0%, #1a0d3a 40%, #0d0820 75%, #050510 100%)",
      position: "relative",
    }}>
      {/* Subtle ambient glow */}
      <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(123,58,237,0.18) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{
        position: "relative", zIndex: 1,
        padding: "44px 24px 28px",
        display: "flex", flexDirection: "column",
        height: "100%",
      }}>

        {/* ── BRAND LOCKUP ── */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{
            fontSize: 11, fontWeight: 600,
            color: "rgba(255,255,255,0.4)",
            letterSpacing: "5px", textTransform: "uppercase",
            marginBottom: 28,
          }}>
            The Cr8tv Collectv
          </div>

          <div style={{
            width: 140, height: 140,
            borderRadius: 32,
            marginBottom: 24,
            overflow: "hidden",
            boxShadow: "0 14px 50px rgba(123,58,237,0.4)",
            background: "#000000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <img src={APP_ICON} alt="Wrytrs Block" style={{ width: "70%", height: "70%", objectFit: "contain", display: "block" }} />
          </div>
          <div style={{
            fontSize: 36, fontWeight: 900, color: "#ffffff",
            letterSpacing: "-0.8px", lineHeight: 1.0,
          }}>Wrytrs Block</div>
        </div>

        {/* ── HERO HEADLINE (centered between logo and buttons) ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ textAlign: "center", marginBottom: 18 }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: "#ffffff", textTransform: "uppercase", letterSpacing: "-1.3px", lineHeight: 0.95 }}>JOIN THE</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: "#f5a623", textTransform: "uppercase", letterSpacing: "-1.1px", lineHeight: 1.05 }}>RIGHT BLOCK.</div>
          </div>

          <p style={{
            fontSize: 15, color: "rgba(255,255,255,0.78)",
            lineHeight: 1.55, textAlign: "center",
            fontWeight: 400, maxWidth: 320, marginLeft: "auto", marginRight: "auto",
          }}>
            Collaborate with artists, producers, writers, and engineers in real time.
          </p>
        </div>

        {/* ── BOTTOM ACTIONS ── */}
        <div>
          {/* Social proof */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ display: "flex" }}>
              {["#a78bfa","#818cf8","#6366f1","#4f46e5"].map(function(c, i) {
                return (
                  <div key={i} style={{
                    width: 26, height: 26, borderRadius: "50%",
                    background: c,
                    border: "2px solid rgba(255,255,255,0.4)",
                    marginLeft: i > 0 ? -8 : 0,
                  }} />
                );
              })}
            </div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.78)" }}>
              <span style={{ fontWeight: 800, color: "#fff" }}>2,400+</span> creatives ready to collaborate
            </p>
          </div>

          {/* Buttons */}
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
            <button onClick={onSignUp} style={{
              width: "100%", padding: "16px",
              background: "linear-gradient(135deg,#4a7fff,#9b5cf6)",
              border: "none",
              borderRadius: 99, color: "#ffffff",
              fontSize: 16, fontWeight: 800, cursor: "pointer",
              fontFamily: "inherit", letterSpacing: "0.2px",
              boxShadow: "0 8px 28px rgba(123,58,237,0.45)",
            }}>Create Free Account</button>

            <button onClick={onLogin} style={{
              width: "100%", padding: "14px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 99, color: "#fff",
              fontSize: 15, fontWeight: 600, cursor: "pointer",
              fontFamily: "inherit",
            }}>Log In</button>
          </div>

          {/* Footer */}
          <p style={{
            fontSize: 10, color: "rgba(255,255,255,0.45)",
            textAlign: "center",
            lineHeight: 1.5, fontFamily: "inherit",
          }}>
            By creating an account you agree to our<br />
            <span style={{ color: "rgba(255,255,255,0.7)", textDecoration: "underline" }}>Terms</span> and <span style={{ color: "rgba(255,255,255,0.7)", textDecoration: "underline" }}>Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SIGN UP — basics
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function SignUpScreen({ onBack, onNext }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const mismatch = confirm.length > 0 && password !== confirm;
  const canContinue = name && email && password && confirm && !mismatch;

  return (
    <div style={{ height: "100%", background: "radial-gradient(ellipse at 50% 30%, #0c1d42 0%, #07091a 50%, #050510 100%)", display: "flex", flexDirection: "column", padding: "0 24px", overflowY: "auto" }}>
      <ScreenHeader title="Create Account" onBack={onBack} />
      <ProgressDots total={4} current={0} />

      <div style={{ fontSize: 26, fontWeight: 900, color: "#fff", marginBottom: 6 }}>Let's get you in 🎵</div>
      <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 32 }}>Quick setup — takes under a minute</div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
        <Field label="FULL NAME" value={name} onChange={setName} placeholder="Your name or artist name" />
        <Field label="EMAIL" value={email} onChange={setEmail} placeholder="your@email.com" type="email" />
        <Field label="PASSWORD" value={password} onChange={setPassword} placeholder="Create a password" type="password" />
        <Field label="CONFIRM PASSWORD" value={confirm} onChange={setConfirm} placeholder="Re-enter your password" type="password" error={mismatch} />
        {mismatch && <div style={{ fontSize: 12, color: T.red, marginTop: -10 }}>Passwords don't match</div>}

        <button onClick={() => canContinue && onNext({ name, email })} style={{
          width: "100%", padding: "17px", marginTop: 12,
          background: canContinue ? "linear-gradient(135deg,#4a7fff,#9b5cf6)" : "rgba(255,255,255,0.1)",
          border: "none", borderRadius: 99, color: "#fff", fontSize: 16, fontWeight: 700,
          cursor: canContinue ? "pointer" : "default", fontFamily: "inherit",
          opacity: canContinue ? 1 : 0.5,
        }}>Continue</button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type, error }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: 6, letterSpacing: "0.5px" }}>{label}</div>
      <input
        type={type || "text"}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", padding: "14px 16px",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid " + (error ? T.red : "rgba(255,255,255,0.12)"),
          borderRadius: 12, color: "#fff", fontSize: 15, outline: "none",
          fontFamily: "inherit", boxSizing: "border-box",
        }}
      />
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ROLE SELECTION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function RoleScreen({ onBack, onNext }) {
  const [selected, setSelected] = useState([]);
  const [otherOpen, setOtherOpen] = useState(false);
  const [otherValue, setOtherValue] = useState("");
  const roles = [
    "Artist / Rapper", "Singer / Vocalist", "Producer", "Songwriter",
    "Mixing Engineer", "Guitarist", "Pianist / Keys", "Drummer",
    "Bassist", "DJ", "Composer",
  ];
  const toggle = r => setSelected(prev => prev.includes(r) ? prev.filter(x => x !== r) : prev.concat([r]));

  function handleContinue() {
    let final = selected.slice();
    const trimmed = otherValue.trim();
    if (otherOpen && trimmed && !final.includes(trimmed)) {
      final = final.concat([trimmed]);
    }
    if (final.length) onNext(final);
  }

  const canContinue = selected.length > 0 || (otherOpen && otherValue.trim().length > 0);

  return (
    <div style={{ height: "100%", background: "radial-gradient(ellipse at 50% 30%, #0c1d42 0%, #07091a 50%, #050510 100%)", display: "flex", flexDirection: "column", padding: "0 24px", overflowY: "auto" }}>
      <ScreenHeader title="Your Role" onBack={onBack} />
      <ProgressDots total={4} current={1} />

      <div style={{ fontSize: 26, fontWeight: 900, color: "#fff", marginBottom: 6 }}>What do you do? 🎤</div>
      <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 24 }}>Pick all that apply</div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
        {roles.map(r => {
          const on = selected.includes(r);
          return (
            <button key={r} onClick={() => toggle(r)} style={{
              padding: "10px 16px", borderRadius: 99, fontSize: 13, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
              background: on ? "rgba(74,127,255,0.2)" : "rgba(255,255,255,0.06)",
              border: "1px solid " + (on ? T.blue : "rgba(255,255,255,0.12)"),
              color: on ? T.blue : "rgba(255,255,255,0.7)",
            }}>{r}</button>
          );
        })}
        <button onClick={() => { setOtherOpen(o => !o); if (otherOpen) setOtherValue(""); }} style={{
          padding: "10px 16px", borderRadius: 99, fontSize: 13, fontWeight: 600,
          cursor: "pointer", fontFamily: "inherit",
          background: otherOpen ? "rgba(155,92,246,0.2)" : "rgba(255,255,255,0.06)",
          border: "1px solid " + (otherOpen ? T.purple : "rgba(255,255,255,0.12)"),
          color: otherOpen ? T.purple : "rgba(255,255,255,0.7)",
        }}>+ Other</button>
      </div>

      {otherOpen && (
        <input
          autoFocus
          value={otherValue}
          onChange={e => setOtherValue(e.target.value)}
          placeholder="Type your role (e.g. Topliner, A&R)"
          style={{
            width: "100%", padding: "12px 16px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(155,92,246,0.4)",
            borderRadius: 12, color: "#fff", fontSize: 14, outline: "none",
            fontFamily: "inherit", boxSizing: "border-box", marginBottom: 24,
          }}
        />
      )}

      <button onClick={handleContinue} style={{
        width: "100%", padding: "17px", marginTop: "auto", marginBottom: 24,
        background: canContinue ? "linear-gradient(135deg,#4a7fff,#9b5cf6)" : "rgba(255,255,255,0.1)",
        border: "none", borderRadius: 99, color: "#fff", fontSize: 16, fontWeight: 700,
        cursor: canContinue ? "pointer" : "default", fontFamily: "inherit",
        opacity: canContinue ? 1 : 0.5,
      }}>Continue</button>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PROFILE PHOTO UPLOAD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function PhotoScreen({ onBack, onNext }) {
  const [photo, setPhoto] = useState(null);

  function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setPhoto(ev.target.result);
    reader.readAsDataURL(file);
  }

  return (
    <div style={{ height: "100%", background: "radial-gradient(ellipse at 50% 30%, #0c1d42 0%, #07091a 50%, #050510 100%)", display: "flex", flexDirection: "column", padding: "0 24px", overflowY: "auto" }}>
      <ScreenHeader title="Profile Photo" onBack={onBack} />
      <ProgressDots total={4} current={2} />

      <div style={{ fontSize: 26, fontWeight: 900, color: "#fff", marginBottom: 6 }}>Add your photo 📸</div>
      <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 40 }}>
        Profiles with a photo get 5x more invites.
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
        <label style={{ cursor: "pointer", marginBottom: 20 }}>
          <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleUpload} />
          <div style={{
            width: 200, height: 200, borderRadius: "50%",
            background: photo ? "#000" : "rgba(255,255,255,0.05)",
            border: photo ? "3px solid rgba(255,255,255,0.15)" : "2px dashed rgba(255,255,255,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden", position: "relative",
          }}>
            {photo ? (
              <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="rgba(255,255,255,0.55)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="13" r="4" stroke="rgba(255,255,255,0.55)" strokeWidth="1.8"/>
                </svg>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>Tap to upload</span>
              </div>
            )}
          </div>
        </label>

        {photo && (
          <button onClick={() => setPhoto(null)} style={{
            background: "none", border: "none", cursor: "pointer",
            color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 600,
            padding: "8px 16px", marginBottom: 20,
          }}>Remove photo</button>
        )}
      </div>

      <button onClick={() => onNext(photo)} style={{
        width: "100%", padding: "17px", marginBottom: 16,
        background: photo ? "linear-gradient(135deg,#4a7fff,#9b5cf6)" : "rgba(255,255,255,0.1)",
        border: "none", borderRadius: 99, color: "#fff",
        fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
        opacity: photo ? 1 : 0.6,
      }}>Continue</button>

      <button onClick={() => onNext(null)} style={{
        width: "100%", padding: "12px", marginBottom: 24,
        background: "none", border: "none",
        color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: 500,
        cursor: "pointer", fontFamily: "inherit",
      }}>Skip for now</button>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LOCATION + AUDIO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function detectPlatform(url) {
  const u = url.toLowerCase();
  if (u.includes("soundcloud.com")) return { name: "SoundCloud", color: "#ff5500" };
  if (u.includes("spotify.com") || u.includes("open.spotify")) return { name: "Spotify", color: "#1db954" };
  if (u.includes("youtube.com") || u.includes("youtu.be")) return { name: "YouTube", color: "#ff0000" };
  if (u.includes("bandcamp.com")) return { name: "Bandcamp", color: "#629aa9" };
  if (u.includes("music.apple") || u.includes("apple.co")) return { name: "Apple Music", color: "#fc3c44" };
  if (u.includes("audiomack.com")) return { name: "Audiomack", color: "#ffa500" };
  if (u.includes("dropbox.com")) return { name: "Dropbox", color: "#0061ff" };
  if (u.includes("drive.google") || u.includes("docs.google")) return { name: "Google Drive", color: "#1fa463" };
  if (u.includes("we.tl") || u.includes("wetransfer")) return { name: "WeTransfer", color: "#409fff" };
  if (u.includes("splice.com")) return { name: "Splice", color: "#ff5b75" };
  return { name: "Link", color: "#94a3b8" };
}

function ProfileSetupScreen({ onBack, onFinish }) {
  const [city, setCity] = useState("");
  const [tracks, setTracks] = useState([]);
  const [linkInput, setLinkInput] = useState("");
  const [linkError, setLinkError] = useState("");

  function handleAddLink() {
    setLinkError("");
    const url = linkInput.trim();
    if (!url) return;

    // Basic URL shape check
    if (!url.match(/^https?:\/\/.+/)) {
      setLinkError("Paste a full URL starting with http:// or https://");
      return;
    }

    const platform = detectPlatform(url);
    const musicPlatforms = ["SoundCloud", "Spotify", "YouTube", "Bandcamp", "Apple Music", "Audiomack"];
    if (!musicPlatforms.includes(platform.name)) {
      setLinkError("Use a SoundCloud, Spotify, YouTube, Bandcamp, Apple Music, or Audiomack link");
      return;
    }

    if (tracks.length >= 3) return;

    setTracks(prev => prev.concat([{
      name: platform.name + " track",
      url,
      platform: platform.name,
      color: platform.color,
    }]));
    setLinkInput("");
  }

  return (
    <div style={{ height: "100%", background: "radial-gradient(ellipse at 50% 30%, #0c1d42 0%, #07091a 50%, #050510 100%)", display: "flex", flexDirection: "column", padding: "0 24px", overflowY: "auto" }}>
      <ScreenHeader title="Almost done" onBack={onBack} />
      <ProgressDots total={4} current={3} />

      <div style={{ fontSize: 26, fontWeight: 900, color: "#fff", marginBottom: 6 }}>One more step 🙌</div>
      <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 28 }}>Where are you, and what do you sound like?</div>

      <div style={{ display: "flex", flexDirection: "column", gap: 18, flex: 1 }}>
        <Field label="CITY / LOCATION" value={city} onChange={setCity} placeholder="e.g. Toronto, ON" />

        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: 10, letterSpacing: "0.5px" }}>
            DEMOS <span style={{ color: "rgba(255,255,255,0.3)", fontWeight: 400 }}>(paste up to 3 links · optional)</span>
          </div>

          {tracks.map((t, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "rgba(74,127,255,0.08)", border: "1px solid rgba(74,127,255,0.2)", borderRadius: 12, marginBottom: 8 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: t.color || "linear-gradient(135deg,#4a7fff,#9b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: "#fff", fontWeight: 600 }}>{t.platform}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.url}</div>
              </div>
              <button onClick={() => setTracks(prev => prev.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", fontSize: 18, lineHeight: 1, padding: "0 4px" }}>×</button>
            </div>
          ))}

          {tracks.length < 3 && (
            <>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={linkInput}
                  onChange={e => { setLinkInput(e.target.value); setLinkError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleAddLink()}
                  placeholder="Paste SoundCloud, Spotify, YouTube..."
                  style={{
                    flex: 1, padding: "12px 14px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid " + (linkError ? "rgba(239,68,68,0.5)" : T.border),
                    borderRadius: 12, color: "#fff", fontSize: 13, outline: "none",
                    fontFamily: "inherit", boxSizing: "border-box",
                  }}
                />
                <button onClick={handleAddLink} style={{
                  padding: "12px 18px", borderRadius: 12,
                  background: linkInput.trim() ? "linear-gradient(135deg,#4a7fff,#9b5cf6)" : "rgba(255,255,255,0.06)",
                  border: "none", color: "#fff", fontSize: 13, fontWeight: 700,
                  cursor: linkInput.trim() ? "pointer" : "default", fontFamily: "inherit",
                  opacity: linkInput.trim() ? 1 : 0.5,
                }}>Add</button>
              </div>
              {linkError && (
                <div style={{ fontSize: 11, color: T.red, marginTop: 6 }}>{linkError}</div>
              )}
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 6 }}>
                {3 - tracks.length} slot{3 - tracks.length !== 1 ? "s" : ""} left
              </div>
            </>
          )}
        </div>
      </div>

      <button onClick={() => city && onFinish({ city, tracks })} style={{
        width: "100%", padding: "17px", marginTop: 24, marginBottom: 24,
        background: city ? "linear-gradient(135deg,#4a7fff,#9b5cf6)" : "rgba(255,255,255,0.1)",
        border: "none", borderRadius: 99, color: "#fff", fontSize: 16, fontWeight: 700,
        cursor: "pointer", fontFamily: "inherit",
        opacity: city ? 1 : 0.5,
      }}>Enter Wrytrs Block 🎵</button>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LOGIN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function LoginScreen({ onBack, onLogin }) {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "radial-gradient(ellipse at 50% 25%, #0d1a3a 0%, #07090f 60%)", padding: "20px 24px 32px" }}>
      <BackButton onClick={onBack} />

      <div style={{ marginTop: 36, fontSize: 30, fontWeight: 800, color: "#fff", marginBottom: 6 }}>Welcome back</div>
      <div style={{ fontSize: 15, color: T.textSub, marginBottom: 28 }}>Pick up where you left off</div>

      <Field label="EMAIL" value="" onChange={() => {}} placeholder="you@email.com" type="email" />
      <div style={{ height: 14 }} />
      <Field label="PASSWORD" value="" onChange={() => {}} placeholder="••••••••" type="password" />

      <button onClick={onLogin} style={{
        width: "100%", padding: "16px", marginTop: 20,
        background: "linear-gradient(135deg,#4a7fff,#9b5cf6)",
        border: "none", borderRadius: 99, color: "#fff",
        fontSize: 16, fontWeight: 700, cursor: "pointer",
      }}>Log In</button>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MEDIA PLAYER (profile only)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function MediaPlayer({ tracks }) {
  const [playing, setPlaying] = useState(false);
  const [trackIdx, setTrackIdx] = useState(0);

  if (!tracks || tracks.length === 0) {
    return (
      <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "16px", textAlign: "center" }}>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>No demos yet</div>
      </div>
    );
  }

  return (
    <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
      <button onClick={() => setPlaying(p => !p)} style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#4a7fff,#9b5cf6)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {playing
          ? <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          : <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>
        }
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tracks[trackIdx].name}</div>
        <div style={{ height: 3, background: "rgba(255,255,255,0.15)", borderRadius: 2 }}>
          <div style={{ height: "100%", width: playing ? "45%" : "0%", background: "linear-gradient(90deg,#4a7fff,#9b5cf6)", borderRadius: 2, transition: "width 0.3s" }} />
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 }}>
        <button onClick={() => { setTrackIdx(i => i > 0 ? i - 1 : tracks.length - 1); setPlaying(false); }} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 4px" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="rgba(255,255,255,0.6)"><path d="M18 6L9 12l9 6V6z"/><rect x="5" y="6" width="2" height="12"/></svg>
        </button>
        <button onClick={() => { setTrackIdx(i => i < tracks.length - 1 ? i + 1 : 0); setPlaying(false); }} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 4px" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="rgba(255,255,255,0.6)"><path d="M6 18l9-6-9-6v12z"/><rect x="17" y="6" width="2" height="12"/></svg>
        </button>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// BLOCK MARKET — discovery feed
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function BlockMarket({ onSelectArtist, currentUser, projects }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [city, setCity] = useState("");
  const filters = ["All", "Producer", "Vocalist", "Songwriter", "Engineer", "Instrumentalist"];

  const filterMap = {
    "Producer": ["producer","beatmaker"],
    "Vocalist": ["vocalist","singer","rapper","artist"],
    "Songwriter": ["songwriter","topliner","lyricist"],
    "Engineer": ["engineer","mixing","mastering"],
    "Instrumentalist": ["guitarist","pianist","keys","drummer","bassist"],
  };

  // Build a market-shaped object from current user so they appear in the feed
  function buildUserCard(u) {
    if (!u || !u.name) return null;
    const initials = u.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    const myProjects = (projects || []);
    const completed = myProjects.filter(p => p.status === "completed");
    const rated = completed.filter(p => p.rating && typeof p.rating.stars === "number");
    const score = rated.length === 0 ? 0 : rated.reduce((s, p) => s + p.rating.stars, 0) / rated.length;
    return {
      isMe: true,
      name: u.name,
      roles: u.roles && u.roles.length ? u.roles : ["Creative"],
      location: u.city || "—",
      genres: [],
      score,
      collabs: completed.length,
      badge: null,
      initials,
      color: "#7c3aed",
      bio: "This is you — your profile is live on the Block Market.",
      online: true,
      photo: u.photo || null,
      tracks: u.tracks || [],
    };
  }

  const userCard = buildUserCard(currentUser);
  const allArtists = userCard ? [userCard].concat(MARKET_ARTISTS) : MARKET_ARTISTS.slice();

  const filtered = allArtists.filter(a => {
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) ||
      (a.genres && a.genres.some(g => g.toLowerCase().includes(search.toLowerCase()))) ||
      a.roles.some(r => r.toLowerCase().includes(search.toLowerCase()));
    const matchFilter = filter === "All" || a.roles.some(r => {
      const keywords = filterMap[filter] || [filter.toLowerCase()];
      return keywords.some(k => r.toLowerCase().includes(k));
    });
    const matchCity = !city || a.location.toLowerCase().includes(city.toLowerCase());
    return matchSearch && matchFilter && matchCity;
  });

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: T.bg }}>
      {/* Header */}
      <div style={{
        padding: "20px 16px 12px",
        background: "linear-gradient(180deg, rgba(124,58,237,0.18) 0%, rgba(13,13,26,0) 100%)",
      }}>
        <div style={{ fontSize: 30, fontWeight: 900, color: "#fff", marginBottom: 6, letterSpacing: "-0.6px" }}>Block Market</div>
        <div style={{ fontSize: 14, color: "#fbbf24", marginBottom: 18, fontWeight: 600 }}>Find your next collaborator</div>

        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, role, or genre..."
          style={{
            width: "100%", padding: "12px 16px",
            background: T.surface2, border: "1px solid " + T.border,
            borderRadius: 12, color: "#fff", fontSize: 14, outline: "none",
            fontFamily: "inherit", boxSizing: "border-box", marginBottom: 10,
          }}
        />

        <input
          value={city}
          onChange={e => setCity(e.target.value)}
          placeholder="📍 Filter by city (optional)"
          style={{
            width: "100%", padding: "10px 14px",
            background: T.surface2, border: "1px solid " + T.border,
            borderRadius: 10, color: "#fff", fontSize: 13, outline: "none",
            fontFamily: "inherit", boxSizing: "border-box", marginBottom: 12,
          }}
        />

        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
          {filters.map(f => {
            const on = filter === f;
            return (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: "8px 14px", borderRadius: 99, fontSize: 12, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0,
                background: on ? "rgba(155,92,246,0.25)" : "rgba(255,255,255,0.06)",
                border: "1px solid " + (on ? T.purple : "rgba(255,255,255,0.12)"),
                color: on ? T.purple : "rgba(255,255,255,0.7)",
              }}>{f}</button>
            );
          })}
        </div>

        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 10, fontWeight: 600 }}>
          {filtered.length} {filtered.length === 1 ? "creator" : "creators"} available
        </div>
      </div>

      {/* Feed */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 16px 16px" }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 14, color: T.textSub, marginBottom: 12 }}>No matches found</div>
            <button onClick={() => { setSearch(""); setFilter("All"); setCity(""); }} style={{
              padding: "8px 16px", background: "rgba(255,255,255,0.08)",
              border: "1px solid " + T.border, borderRadius: 99,
              color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}>Clear filters</button>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {filtered.map((a, i) => (
            <ArtistCard key={i} artist={a} onClick={() => onSelectArtist(a)} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ArtistCard({ artist, onClick, index }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: T.surface,
        border: "1px solid " + T.border,
        borderRadius: 20,
        overflow: "hidden",
        cursor: "pointer",
        animation: "fadeIn 0.4s " + (index * 0.04) + "s both",
      }}
    >
      <style>{"@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }"}</style>

      {/* ── Square gradient cover ── */}
      <div style={{
        position: "relative",
        width: "100%",
        aspectRatio: "1 / 1",
        background: "linear-gradient(135deg, " + artist.color + " 0%, " + artist.color + "99 50%, " + artist.color + "55 100%)",
        overflow: "hidden",
      }}>
        {/* Soft depth orbs */}
        <div style={{ position: "absolute", top: -30, right: -30, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.18)", filter: "blur(30px)" }} />
        <div style={{ position: "absolute", bottom: -40, left: -20, width: 160, height: 160, borderRadius: "50%", background: "rgba(0,0,0,0.2)", filter: "blur(40px)" }} />

        {/* Top-right: status pill */}
        <div style={{ position: "absolute", top: 10, right: 10 }}>
          {artist.online ? (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "4px 8px", borderRadius: 99,
              background: "rgba(0,0,0,0.4)", color: "#fff",
              fontSize: 9, fontWeight: 800, letterSpacing: "0.4px", textTransform: "uppercase",
            }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ade80", animation: "pulse-dot 2s ease-in-out infinite" }} />
              Active
            </span>
          ) : (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "4px 8px", borderRadius: 99,
              background: "rgba(0,0,0,0.4)", color: "rgba(255,255,255,0.85)",
              fontSize: 9, fontWeight: 800, letterSpacing: "0.4px", textTransform: "uppercase",
            }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.5)" }} />
              Available
            </span>
          )}
        </div>

        {/* Top-left: New / Verified / You badge */}
        {artist.isMe ? (
          <div style={{ position: "absolute", top: 10, left: 10 }}>
            <span style={{
              fontSize: 9, fontWeight: 800, padding: "4px 8px", borderRadius: 99,
              background: "linear-gradient(135deg,#4a7fff,#9b5cf6)", color: "#fff",
              letterSpacing: "0.4px", textTransform: "uppercase",
            }}>✨ You</span>
          </div>
        ) : artist.collabs < 3 ? (
          <div style={{ position: "absolute", top: 10, left: 10 }}>
            <span style={{
              fontSize: 9, fontWeight: 800, padding: "4px 8px", borderRadius: 99,
              background: "rgba(251,191,36,0.95)", color: "#000",
              letterSpacing: "0.4px", textTransform: "uppercase",
            }}>✨ New</span>
          </div>
        ) : artist.badge && (
          <div style={{ position: "absolute", top: 10, left: 10 }}>
            <span style={{
              fontSize: 9, fontWeight: 800, padding: "4px 8px", borderRadius: 99,
              background: "rgba(0,0,0,0.4)", color: "#fff",
              letterSpacing: "0.4px", textTransform: "uppercase",
            }}>{artist.badge}</span>
          </div>
        )}

        {/* Center: photo if present, else initials */}
        {artist.photo ? (
          <img src={artist.photo} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{
              fontSize: 64, fontWeight: 900, color: "rgba(255,255,255,0.95)",
              letterSpacing: "-2px", lineHeight: 1,
              textShadow: "0 6px 24px rgba(0,0,0,0.25)",
              fontFamily: "Inter, sans-serif",
            }}>{artist.initials}</div>
          </div>
        )}
      </div>

      {/* ── Meta strip ── */}
      <div style={{ padding: "12px 14px 14px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", letterSpacing: "-0.2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 3 }}>{artist.name}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 6 }}>
            {artist.roles[0]}{artist.roles.length > 1 ? " · " + artist.roles[1] : ""}
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)" }}>
            {artist.isMe ? (
              <span style={{ color: T.blue, fontWeight: 700 }}>Your profile · Live</span>
            ) : artist.collabs < 3 ? (
              <span style={{ color: "#fbbf24", fontWeight: 700 }}>New collaborator</span>
            ) : (
              <span>⭐ {artist.score.toFixed(1)} · {artist.collabs} Blocks</span>
            )}
          </div>
        </div>

        {/* Quick-play button */}
        <button
          onClick={e => {
            e.stopPropagation();
            const firstTrack = artist.tracks && artist.tracks[0];
            if (firstTrack && firstTrack.url) {
              window.open(firstTrack.url, "_blank");
            }
          }}
          title={artist.tracks && artist.tracks[0] ? "Play on " + (artist.tracks[0].platform || "external") : "No demo yet"}
          style={{
            width: 38, height: 38, borderRadius: "50%",
            background: artist.tracks && artist.tracks[0]
              ? "linear-gradient(135deg,#4a7fff,#9b5cf6)"
              : "rgba(255,255,255,0.08)",
            border: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: artist.tracks && artist.tracks[0] ? "pointer" : "default",
            padding: 0, fontFamily: "inherit",
            boxShadow: artist.tracks && artist.tracks[0] ? "0 4px 14px rgba(74,127,255,0.45)" : "none",
            flexShrink: 0,
            opacity: artist.tracks && artist.tracks[0] ? 1 : 0.4,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff" style={{ marginLeft: 2 }}>
            <path d="M8 5v14l11-7z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ARTIST PROFILE VIEW (with Invite to Block)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function ArtistProfileView({ artist, onClose, onInvite }) {
  const demoTracks = [
    { name: "Sample Track 1" },
    { name: "Sample Track 2" },
  ];

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 200, background: "radial-gradient(ellipse at 50% 0%, #1a1a2e 0%, #0d0d1a 60%, #050510 100%)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ flex: 1, overflowY: "auto" }}>

        {/* ── MAGAZINE COVER HERO ── */}
        <div style={{ position: "relative", padding: "12px 12px 0" }}>
          <div style={{
            position: "relative",
            width: "100%",
            aspectRatio: "1 / 1",
            borderRadius: 24,
            overflow: "hidden",
            background: artist.photo ? "#000" : "linear-gradient(135deg, " + artist.color + " 0%, " + artist.color + "99 50%, " + artist.color + "44 100%)",
          }}>
            {/* Photo or initials */}
            {artist.photo ? (
              <img src={artist.photo} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 140, fontWeight: 900, color: "rgba(255,255,255,0.95)", letterSpacing: "-4px", textShadow: "0 8px 32px rgba(0,0,0,0.25)" }}>{artist.initials}</div>
            )}

            {/* Bottom gradient overlay */}
            <div style={{
              position: "absolute", left: 0, right: 0, bottom: 0,
              height: "55%",
              background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.85) 100%)",
              pointerEvents: "none",
            }} />

            {/* Close X */}
            <button onClick={onClose} style={{
              position: "absolute", top: 14, right: 14, zIndex: 10,
              width: 36, height: 36, borderRadius: "50%",
              background: "rgba(0,0,0,0.5)",
              border: "1px solid rgba(255,255,255,0.2)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              padding: 0, fontFamily: "inherit",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </button>

            {/* Top-left: badge */}
            <div style={{ position: "absolute", top: 14, left: 14, display: "flex", gap: 6 }}>
              {artist.collabs < 3 && (
                <span style={{
                  fontSize: 10, fontWeight: 800, padding: "5px 10px", borderRadius: 99,
                  background: "rgba(251,191,36,0.95)", color: "#000",
                  letterSpacing: "0.5px", textTransform: "uppercase",
                }}>✨ New</span>
              )}
              {artist.collabs >= 3 && artist.badge && (
                <span style={{
                  fontSize: 10, fontWeight: 800, padding: "5px 10px", borderRadius: 99,
                  background: "rgba(0,0,0,0.5)", color: "#fff",
                  letterSpacing: "0.5px", textTransform: "uppercase",
                }}>{artist.badge}</span>
              )}
              {artist.online && (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  fontSize: 10, fontWeight: 800, padding: "5px 10px", borderRadius: 99,
                  background: "rgba(0,0,0,0.5)", color: "#fff",
                  letterSpacing: "0.4px", textTransform: "uppercase",
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", animation: "pulse-dot 2s ease-in-out infinite" }} />
                  Active
                </span>
              )}
            </div>

            {/* Name + role + action row (overlay bottom) */}
            <div style={{
              position: "absolute", left: 0, right: 0, bottom: 0,
              padding: "20px 22px 22px",
              display: "flex", alignItems: "flex-end", gap: 12,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 32, fontWeight: 900, color: "#fff", letterSpacing: "-0.8px", lineHeight: 1.05, marginBottom: 4, textShadow: "0 2px 12px rgba(0,0,0,0.4)" }}>{artist.name}</div>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", fontWeight: 500, marginBottom: 12, textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
                  {artist.roles[0]}{artist.roles.length > 1 ? " · " + artist.roles[1] : ""}
                </div>

                {/* Action icons */}
                {!artist.isMe && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={onInvite} style={{
                      width: 38, height: 38, borderRadius: "50%",
                      background: "rgba(0,0,0,0.5)",
                      border: "1px solid rgba(255,255,255,0.25)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", padding: 0, fontFamily: "inherit",
                    }} title="Invite">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M22 6l-10 7L2 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <button style={{
                      width: 38, height: 38, borderRadius: "50%",
                      background: "rgba(0,0,0,0.5)",
                      border: "1px solid rgba(255,255,255,0.25)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", padding: 0, fontFamily: "inherit",
                    }} title="Save">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "24px 20px 0", position: "relative" }}>

          {/* Location */}
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
            <span>📍</span> {artist.location}
          </div>

          {/* Roles + genres */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 24 }}>
            {artist.roles.map(r => (
              <span key={r} style={{ padding: "5px 12px", borderRadius: 99, fontSize: 11, color: T.blue, background: "rgba(74,127,255,0.15)", border: "1px solid rgba(74,127,255,0.3)", fontWeight: 600 }}>{r}</span>
            ))}
            {artist.genres.map(g => (
              <span key={g} style={{ padding: "5px 12px", borderRadius: 99, fontSize: 11, color: T.purple, background: "rgba(155,92,246,0.15)", border: "1px solid rgba(155,92,246,0.3)", fontWeight: 600 }}>{g}</span>
            ))}
          </div>

          {/* Bio */}
          {artist.bio && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "1px", marginBottom: 10 }}>ABOUT</div>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", lineHeight: 1.55 }}>{artist.bio}</p>
            </div>
          )}

          {/* Stats / Rating */}
          <RatingDisplay score={artist.score} collabs={artist.collabs} size="lg" />

          {/* Pinned Demo */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "1px" }}>PINNED DEMO</div>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>📌</span>
          </div>
          <MediaPlayer tracks={demoTracks} />

          <div style={{ height: 100 }} />
        </div>
      </div>

      {/* Sticky CTA */}
      <div style={{
        padding: "16px 20px",
        background: "rgba(13,13,26,0.95)",
        borderTop: "1px solid " + T.border,
      }}>
        {artist.isMe ? (
          <button onClick={onClose} style={{
            width: "100%", padding: "17px",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid " + T.border, borderRadius: 99, color: "rgba(255,255,255,0.7)",
            fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          }}>This is your profile</button>
        ) : (
          <button onClick={onInvite} style={{
            width: "100%", padding: "17px",
            background: "linear-gradient(135deg,#4a7fff,#9b5cf6)",
            border: "none", borderRadius: 99, color: "#fff",
            fontSize: 16, fontWeight: 800, cursor: "pointer",
            fontFamily: "inherit",
            boxShadow: "0 8px 28px rgba(123,58,237,0.5)",
            animation: "glow-breath 3s ease-in-out infinite",
          }}>Invite to Block</button>
        )}
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// INVITE FLOW (existing or new Block)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function InviteSheet({ artist, projects, onClose, onSendInvite }) {
  const [mode, setMode] = useState("choose"); // choose | new
  const [title, setTitle] = useState("");
  const [role, setRole] = useState("");
  const [deadlineMonth, setDeadlineMonth] = useState(null);
  const [deadlineDay, setDeadlineDay] = useState(null);
  const roles = ["Producer", "Vocalist", "Songwriter", "Engineer", "Instrumentalist"];

  const dayCount = deadlineMonth !== null ? DAYS_IN_MONTH[deadlineMonth] : 31;
  const days = Array.from({ length: dayCount }, (_, i) => i + 1);

  // Build a display string for the deadline
  function formatDeadline() {
    if (deadlineMonth === null || deadlineDay === null) return "";
    const today = new Date();
    const targetYear = today.getMonth() > deadlineMonth ? today.getFullYear() + 1 : today.getFullYear();
    return MONTHS[deadlineMonth] + " " + deadlineDay + ", " + targetYear;
  }
  const deadline = formatDeadline();

  const myProjects = projects.filter(p => p.owner === "me");

  function send(blockData) {
    onSendInvite(blockData);
  }

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 300, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)" }} />
      <div style={{ position: "relative", background: "#13162a", borderRadius: "24px 24px 0 0", padding: "20px 20px 32px", maxHeight: "85%", overflowY: "auto" }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.2)", margin: "0 auto 20px" }} />

        {mode === "choose" && (
          <>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 4 }}>Invite {artist.name}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 24 }}>
              Add to one of your existing Blocks, or start a new one together.
            </div>

            {myProjects.length > 0 && (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "1px", marginBottom: 10 }}>YOUR ACTIVE BLOCKS</div>
                {myProjects.map((p, i) => (
                  <div key={i} onClick={() => send({ existing: p })} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "14px 16px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid " + T.border,
                    borderRadius: 12, marginBottom: 8, cursor: "pointer",
                  }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg,#4a7fff,#9b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🎵</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{p.title}</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{p.role} · {p.deadline}</div>
                    </div>
                    <span style={{ fontSize: 13, color: T.blue, fontWeight: 700 }}>Add →</span>
                  </div>
                ))}
                <div style={{ height: 1, background: T.border, margin: "16px 0" }} />
              </>
            )}

            <button onClick={() => setMode("new")} style={{
              width: "100%", padding: "16px",
              background: "rgba(74,127,255,0.15)",
              border: "1px solid rgba(74,127,255,0.4)",
              borderRadius: 12, color: T.blue,
              fontSize: 15, fontWeight: 700, cursor: "pointer",
            }}>＋ Start a New Block Together</button>
          </>
        )}

        {mode === "new" && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <button onClick={() => setMode("choose")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>New Block</div>
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 20 }}>Set the basics — you can fill in the rest later.</div>

            <Field label="BLOCK TITLE" value={title} onChange={setTitle} placeholder="e.g. Midnight Frequency" />

            <div style={{ height: 14 }} />

            <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: 8, letterSpacing: "0.5px" }}>ROLE NEEDED</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
              {roles.map(r => {
                const on = role === r;
                return (
                  <button key={r} onClick={() => setRole(r)} style={{
                    padding: "8px 14px", borderRadius: 99, fontSize: 12, fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit",
                    background: on ? "rgba(155,92,246,0.25)" : "rgba(255,255,255,0.06)",
                    border: "1px solid " + (on ? T.purple : "rgba(255,255,255,0.12)"),
                    color: on ? T.purple : "rgba(255,255,255,0.7)",
                  }}>{r}</button>
                );
              })}
            </div>

            {/* Deadline picker */}
            <div style={{ marginBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "1px" }}>DEADLINE</div>
                {deadline && (
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.blue }}>📅 {deadline}</div>
                )}
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                {/* Month dropdown */}
                <div style={{ flex: 1, position: "relative" }}>
                  <select
                    value={deadlineMonth === null ? "" : deadlineMonth}
                    onChange={e => {
                      const v = e.target.value === "" ? null : parseInt(e.target.value, 10);
                      setDeadlineMonth(v);
                      if (v !== null && deadlineDay !== null && deadlineDay > DAYS_IN_MONTH[v]) {
                        setDeadlineDay(null);
                      }
                    }}
                    style={{
                      width: "100%", padding: "13px 36px 13px 14px",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid " + (deadlineMonth !== null ? "rgba(74,127,255,0.4)" : T.border),
                      borderRadius: 12, color: deadlineMonth === null ? "rgba(255,255,255,0.5)" : "#fff",
                      fontSize: 14, fontWeight: 600, outline: "none", fontFamily: "inherit",
                      appearance: "none", WebkitAppearance: "none", MozAppearance: "none",
                      cursor: "pointer",
                    }}
                  >
                    <option value="" style={{ background: "#13162a", color: "#fff" }}>Month</option>
                    {MONTHS.map((m, i) => (
                      <option key={m} value={i} style={{ background: "#13162a", color: "#fff" }}>{m}</option>
                    ))}
                  </select>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                    <path d="M6 9l6 6 6-6" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>

                {/* Day dropdown */}
                <div style={{ flex: 1, position: "relative" }}>
                  <select
                    value={deadlineDay === null ? "" : deadlineDay}
                    onChange={e => setDeadlineDay(e.target.value === "" ? null : parseInt(e.target.value, 10))}
                    disabled={deadlineMonth === null}
                    style={{
                      width: "100%", padding: "13px 36px 13px 14px",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid " + (deadlineDay !== null ? "rgba(155,92,246,0.4)" : T.border),
                      borderRadius: 12, color: deadlineDay === null ? "rgba(255,255,255,0.5)" : "#fff",
                      fontSize: 14, fontWeight: 600, outline: "none", fontFamily: "inherit",
                      appearance: "none", WebkitAppearance: "none", MozAppearance: "none",
                      cursor: deadlineMonth === null ? "default" : "pointer",
                      opacity: deadlineMonth === null ? 0.5 : 1,
                    }}
                  >
                    <option value="" style={{ background: "#13162a", color: "#fff" }}>Day</option>
                    {days.map(d => (
                      <option key={d} value={d} style={{ background: "#13162a", color: "#fff" }}>{d}</option>
                    ))}
                  </select>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                    <path d="M6 9l6 6 6-6" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>

            <button
              onClick={() => title && role && deadline && send({ newBlock: { title, role, deadline } })}
              style={{
                width: "100%", padding: "16px", marginTop: 24,
                background: title && role && deadline ? "linear-gradient(135deg,#4a7fff,#9b5cf6)" : "rgba(255,255,255,0.08)",
                border: "none", borderRadius: 99, color: "#fff",
                fontSize: 16, fontWeight: 800, cursor: "pointer",
                opacity: title && role && deadline ? 1 : 0.5,
              }}
            >Send Invite</button>
          </>
        )}
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// INVITE SUCCESS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RATE BLOCK SHEET — appears when you mark a Block complete
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// BLOCK DETAIL SHEET — tap a Block to see collaborators, splits, actions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function BlockDetailSheet({ block, currentUser, onClose, onMarkComplete, onEditSplit, onAddCollaborator, onSendMessage }) {
  // ── LISTING DETAIL VIEW ──
  if (block.type === "listing") {
    const initial = (block.title || "").trim().split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase();
    return (
      <div style={{ position: "absolute", inset: 0, zIndex: 350, background: "radial-gradient(ellipse at 50% 0%, #2a1a0e 0%, #1a0e08 60%, #050510 100%)", display: "flex", flexDirection: "column" }}>
        {/* Header bar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px",
          borderBottom: "1px solid " + T.border,
        }}>
          <button onClick={onClose} style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid " + T.border,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", padding: 0, fontFamily: "inherit",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fbbf24", letterSpacing: "1px" }}>💰 LISTING</div>
          <div style={{ width: 36 }} />
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 28px" }}>
          {/* Gold cover */}
          <div style={{
            position: "relative",
            width: "100%",
            aspectRatio: "1 / 1",
            borderRadius: 20, overflow: "hidden", marginBottom: 24,
            background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #b45309 100%)",
            boxShadow: "0 12px 40px rgba(251,191,36,0.3)",
          }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 50% at 30% 0%, rgba(255,255,255,0.22) 0%, transparent 60%)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 100% 60% at 50% 110%, rgba(0,0,0,0.45) 0%, transparent 60%)", pointerEvents: "none" }} />

            {/* Price tag */}
            <div style={{ position: "absolute", top: 18, right: 18 }}>
              <div style={{
                padding: "10px 18px", borderRadius: 99,
                background: "#000", color: "#fbbf24",
                fontSize: 22, fontWeight: 900,
                border: "1px solid rgba(251,191,36,0.4)",
                letterSpacing: "-0.5px",
              }}>${block.price}</div>
            </div>

            {/* Center */}
            <div style={{
              position: "absolute", left: 0, right: 0, top: "50%",
              transform: "translateY(-50%)",
              textAlign: "center", padding: "0 24px",
            }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(0,0,0,0.7)", letterSpacing: "3px", textTransform: "uppercase", marginBottom: 10 }}>{block.listingType || "Listing"}</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: "#fff", letterSpacing: "-0.8px", lineHeight: 1.1, textShadow: "0 2px 24px rgba(0,0,0,0.4)" }}>{block.title}</div>
            </div>

            {/* Corner emboss */}
            <div style={{ position: "absolute", bottom: 18, right: 22, fontSize: 50, fontWeight: 900, color: "rgba(255,255,255,0.18)", letterSpacing: "-2px", lineHeight: 1 }}>{initial}</div>
          </div>

          {/* What's included */}
          {block.includes && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "1px", marginBottom: 10 }}>WHAT'S INCLUDED</div>
              <p style={{ fontSize: 15, color: "#fff", lineHeight: 1.6, fontWeight: 500 }}>{block.includes}</p>
            </div>
          )}

          {/* Description */}
          {block.description && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "1px", marginBottom: 10 }}>ABOUT</div>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", lineHeight: 1.55 }}>{block.description}</p>
            </div>
          )}

          {/* Seller info */}
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "1px", marginBottom: 10 }}>SELLER</div>
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "14px 16px", marginBottom: 20,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid " + T.border,
            borderRadius: 14,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              background: "linear-gradient(135deg, #7c3aed, #7c3aedaa)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 800, color: "#fff", flexShrink: 0,
              overflow: "hidden",
            }}>
              {currentUser.photo ? (
                <img src={currentUser.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (currentUser.name || "You").split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>{currentUser.name || "You"} (you)</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{currentUser.city || "—"}</div>
            </div>
          </div>

          <div style={{ height: 12 }} />
        </div>

        {/* Sticky footer — buyer contact CTA (greyed out since you're the seller) */}
        <div style={{
          background: "rgba(13,13,26,0.95)",
          borderTop: "1px solid " + T.border,
          padding: "14px 20px 18px",
        }}>
          <button disabled style={{
            width: "100%", padding: "16px",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid " + T.border,
            borderRadius: 99, color: "rgba(255,255,255,0.5)",
            fontSize: 14, fontWeight: 700, cursor: "default", fontFamily: "inherit",
          }}>This is your listing</button>
        </div>
      </div>
    );
  }

  const isCompleted = block.status === "completed";
  const stageColors = {
    "Writing":   { bg: "rgba(245,158,11,0.15)", color: "#f59e0b" },
    "Recording": { bg: "rgba(74,127,255,0.15)", color: T.blue },
    "Mixing":    { bg: "rgba(155,92,246,0.15)", color: T.purple },
    "Released":  { bg: "rgba(34,197,94,0.15)", color: T.green },
  };
  const stageStyle = stageColors[block.stage] || stageColors["Writing"];

  const userInitials = (currentUser.name || "You").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "YOU";
  const userRole = (currentUser.roles && currentUser.roles[0]) || block.role || "Creative";
  const participants = [
    { id: "me", name: (currentUser.name || "You") + " (you)", initials: userInitials, color: "#7c3aed", role: userRole },
  ].concat((block.collaborators || []).map((c, i) => ({
    id: "c" + i,
    name: c.name || block.with || c.initials,
    initials: c.initials,
    color: c.color,
    role: c.role || "Collaborator",
  })));

  // Find splits per participant if confirmed
  function splitFor(pid) {
    if (!block.splits) return null;
    const found = block.splits.find(s => s.id === pid);
    return found ? found.percent : null;
  }

  // Chat state
  const [msgText, setMsgText] = useState("");
  const [linkComposerOpen, setLinkComposerOpen] = useState(false);
  const [shareFilesOpen, setShareFilesOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkErr, setLinkErr] = useState("");
  const [fileLinkUrl, setFileLinkUrl] = useState("");
  const [fileLinkErr, setFileLinkErr] = useState("");
  const [collabsExpanded, setCollabsExpanded] = useState(false);
  const messages = block.messages || [];

  function handleShareFile() {
    const url = fileLinkUrl.trim();
    setFileLinkErr("");
    if (!url) {
      setFileLinkErr("Paste a link from your cloud storage");
      return;
    }
    if (!url.match(/^https?:\/\/.+/)) {
      setFileLinkErr("URL must start with http:// or https://");
      return;
    }
    const p = detectPlatform(url);
    onSendMessage({
      from: "me",
      text: "",
      attachment: { url, platform: p.name, color: p.color },
      timestamp: new Date().toISOString(),
    });
    setFileLinkUrl("");
    setFileLinkErr("");
    setShareFilesOpen(false);
  }

  function handleSend() {
    const text = msgText.trim();
    let attachment = null;
    if (linkComposerOpen) {
      const url = linkUrl.trim();
      if (!url) {
        setLinkErr("Paste a URL or close link");
        return;
      }
      if (!url.match(/^https?:\/\/.+/)) {
        setLinkErr("URL must start with http:// or https://");
        return;
      }
      const p = detectPlatform(url);
      attachment = { url, platform: p.name, color: p.color };
    }
    if (!text && !attachment) return;
    onSendMessage({
      from: "me",
      text,
      attachment,
      timestamp: new Date().toISOString(),
    });
    setMsgText("");
    setLinkUrl("");
    setLinkErr("");
    setLinkComposerOpen(false);
  }

  function formatTime(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    if (sameDay) {
      return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    }
    const diffMs = now - d;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 7) return diffDays + "d ago";
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  }

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 350, background: "radial-gradient(ellipse at 50% 0%, #1a1a2e 0%, #0d0d1a 60%, #050510 100%)", display: "flex", flexDirection: "column" }}>
      {/* Header bar with close */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 20px",
        borderBottom: "1px solid " + T.border,
      }}>
        <button onClick={onClose} style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid " + T.border,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", padding: 0, fontFamily: "inherit",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.55)", letterSpacing: "0.8px" }}>BLOCK DETAILS</div>
        <div style={{ width: 36 }} />
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 16px" }}>

        {/* Title + stage */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            {!isCompleted && block.stage && (
              <span style={{
                fontSize: 10, fontWeight: 800, padding: "5px 10px", borderRadius: 99,
                background: stageStyle.bg, color: stageStyle.color,
                letterSpacing: "0.5px", textTransform: "uppercase",
              }}>● {block.stage}</span>
            )}
            {isCompleted && (
              <span style={{
                fontSize: 10, fontWeight: 800, padding: "5px 10px", borderRadius: 99,
                background: "rgba(34,197,94,0.2)", color: T.green,
                letterSpacing: "0.5px", textTransform: "uppercase",
              }}>✓ Completed</span>
            )}
            {block.lastActivity && !isCompleted && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 600,
              }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ade80", animation: "pulse-dot 2s ease-in-out infinite" }} />
                Active {block.lastActivity}
              </span>
            )}
          </div>
          <div style={{ fontSize: 34, fontWeight: 900, color: "#fff", letterSpacing: "-0.9px", lineHeight: 1.05, marginBottom: 10 }}>{block.title}</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>{block.role} · Deadline {block.deadline}</div>
          {block.description && (
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", lineHeight: 1.55, marginTop: 14 }}>{block.description}</p>
          )}
        </div>

        {/* Collaborators */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "1px" }}>COLLABORATORS · {participants.length}</div>
          {!isCompleted && onAddCollaborator && (
            <button onClick={e => { e.stopPropagation(); onAddCollaborator(); }} style={{
              fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 99,
              background: "rgba(74,127,255,0.15)", border: "1px solid rgba(74,127,255,0.3)",
              color: T.blue, cursor: "pointer", fontFamily: "inherit",
            }}>＋ Add</button>
          )}
        </div>
        {(collabsExpanded ? participants : participants.slice(0, 3)).map(p => {
          const pct = splitFor(p.id);
          return (
            <div key={p.id} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 14px", marginBottom: 8,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid " + T.border,
              borderRadius: 14,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: "linear-gradient(135deg, " + p.color + ", " + p.color + "aa)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 800, color: "#fff",
                flexShrink: 0,
              }}>{p.initials}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{p.name}</span>
                  <span style={{
                    fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 99,
                    background: "rgba(74,127,255,0.15)", color: T.blue,
                    border: "1px solid rgba(74,127,255,0.25)",
                    letterSpacing: "0.4px", textTransform: "uppercase",
                    flexShrink: 0,
                  }}>{p.role}</span>
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{p.id === "me" ? "Owner" : "Collaborator"}</div>
              </div>
              {pct !== null && (
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{pct}%</div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: T.green, marginTop: 2, letterSpacing: "0.4px" }}>SPLIT</div>
                </div>
              )}
            </div>
          );
        })}
        {participants.length > 3 && (
          <button onClick={() => setCollabsExpanded(v => !v)} style={{
            width: "100%", padding: "10px 14px", marginBottom: 8,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid " + T.border,
            borderRadius: 12, color: "rgba(255,255,255,0.7)",
            fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
            {collabsExpanded ? "Show less" : "Show all " + participants.length + " collaborators"}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ transform: collabsExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
              <path d="M6 9l6 6 6-6" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}

        {/* Split Sheet — single inline row */}
        <button
          onClick={e => { e.stopPropagation(); if (!isCompleted) onEditSplit(); }}
          disabled={isCompleted}
          style={{
            width: "100%", marginTop: 12,
            padding: "12px 14px",
            background: block.splits ? "rgba(34,197,94,0.08)" : "rgba(155,92,246,0.08)",
            border: "1px solid " + (block.splits ? "rgba(34,197,94,0.25)" : "rgba(155,92,246,0.25)"),
            borderRadius: 14,
            display: "flex", alignItems: "center", gap: 12,
            cursor: isCompleted ? "default" : "pointer", fontFamily: "inherit",
            textAlign: "left",
          }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: block.splits ? "rgba(34,197,94,0.2)" : "rgba(155,92,246,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, flexShrink: 0,
          }}>{block.splits ? "✓" : "📋"}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 2 }}>Split Sheet</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
              {block.splits
                ? "Confirmed · " + block.splits.length + " " + (block.splits.length === 1 ? "person" : "people")
                : "Not set yet · tap to configure"}
            </div>
          </div>
          {!isCompleted && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
              <path d="M9 18l6-6-6-6" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>

        {/* Rating (if completed) */}
        {isCompleted && block.rating && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "1px", marginTop: 20, marginBottom: 12 }}>YOUR RATING</div>
            <div style={{
              padding: "14px 16px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid " + T.border,
              borderRadius: 14,
            }}>
              <div style={{ display: "flex", gap: 4, marginBottom: block.rating.note ? 8 : 0 }}>
                {[1,2,3,4,5].map(n => (
                  <span key={n} style={{ fontSize: 16, color: n <= block.rating.stars ? "#fbbf24" : "rgba(255,255,255,0.15)" }}>★</span>
                ))}
              </div>
              {block.rating.note && (
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.5, fontStyle: "italic" }}>"{block.rating.note}"</p>
              )}
            </div>
          </>
        )}

        {/* Chat */}
        <div style={{ marginTop: 32, marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "1px", marginBottom: 14 }}>
            SESSION CHAT{messages.length > 0 ? " · " + messages.length : ""}
          </div>

          {messages.length === 0 && (
            <div style={{
              padding: "28px 20px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid " + T.border,
              borderRadius: 16,
              textAlign: "center",
            }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 6, letterSpacing: "-0.2px" }}>This is where the song gets made.</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>Drop a beat, share an idea, or just say what's up.</div>
            </div>
          )}

          {messages.map((m, i) => {
            const isMe = m.from === "me";
            return (
              <div key={i} style={{
                display: "flex", flexDirection: "column",
                alignItems: isMe ? "flex-end" : "flex-start",
                marginBottom: 10,
              }}>
                <div style={{
                  maxWidth: "80%",
                  padding: "10px 14px",
                  background: isMe ? "linear-gradient(135deg,#4a7fff,#9b5cf6)" : "rgba(255,255,255,0.06)",
                  border: isMe ? "none" : "1px solid " + T.border,
                  borderRadius: 18,
                  borderBottomRightRadius: isMe ? 4 : 18,
                  borderBottomLeftRadius: isMe ? 18 : 4,
                }}>
                  {m.text && (
                    <div style={{ fontSize: 14, color: "#fff", lineHeight: 1.45, marginBottom: m.attachment ? 8 : 0, wordBreak: "break-word" }}>{m.text}</div>
                  )}
                  {m.attachment && (
                    <div
                      onClick={() => window.open(m.attachment.url, "_blank")}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "10px 12px",
                        background: isMe ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.04)",
                        borderRadius: 12, cursor: "pointer",
                        border: "1px solid " + (isMe ? "rgba(255,255,255,0.15)" : T.border),
                      }}
                    >
                      <div style={{
                        width: 30, height: 30, borderRadius: 8,
                        background: m.attachment.color,
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{m.attachment.platform}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.attachment.url}</div>
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 4, padding: "0 6px" }}>{formatTime(m.timestamp)}</div>
              </div>
            );
          })}
        </div>

        <div style={{ height: 20 }} />
      </div>

      {/* Sticky footer: Composer + Mark Done */}
      <div style={{
        background: "rgba(13,13,26,0.95)",
        borderTop: "1px solid " + T.border,
        padding: "10px 16px 14px",
      }}>
        {/* Link composer (shown when toggled) */}
        {linkComposerOpen && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                autoFocus
                value={linkUrl}
                onChange={e => { setLinkUrl(e.target.value); setLinkErr(""); }}
                placeholder="Paste a link (SoundCloud, Dropbox, etc.)"
                style={{
                  flex: 1, padding: "11px 14px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid " + (linkErr ? "rgba(239,68,68,0.5)" : T.border),
                  borderRadius: 99, color: "#fff", fontSize: 13, outline: "none",
                  fontFamily: "inherit", boxSizing: "border-box",
                }}
              />
              <button onClick={() => { setLinkComposerOpen(false); setLinkUrl(""); setLinkErr(""); }} style={{
                padding: "0 14px", borderRadius: 99,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid " + T.border,
                color: "rgba(255,255,255,0.6)", fontSize: 16, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
              }}>×</button>
            </div>
            {linkErr && (
              <div style={{ fontSize: 11, color: T.red, marginTop: 5, marginLeft: 6 }}>{linkErr}</div>
            )}
          </div>
        )}

        {/* Message composer row */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: !isCompleted ? 10 : 0 }}>
          <button onClick={() => setShareFilesOpen(true)} title="Share files" style={{
            width: 38, height: 38, borderRadius: "50%",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid " + T.border,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", padding: 0, flexShrink: 0, fontFamily: "inherit",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button onClick={() => setLinkComposerOpen(o => !o)} title="Attach link" style={{
            width: 38, height: 38, borderRadius: "50%",
            background: linkComposerOpen ? "rgba(155,92,246,0.2)" : "rgba(255,255,255,0.06)",
            border: "1px solid " + (linkComposerOpen ? "rgba(155,92,246,0.4)" : T.border),
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", padding: 0, flexShrink: 0, fontFamily: "inherit",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke={linkComposerOpen ? T.purple : "rgba(255,255,255,0.7)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke={linkComposerOpen ? T.purple : "rgba(255,255,255,0.7)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <input
            value={msgText}
            onChange={e => setMsgText(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSend()}
            placeholder="Message your collaborators..."
            style={{
              flex: 1, padding: "11px 16px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid " + T.border,
              borderRadius: 99, color: "#fff", fontSize: 14, outline: "none",
              fontFamily: "inherit", boxSizing: "border-box",
            }}
          />
          <button onClick={handleSend} disabled={!msgText.trim() && !linkComposerOpen} style={{
            width: 38, height: 38, borderRadius: "50%",
            background: (msgText.trim() || linkComposerOpen) ? "linear-gradient(135deg,#4a7fff,#9b5cf6)" : "rgba(255,255,255,0.08)",
            border: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: (msgText.trim() || linkComposerOpen) ? "pointer" : "default", padding: 0,
            flexShrink: 0, fontFamily: "inherit",
            opacity: (msgText.trim() || linkComposerOpen) ? 1 : 0.5,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {!isCompleted && (
          <button onClick={onMarkComplete} style={{
            width: "100%", padding: "13px",
            background: "rgba(34,197,94,0.12)",
            border: "1px solid rgba(34,197,94,0.35)",
            borderRadius: 99, color: "#4ade80",
            fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            letterSpacing: "0.2px",
          }}>Wrap Session</button>
        )}
      </div>

      {/* ── SHARE FILES SHEET (overlay inside BlockDetail) ── */}
      {shareFilesOpen && (
        <div style={{ position: "absolute", inset: 0, zIndex: 400, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <div onClick={() => { setShareFilesOpen(false); setFileLinkUrl(""); setFileLinkErr(""); }} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)" }} />
          <div style={{ position: "relative", background: "#13162a", borderRadius: "24px 24px 0 0", padding: "20px 20px 28px", maxHeight: "85%", overflowY: "auto" }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.2)", margin: "0 auto 20px" }} />

            <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: T.purple, letterSpacing: "1.2px", marginBottom: 6 }}>SHARE FILES</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 4 }}>Send stems, demos, or project files</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 20 }}>Upload to your cloud, then paste the share link below.</div>
            </div>

            {/* Cloud service quick buttons */}
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "1px", marginBottom: 10 }}>UPLOAD TO</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
              {[
                { name: "Dropbox", color: "#0061ff", url: "https://www.dropbox.com/home" },
                { name: "Google Drive", color: "#1fa463", url: "https://drive.google.com" },
                { name: "WeTransfer", color: "#409fff", url: "https://wetransfer.com" },
                { name: "Splice", color: "#ff5b75", url: "https://splice.com" },
              ].map(svc => (
                <button key={svc.name} onClick={() => window.open(svc.url, "_blank")} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "12px 14px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid " + T.border,
                  borderRadius: 14, cursor: "pointer", fontFamily: "inherit",
                  textAlign: "left",
                }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 8,
                    background: svc.color,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{svc.name}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)" }}>Open & upload</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Paste URL */}
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "1px", marginBottom: 10 }}>PASTE YOUR SHARE LINK</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input
                value={fileLinkUrl}
                onChange={e => { setFileLinkUrl(e.target.value); setFileLinkErr(""); }}
                onKeyDown={e => e.key === "Enter" && handleShareFile()}
                placeholder="https://..."
                style={{
                  flex: 1, padding: "12px 14px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid " + (fileLinkErr ? "rgba(239,68,68,0.5)" : T.border),
                  borderRadius: 12, color: "#fff", fontSize: 13, outline: "none",
                  fontFamily: "inherit", boxSizing: "border-box",
                }}
              />
              <button onClick={handleShareFile} style={{
                padding: "12px 18px", borderRadius: 12,
                background: fileLinkUrl.trim() ? "linear-gradient(135deg,#4a7fff,#9b5cf6)" : "rgba(255,255,255,0.06)",
                border: "none", color: "#fff", fontSize: 13, fontWeight: 700,
                cursor: fileLinkUrl.trim() ? "pointer" : "default", fontFamily: "inherit",
                opacity: fileLinkUrl.trim() ? 1 : 0.5,
              }}>Send</button>
            </div>
            {fileLinkErr && (
              <div style={{ fontSize: 11, color: T.red, marginBottom: 12 }}>{fileLinkErr}</div>
            )}

            <div style={{
              padding: "12px 14px", marginTop: 8,
              background: "rgba(74,127,255,0.08)",
              border: "1px solid rgba(74,127,255,0.2)",
              borderRadius: 12,
              display: "flex", gap: 10, alignItems: "flex-start",
            }}>
              <span style={{ fontSize: 16, lineHeight: 1 }}>💡</span>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
                Tip: Upload your stems, beat, or project file to a cloud service, then paste the share link here. Your collaborator can download it directly.
              </div>
            </div>

            <button onClick={() => { setShareFilesOpen(false); setFileLinkUrl(""); setFileLinkErr(""); }} style={{
              width: "100%", padding: "14px", marginTop: 18,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid " + T.border,
              borderRadius: 99, color: "rgba(255,255,255,0.7)",
              fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SPLIT SHEET — set ownership %s, each collaborator confirms
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CREATE BLOCK SHEET — Session or Listing
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function CreateBlockSheet({ onClose, onCreate }) {
  const [step, setStep] = useState("type"); // "type" | "session" | "listing"

  // Session fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [role, setRole] = useState("");
  const [stage, setStage] = useState("Writing");
  const [crewMode, setCrewMode] = useState("solo");
  const [deadlineMonth, setDeadlineMonth] = useState(null);
  const [deadlineDay, setDeadlineDay] = useState(null);

  // Listing fields
  const [listingType, setListingType] = useState("Beats");
  const [includes, setIncludes] = useState("");
  const [price, setPrice] = useState("");

  const roles = ["Producer", "Vocalist", "Songwriter", "Engineer", "Instrumentalist", "Beatmaker", "Artist", "Other"];
  const stages = ["Writing", "Recording", "Mixing", "Released"];
  const stageColors = {
    "Writing":   { bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.4)", color: "#f59e0b" },
    "Recording": { bg: "rgba(74,127,255,0.15)", border: "rgba(74,127,255,0.4)", color: T.blue },
    "Mixing":    { bg: "rgba(155,92,246,0.15)", border: "rgba(155,92,246,0.4)", color: T.purple },
    "Released":  { bg: "rgba(34,197,94,0.15)",  border: "rgba(34,197,94,0.4)",  color: T.green },
  };
  const listingTypes = ["Beats", "Vocal Samples", "Drum Kit", "Sample Pack", "Loops", "Service", "Other"];

  const dayCount = deadlineMonth !== null ? DAYS_IN_MONTH[deadlineMonth] : 31;
  const days = Array.from({ length: dayCount }, (_, i) => i + 1);

  function formatDeadline() {
    if (deadlineMonth === null || deadlineDay === null) return "";
    const today = new Date();
    const targetYear = today.getMonth() > deadlineMonth ? today.getFullYear() + 1 : today.getFullYear();
    return MONTHS[deadlineMonth] + " " + deadlineDay + ", " + targetYear;
  }
  const deadline = formatDeadline();

  const canCreateSession = title.trim().length > 0;
  const canCreateListing = title.trim().length > 0 && price.trim().length > 0;

  function handleCreateSession() {
    if (!canCreateSession) return;
    onCreate({
      type: "session",
      title: title.trim(),
      description: description.trim(),
      role: role || "Creative",
      stage,
      deadline: deadline || "No deadline",
      addCollaborators: crewMode === "withCollabs",
    });
  }

  function handleCreateListing() {
    if (!canCreateListing) return;
    onCreate({
      type: "listing",
      title: title.trim(),
      description: description.trim(),
      listingType,
      includes: includes.trim(),
      price: price.trim(),
    });
  }

  // Sheet outer wrapper
  function Wrapper({ children }) {
    return (
      <div style={{ position: "absolute", inset: 0, zIndex: 360, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
        <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)" }} />
        <div style={{ position: "relative", background: "#13162a", borderRadius: "24px 24px 0 0", padding: "20px 20px 28px", maxHeight: "92%", overflowY: "auto" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.2)", margin: "0 auto 20px" }} />
          {children}
        </div>
      </div>
    );
  }

  // ── STEP 1: PICK TYPE ──
  if (step === "type") {
    return (
      <Wrapper>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: T.purple, letterSpacing: "1.2px", marginBottom: 6 }}>NEW BLOCK</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: "-0.4px", marginBottom: 4 }}>What kind of Block?</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>Sessions are for collab. Listings are for sale.</div>
        </div>

        <button onClick={() => setStep("session")} style={{
          width: "100%", textAlign: "left",
          padding: "18px 18px",
          background: "rgba(74,127,255,0.08)",
          border: "1px solid rgba(74,127,255,0.3)",
          borderRadius: 16, marginBottom: 12,
          cursor: "pointer", fontFamily: "inherit",
          display: "flex", alignItems: "flex-start", gap: 14,
        }}>
          <div style={{ fontSize: 26, lineHeight: 1, marginTop: 2 }}>🎤</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", marginBottom: 4 }}>Session Block</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>Work on a song with collaborators. Chat, share files, set splits, finalize together.</div>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 6 }}>
            <path d="M9 18l6-6-6-6" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <button onClick={() => setStep("listing")} style={{
          width: "100%", textAlign: "left",
          padding: "18px 18px",
          background: "rgba(251,191,36,0.08)",
          border: "1px solid rgba(251,191,36,0.3)",
          borderRadius: 16, marginBottom: 16,
          cursor: "pointer", fontFamily: "inherit",
          display: "flex", alignItems: "flex-start", gap: 14,
        }}>
          <div style={{ fontSize: 26, lineHeight: 1, marginTop: 2 }}>💰</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", marginBottom: 4 }}>Listing Block</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>Sell beats, sample packs, vocal loops, drum kits, or your services to buyers.</div>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 6 }}>
            <path d="M9 18l6-6-6-6" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <button onClick={onClose} style={{
          width: "100%", padding: "14px",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid " + T.border,
          borderRadius: 99, color: "rgba(255,255,255,0.7)",
          fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
        }}>Cancel</button>
      </Wrapper>
    );
  }

  // ── STEP 2A: SESSION FORM ──
  if (step === "session") {
    return (
      <Wrapper>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <button onClick={() => setStep("type")} style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid " + T.border,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", padding: 0, fontFamily: "inherit",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: T.blue, letterSpacing: "1.2px" }}>SESSION BLOCK</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", letterSpacing: "-0.3px" }}>Start a new session</div>
          </div>
        </div>

        {/* Title */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "1px", marginBottom: 8 }}>TITLE</div>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Name your Block (e.g. Late Night EP)" autoFocus style={{ width: "100%", padding: "13px 16px", background: "rgba(255,255,255,0.05)", border: "1px solid " + T.border, borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 600, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
        </div>

        {/* Description */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "1px", marginBottom: 8 }}>WHAT IS THIS BLOCK FOR? <span style={{ color: "rgba(255,255,255,0.3)", fontWeight: 400 }}>(optional)</span></div>
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Building beats for the EP, looking for a vocalist..." rows={3} style={{ width: "100%", padding: "12px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid " + T.border, borderRadius: 12, color: "#fff", fontSize: 14, lineHeight: 1.5, outline: "none", fontFamily: "inherit", boxSizing: "border-box", resize: "vertical" }} />
        </div>

        {/* Stage */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "1px", marginBottom: 8 }}>STAGE</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {stages.map(s => {
              const on = stage === s;
              const sc = stageColors[s];
              return (
                <button key={s} onClick={() => setStage(s)} style={{ padding: "8px 14px", borderRadius: 99, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", background: on ? sc.bg : "rgba(255,255,255,0.04)", border: "1px solid " + (on ? sc.border : T.border), color: on ? sc.color : "rgba(255,255,255,0.65)" }}>{s}</button>
              );
            })}
          </div>
        </div>

        {/* Role */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "1px", marginBottom: 8 }}>YOUR ROLE IN THIS BLOCK</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {roles.map(r => {
              const on = role === r;
              return (
                <button key={r} onClick={() => setRole(r)} style={{ padding: "8px 14px", borderRadius: 99, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", background: on ? "rgba(74,127,255,0.2)" : "rgba(255,255,255,0.04)", border: "1px solid " + (on ? T.blue : T.border), color: on ? T.blue : "rgba(255,255,255,0.65)" }}>{r}</button>
              );
            })}
          </div>
        </div>

        {/* Deadline */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "1px" }}>DEADLINE <span style={{ color: "rgba(255,255,255,0.3)", fontWeight: 400 }}>(optional)</span></div>
            {deadline && (<div style={{ fontSize: 12, fontWeight: 700, color: T.blue }}>📅 {deadline}</div>)}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <select value={deadlineMonth === null ? "" : deadlineMonth} onChange={e => { const v = e.target.value === "" ? null : parseInt(e.target.value, 10); setDeadlineMonth(v); if (v !== null && deadlineDay !== null && deadlineDay > DAYS_IN_MONTH[v]) setDeadlineDay(null); }} style={{ width: "100%", padding: "13px 36px 13px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid " + (deadlineMonth !== null ? "rgba(74,127,255,0.4)" : T.border), borderRadius: 12, color: deadlineMonth === null ? "rgba(255,255,255,0.5)" : "#fff", fontSize: 14, fontWeight: 600, outline: "none", fontFamily: "inherit", appearance: "none", WebkitAppearance: "none", MozAppearance: "none", cursor: "pointer" }}>
                <option value="" style={{ background: "#13162a", color: "#fff" }}>Month</option>
                {MONTHS.map((m, i) => (<option key={m} value={i} style={{ background: "#13162a", color: "#fff" }}>{m}</option>))}
              </select>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                <path d="M6 9l6 6 6-6" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div style={{ flex: 1, position: "relative" }}>
              <select value={deadlineDay === null ? "" : deadlineDay} onChange={e => setDeadlineDay(e.target.value === "" ? null : parseInt(e.target.value, 10))} disabled={deadlineMonth === null} style={{ width: "100%", padding: "13px 36px 13px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid " + (deadlineDay !== null ? "rgba(155,92,246,0.4)" : T.border), borderRadius: 12, color: deadlineDay === null ? "rgba(255,255,255,0.5)" : "#fff", fontSize: 14, fontWeight: 600, outline: "none", fontFamily: "inherit", appearance: "none", WebkitAppearance: "none", MozAppearance: "none", cursor: deadlineMonth === null ? "default" : "pointer", opacity: deadlineMonth === null ? 0.5 : 1 }}>
                <option value="" style={{ background: "#13162a", color: "#fff" }}>Day</option>
                {days.map(d => (<option key={d} value={d} style={{ background: "#13162a", color: "#fff" }}>{d}</option>))}
              </select>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                <path d="M6 9l6 6 6-6" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Solo vs Add collaborators */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "1px", marginBottom: 10 }}>WHO'S IN?</div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setCrewMode("solo")} style={{ flex: 1, padding: "14px 12px", background: crewMode === "solo" ? "rgba(155,92,246,0.15)" : "rgba(255,255,255,0.04)", border: "1px solid " + (crewMode === "solo" ? "rgba(155,92,246,0.4)" : T.border), borderRadius: 14, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
              <div style={{ fontSize: 18, marginBottom: 6 }}>🧘</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", marginBottom: 2 }}>Solo</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>Start alone. Invite anytime.</div>
            </button>
            <button onClick={() => setCrewMode("withCollabs")} style={{ flex: 1, padding: "14px 12px", background: crewMode === "withCollabs" ? "rgba(74,127,255,0.15)" : "rgba(255,255,255,0.04)", border: "1px solid " + (crewMode === "withCollabs" ? "rgba(74,127,255,0.4)" : T.border), borderRadius: 14, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
              <div style={{ fontSize: 18, marginBottom: 6 }}>🤝</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", marginBottom: 2 }}>Add collaborators</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>Pick from the Market next.</div>
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "14px", background: "rgba(255,255,255,0.06)", border: "1px solid " + T.border, borderRadius: 99, color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
          <button onClick={handleCreateSession} disabled={!canCreateSession} style={{ flex: 2, padding: "14px", background: canCreateSession ? "linear-gradient(135deg,#4a7fff,#9b5cf6)" : "rgba(255,255,255,0.08)", border: "none", borderRadius: 99, color: "#fff", fontSize: 15, fontWeight: 800, cursor: canCreateSession ? "pointer" : "default", fontFamily: "inherit", opacity: canCreateSession ? 1 : 0.5, boxShadow: canCreateSession ? "0 8px 24px rgba(123,58,237,0.4)" : "none" }}>{crewMode === "withCollabs" ? "Create & invite" : "Create Block"}</button>
        </div>
      </Wrapper>
    );
  }

  // ── STEP 2B: LISTING FORM ──
  return (
    <Wrapper>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <button onClick={() => setStep("type")} style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid " + T.border,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", padding: 0, fontFamily: "inherit",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#fbbf24", letterSpacing: "1.2px" }}>LISTING BLOCK</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", letterSpacing: "-0.3px" }}>List something for sale</div>
        </div>
      </div>

      {/* Title */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "1px", marginBottom: 8 }}>TITLE</div>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Dark Trap Beat Pack Vol. 3" autoFocus style={{ width: "100%", padding: "13px 16px", background: "rgba(255,255,255,0.05)", border: "1px solid " + T.border, borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 600, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
      </div>

      {/* Listing type */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "1px", marginBottom: 8 }}>WHAT ARE YOU SELLING?</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {listingTypes.map(lt => {
            const on = listingType === lt;
            return (
              <button key={lt} onClick={() => setListingType(lt)} style={{ padding: "8px 14px", borderRadius: 99, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", background: on ? "rgba(251,191,36,0.15)" : "rgba(255,255,255,0.04)", border: "1px solid " + (on ? "rgba(251,191,36,0.4)" : T.border), color: on ? "#fbbf24" : "rgba(255,255,255,0.65)" }}>{lt}</button>
            );
          })}
        </div>
      </div>

      {/* What's included */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "1px", marginBottom: 8 }}>WHAT'S INCLUDED? <span style={{ color: "rgba(255,255,255,0.3)", fontWeight: 400 }}>(optional)</span></div>
        <textarea value={includes} onChange={e => setIncludes(e.target.value)} placeholder="e.g. 12 beats, WAV + MP3 stems, untagged, exclusive license" rows={3} style={{ width: "100%", padding: "12px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid " + T.border, borderRadius: 12, color: "#fff", fontSize: 14, lineHeight: 1.5, outline: "none", fontFamily: "inherit", boxSizing: "border-box", resize: "vertical" }} />
      </div>

      {/* Description */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "1px", marginBottom: 8 }}>DESCRIPTION <span style={{ color: "rgba(255,255,255,0.3)", fontWeight: 400 }}>(optional)</span></div>
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Tell buyers about the sound, the inspiration, what makes it special..." rows={3} style={{ width: "100%", padding: "12px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid " + T.border, borderRadius: 12, color: "#fff", fontSize: 14, lineHeight: 1.5, outline: "none", fontFamily: "inherit", boxSizing: "border-box", resize: "vertical" }} />
      </div>

      {/* Price */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "1px", marginBottom: 8 }}>PRICE (USD)</div>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 16, fontWeight: 800, color: "#fbbf24" }}>$</span>
          <input value={price} onChange={e => setPrice(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="0" inputMode="decimal" style={{ width: "100%", padding: "13px 16px 13px 32px", background: "rgba(255,255,255,0.05)", border: "1px solid " + T.border, borderRadius: 12, color: "#fff", fontSize: 18, fontWeight: 700, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>Buyers will see this price and contact you to purchase.</div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onClose} style={{ flex: 1, padding: "14px", background: "rgba(255,255,255,0.06)", border: "1px solid " + T.border, borderRadius: 99, color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
        <button onClick={handleCreateListing} disabled={!canCreateListing} style={{ flex: 2, padding: "14px", background: canCreateListing ? "linear-gradient(135deg,#f59e0b,#fbbf24)" : "rgba(255,255,255,0.08)", border: "none", borderRadius: 99, color: canCreateListing ? "#000" : "#fff", fontSize: 15, fontWeight: 800, cursor: canCreateListing ? "pointer" : "default", fontFamily: "inherit", opacity: canCreateListing ? 1 : 0.5, boxShadow: canCreateListing ? "0 8px 24px rgba(251,191,36,0.4)" : "none" }}>Publish Listing</button>
      </div>
    </Wrapper>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ADD COLLABORATOR SHEET — pick an artist from the market to add to a Block
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function AddCollaboratorSheet({ block, onClose, onAdd }) {
  const [search, setSearch] = useState("");

  // Filter out artists already on the block
  const existingInitials = (block.collaborators || []).map(c => c.initials);
  const available = MARKET_ARTISTS.filter(a => !existingInitials.includes(a.initials));

  const filtered = available.filter(a => {
    if (!search) return true;
    const q = search.toLowerCase();
    return a.name.toLowerCase().includes(q) ||
      a.roles.some(r => r.toLowerCase().includes(q)) ||
      a.genres.some(g => g.toLowerCase().includes(q));
  });

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 380, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)" }} />
      <div style={{ position: "relative", background: "#13162a", borderRadius: "24px 24px 0 0", padding: "20px 20px 28px", maxHeight: "85%", display: "flex", flexDirection: "column" }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.2)", margin: "0 auto 20px" }} />

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: T.purple, letterSpacing: "1.2px", marginBottom: 6 }}>ADD TO BLOCK</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 4 }}>Invite someone to {block.title}</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>Pick a collaborator from the Block Market.</div>
        </div>

        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, role, or genre..."
          style={{
            width: "100%", padding: "12px 16px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid " + T.border,
            borderRadius: 12, color: "#fff", fontSize: 14, outline: "none",
            fontFamily: "inherit", boxSizing: "border-box", marginBottom: 14,
          }}
        />

        <div style={{ flex: 1, overflowY: "auto", maxHeight: "55vh" }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>🔍</div>
              <div style={{ fontSize: 13, color: T.textSub }}>No matches</div>
            </div>
          )}

          {filtered.map((a, i) => (
            <div key={i} onClick={() => onAdd(a)} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 14px", marginBottom: 8,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid " + T.border,
              borderRadius: 14, cursor: "pointer",
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                background: "linear-gradient(135deg, " + a.color + ", " + a.color + "aa)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 800, color: "#fff",
                flexShrink: 0,
              }}>{a.initials}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>
                  {a.roles[0]}{a.roles.length > 1 ? " · " + a.roles[1] : ""} · {a.location}
                </div>
              </div>
              <span style={{ fontSize: 13, color: T.purple, fontWeight: 700, flexShrink: 0 }}>＋ Add</span>
            </div>
          ))}
        </div>

        <button onClick={onClose} style={{
          width: "100%", padding: "14px", marginTop: 12,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid " + T.border,
          borderRadius: 99, color: "rgba(255,255,255,0.7)",
          fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
        }}>Cancel</button>
      </div>
    </div>
  );
}

function SplitSheet({ block, currentUser, onClose, onConfirm }) {
  // Build the participants list: current user + block collaborators
  const userInitials = (currentUser.name || "You").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "YOU";
  const collabs = block.collaborators || [];

  // If block already has splits, seed from them
  let initialParticipants;
  if (block.splits && block.splits.length) {
    initialParticipants = block.splits.map(s => Object.assign({}, s));
  } else {
    initialParticipants = [
      { id: "me", name: currentUser.name || "You", initials: userInitials, color: "#7c3aed", percent: collabs.length === 0 ? 100 : Math.floor(100 / (collabs.length + 1)) },
    ].concat(collabs.map((c, i) => ({
      id: "c" + i,
      name: block.with || c.initials,
      initials: c.initials,
      color: c.color,
      percent: collabs.length === 0 ? 0 : Math.floor(100 / (collabs.length + 1)),
    })));

    // Distribute remainder so total = 100
    const totalInit = initialParticipants.reduce((s, p) => s + p.percent, 0);
    if (totalInit < 100 && initialParticipants.length > 0) {
      initialParticipants[0].percent += (100 - totalInit);
    }
  }

  const [participants, setParticipants] = useState(initialParticipants);
  const [confirmed, setConfirmed] = useState({}); // id -> bool

  const total = participants.reduce((s, p) => s + Number(p.percent || 0), 0);
  const valid = total === 100;
  const allConfirmed = participants.every(p => confirmed[p.id]);
  const canSubmit = valid && allConfirmed;

  function updatePercent(id, value) {
    let n = parseInt(value, 10);
    if (isNaN(n)) n = 0;
    if (n < 0) n = 0;
    if (n > 100) n = 100;
    setParticipants(prev => prev.map(p => p.id === id ? Object.assign({}, p, { percent: n }) : p));
    // any change clears confirmations
    setConfirmed({});
  }

  function toggleConfirm(id) {
    if (!valid) return;
    setConfirmed(prev => Object.assign({}, prev, { [id]: !prev[id] }));
  }

  function splitEvenly() {
    const each = Math.floor(100 / participants.length);
    const remainder = 100 - (each * participants.length);
    setParticipants(prev => prev.map((p, i) => Object.assign({}, p, { percent: i === 0 ? each + remainder : each })));
    setConfirmed({});
  }

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 350, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)" }} />
      <div style={{ position: "relative", background: "#13162a", borderRadius: "24px 24px 0 0", padding: "20px 20px 28px", maxHeight: "90%", overflowY: "auto" }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.2)", margin: "0 auto 20px" }} />

        <div style={{ textAlign: "center", marginBottom: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: T.purple, letterSpacing: "1.2px", marginBottom: 6 }}>SPLIT SHEET</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 4 }}>Set ownership for this Block</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 20 }}>Each collaborator must confirm before finalizing.</div>
        </div>

        {/* Block summary */}
        <div style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid " + T.border,
          borderRadius: 12, padding: "12px 14px",
          marginBottom: 16, display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#4a7fff,#9b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>🎵</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{block.title}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>{block.role}{block.stage ? " · " + block.stage : ""}</div>
          </div>
        </div>

        {/* Total + Split evenly */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "1px" }}>ALLOCATION</div>
          <button onClick={splitEvenly} style={{
            fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 99,
            background: "rgba(155,92,246,0.15)", border: "1px solid rgba(155,92,246,0.3)",
            color: T.purple, cursor: "pointer", fontFamily: "inherit",
          }}>Split evenly</button>
        </div>

        {/* Participants */}
        {participants.map(p => (
          <div key={p.id} style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "12px 14px", marginBottom: 8,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid " + (confirmed[p.id] ? "rgba(34,197,94,0.4)" : T.border),
            borderRadius: 14,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "linear-gradient(135deg, " + p.color + ", " + p.color + "aa)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 800, color: "#fff",
              flexShrink: 0,
            }}>{p.initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {p.name}{p.id === "me" ? " (you)" : ""}
              </div>
              {confirmed[p.id] && (
                <div style={{ fontSize: 10, fontWeight: 700, color: T.green, marginTop: 2 }}>✓ Accepted</div>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              <input
                type="number"
                inputMode="numeric"
                value={p.percent}
                onChange={e => updatePercent(p.id, e.target.value)}
                style={{
                  width: 56, padding: "8px 6px",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid " + T.border,
                  borderRadius: 10, color: "#fff", fontSize: 15, fontWeight: 700,
                  textAlign: "center", outline: "none", fontFamily: "inherit",
                  appearance: "textfield",
                }}
              />
              <span style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>%</span>
            </div>
            <button onClick={() => toggleConfirm(p.id)} disabled={!valid} style={{
              fontSize: 11, fontWeight: 700, padding: "6px 10px", borderRadius: 99,
              background: confirmed[p.id] ? "rgba(34,197,94,0.2)" : (valid ? "rgba(74,127,255,0.15)" : "rgba(255,255,255,0.05)"),
              border: "1px solid " + (confirmed[p.id] ? "rgba(34,197,94,0.4)" : (valid ? "rgba(74,127,255,0.3)" : T.border)),
              color: confirmed[p.id] ? T.green : (valid ? T.blue : "rgba(255,255,255,0.3)"),
              cursor: valid ? "pointer" : "default", fontFamily: "inherit",
              flexShrink: 0,
              minWidth: 64,
            }}>{confirmed[p.id] ? "✓" : "Accept"}</button>
          </div>
        ))}

        {/* Total row */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 14px", marginTop: 4, marginBottom: 20,
          background: valid ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
          border: "1px solid " + (valid ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"),
          borderRadius: 12,
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: "0.5px" }}>TOTAL</span>
          <span style={{ fontSize: 18, fontWeight: 900, color: valid ? T.green : T.red }}>
            {total}%{!valid && " · must equal 100"}
          </span>
        </div>

        {!allConfirmed && valid && (
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", textAlign: "center", marginBottom: 14 }}>
            Waiting on {participants.filter(p => !confirmed[p.id]).length} collaborator(s) to accept…
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "14px",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid " + T.border,
            borderRadius: 99, color: "rgba(255,255,255,0.7)",
            fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          }}>Cancel</button>
          <button
            onClick={() => canSubmit && onConfirm(participants)}
            style={{
              flex: 2, padding: "14px",
              background: canSubmit ? "linear-gradient(135deg,#4a7fff,#9b5cf6)" : "rgba(255,255,255,0.08)",
              border: "none",
              borderRadius: 99, color: "#fff",
              fontSize: 15, fontWeight: 800,
              cursor: canSubmit ? "pointer" : "default", fontFamily: "inherit",
              opacity: canSubmit ? 1 : 0.5,
            }}
          >Finalize Split</button>
        </div>
      </div>
    </div>
  );
}

function RateBlockSheet({ block, onClose, onSubmit }) {
  const [stars, setStars] = useState(0);
  const [note, setNote] = useState("");
  const collaboratorName = block.with || block.owner || "your collaborator";

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 350, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)" }} />
      <div style={{ position: "relative", background: "#13162a", borderRadius: "24px 24px 0 0", padding: "20px 20px 32px", maxHeight: "85%", overflowY: "auto" }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.2)", margin: "0 auto 20px" }} />

        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 4 }}>Block Completed!</div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>How was your experience with <span style={{ color: "#fff", fontWeight: 600 }}>{collaboratorName}</span>?</div>
        </div>

        {/* Star picker */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, padding: "24px 0 8px" }}>
          {[1,2,3,4,5].map(n => (
            <button key={n} onClick={() => setStars(n)} style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 36, padding: 4,
              color: n <= stars ? "#fbbf24" : "rgba(255,255,255,0.2)",
              transition: "color 0.15s",
              fontFamily: "inherit",
            }}>★</button>
          ))}
        </div>

        <div style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 24, minHeight: 18 }}>
          {stars === 0 && "Tap a star to rate"}
          {stars === 1 && "Poor"}
          {stars === 2 && "Below expectations"}
          {stars === 3 && "Good"}
          {stars === 4 && "Great"}
          {stars === 5 && "Amazing — would collab again"}
        </div>

        {/* Optional note */}
        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.55)", letterSpacing: "0.5px", marginBottom: 8 }}>LEAVE A NOTE (OPTIONAL)</div>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="What was great? What could improve?"
          rows={3}
          style={{
            width: "100%", padding: "12px 14px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid " + T.border,
            borderRadius: 12, color: "#fff", fontSize: 14,
            outline: "none", fontFamily: "inherit",
            resize: "none", boxSizing: "border-box",
            marginBottom: 20,
          }}
        />

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "14px",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid " + T.border,
            borderRadius: 99, color: "rgba(255,255,255,0.7)",
            fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          }}>Skip</button>
          <button
            onClick={() => stars > 0 && onSubmit({ stars, note })}
            style={{
              flex: 2, padding: "14px",
              background: stars > 0 ? "linear-gradient(135deg,#4a7fff,#9b5cf6)" : "rgba(255,255,255,0.08)",
              border: "none",
              borderRadius: 99, color: "#fff",
              fontSize: 15, fontWeight: 800,
              cursor: stars > 0 ? "pointer" : "default",
              fontFamily: "inherit",
              opacity: stars > 0 ? 1 : 0.5,
            }}
          >Submit Rating</button>
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// INVITE SUCCESS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function InviteSuccess({ artistName, onDone }) {
  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 400,
      background: "rgba(13,13,26,0.96)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "0 32px",
    }}>
      <div style={{ fontSize: 72, marginBottom: 20, animation: "pop 0.4s ease-out" }}>🎉</div>
      <style>{"@keyframes pop { 0% { transform: scale(0); } 70% { transform: scale(1.15); } 100% { transform: scale(1); } }"}</style>
      <div style={{ fontSize: 26, fontWeight: 900, color: "#fff", marginBottom: 10, textAlign: "center" }}>Invite sent!</div>
      <div style={{ fontSize: 15, color: "rgba(255,255,255,0.65)", textAlign: "center", marginBottom: 36, lineHeight: 1.6 }}>
        <span style={{ color: "#fff", fontWeight: 700 }}>{artistName}</span> will see your invite in their Blocks tab.
      </div>
      <button onClick={onDone} style={{
        padding: "16px 56px",
        background: "linear-gradient(135deg,#4a7fff,#9b5cf6)",
        border: "none", borderRadius: 99, color: "#fff",
        fontSize: 16, fontWeight: 800, cursor: "pointer",
      }}>Done</button>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MY BLOCKS — with pending invites banner
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function MyBlocks({ projects, invites, onAcceptInvite, onDeclineInvite, onMarkComplete, onViewBlock, onCreateBlock }) {
  const myProjects = projects.filter(p => p.owner === "me");
  const collabBlocks = projects.filter(p => p.owner !== "me");

  return (
    <div style={{ height: "100%", overflowY: "auto", background: T.bg }}>
      {/* Header */}
      <div style={{
        padding: "20px 16px 16px",
        background: "linear-gradient(180deg, rgba(124,58,237,0.18) 0%, rgba(13,13,26,0) 100%)",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 30, fontWeight: 900, color: "#fff", letterSpacing: "-0.6px" }}>My Blocks</div>
          </div>
          {onCreateBlock && (
            <button onClick={onCreateBlock} style={{
              padding: "10px 16px", borderRadius: 99,
              background: "linear-gradient(135deg,#4a7fff,#9b5cf6)",
              border: "none", color: "#fff",
              fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit",
              boxShadow: "0 6px 20px rgba(123,58,237,0.45)",
              flexShrink: 0,
              display: "inline-flex", alignItems: "center", gap: 6,
            }}>
              <span style={{ fontSize: 16, lineHeight: 1 }}>＋</span>
              New Block
            </button>
          )}
        </div>
        <div style={{ fontSize: 14, color: "#fbbf24", fontWeight: 600 }}>Your active collaborations</div>
      </div>

      <div style={{ padding: "0 16px 24px" }}>
        {/* Pending invites banner */}
        {invites.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.red, letterSpacing: "0.8px", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
              ● PENDING INVITES ({invites.length})
            </div>
            {invites.map((inv, i) => (
              <div key={i} style={{
                background: "linear-gradient(135deg, rgba(239,68,68,0.12), rgba(155,92,246,0.12))",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: 16, padding: 16, marginBottom: 10,
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: "50%",
                    background: "linear-gradient(135deg, " + inv.fromColor + "cc, " + inv.fromColor + "55)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, fontWeight: 900, color: "#fff", flexShrink: 0,
                  }}>{inv.fromInitials}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", marginBottom: 2 }}>
                      <span style={{ fontWeight: 700, color: "#fff" }}>{inv.from}</span> invited you to:
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 4 }}>{inv.title}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{inv.role} · {inv.deadline}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => onDeclineInvite(i)} style={{
                    flex: 1, padding: "12px",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid " + T.border,
                    borderRadius: 99, color: "rgba(255,255,255,0.7)",
                    fontSize: 14, fontWeight: 700, cursor: "pointer",
                  }}>Decline</button>
                  <button onClick={() => onAcceptInvite(i)} style={{
                    flex: 2, padding: "12px",
                    background: "linear-gradient(135deg,#4a7fff,#9b5cf6)",
                    border: "none",
                    borderRadius: 99, color: "#fff",
                    fontSize: 14, fontWeight: 800, cursor: "pointer",
                  }}>Accept</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* My projects */}
        {myProjects.length > 0 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "1px", marginBottom: 10 }}>YOUR BLOCKS</div>
            {myProjects.map((p, i) => (
              <BlockCard key={i} block={p} onMarkComplete={() => onMarkComplete(projects.indexOf(p))} onClick={() => onViewBlock(projects.indexOf(p))} />
            ))}
          </>
        )}

        {/* Collaborating */}
        {collabBlocks.length > 0 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "1px", marginBottom: 10, marginTop: 20 }}>COLLABORATING</div>
            {collabBlocks.map((p, i) => (
              <BlockCard key={i} block={p} onMarkComplete={() => onMarkComplete(projects.indexOf(p))} onClick={() => onViewBlock(projects.indexOf(p))} />
            ))}
          </>
        )}

        {/* Empty state */}
        {projects.length === 0 && invites.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 20px" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎼</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", marginBottom: 8, letterSpacing: "-0.3px" }}>No Blocks yet</div>
            <div style={{ fontSize: 14, color: T.textSub, marginBottom: 24, lineHeight: 1.5 }}>
              Spin one up to start a session.<br/>Solo or with collaborators — your call.
            </div>
            {onCreateBlock && (
              <button onClick={onCreateBlock} style={{
                padding: "13px 24px", borderRadius: 99,
                background: "linear-gradient(135deg,#4a7fff,#9b5cf6)",
                border: "none", color: "#fff",
                fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit",
                boxShadow: "0 8px 24px rgba(123,58,237,0.45)",
              }}>＋ Create your first Block</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function BlockCard({ block, onMarkComplete, onClick }) {
  const isListing = block.type === "listing";
  const isCompleted = block.status === "completed";

  // ── LISTING CARD ──
  if (isListing) {
    const initial = (block.title || "").trim().split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase();
    return (
      <div
        onClick={onClick}
        style={{
          width: "100%",
          borderRadius: 24,
          background: T.surface,
          border: "1px solid " + T.border,
          overflow: "hidden",
          marginBottom: 18,
          boxShadow: "0 8px 32px rgba(251,191,36,0.25)",
          cursor: onClick ? "pointer" : "default",
        }}
      >
        {/* Cover — gold/amber gradient for listings */}
        <div style={{
          position: "relative",
          width: "100%",
          aspectRatio: "1 / 1",
          background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #b45309 100%)",
          overflow: "hidden",
        }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 50% at 30% 0%, rgba(255,255,255,0.22) 0%, transparent 60%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 100% 60% at 50% 110%, rgba(0,0,0,0.45) 0%, transparent 60%)", pointerEvents: "none" }} />

          {/* Top-left: For sale pill */}
          <div style={{ position: "absolute", top: 16, left: 16 }}>
            <span style={{
              fontSize: 10, fontWeight: 800, padding: "6px 11px", borderRadius: 99,
              background: "rgba(0,0,0,0.5)", color: "#fff",
              letterSpacing: "0.5px", textTransform: "uppercase",
            }}>💰 For Sale</span>
          </div>

          {/* Top-right: Price tag */}
          <div style={{ position: "absolute", top: 16, right: 16 }}>
            <div style={{
              padding: "6px 14px", borderRadius: 99,
              background: "#000", color: "#fbbf24",
              fontSize: 14, fontWeight: 900,
              border: "1px solid rgba(251,191,36,0.4)",
              letterSpacing: "-0.3px",
            }}>${block.price}</div>
          </div>

          {/* Center: title + listing type */}
          <div style={{
            position: "absolute", left: 0, right: 0, top: "50%",
            transform: "translateY(-50%)",
            textAlign: "center", padding: "0 24px",
            pointerEvents: "none",
          }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "rgba(0,0,0,0.6)", letterSpacing: "3px", textTransform: "uppercase", marginBottom: 8 }}>{block.listingType || "Listing"}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#fff", letterSpacing: "-0.8px", lineHeight: 1.1, textShadow: "0 2px 24px rgba(0,0,0,0.4)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{block.title}</div>
          </div>

          {/* Corner emboss */}
          <div style={{ position: "absolute", bottom: 16, right: 20, fontSize: 42, fontWeight: 900, color: "rgba(255,255,255,0.18)", letterSpacing: "-2px", lineHeight: 1, pointerEvents: "none" }}>{initial}</div>
        </div>

        {/* Meta strip */}
        <div style={{ padding: "16px 18px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#fff", marginBottom: 4, letterSpacing: "-0.2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{block.title}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>{block.listingType} · Listed by you</div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#fbbf24", letterSpacing: "-0.5px", flexShrink: 0 }}>${block.price}</div>
          </div>
        </div>
      </div>
    );
  }

  // ── SESSION CARD (default) ──
  // Gradient themed by stage
  const stageThemes = {
    "Writing":   { gradient: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #ea580c 100%)", glow: "rgba(245,158,11,0.35)", pillBg: "rgba(0,0,0,0.4)", pillColor: "#fff" },
    "Recording": { gradient: "linear-gradient(135deg, #60a5fa 0%, #4a7fff 50%, #2563eb 100%)", glow: "rgba(74,127,255,0.35)", pillBg: "rgba(0,0,0,0.4)", pillColor: "#fff" },
    "Mixing":    { gradient: "linear-gradient(135deg, #c084fc 0%, #9b5cf6 50%, #7c3aed 100%)", glow: "rgba(155,92,246,0.4)",  pillBg: "rgba(0,0,0,0.4)", pillColor: "#fff" },
    "Released":  { gradient: "linear-gradient(135deg, #4ade80 0%, #22c55e 50%, #16a34a 100%)", glow: "rgba(34,197,94,0.35)",  pillBg: "rgba(0,0,0,0.4)", pillColor: "#fff" },
  };
  const theme = isCompleted
    ? { gradient: "linear-gradient(135deg, #475569 0%, #334155 50%, #1e293b 100%)", glow: "rgba(100,116,139,0.2)", pillBg: "rgba(34,197,94,0.25)", pillColor: "#4ade80" }
    : stageThemes[block.stage] || stageThemes["Writing"];

  // Decorative initial / glyph (first 1-2 chars of title)
  const initial = (block.title || "").trim().split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase();

  return (
    <div
      onClick={onClick}
      style={{
        width: "100%",
        borderRadius: 24,
        background: T.surface,
        border: "1px solid " + T.border,
        overflow: "hidden",
        marginBottom: 18,
        boxShadow: "0 8px 32px " + theme.glow,
        cursor: onClick ? "pointer" : "default",
      }}
    >
      {/* ── Cover (square gradient) ── */}
      <div style={{
        position: "relative",
        width: "100%",
        aspectRatio: "1 / 1",
        background: theme.gradient,
        overflow: "hidden",
      }}>
        {/* Cinematic light from top, shadow vignette toward bottom */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 50% at 30% 0%, rgba(255,255,255,0.22) 0%, transparent 60%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 100% 60% at 50% 110%, rgba(0,0,0,0.45) 0%, transparent 60%)", pointerEvents: "none" }} />

        {/* Top-left: stage pill */}
        <div style={{ position: "absolute", top: 16, left: 16, display: "flex", alignItems: "center", gap: 6 }}>
          {!isCompleted && block.stage && (
            <span style={{
              fontSize: 10, fontWeight: 800, padding: "6px 11px", borderRadius: 99,
              background: theme.pillBg, color: theme.pillColor,
              backdropFilter: "blur(8px)",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
            }}>● {block.stage}</span>
          )}
          {isCompleted && (
            <span style={{
              fontSize: 10, fontWeight: 800, padding: "6px 11px", borderRadius: 99,
              background: theme.pillBg, color: theme.pillColor,
              letterSpacing: "0.5px", textTransform: "uppercase",
            }}>✓ Completed</span>
          )}
        </div>

        {/* Top-right: collaborator avatar stack */}
        {block.collaborators && block.collaborators.length > 0 && (
          <div style={{ position: "absolute", top: 16, right: 16, display: "flex" }}>
            {block.collaborators.slice(0, 3).map((c, i) => (
              <div key={i} style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "linear-gradient(135deg, " + c.color + ", " + c.color + "aa)",
                border: "2px solid rgba(255,255,255,0.9)",
                marginLeft: i > 0 ? -10 : 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 800, color: "#fff",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              }}>{c.initials}</div>
            ))}
          </div>
        )}

        {/* Center: title typography (the iconic moment) */}
        <div style={{
          position: "absolute", left: 0, right: 0, top: "50%",
          transform: "translateY(-50%)",
          textAlign: "center", padding: "0 24px",
          pointerEvents: "none",
        }}>
          <div style={{
            fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.7)",
            letterSpacing: "3px", textTransform: "uppercase",
            marginBottom: 8,
          }}>Session</div>
          <div style={{
            fontSize: 28, fontWeight: 900, color: "#fff",
            letterSpacing: "-0.8px", lineHeight: 1.1,
            textShadow: "0 2px 24px rgba(0,0,0,0.4)",
            display: "-webkit-box",
            WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}>{block.title}</div>
        </div>

        {/* Corner emboss initials (small, decorative) */}
        <div style={{
          position: "absolute", bottom: 16, right: 20,
          fontSize: 42, fontWeight: 900,
          color: "rgba(255,255,255,0.18)",
          letterSpacing: "-2px", lineHeight: 1,
          pointerEvents: "none",
        }}>{initial}</div>

        {/* Bottom-left: lightweight activity */}
        {block.lastActivity && !isCompleted && (
          <div style={{
            position: "absolute", bottom: 16, left: 16,
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 11, fontWeight: 600,
            color: "rgba(255,255,255,0.95)",
            background: "rgba(0,0,0,0.3)",
            padding: "5px 10px", borderRadius: 99,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", animation: "pulse-dot 2s ease-in-out infinite" }} />
            Active {block.lastActivity}
          </div>
        )}
      </div>

      {/* ── Meta strip ── */}
      <div style={{ padding: "16px 18px 18px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#fff", marginBottom: 4, letterSpacing: "-0.2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{block.title}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>
              {block.role}{block.with ? " · with " + block.with : ""}
            </div>
          </div>
          {block.status === "active" && onMarkComplete && (
            <button onClick={e => { e.stopPropagation(); onMarkComplete(); }} style={{
              fontSize: 11, fontWeight: 700, padding: "8px 14px", borderRadius: 99,
              background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)",
              color: T.green, cursor: "pointer", fontFamily: "inherit",
              flexShrink: 0,
            }}>Wrap</button>
          )}
          {block.status === "waiting" && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "6px 11px", borderRadius: 99,
              background: "rgba(245,158,11,0.15)", color: "#f59e0b",
              flexShrink: 0,
            }}>Waiting</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MY PROFILE — simple read-only view
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function MyProfile({ user, projects, onLogout, onPhotoChange, onTracksChange }) {
  const initials = (user.name || "U").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const photo = user.photo;
  const [linkInput, setLinkInput] = useState("");
  const [linkError, setLinkError] = useState("");

  // Compute live stats from the user's completed Blocks
  const allProjects = projects || [];
  const completedBlocks = allProjects.filter(p => p.status === "completed");
  const ratedBlocks = completedBlocks.filter(p => p.rating && typeof p.rating.stars === "number");
  const collabCount = completedBlocks.length;
  const avgScore = ratedBlocks.length === 0
    ? 0
    : ratedBlocks.reduce((sum, p) => sum + p.rating.stars, 0) / ratedBlocks.length;

  const tracks = user.tracks || [];

  function handleAddLink() {
    setLinkError("");
    const url = linkInput.trim();
    if (!url) return;
    if (!url.match(/^https?:\/\/.+/)) {
      setLinkError("Paste a full URL starting with http:// or https://");
      return;
    }
    const platform = detectPlatform(url);
    const musicPlatforms = ["SoundCloud", "Spotify", "YouTube", "Bandcamp", "Apple Music", "Audiomack"];
    if (!musicPlatforms.includes(platform.name)) {
      setLinkError("Use a SoundCloud, Spotify, YouTube, Bandcamp, Apple Music, or Audiomack link");
      return;
    }
    if (tracks.length >= 3) return;
    const updated = tracks.concat([{
      name: platform.name + " track",
      url,
      platform: platform.name,
      color: platform.color,
    }]);
    onTracksChange(updated);
    setLinkInput("");
  }

  function handleRemoveTrack(idx) {
    onTracksChange(tracks.filter((_, i) => i !== idx));
  }

  function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => onPhotoChange(ev.target.result);
    reader.readAsDataURL(file);
  }

  return (
    <div style={{ height: "100%", overflowY: "auto", background: T.bg }}>

      {/* ── MAGAZINE COVER HERO ── */}
      <div style={{ position: "relative", padding: "12px 12px 0" }}>
        <div style={{
          position: "relative",
          width: "100%",
          aspectRatio: "1 / 1",
          borderRadius: 24,
          overflow: "hidden",
          background: photo ? "#000" : "linear-gradient(135deg, #7c3aed 0%, #4a7fff 100%)",
        }}>
          {/* Photo or initials */}
          {photo ? (
            <img src={photo} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 140, fontWeight: 900, color: "rgba(255,255,255,0.95)", letterSpacing: "-4px", textShadow: "0 8px 32px rgba(0,0,0,0.25)" }}>{initials}</div>
          )}

          {/* Bottom gradient overlay */}
          <div style={{
            position: "absolute", left: 0, right: 0, bottom: 0,
            height: "55%",
            background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.85) 100%)",
            pointerEvents: "none",
          }} />

          {/* Top-left: You badge */}
          <div style={{ position: "absolute", top: 14, left: 14 }}>
            <span style={{
              fontSize: 10, fontWeight: 800, padding: "5px 10px", borderRadius: 99,
              background: "linear-gradient(135deg,#4a7fff,#9b5cf6)", color: "#fff",
              letterSpacing: "0.5px", textTransform: "uppercase",
            }}>✨ You</span>
          </div>

          {/* Name + role + action row (overlay bottom) */}
          <div style={{
            position: "absolute", left: 0, right: 0, bottom: 0,
            padding: "20px 22px 22px",
            display: "flex", alignItems: "flex-end", gap: 12,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: "#fff", letterSpacing: "-0.8px", lineHeight: 1.05, marginBottom: 4, textShadow: "0 2px 12px rgba(0,0,0,0.4)" }}>{user.name || "Your Name"}</div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", fontWeight: 500, marginBottom: 12, textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
                {(user.roles && user.roles[0]) || "Creative"}{user.roles && user.roles.length > 1 ? " · " + user.roles[1] : ""}
              </div>

              {/* Action icons */}
              <div style={{ display: "flex", gap: 8 }}>
                <label style={{
                  width: 38, height: 38, borderRadius: "50%",
                  background: "rgba(0,0,0,0.5)",
                  border: "1px solid rgba(255,255,255,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                }} title="Change photo">
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleUpload} />
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="13" r="4" stroke="#fff" strokeWidth="2"/>
                  </svg>
                </label>
                <button onClick={onLogout} style={{
                  width: 38, height: 38, borderRadius: "50%",
                  background: "rgba(0,0,0,0.5)",
                  border: "1px solid rgba(255,255,255,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", padding: 0, fontFamily: "inherit",
                }} title="Log out">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "24px 20px 0" }}>
        {/* Location */}
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
          <span>📍</span> {user.city || "—"}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 24 }}>
          {(user.roles || []).map(r => (
            <span key={r} style={{ padding: "5px 12px", borderRadius: 99, fontSize: 11, color: T.blue, background: "rgba(74,127,255,0.15)", border: "1px solid rgba(74,127,255,0.3)", fontWeight: 600 }}>{r}</span>
          ))}
        </div>

        {/* Rating */}
        <RatingDisplay score={avgScore} collabs={collabCount} size="lg" />

        {/* Demos */}
        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.55)", letterSpacing: "0.8px", marginBottom: 10 }}>YOUR DEMOS</div>

        {tracks.map((t, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "rgba(74,127,255,0.08)", border: "1px solid rgba(74,127,255,0.2)", borderRadius: 12, marginBottom: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: t.color || "linear-gradient(135deg,#4a7fff,#9b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: "#fff", fontWeight: 600 }}>{t.platform || "Track"}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.url}</div>
            </div>
            <button onClick={() => handleRemoveTrack(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", fontSize: 18, lineHeight: 1, padding: "0 4px" }}>×</button>
          </div>
        ))}

        {tracks.length < 3 && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={linkInput}
                onChange={e => { setLinkInput(e.target.value); setLinkError(""); }}
                onKeyDown={e => e.key === "Enter" && handleAddLink()}
                placeholder="Paste SoundCloud, Spotify, YouTube..."
                style={{
                  flex: 1, padding: "12px 14px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid " + (linkError ? "rgba(239,68,68,0.5)" : T.border),
                  borderRadius: 12, color: "#fff", fontSize: 13, outline: "none",
                  fontFamily: "inherit", boxSizing: "border-box",
                }}
              />
              <button onClick={handleAddLink} style={{
                padding: "12px 18px", borderRadius: 12,
                background: linkInput.trim() ? "linear-gradient(135deg,#4a7fff,#9b5cf6)" : "rgba(255,255,255,0.06)",
                border: "none", color: "#fff", fontSize: 13, fontWeight: 700,
                cursor: linkInput.trim() ? "pointer" : "default", fontFamily: "inherit",
                opacity: linkInput.trim() ? 1 : 0.5,
              }}>Add</button>
            </div>
            {linkError && (
              <div style={{ fontSize: 11, color: T.red, marginTop: 6 }}>{linkError}</div>
            )}
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 6 }}>
              {3 - tracks.length} slot{3 - tracks.length !== 1 ? "s" : ""} left
            </div>
          </div>
        )}

        <div style={{ height: 32 }} />
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// APP ROOT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function App() {
  const [screen, setScreen] = useState("splash");
  const [tab, setTab] = useState("market");

  const [user, setUser] = useState({ name: "", email: "", roles: [], city: "", tracks: [], photo: null });
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [showInvite, setShowInvite] = useState(false);
  const [showSuccess, setShowSuccess] = useState(null);
  const [viewingBlockIdx, setViewingBlockIdx] = useState(null);
  const [splitBlockIdx, setSplitBlockIdx] = useState(null);
  const [splitMode, setSplitMode] = useState("markdone"); // "markdone" | "edit"
  const [ratingBlockIdx, setRatingBlockIdx] = useState(null);
  const [pendingSplits, setPendingSplits] = useState(null);
  const [addingToBlockIdx, setAddingToBlockIdx] = useState(null);
  const [createBlockOpen, setCreateBlockOpen] = useState(false);

  // Seed one active block so testers can try the rating flow immediately
  const [projects, setProjects] = useState([
    { title: "Demo Track", role: "Producer", deadline: "March 28, 2026", owner: "me", status: "active", with: "Clint Spark", stage: "Recording", lastActivity: "2h ago", collaborators: [{ initials: "CS", color: "#7c3aed", name: "Clint Spark", role: "Producer" }] },
  ]);
  // Seed one demo invite so testers see the accept/decline flow on first open
  const [invites, setInvites] = useState([
    { from: "Clint Spark", fromInitials: "CS", fromColor: "#7c3aed", title: "Late Night Sessions", role: "Vocalist", deadline: "March 22, 2026" },
  ]);

  // Tap a block card → open detail
  function handleViewBlock(idx) {
    setViewingBlockIdx(idx);
  }

  // Mark Done from card OR from detail
  function handleMarkComplete(idx) {
    setViewingBlockIdx(null);
    setSplitMode("markdone");
    setSplitBlockIdx(idx);
  }

  // Edit Splits from detail (no rate flow)
  function handleEditSplit() {
    setSplitMode("edit");
    setSplitBlockIdx(viewingBlockIdx);
    setViewingBlockIdx(null);
  }

  function handleSplitConfirmed(splits) {
    const idx = splitBlockIdx;
    if (splitMode === "edit") {
      // Standalone save: just persist splits and return to detail view
      setProjects(prev => prev.map((p, i) => i === idx ? Object.assign({}, p, { splits }) : p));
      setSplitBlockIdx(null);
      setViewingBlockIdx(idx);
    } else {
      // Mark-done flow: save splits, then open Rate sheet
      setPendingSplits(splits);
      setSplitBlockIdx(null);
      setRatingBlockIdx(idx);
    }
  }

  function handleSplitCancel() {
    const wasEdit = splitMode === "edit";
    const idx = splitBlockIdx;
    setSplitBlockIdx(null);
    if (wasEdit) {
      // Return to detail view
      setViewingBlockIdx(idx);
    }
  }

  function handleSubmitRating({ stars, note }) {
    setProjects(prev => prev.map((p, i) => i === ratingBlockIdx ? Object.assign({}, p, { status: "completed", rating: { stars, note }, splits: pendingSplits }) : p));
    setRatingBlockIdx(null);
    setPendingSplits(null);
  }

  function handleSkipRating() {
    setProjects(prev => prev.map((p, i) => i === ratingBlockIdx ? Object.assign({}, p, { status: "completed", splits: pendingSplits }) : p));
    setRatingBlockIdx(null);
    setPendingSplits(null);
  }

  // Add Collaborator flow (from Block Detail)
  function handleOpenAddCollaborator() {
    setAddingToBlockIdx(viewingBlockIdx);
    setViewingBlockIdx(null);
  }

  // Create Block flow
  function handleOpenCreateBlock() {
    setCreateBlockOpen(true);
  }

  function handleCreateBlock(data) {
    const isListing = data.type === "listing";
    const newBlock = isListing ? {
      type: "listing",
      title: data.title,
      description: data.description,
      listingType: data.listingType,
      includes: data.includes,
      price: data.price,
      owner: "me",
      status: "listed",
      lastActivity: "just now",
      messages: [],
    } : {
      type: "session",
      title: data.title,
      description: data.description,
      role: data.role,
      stage: data.stage,
      deadline: data.deadline,
      owner: "me",
      status: "active",
      with: "",
      lastActivity: "just now",
      collaborators: [],
      messages: [],
    };
    setProjects(prev => {
      const next = prev.concat([newBlock]);
      const idx = next.length - 1;
      setTimeout(() => {
        if (!isListing && data.addCollaborators) {
          setAddingToBlockIdx(idx);
        } else {
          setViewingBlockIdx(idx);
        }
      }, 0);
      return next;
    });
    setCreateBlockOpen(false);
  }

  function handleSendMessage(message) {
    const idx = viewingBlockIdx;
    if (idx === null) return;
    setProjects(prev => prev.map((p, i) => {
      if (i !== idx) return p;
      const msgs = p.messages || [];
      return Object.assign({}, p, {
        messages: msgs.concat([message]),
        lastActivity: "just now",
      });
    }));
  }

  function handleAddCollaborator(artist) {
    const idx = addingToBlockIdx;
    setProjects(prev => prev.map((p, i) => {
      if (i !== idx) return p;
      const existing = p.collaborators || [];
      const already = existing.some(c => c.initials === artist.initials);
      if (already) return p;
      return Object.assign({}, p, {
        collaborators: existing.concat([{ initials: artist.initials, color: artist.color, name: artist.name, role: (artist.roles && artist.roles[0]) || "Collaborator" }]),
        lastActivity: "just now",
        splits: null, // splits invalidate when crew changes
      });
    }));
    setAddingToBlockIdx(null);
    setViewingBlockIdx(idx); // return to detail view
  }

  function handleCancelAddCollaborator() {
    const idx = addingToBlockIdx;
    setAddingToBlockIdx(null);
    setViewingBlockIdx(idx); // return to detail view
  }

  function handleSendInvite(data) {
    if (data.newBlock) {
      setProjects(prev => prev.concat([{
        title: data.newBlock.title,
        role: data.newBlock.role,
        deadline: data.newBlock.deadline,
        owner: "me",
        status: "waiting",
        with: selectedArtist.name,
        stage: "Writing",
        lastActivity: "just now",
        collaborators: [{ initials: selectedArtist.initials, color: selectedArtist.color, name: selectedArtist.name, role: data.newBlock.role }],
      }]));
    } else if (data.existing) {
      // Add the artist as a new collaborator to the existing block
      const targetTitle = data.existing.title;
      setProjects(prev => prev.map(p => {
        if (p.title !== targetTitle) return p;
        const existingCollabs = p.collaborators || [];
        // Don't duplicate if already on the block
        const already = existingCollabs.some(c => c.initials === selectedArtist.initials);
        if (already) return p;
        return Object.assign({}, p, {
          collaborators: existingCollabs.concat([{ initials: selectedArtist.initials, color: selectedArtist.color, name: selectedArtist.name, role: (selectedArtist.roles && selectedArtist.roles[0]) || "Collaborator" }]),
          lastActivity: "just now",
          // Splits become stale if more people join — clear them
          splits: null,
        });
      }));
    }
    setShowInvite(false);
    setShowSuccess(selectedArtist.name);
  }

  function handleSuccessDone() {
    setShowSuccess(null);
    setSelectedArtist(null);
    setTab("blocks");
  }

  function handleAcceptInvite(idx) {
    const inv = invites[idx];
    setProjects(prev => prev.concat([{
      title: inv.title,
      role: inv.role,
      deadline: inv.deadline,
      owner: inv.from,
      status: "active",
      stage: "Writing",
      lastActivity: "just now",
      collaborators: [{ initials: inv.fromInitials, color: inv.fromColor, name: inv.from, role: inv.role }],
    }]));
    setInvites(prev => prev.filter((_, i) => i !== idx));
  }

  function handleDeclineInvite(idx) {
    setInvites(prev => prev.filter((_, i) => i !== idx));
  }

  return (
    <div style={{
      width: "100%", height: "100vh", maxWidth: 430, margin: "0 auto",
      position: "relative", overflow: "hidden",
      background: "radial-gradient(ellipse at 50% 0%, #1a1a2e 0%, #0d0d1a 60%, #050510 100%)",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      <style>{globalStyles}</style>

      {screen === "splash" && (
        <SplashScreen
          onSignUp={() => setScreen("signup")}
          onLogin={() => setScreen("login")}
        />
      )}

      {screen === "signup" && (
        <SignUpScreen
          onBack={() => setScreen("splash")}
          onNext={({ name, email }) => { setUser(u => Object.assign({}, u, { name, email })); setScreen("role"); }}
        />
      )}

      {screen === "role" && (
        <RoleScreen
          onBack={() => setScreen("signup")}
          onNext={roles => { setUser(u => Object.assign({}, u, { roles })); setScreen("photo"); }}
        />
      )}

      {screen === "photo" && (
        <PhotoScreen
          onBack={() => setScreen("role")}
          onNext={photo => { setUser(u => Object.assign({}, u, { photo })); setScreen("setup"); }}
        />
      )}

      {screen === "setup" && (
        <ProfileSetupScreen
          onBack={() => setScreen("photo")}
          onFinish={({ city, tracks }) => { setUser(u => Object.assign({}, u, { city, tracks })); setScreen("app"); }}
        />
      )}

      {screen === "login" && (
        <LoginScreen
          onBack={() => setScreen("splash")}
          onLogin={() => {
            // demo login fills basic info so the profile tab isn't empty
            setUser({ name: "Demo User", email: "demo@wrytrs.com", roles: ["Producer"], city: "Toronto, ON", tracks: [], photo: null });
            setScreen("app");
          }}
        />
      )}

      {screen === "app" && (
        <>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 72, overflow: "hidden" }}>
            {tab === "market" && (
              <BlockMarket onSelectArtist={setSelectedArtist} currentUser={user} projects={projects} />
            )}
            {tab === "blocks" && (
              <MyBlocks
                projects={projects}
                invites={invites}
                onAcceptInvite={handleAcceptInvite}
                onDeclineInvite={handleDeclineInvite}
                onMarkComplete={handleMarkComplete}
                onViewBlock={handleViewBlock}
                onCreateBlock={handleOpenCreateBlock}
              />
            )}
            {tab === "profile" && (
              <MyProfile
                user={user}
                projects={projects}
                onLogout={() => setScreen("splash")}
                onPhotoChange={photo => setUser(u => Object.assign({}, u, { photo }))}
                onTracksChange={tracks => setUser(u => Object.assign({}, u, { tracks }))}
              />
            )}
          </div>
          <BottomNav active={tab} setTab={setTab} pendingInvites={invites.length} />

          {selectedArtist && !showInvite && !showSuccess && (
            <ArtistProfileView
              artist={selectedArtist}
              onClose={() => setSelectedArtist(null)}
              onInvite={() => setShowInvite(true)}
            />
          )}

          {showInvite && selectedArtist && (
            <InviteSheet
              artist={selectedArtist}
              projects={projects}
              onClose={() => setShowInvite(false)}
              onSendInvite={handleSendInvite}
            />
          )}

          {showSuccess && (
            <InviteSuccess artistName={showSuccess} onDone={handleSuccessDone} />
          )}

          {viewingBlockIdx !== null && projects[viewingBlockIdx] && (
            <BlockDetailSheet
              block={projects[viewingBlockIdx]}
              currentUser={user}
              onClose={() => setViewingBlockIdx(null)}
              onMarkComplete={() => handleMarkComplete(viewingBlockIdx)}
              onEditSplit={handleEditSplit}
              onAddCollaborator={handleOpenAddCollaborator}
              onSendMessage={handleSendMessage}
            />
          )}

          {createBlockOpen && (
            <CreateBlockSheet
              onClose={() => setCreateBlockOpen(false)}
              onCreate={handleCreateBlock}
            />
          )}

          {addingToBlockIdx !== null && projects[addingToBlockIdx] && (
            <AddCollaboratorSheet
              block={projects[addingToBlockIdx]}
              onClose={handleCancelAddCollaborator}
              onAdd={handleAddCollaborator}
            />
          )}

          {splitBlockIdx !== null && projects[splitBlockIdx] && (
            <SplitSheet
              block={projects[splitBlockIdx]}
              currentUser={user}
              onClose={handleSplitCancel}
              onConfirm={handleSplitConfirmed}
            />
          )}

          {ratingBlockIdx !== null && projects[ratingBlockIdx] && (
            <RateBlockSheet
              block={projects[ratingBlockIdx]}
              onClose={handleSkipRating}
              onSubmit={handleSubmitRating}
            />
          )}
        </>
      )}
    </div>
  );
}
