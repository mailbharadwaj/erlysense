import React from "react";
import { motion, AnimatePresence, cubicBezier } from "framer-motion";
import { Sparkles } from "lucide-react";

/**
 * erlySense — Anticipated (no-scroll, full-viewport)
 * - Locks layout to 100dvh and hides overflow
 * - Footer is inside the viewport (absolute bottom)
 * - Interest form opens on demand (no height bumps)
 * - Accessible modals; reduced-motion support
 */

// ---- Debug helpers ----
const DEBUG = true;
function maskEmail(e: string) {
  if (!e || !e.includes("@")) return e;
  const [u, d] = e.split("@");
  const uu = u.length <= 2 ? u[0] + "*" : u[0] + "*".repeat(Math.max(1, u.length - 2)) + u[u.length - 1];
  return `${uu}@${d}`;
}
function dbg(...args: any[]) {
  if (DEBUG && typeof console !== "undefined") console.log("[erlySense]", ...args);
}

// ---- Brand palette (from logo) ----
const BRAND = {
  aqua: "#57C8C7",
  teal: "#2FB3C4",
  blue: "#0E5C8B",
  deep: "#073B5C",
  ink:  "#08141C",
};
dbg("Brand colors:", BRAND);

// ---- Animation presets ----
const floating = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.8, ease: cubicBezier(0.22, 1, 0.36, 1) } },
};
const stagger = { show: { transition: { staggerChildren: 0.08 } } };

// ---- Utilities ----
export function validateEmail(email: string): boolean {
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  dbg("validateEmail:", maskEmail(email), "→", ok);
  return ok;
}

const LOGO_CANDIDATES = [
  "/erlysense-logo.png",
  "/logo.png",
  "/assets/erlysense-logo.png",
];
dbg("Logo candidates:", LOGO_CANDIDATES);

const INTEREST_ENDPOINT =
  (typeof import.meta !== "undefined" &&
    (import.meta as any).env &&
    (import.meta as any).env.VITE_INTEREST_ENDPOINT) ||
  "/api/interest";
dbg("Interest endpoint in use:", INTEREST_ENDPOINT);

// Favicons with cache-busting
const VER = `v=${Date.now()}`;
const FAVICONS = [
  { rel: "icon", href: `/favicon.ico?${VER}`, type: "image/x-icon" },
  { rel: "icon", href: `/favicon-512.png?${VER}`, type: "image/png", sizes: "512x512" },
  { rel: "shortcut icon", href: `/favicon.ico?${VER}`, type: "image/x-icon" },
  { rel: "apple-touch-icon", href: `/favicon-512.png?${VER}`, sizes: "180x180" },
];

// Curiosity: rotating word next to Anticipated
const VOICES = ["sooner", "quietly", "privately", "softly", "steadily", "imminently"];

// Curiosity: rotating teaser pills
const PILL_SETS = [
  ["Private Beta", "Edge-first", "Privacy by design"],
  ["Founders only", "On-device AI", "Noise-resilient"],
  ["University-ready", "Low latency", "Launch-imminent"],
];

export default function App() {
  const [email, setEmail] = React.useState("");
  const [note, setNote] = React.useState("");
  const [trap, setTrap] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [status, setStatus] = React.useState<null | { ok: boolean; msg: string }>(null);
  const [logoBroken, setLogoBroken] = React.useState(false);
  const [logoIdx, setLogoIdx] = React.useState(0);
  const [interestOpen, setInterestOpen] = React.useState(false);
  const [showTerms, setShowTerms] = React.useState(false);
  const [showPrivacy, setShowPrivacy] = React.useState(false);
  const emailRef = React.useRef<HTMLInputElement | null>(null);

  // Rotate words in headline
  const [voiceIdx, setVoiceIdx] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setVoiceIdx(i => (i + 1) % VOICES.length), 3000);
    return () => clearInterval(id);
  }, []);

  // Rotate pill set
  const [pillSet, setPillSet] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setPillSet(p => (p + 1) % PILL_SETS.length), 5000);
    return () => clearInterval(id);
  }, []);

  // Favicon injection
  React.useEffect(() => {
    try {
      const removeNodes = document.querySelectorAll("link[rel='icon'], link[rel='shortcut icon'], link[rel='apple-touch-icon']");
      removeNodes.forEach((el) => el.parentElement?.removeChild(el));
      FAVICONS.forEach((f) => {
        const link = document.createElement("link");
        link.rel = (f as any).rel;
        if ((f as any).type) link.type = (f as any).type;
        if ((f as any).sizes) link.sizes = (f as any).sizes as any;
        link.href = (f as any).href;
        link.crossOrigin = "anonymous";
        document.head.appendChild(link);
      });
      const metaTheme = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
      if (!metaTheme) {
        const m = document.createElement("meta");
        m.name = "theme-color";
        m.content = BRAND.deep;
        document.head.appendChild(m);
      }
    } catch (err) {
      dbg("Favicon effect error:", err);
    }
  }, []);

  // Autofocus when interest opens
  React.useEffect(() => {
    if (interestOpen && emailRef.current) {
      requestAnimationFrame(() => emailRef.current && emailRef.current.focus());
    }
  }, [interestOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (trap) return;
    if (!validateEmail(email)) { setStatus({ ok: false, msg: "Please enter a valid email." }); return; }
    try {
      setIsLoading(true); setStatus(null);
      const payload = { email, note, source: "coming-soon" };
      const res = await fetch(INTEREST_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Network error");
      setStatus({ ok: true, msg: "Thanks! We'll be in touch soon." });
      setEmail(""); setNote("");
    } catch (err) {
      setStatus({ ok: false, msg: "Something went wrong. Please try again." });
    } finally { setIsLoading(false); }
  }

  return (
    /* Lock to full viewport, hide any accidental overflow */
    <div className="relative h-[100dvh] w-full overflow-hidden text-white selection:bg-white/10 selection:text-white">
      {/* Background layers (fixed to viewport, no scroll) */}
      <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${BRAND.ink} 0%, ${BRAND.deep} 100%)` }} />
      <div className="absolute inset-0" style={{ background: `radial-gradient(50% 35% at 50% 18%, ${hexWithAlpha(BRAND.teal, 0.22)} 0%, rgba(0,0,0,0) 100%)` }} />
      <div className="absolute -inset-32 opacity-35 [mask-image:radial-gradient(closest-side,black,transparent)]">
        <div className="animate-[spin_28s_linear_infinite] h-full w-full" style={{ background: `conic-gradient(from 120deg at 50% 50%, ${hexWithAlpha(BRAND.aqua,0.16)}, ${hexWithAlpha(BRAND.blue,0.16)}, ${hexWithAlpha(BRAND.teal,0.16)}, ${hexWithAlpha(BRAND.aqua,0.16)})` }} />
      </div>

      {/* MAIN: fills viewport height completely */}
      <main className="relative z-10 mx-auto flex h-full max-w-5xl flex-col items-center justify-center px-6 py-6">
        <motion.div variants={stagger} initial="hidden" animate="show" className="w-full">
          <motion.div variants={floating} className="mx-auto mb-4 flex items-center justify-center">
            {!logoBroken ? (
              <img
                src={LOGO_CANDIDATES[logoIdx]}
                alt="erlySense logo"
                className="h-16 w-auto drop-shadow-[0_2px_16px_rgba(0,0,0,0.35)]"
                loading="eager"
                decoding="async"
                onError={() => { if (logoIdx < LOGO_CANDIDATES.length - 1) setLogoIdx(i => i + 1); else setLogoBroken(true); }}
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10 backdrop-blur">
                <Sparkles className="h-7 w-7" />
              </div>
            )}
          </motion.div>

          {/* Headline: Anticipated + visible rotating word */}
          <motion.h1 variants={floating} className="mx-auto text-center font-semibold tracking-tight" style={{ fontSize: "clamp(1.9rem, 4vw, 3.6rem)" }}>
            <span className="mx-auto block">
              <span style={{ color: BRAND.aqua }}>erly</span>
              <span style={{ color: BRAND.blue }}>Sense</span>
            </span>
            <span className="relative inline-block">
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: `linear-gradient(90deg, ${BRAND.aqua}, ${BRAND.teal}, ${BRAND.blue})` }}
              >
                Anticipated
              </span>{" "}
              <span
                className="inline-block align-baseline"
                style={{
                  color: "#E6FAFF",
                  WebkitTextFillColor: "#E6FAFF",
                  textShadow: "0 1px 2px rgba(0,0,0,0.35)",
                }}
              >
                {VOICES[voiceIdx]}
              </span>
            </span>
          </motion.h1>

          <motion.p variants={floating} className="mx-auto mt-3 max-w-xl text-center leading-relaxed text-white/80" style={{ fontSize: "clamp(0.95rem, 1.2vw, 1.125rem)" }}>
            An innovative step toward proactive student well-being. For now, just a whisper.
          </motion.p>

          <motion.div variants={floating} className="mx-auto mt-5 flex items-center justify-center gap-3">
            <TeaserPill label="Private Beta" color={BRAND.teal} />
            <TeaserPill label="Edge-first" color={BRAND.aqua} />
            <TeaserPill label="Privacy by design" color={BRAND.blue} />
          </motion.div>

          <motion.div variants={floating} className="mx-auto mt-5 flex items-center justify-center">
            <span
              className="inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium"
              style={{
                border: `1px solid ${hexWithAlpha(BRAND.aqua, 0.35)}`,
                backgroundColor: hexWithAlpha(BRAND.aqua, 0.10),
                color: '#E6FAFF',
              }}
            >
              <span aria-hidden className="inline-block h-2 w-2 animate-pulse rounded-full" style={{ backgroundColor: BRAND.teal }} />
              <Sparkles className="h-4 w-4 opacity-80" />
              Stay curious — launch imminent
            </span>
          </motion.div>

          {/* Interested CTA (reveals the form in-place without changing page height) */}
          {!interestOpen && (
            <motion.div variants={floating} className="mx-auto mt-6 flex items-center justify-center">
              <button
                type="button"
                onClick={() => setInterestOpen(true)}
                aria-expanded={interestOpen}
                aria-controls="interest-form"
                className="rounded-xl px-5 py-3 text-sm font-medium"
                style={{
                  border: `1px solid ${hexWithAlpha(BRAND.teal,0.4)}`,
                  backgroundColor: hexWithAlpha(BRAND.teal,0.12),
                  color: '#e9fbff',
                }}
              >
                I’m interested
              </button>
            </motion.div>
          )}

          <AnimatePresence initial={false}>
            {interestOpen && (
              <motion.section
                key="interest-form"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.28, ease: cubicBezier(0.22, 1, 0.36, 1) }}
                id="interest-form"
                className="mx-auto mt-6 w-full max-w-md"
              >
                <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm backdrop-blur">
                  <label htmlFor="email" className="block text-sm text-white/80">Get notified at</label>
                  <div className="mt-2 flex gap-2">
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      ref={emailRef}
                      autoComplete="email"
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@school.edu"
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-white/40 outline-none focus:border-white/30"
                      aria-label="Email address"
                    />
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="shrink-0 rounded-xl px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
                      style={{
                        border: `1px solid ${hexWithAlpha(BRAND.teal,0.4)}`,
                        backgroundColor: hexWithAlpha(BRAND.teal,0.12),
                        color: `#e9fbff`,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = hexWithAlpha(BRAND.teal,0.16))}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = hexWithAlpha(BRAND.teal,0.12))}
                    >
                      {isLoading ? "Sending…" : "Notify me"}
                    </button>
                  </div>

                  <div className="mt-3">
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Optional: a line about your use case"
                      rows={2}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-white/40 outline-none focus:border-white/30"
                    />
                  </div>

                  {/* Honeypot input */}
                  <input type="text" value={trap} onChange={(e) => setTrap(e.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

                  {status && (
                    <div
                      role="status"
                      aria-live="polite"
                      className="mt-3 rounded-xl px-3 py-2 text-sm"
                      style={{
                        backgroundColor: status.ok ? hexWithAlpha("#10B981",0.12) : hexWithAlpha("#F43F5E",0.12),
                        color: status.ok ? "#d1fae5" : "#ffe1e7",
                        border: `1px solid ${status.ok ? hexWithAlpha("#10B981",0.3) : hexWithAlpha("#F43F5E",0.3)}`,
                      }}
                    >
                      {status.msg}
                    </div>
                  )}

                  <p className="mt-3 text-[11px] leading-snug text-white/50">
                    We’ll only email you about launch updates. By submitting, you agree to our privacy notice.
                  </p>
                </form>
              </motion.section>
            )}
          </AnimatePresence>
        </motion.div>
      </main>

      {/* fine grain noise (fixed overlay, doesn’t affect layout) */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.08] mix-blend-soft-light" aria-hidden>
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <filter id="n">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#n)" />
        </svg>
      </div>

      {/* FOOTER inside viewport, pinned to bottom */}
      <footer className="absolute bottom-3 left-0 right-0 z-10 mx-auto flex w-full max-w-5xl items-center justify-between px-6 text-xs text-white/70">
        <p>© {new Date().getFullYear()} erlySense</p>
        <nav className="flex items-center gap-3">
          <button onClick={() => setShowTerms(true)} className="rounded px-1.5 py-0.5 underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-white/20">Terms</button>
          <span className="opacity-40">·</span>
          <button onClick={() => setShowPrivacy(true)} className="rounded px-1.5 py-0.5 underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-white/20">Privacy</button>
        </nav>
      </footer>

      {/* Legal modals (fixed overlay; do not change page height) */}
      {showTerms && (
        <SimpleModal title="Early Access Terms" onClose={() => setShowTerms(false)}>
          <LegalBlock>
            <h3>Scope & Eligibility</h3>
            <p>These Early Access Terms govern your participation in our private beta and the use of any pre-release features of erlySense (the “Service”). Participation is by invitation only and may be suspended or ended at any time.</p>
            <h3>Confidentiality</h3>
            <p>You agree not to disclose non-public information about the Service, including performance, features, or feedback, except to your internal team with a need to know. You may not publish benchmarks without prior written consent.</p>
            <h3>Feedback License</h3>
            <p>If you choose to provide feedback, you grant us a worldwide, royalty-free license to use it to improve the Service.</p>
            <h3>Pre-Release Disclaimer</h3>
            <p>The Service is provided “as is” and may contain defects. To the fullest extent permitted by law, we disclaim all warranties and limit liability to direct damages capped at the fees you paid for the beta, if any.</p>
            <h3>Data & Security</h3>
            <p>We take appropriate technical and organizational measures to protect data. Do not input personal data of children under 13 or any sensitive categories without a written agreement with us.</p>
            <h3>Termination</h3>
            <p>Either party may terminate beta access at any time. Upon termination you’ll stop using the pre-release features and, where applicable, delete related materials.</p>
            <p className="text-[11px] text-white/50 mt-4">Note: This is a concise beta overview for launch-phase use. For a signed agreement, contact us.</p>
          </LegalBlock>
        </SimpleModal>
      )}

      {showPrivacy && (
        <SimpleModal title="Privacy Notice (Waitlist)" onClose={() => setShowPrivacy(false)}>
          <LegalBlock>
            <h3>What we collect</h3>
            <p>When you join the waitlist, we collect your email and any optional note you provide. We also store the date/time and approximate region derived from network information.</p>
            <h3>How we use it</h3>
            <p>We use your details to send launch updates and—if you opt in—beta invitations. We do not sell your personal data. You can opt out at any time via the unsubscribe link in our emails.</p>
            <h3>Legal basis</h3>
            <p>For users in the EU/UK, our processing is based on your consent for marketing updates. You may withdraw consent at any time.</p>
            <h3>Retention</h3>
            <p>We retain waitlist data until general availability or until you unsubscribe—whichever occurs first—unless a longer period is required by law.</p>
            <h3>Your rights</h3>
            <p>Where applicable, you may request access, correction, deletion, or objection to processing. Contact us using the details below.</p>
            <h3>Children</h3>
            <p>We do not knowingly collect personal information from children under 13. If you believe a child provided information, contact us and we will delete it.</p>
            <h3>Contact</h3>
            <p>Questions or requests: <a className="underline" href="mailto:privacy@erlysense.com">privacy@erlysense.com</a></p>
            <p className="text-[11px] text-white/50 mt-4">This notice is for the waitlist/coming-soon page only and will be replaced by a full policy at GA.</p>
          </LegalBlock>
        </SimpleModal>
      )}
    </div>
  );
}

// ——— UI primitives for legal modals ———
function SimpleModal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && containerRef.current) {
        const focusables = containerRef.current.querySelectorAll<HTMLElement>('a,button,textarea,input,select,[tabindex]:not([tabindex="-1"])');
        const arr = Array.from(focusables).filter(el => !el.hasAttribute('disabled'));
        if (arr.length === 0) return;
        const first = arr[0];
        const last = arr[arr.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (!active || !containerRef.current.contains(active)) { first.focus(); e.preventDefault(); return; }
        if (!e.shiftKey && active === last) { first.focus(); e.preventDefault(); }
        if (e.shiftKey && active === first) { last.focus(); e.preventDefault(); }
      }
    };
    document.addEventListener('keydown', onKey);
    requestAnimationFrame(() => {
      const target = containerRef.current?.querySelector<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      target?.focus();
    });
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div ref={containerRef} className="relative z-10 m-4 w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#0b1620]/95 p-0 shadow-xl backdrop-blur">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <h2 id="modal-title" className="text-sm font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded px-2 py-1 text-white/70 hover:text-white/90 focus:outline-none focus:ring-2 focus:ring-white/20">Close</button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-4 text-[13px] leading-relaxed text-white/90">
          {children}
        </div>
      </div>
    </div>
  );
}

function LegalBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="prose prose-invert prose-sm max-w-none">
      {children}
      <style>{`.prose h3{font-size:0.95rem;margin-top:1rem;margin-bottom:0.35rem}.prose p{margin:0.4rem 0}.prose a{color:#a6e8ff}`}</style>
    </div>
  );
}

function TeaserPill({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="select-none rounded-full px-3 py-1 text-xs backdrop-blur"
      style={{
        border: `1px solid ${hexWithAlpha(color, 0.35)}`,
        backgroundColor: hexWithAlpha(color, 0.12),
        color: `#E6FAFF`,
      }}
    >
      {label}
    </span>
  );
}

// Utility to add alpha to a hex color
function hexWithAlpha(hex: string, alpha: number) {
  const a = Math.max(0, Math.min(1, alpha));
  const h = hex.replace('#','');
  const bigint = parseInt(h.length === 3 ? h.split('').map(ch => ch + ch).join('') : h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

// ---- Tiny dev-only tests ----
if (typeof import.meta !== "undefined" && (import.meta as any).env && (import.meta as any).env.DEV) {
  console.assert(validateEmail("a@b.co") === true, "validateEmail: simple valid email failed");
  console.assert(validateEmail("user+tag@domain.edu") === true, "validateEmail: plus-tag valid email failed");
  console.assert(validateEmail("no-at") === false, "validateEmail: missing @ should be false");
  console.assert(validateEmail("bad@domain") === false, "validateEmail: missing TLD should be false");
  console.assert(hexWithAlpha("#000000", 1) === "rgba(0, 0, 0, 1)", "hexWithAlpha: black full alpha");
  console.assert(hexWithAlpha("#FFF", 0.5) === "rgba(255, 255, 255, 0.5)", "hexWithAlpha: 3-digit expansion");
  console.assert(hexWithAlpha("#123456", -1).endsWith(", 0)"), "hexWithAlpha: clamps low alpha to 0");
  console.assert(hexWithAlpha("#123456", 2).endsWith(", 1)"), "hexWithAlpha: clamps high alpha to 1");
}
