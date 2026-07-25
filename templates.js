function escapeHtml(str) {
  return String(str == null ? "" : str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function t(field, lang) {
  if (field == null) return "";
  if (typeof field === "string") return field;
  return field[lang] != null ? field[lang] : (field.ua != null ? field.ua : "");
}

function renderAccentHtml(text) {
  var escaped = escapeHtml(text);
  return escaped.replace(/\*([^*]+)\*/g, '<span class="accent">$1</span>');
}

var TEACH_ICONS = {
  bubble: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  document: '<rect x="2" y="4" width="20" height="16" rx="3"/><path d="m3 7 9 6 9-6"/>',
  building: '<path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h1m4 0h1m-6 4h1m4 0h1m-6 4h1m4 0h1"/>',
  layers: '<path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>',
  cap: '<path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c0 1.1 2.7 2 6 2s6-.9 6-2v-5"/><path d="M22 10v6"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>'
};

function renderTeachCard(card, lang) {
  var iconPath = TEACH_ICONS[card.icon] || TEACH_ICONS.bubble;
  return (
    '<div class="teach-card">' +
      '<div class="icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' + iconPath + '</svg></div>' +
      '<div class="title-row"><h3>' + escapeHtml(t(card.t, lang)) + '</h3><span class="arrow">↗</span></div>' +
      '<p>' + escapeHtml(t(card.d, lang)) + '</p>' +
    '</div>'
  );
}

function renderPriceCard(card, lang, btnLabel) {
  var suffix = t(card.priceSuffix, lang);
  var features = (card.features || []).map(function (f) {
    return '<li>✓ ' + escapeHtml(t(f, lang)) + '</li>';
  }).join("");
  return (
    '<div class="price-card' + (card.featured ? ' featured' : '') + '">' +
      '<div class="tag">' + escapeHtml(t(card.tag, lang)) + '</div>' +
      '<h3>' + escapeHtml(t(card.title, lang)) + '</h3>' +
      '<div class="price">' + escapeHtml(t(card.price, lang)) + (suffix ? ' <span>' + escapeHtml(suffix) + '</span>' : '') + '</div>' +
      '<ul>' + features + '</ul>' +
      '<a href="#booking" class="btn ' + (card.featured ? 'btn-mint' : 'btn-outline-dark') + ' btn-block">' + escapeHtml(btnLabel) + '</a>' +
    '</div>'
  );
}

function renderProcessStep(step, index, lang) {
  return (
    '<div class="process-step">' +
      '<div class="step-num">' + (index + 1) + '</div>' +
      '<h4>' + escapeHtml(t(step.t, lang)) + '</h4>' +
      '<p>' + escapeHtml(t(step.d, lang)) + '</p>' +
    '</div>'
  );
}

function renderAvatarInner(photo, initial) {
  if (photo) {
    return '<img src="' + escapeHtml(photo) + '" alt="">';
  }
  return escapeHtml(initial || "");
}

function renderTestimonialCard(item, lang, ariaHidden) {
  return (
    '<div class="test-card"' + (ariaHidden ? ' aria-hidden="true"' : '') + '>' +
      '<div class="stars">★★★★★</div>' +
      '<p class="quote">' + escapeHtml(t(item.quote, lang)) + '</p>' +
      '<div class="test-author"><div class="test-avatar">' + renderAvatarInner(item.photo, item.initial) + '</div>' +
      '<div><div class="name">' + escapeHtml(t(item.name, lang)) + '</div><div class="role">' + escapeHtml(t(item.role, lang)) + '</div></div></div>' +
    '</div>'
  );
}

function renderAvatarStackItem(item) {
  return '<span>' + renderAvatarInner(item.photo, item.initial) + '</span>';
}

function renderAvatarStack(items) {
  return items.map(renderAvatarStackItem).join("");
}

function renderTestimonialsTrack(items, lang) {
  var once = items.map(function (item) { return renderTestimonialCard(item, lang, false); }).join("");
  var twice = items.map(function (item) { return renderTestimonialCard(item, lang, true); }).join("");
  return once + twice;
}

function renderFaqItem(item, lang) {
  return (
    '<div class="faq-item">' +
      '<div class="faq-q"><span>' + escapeHtml(t(item.q, lang)) + '</span><span class="plus">+</span></div>' +
      '<div class="faq-a">' + escapeHtml(t(item.a, lang)) + '</div>' +
    '</div>'
  );
}

function renderTrustItem(item, lang) {
  return (
    '<div class="trust-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>' +
      '<span>' + escapeHtml(t(item, lang)) + '</span></div>'
  );
}

function renderChecklistItem(item, lang) {
  return '<li><span class="tick">✓</span><span>' + escapeHtml(t(item, lang)) + '</span></li>';
}

function renderHeroStat(stat, lang) {
  return (
    '<div class="stat-pill"><div class="num">' + escapeHtml(stat.num) + '</div>' +
    '<div class="lbl">' + escapeHtml(t(stat.label, lang)) + '</div></div>'
  );
}

function renderSelectOptions(options, lang) {
  return (options || []).map(function (opt) {
    return '<option value="' + escapeHtml(opt.value) + '">' + escapeHtml(t(opt.label, lang)) + '</option>';
  }).join("");
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    escapeHtml: escapeHtml,
    t: t,
    renderAccentHtml: renderAccentHtml,
    TEACH_ICONS: TEACH_ICONS,
    renderTeachCard: renderTeachCard,
    renderPriceCard: renderPriceCard,
    renderProcessStep: renderProcessStep,
    renderTestimonialCard: renderTestimonialCard,
    renderTestimonialsTrack: renderTestimonialsTrack,
    renderFaqItem: renderFaqItem,
    renderTrustItem: renderTrustItem,
    renderChecklistItem: renderChecklistItem,
    renderHeroStat: renderHeroStat,
    renderSelectOptions: renderSelectOptions,
    renderAvatarInner: renderAvatarInner,
    renderAvatarStack: renderAvatarStack
  };
}
