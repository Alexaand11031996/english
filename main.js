function getPath(obj, path) {
  return path.split('.').reduce(function (o, k) { return (o && o[k] !== undefined) ? o[k] : undefined; }, obj);
}

function loadSiteContent() {
  var el = document.getElementById('site-content-data');
  if (el) {
    try {
      return { data: deepMerge(DEFAULT_CONTENT, JSON.parse(el.textContent)), fromEmbedded: true };
    } catch (e) {}
  }
  return { data: DEFAULT_CONTENT, fromEmbedded: false };
}

var siteContent = loadSiteContent().data;
var currentLang = document.documentElement.lang === 'en' ? 'en' : 'ua';

function renderLists(lang) {
  document.getElementById('teachGrid').innerHTML = siteContent.teach.cards.map(function (c) { return renderTeachCard(c, lang); }).join('');
  document.getElementById('trustItems').innerHTML = siteContent.trust.items.map(function (i) { return renderTrustItem(i, lang); }).join('');
  document.getElementById('aboutChecklist').innerHTML = siteContent.about.checklist.map(function (i) { return renderChecklistItem(i, lang); }).join('');
  document.getElementById('priceGrid').innerHTML = siteContent.pricing.cards.map(function (c) { return renderPriceCard(c, lang, t(siteContent.pricing.btnLabel, lang)); }).join('');
  document.getElementById('processGrid').innerHTML = siteContent.process.steps.map(function (s, i) { return renderProcessStep(s, i, lang); }).join('');
  document.getElementById('testTrack').innerHTML = renderTestimonialsTrack(siteContent.testimonials.items, lang);
  document.getElementById('faqList').innerHTML = siteContent.faq.items.map(function (i) { return renderFaqItem(i, lang); }).join('');
  document.getElementById('heroStats').innerHTML = siteContent.hero.stats.map(function (s) { return renderHeroStat(s, lang); }).join('');

  var levelSelect = document.getElementById('level');
  var prevLevel = levelSelect.value;
  levelSelect.innerHTML = renderSelectOptions(siteContent.booking.form.levels, lang);
  if (prevLevel) levelSelect.value = prevLevel;

  var goalSelect = document.getElementById('goal');
  var prevGoal = goalSelect.value;
  goalSelect.innerHTML = renderSelectOptions(siteContent.booking.form.goals, lang);
  if (prevGoal) goalSelect.value = prevGoal;

  reattachFaqHandlers();
}

function applyStaticFields(lang) {
  document.querySelectorAll('[data-i18n]').forEach(function (el) {
    var key = el.getAttribute('data-i18n');
    var val = getPath(siteContent, key);
    if (val !== undefined) el.textContent = t(val, lang);
  });
  document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
    var key = el.getAttribute('data-i18n-html');
    var val = getPath(siteContent, key);
    if (val !== undefined) el.innerHTML = t(val, lang);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
    var key = el.getAttribute('data-i18n-placeholder');
    var val = getPath(siteContent, key);
    if (val !== undefined) el.setAttribute('placeholder', t(val, lang));
  });
  document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
    var key = el.getAttribute('data-i18n-aria');
    var val = getPath(siteContent, key);
    if (val !== undefined) el.setAttribute('aria-label', t(val, lang));
  });

  document.getElementById('heroH1').innerHTML = renderAccentHtml(t(siteContent.hero.h1, lang));
  document.getElementById('heroBadge1Num').textContent = siteContent.hero.badges[0].num;
  document.getElementById('heroBadge1Lbl').textContent = t(siteContent.hero.badges[0].label, lang);
  document.getElementById('heroBadge2Num').textContent = siteContent.hero.badges[1].num;
  document.getElementById('heroBadge2Lbl').textContent = t(siteContent.hero.badges[1].label, lang);

  document.getElementById('siteName').textContent = siteContent.site.name;
  document.getElementById('footerSiteName').textContent = siteContent.site.name;

  document.getElementById('navCtaUa').textContent = t(siteContent.nav.cta, 'ua');
  document.getElementById('navCtaEn').textContent = t(siteContent.nav.cta, 'en');
  document.getElementById('navCtaUa').classList.toggle('lang-visible', lang === 'ua');
  document.getElementById('navCtaEn').classList.toggle('lang-visible', lang === 'en');
  document.getElementById('pageTitle').textContent = t(siteContent.seo.title, lang);
  document.getElementById('pageDesc').setAttribute('content', t(siteContent.seo.description, lang));
  document.getElementById('ogTitle').setAttribute('content', t(siteContent.seo.title, lang));
  document.getElementById('ogDesc').setAttribute('content', t(siteContent.seo.description, lang));

  document.querySelectorAll('.lang-btn').forEach(function (btn) {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
  });

  document.documentElement.lang = lang === 'en' ? 'en' : 'uk';
}

function applyContacts() {
  var c = siteContent.contacts;
  var tgUrl = 'https://t.me/' + c.telegramUsername;
  var igUrl = 'https://instagram.com/' + c.instagramUsername;
  var telUrl = 'tel:' + c.phone.replace(/[^+\d]/g, '');
  var mailUrl = 'mailto:' + c.email;

  ['heroTelegramLink', 'ctaTelegramLink', 'stickyTelegramLink', 'contactTelegram', 'footerTelegram'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.setAttribute('href', tgUrl);
  });
  document.getElementById('contactInstagram').setAttribute('href', igUrl);
  document.getElementById('contactPhone').setAttribute('href', telUrl);
  document.getElementById('contactEmail').setAttribute('href', mailUrl);
  document.getElementById('footerInstagram').setAttribute('href', igUrl);
  document.getElementById('footerPhone').setAttribute('href', telUrl);
  document.getElementById('footerEmail').setAttribute('href', mailUrl);

  document.getElementById('contactTelegramValue').textContent = '@' + c.telegramUsername;
  document.getElementById('contactInstagramValue').textContent = '@' + c.instagramUsername;
  document.getElementById('contactPhoneValue').textContent = c.phone;
  document.getElementById('contactEmailValue').textContent = c.email;
  document.getElementById('footerTelegram').textContent = '@' + c.telegramUsername;
  document.getElementById('footerInstagram').textContent = '@' + c.instagramUsername;
  document.getElementById('footerPhone').textContent = c.phone;
  document.getElementById('footerEmail').textContent = c.email;
}

function applyPhotos() {
  if (siteContent.hero.photo) {
    document.getElementById('heroPhoto').innerHTML = '<img src="' + siteContent.hero.photo + '" alt="">';
  }
  if (siteContent.about.photo) {
    document.getElementById('aboutPhoto').innerHTML = '<img src="' + siteContent.about.photo + '" alt="">';
  }
}

function applyLang(lang) {
  currentLang = lang;
  applyStaticFields(lang);
  renderLists(lang);
}

function reattachFaqHandlers() {
  document.querySelectorAll('.faq-item').forEach(function (item) {
    item.querySelector('.faq-q').addEventListener('click', function () {
      var isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(function (i) { i.classList.remove('open'); });
      if (!isOpen) item.classList.add('open');
    });
  });
}

document.querySelectorAll('.lang-btn').forEach(function (btn) {
  btn.addEventListener('click', function () {
    applyLang(btn.getAttribute('data-lang'));
  });
});

applyContacts();
applyPhotos();
applyLang(currentLang);

document.getElementById('bookingForm').addEventListener('submit', function (e) {
  e.preventDefault();
  var form = this;
  var submitBtn = document.getElementById('submitBtn');
  var successBox = document.getElementById('formSuccess');
  var errorBox = document.getElementById('formError');
  successBox.style.display = 'none';
  errorBox.style.display = 'none';

  var turnstileInput = form.querySelector('[name="cf-turnstile-response"]');
  var turnstileToken = turnstileInput ? turnstileInput.value : '';

  var data = new FormData(form);
  var payload = {
    name: data.get('name') || '',
    contact: data.get('contact') || '',
    level: data.get('level') || '',
    goal: data.get('goal') || '',
    time: data.get('time') || '',
    message: data.get('message') || '',
    lang: currentLang,
    turnstileToken: turnstileToken
  };

  submitBtn.disabled = true;
  submitBtn.textContent = t(siteContent.booking.form.sending, currentLang);

  fetch('/.netlify/functions/send-telegram', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(function (res) { return res.json(); }).then(function (json) {
    if (json && json.ok) {
      successBox.style.display = 'block';
      form.reset();
      if (window.turnstile) window.turnstile.reset();
    } else if (json && (json.error === 'rate_limited' || json.error === 'too_soon')) {
      errorBox.textContent = t(siteContent.booking.form.tooSoon, currentLang);
      errorBox.style.display = 'block';
    } else {
      errorBox.textContent = t(siteContent.booking.form.error, currentLang);
      errorBox.style.display = 'block';
    }
  }).catch(function () {
    errorBox.textContent = t(siteContent.booking.form.error, currentLang);
    errorBox.style.display = 'block';
  }).finally(function () {
    submitBtn.disabled = false;
    submitBtn.textContent = t(siteContent.booking.form.submit, currentLang);
  });
});
