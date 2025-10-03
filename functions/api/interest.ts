export interface Env {
  // Bindings (configure in Cloudflare Pages → Settings → Functions → Environment Variables/Bindings)
  RESEND_API_KEY?: string;   // or SENDGRID_API_KEY if you prefer
  NOTIFY_TO?: string;        // e.g. "founders@erlysense.example"
  WAITLIST?: KVNamespace;    // KV namespace binding name: WAITLIST
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const data = await request.json().catch(() => ({}));
    const email = String(data?.email || "").trim();
    const note  = String(data?.note || "").trim();
    if (!EMAIL_RE.test(email)) {
      return new Response(JSON.stringify({ ok:false, error:"Invalid email" }), { status: 400 });
    }

    // Store in KV (optional but recommended)
    if (env.WAITLIST) {
      const key = `waitlist:${Date.now()}:${crypto.randomUUID()}`;
      await env.WAITLIST.put(key, JSON.stringify({
        email, note,
        ua: request.headers.get("user-agent"),
        ip: request.headers.get("cf-connecting-ip"),
        at: new Date().toISOString(),
      }));
    }

    // Notify via Resend (simple and reliable)
    if (env.RESEND_API_KEY && env.NOTIFY_TO) {
      const subject = `erlySense waitlist: ${email}`;
      const html = `
        <h2>New waitlist interest</h2>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Note:</strong> ${note ? note.replace(/</g,"&lt;") : "(none)"}</p>
        <p style="color:#888">Source: coming-soon @ ${new Date().toISOString()}</p>
      `;

      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "erlySense <noreply@mail.erlysense.example>",
          to: [env.NOTIFY_TO],
          subject,
          html,
        }),
      });

      if (!r.ok) {
        const text = await r.text();
        console.error("Resend failed:", r.status, text);
      }
    }

    return new Response(JSON.stringify({ ok:true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ ok:false, error:"Server error" }), { status: 500 });
  }
};
