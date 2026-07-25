const fs = require("fs");
const path = require("path");

const { DEFAULT_CONTENT, deepMerge } = require("./content.default.js");
const {
  escapeHtml,
  t,
  renderAccentHtml,
  renderTeachCard,
  renderPriceCard,
  renderProcessStep,
  renderTestimonialsTrack,
  renderFaqItem,
  renderTrustItem,
  renderChecklistItem,
  renderHeroStat,
  renderSelectOptions
} = require("./templates.js");

const ROOT = __dirname;
const DIST = path.join(ROOT, "dist");
const LANG = "ua";

const assetsToCopy = [
  "templates.js",
  "content.default.js",
  "main.js",
  "content",
  "admin",
  "privacy.html",
  "favicon.ico",
  "favicon.svg",
  "favicon-16x16.png",
  "favicon-32x32.png",
  "apple-touch-icon.png",
  "android-chrome-192x192.png",
  "android-chrome-512x512.png",
  "site.webmanifest"
];

function readJsonSafe(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    return fallback;
  }
}

async function processImage(sharp, heicConvert, srcRelPath) {
  if (!srcRelPath) return "";
  if (/^https?:\/\//i.test(srcRelPath)) return srcRelPath;

  const srcPath = path.join(ROOT, srcRelPath.replace(/^\/+/, ""));
  if (!fs.existsSync(srcPath)) {
    console.warn("[build.js] warning: image not found, skipping: " + srcRelPath);
    return "";
  }

  const baseName = path.basename(srcPath, path.extname(srcPath));
  const outDir = path.join(DIST, "images");
  fs.mkdirSync(outDir, { recursive: true });
  const outRelPath = "images/" + baseName + ".jpg";
  const outPath = path.join(DIST, outRelPath);

  try {
    const ext = path.extname(srcPath).toLowerCase();
    let inputBuffer = fs.readFileSync(srcPath);

    if (ext === ".heic" || ext === ".heif") {
      inputBuffer = await heicConvert({ buffer: inputBuffer, format: "JPEG", quality: 0.9 });
    }

    await sharp(inputBuffer)
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 82 })
      .toFile(outPath);

    return outRelPath;
  } catch (e) {
    console.warn("[build.js] warning: failed to process image " + srcRelPath + " (" + e.message + "), falling back to the original file");
    try {
      const fallbackRelPath = "images/" + baseName + path.extname(srcPath);
      fs.copyFileSync(srcPath, path.join(DIST, fallbackRelPath));
      return fallbackRelPath;
    } catch (copyErr) {
      console.warn("[build.js] warning: fallback copy also failed for " + srcRelPath + ", omitting the image");
      return "";
    }
  }
}

function replaceOnce(html, oldStr, newStr) {
  const idx = html.indexOf(oldStr);
  if (idx === -1) {
    console.warn("[build.js] warning: replacement target not found: " + oldStr.slice(0, 80));
    return html;
  }
  return html.slice(0, idx) + newStr + html.slice(idx + oldStr.length);
}

function bakeI18nAttrs(html, content, lang) {
  html = html.replace(/data-i18n="([a-zA-Z0-9_.]+)">([^<]*)</g, function (match, key, oldText) {
    const val = getPath(content, key);
    if (val === undefined) return match;
    return 'data-i18n="' + key + '">' + escapeHtml(t(val, lang)) + "<";
  });

  html = html.replace(/data-i18n-placeholder="([a-zA-Z0-9_.]+)" placeholder="([^"]*)"/g, function (match, key) {
    const val = getPath(content, key);
    if (val === undefined) return match;
    return 'data-i18n-placeholder="' + key + '" placeholder="' + escapeHtml(t(val, lang)) + '"';
  });

  html = html.replace(/data-i18n-aria="([a-zA-Z0-9_.]+)" aria-label="([^"]*)"/g, function (match, key) {
    const val = getPath(content, key);
    if (val === undefined) return match;
    return 'data-i18n-aria="' + key + '" aria-label="' + escapeHtml(t(val, lang)) + '"';
  });

  return html;
}

function getPath(obj, keyPath) {
  return keyPath.split(".").reduce(function (o, k) {
    return o && o[k] !== undefined ? o[k] : undefined;
  }, obj);
}

function setInner(html, id, tag, value) {
  const re = new RegExp("(<" + tag + "[^>]*\\bid=\"" + id + "\"[^>]*>)([\\s\\S]*?)(</" + tag + ">)");
  return html.replace(re, function (match, open, _old, close) {
    return open + value + close;
  });
}

function setAttr(html, id, attr, value) {
  const re = new RegExp("(<[^>]*\\bid=\"" + id + "\"[^>]*\\b" + attr + "=\")([^\"]*)(\")");
  return html.replace(re, function (match, open, _old, close) {
    return open + value + close;
  });
}

const THEME_VARS = {
  bgDark: "--bg-dark",
  bgDark2: "--bg-dark-2",
  bgDark3: "--bg-dark-3",
  orange: "--orange",
  orangeHover: "--orange-hover",
  mint: "--mint",
  mintSoft: "--mint-soft",
  cream: "--cream",
  cream2: "--cream-2",
  textDark: "--text-dark",
  textMutedDark: "--text-muted-dark",
  textLight: "--text-light",
  textMutedLight: "--text-muted-light",
  borderSoft: "--border-soft"
};

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

function bakeTheme(html, theme, defaultTheme) {
  Object.keys(THEME_VARS).forEach(function (key) {
    const cssVar = THEME_VARS[key];
    let value = theme[key];
    if (!HEX_COLOR_RE.test(value)) {
      console.warn("[build.js] warning: theme." + key + ' ("' + value + '") is not a valid 6-digit hex color, falling back to default');
      value = defaultTheme[key];
    }
    const re = new RegExp("(" + cssVar + ":)[^;]+(;)");
    html = html.replace(re, "$1" + value + "$2");
  });
  return html;
}

async function build() {
  const siteJsonPath = path.join(ROOT, "content", "site.json");
  const siteJson = readJsonSafe(siteJsonPath, {});
  const content = deepMerge(DEFAULT_CONTENT, siteJson);

  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  let sharp, heicConvert;
  try {
    sharp = require("sharp");
    heicConvert = require("heic-convert");
  } catch (e) {
    console.warn("[build.js] sharp/heic-convert not installed, skipping image processing");
  }

  if (sharp && heicConvert) {
    if (content.hero.photo) {
      try {
        content.hero.photo = await processImage(sharp, heicConvert, content.hero.photo);
      } catch (e) {
        console.warn("[build.js] warning: unexpected error processing hero.photo (" + e.message + "), omitting the image");
        content.hero.photo = "";
      }
    }
    if (content.about.photo) {
      try {
        content.about.photo = await processImage(sharp, heicConvert, content.about.photo);
      } catch (e) {
        console.warn("[build.js] warning: unexpected error processing about.photo (" + e.message + "), omitting the image");
        content.about.photo = "";
      }
    }
  }

  let html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");

  html = bakeI18nAttrs(html, content, LANG);
  html = bakeTheme(html, content.theme, DEFAULT_CONTENT.theme);

  html = setInner(html, "pageTitle", "title", escapeHtml(t(content.seo.title, LANG)));
  html = setAttr(html, "pageDesc", "content", escapeHtml(t(content.seo.description, LANG)));
  html = setAttr(html, "ogTitle", "content", escapeHtml(t(content.seo.title, LANG)));
  html = setAttr(html, "ogDesc", "content", escapeHtml(t(content.seo.description, LANG)));
  const ogImage = content.seo.ogImage || content.hero.photo || "";
  html = setAttr(html, "ogImage", "content", escapeHtml(ogImage));
  const twitterImage = content.seo.twitterImage || ogImage;
  html = setAttr(html, "twitterImage", "content", escapeHtml(twitterImage));

  html = setInner(html, "heroH1", "h1", renderAccentHtml(t(content.hero.h1, LANG)));

  if (content.hero.photo) {
    html = setInner(html, "heroPhoto", "div", '<img src="' + escapeHtml(content.hero.photo) + '" alt="">');
  }
  if (content.about.photo) {
    html = setInner(html, "aboutPhoto", "div", '<img src="' + escapeHtml(content.about.photo) + '" alt="">');
  }

  html = setInner(html, "heroBadge1Num", "div", escapeHtml(content.hero.badges[0].num));
  html = setInner(html, "heroBadge1Lbl", "div", escapeHtml(t(content.hero.badges[0].label, LANG)));
  html = setInner(html, "heroBadge2Num", "div", escapeHtml(content.hero.badges[1].num));
  html = setInner(html, "heroBadge2Lbl", "div", escapeHtml(t(content.hero.badges[1].label, LANG)));

  html = setInner(html, "heroStats", "div", content.hero.stats.map(function (s) { return renderHeroStat(s, LANG); }).join(""));
  html = setInner(html, "teachGrid", "div", content.teach.cards.map(function (c) { return renderTeachCard(c, LANG); }).join(""));
  html = setInner(html, "trustItems", "div", content.trust.items.map(function (i) { return renderTrustItem(i, LANG); }).join(""));
  html = setInner(html, "aboutChecklist", "ul", content.about.checklist.map(function (i) { return renderChecklistItem(i, LANG); }).join(""));
  const priceBtnLabel = t(content.pricing.btnLabel, LANG);
  html = setInner(html, "priceGrid", "div", content.pricing.cards.map(function (c) { return renderPriceCard(c, LANG, priceBtnLabel); }).join(""));
  html = setInner(html, "processGrid", "div", content.process.steps.map(function (s, i) { return renderProcessStep(s, i, LANG); }).join(""));
  html = setInner(html, "testTrack", "div", renderTestimonialsTrack(content.testimonials.items, LANG));
  html = setInner(html, "faqList", "div", content.faq.items.map(function (i) { return renderFaqItem(i, LANG); }).join(""));
  html = setInner(html, "level", "select", renderSelectOptions(content.booking.form.levels, LANG));
  html = setInner(html, "goal", "select", renderSelectOptions(content.booking.form.goals, LANG));
  html = setInner(html, "consentLabel", "label", t(content.booking.form.consent, LANG));

  const c = content.contacts;
  const tgUrl = "https://t.me/" + c.telegramUsername;
  const igUrl = "https://instagram.com/" + c.instagramUsername;
  const telUrl = "tel:" + c.phone.replace(/[^+\d]/g, "");
  const mailUrl = "mailto:" + c.email;

  ["heroTelegramLink", "ctaTelegramLink", "stickyTelegramLink", "contactTelegram", "footerTelegram"].forEach(function (id) {
    html = setAttr(html, id, "href", escapeHtml(tgUrl));
  });
  html = setAttr(html, "contactInstagram", "href", escapeHtml(igUrl));
  html = setAttr(html, "contactPhone", "href", escapeHtml(telUrl));
  html = setAttr(html, "contactEmail", "href", escapeHtml(mailUrl));
  html = setAttr(html, "footerInstagram", "href", escapeHtml(igUrl));
  html = setAttr(html, "footerPhone", "href", escapeHtml(telUrl));
  html = setAttr(html, "footerEmail", "href", escapeHtml(mailUrl));

  html = setInner(html, "contactTelegramValue", "div", "@" + escapeHtml(c.telegramUsername));
  html = setInner(html, "contactInstagramValue", "div", "@" + escapeHtml(c.instagramUsername));
  html = setInner(html, "contactPhoneValue", "div", escapeHtml(c.phone));
  html = setInner(html, "contactEmailValue", "div", escapeHtml(c.email));
  html = setInner(html, "footerTelegram", "a", "@" + escapeHtml(c.telegramUsername));
  html = setInner(html, "footerInstagram", "a", "@" + escapeHtml(c.instagramUsername));
  html = setInner(html, "footerPhone", "a", escapeHtml(c.phone));
  html = setInner(html, "footerEmail", "a", escapeHtml(c.email));

  html = setInner(html, "siteName", "span", escapeHtml(content.site.name));
  html = setInner(html, "footerSiteName", "span", escapeHtml(content.site.name));

  const turnstileSiteKey = process.env.TURNSTILE_SITE_KEY || "";
  if (turnstileSiteKey) {
    html = setAttr(html, "turnstileWidget", "data-sitekey", escapeHtml(turnstileSiteKey));
    html = html.replace(/<!--TURNSTILE_SCRIPT_START-->|<!--TURNSTILE_SCRIPT_END-->|<!--TURNSTILE_WIDGET_START-->|<!--TURNSTILE_WIDGET_END-->/g, "");
  } else {
    html = html.replace(/<!--TURNSTILE_SCRIPT_START-->[\s\S]*?<!--TURNSTILE_SCRIPT_END-->/, "");
    html = html.replace(/<!--TURNSTILE_WIDGET_START-->[\s\S]*?<!--TURNSTILE_WIDGET_END-->/, "");
  }

  html = replaceOnce(html, "<!--SITE_CONTENT_DATA-->", JSON.stringify(content).replace(/</g, "\\u003c"));

  fs.writeFileSync(path.join(DIST, "index.html"), html);

  assetsToCopy.forEach(function (asset) {
    const src = path.join(ROOT, asset);
    if (!fs.existsSync(src)) return;
    const dest = path.join(DIST, asset);
    fs.cpSync(src, dest, { recursive: true });
  });

  console.log("[build.js] build complete -> " + DIST);
}

build().catch(function (err) {
  console.error(err);
  process.exit(1);
});
