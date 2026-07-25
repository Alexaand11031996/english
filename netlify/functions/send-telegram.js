const { getStore } = require("@netlify/blobs");

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

function json(statusCode, body) {
  return {
    statusCode: statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  };
}

async function verifyTurnstile(token, remoteIp) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return false;
  if (!token) return false;

  const params = new URLSearchParams();
  params.append("secret", secret);
  params.append("response", token);
  if (remoteIp) params.append("remoteip", remoteIp);

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: params
  });
  const data = await res.json();
  return !!data.success;
}

async function checkRateLimit(ip) {
  try {
    const store = getStore("rate-limits");
    const key = "send-telegram:" + ip;
    const now = Date.now();
    const raw = await store.get(key, { type: "json" });
    const timestamps = Array.isArray(raw) ? raw.filter(function (ts) { return now - ts < RATE_LIMIT_WINDOW_MS; }) : [];

    if (timestamps.length >= RATE_LIMIT_MAX) return false;

    timestamps.push(now);
    await store.setJSON(key, timestamps);
    return true;
  } catch (e) {
    return true;
  }
}

function escapeMd(str) {
  return String(str || "").replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, "\\$&");
}

const LABELS = {
  ua: { name: "Ім'я", contact: "Контакт", level: "Рівень", goal: "Мета", time: "Зручний час", message: "Коментар", title: "Нова заявка на урок" },
  en: { name: "Name", contact: "Contact", level: "Level", goal: "Goal", time: "Convenient time", message: "Comment", title: "New lesson request" }
};

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return json(405, { ok: false, error: "method_not_allowed" });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (e) {
    return json(400, { ok: false, error: "invalid_json" });
  }

  const name = String(payload.name || "").slice(0, 200);
  const contact = String(payload.contact || "").slice(0, 200);
  const level = String(payload.level || "").slice(0, 200);
  const goal = String(payload.goal || "").slice(0, 200);
  const time = String(payload.time || "").slice(0, 200);
  const message = String(payload.message || "").slice(0, 2000);
  const lang = payload.lang === "en" ? "en" : "ua";
  const turnstileToken = String(payload.turnstileToken || "");

  if (!name || !contact) {
    return json(400, { ok: false, error: "missing_fields" });
  }

  const ip = event.headers["x-nf-client-connection-ip"] || event.headers["client-ip"] || "unknown";

  const allowed = await checkRateLimit(ip);
  if (!allowed) {
    return json(429, { ok: false, error: "rate_limited" });
  }

  const turnstileOk = await verifyTurnstile(turnstileToken, ip);
  if (!turnstileOk) {
    return json(400, { ok: false, error: "turnstile_failed" });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) {
    return json(500, { ok: false, error: "not_configured" });
  }

  const l = LABELS[lang];
  const text =
    "*" + escapeMd(l.title) + "*\n" +
    escapeMd(l.name) + ": " + escapeMd(name) + "\n" +
    escapeMd(l.contact) + ": " + escapeMd(contact) + "\n" +
    escapeMd(l.level) + ": " + escapeMd(level) + "\n" +
    escapeMd(l.goal) + ": " + escapeMd(goal) + "\n" +
    escapeMd(l.time) + ": " + escapeMd(time || "-") + "\n" +
    escapeMd(l.message) + ": " + escapeMd(message || "-");

  try {
    const res = await fetch("https://api.telegram.org/bot" + botToken + "/sendMessage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: text, parse_mode: "MarkdownV2" })
    });
    const data = await res.json();
    if (!data.ok) {
      return json(502, { ok: false, error: "telegram_error" });
    }
    return json(200, { ok: true });
  } catch (e) {
    return json(502, { ok: false, error: "telegram_unreachable" });
  }
};
