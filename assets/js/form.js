/* MAX SYSTEM — contact form (static site: optional endpoint, honest fallback to WhatsApp) */
(function () {
  'use strict';
  var C = window.MAXSYSTEM || {}, LANG = window.MS_LANG || 'ar', T = window.MS_I18N || {};
  var FX = T.formx || {}, F = T.form || {}, FE = F.errors || {};
  var form = document.getElementById('contact-form'); if (!form) return;
  var $ = function (id) { return document.getElementById(id); };
  var fb = $('form-feedback'), btn = $('submit-btn'), waBtn = $('wa-submit');
  var opened = Date.now();
  var fcfg = C.form || {};
  var waList = window.MS_waList || [];

  var RX = { sa: /^(?:\+?966|00966|0)?5\d{8}$/, eg: /^(?:\+?20|0020|0)?1[0125]\d{8}$/, other: /^\+?[\d\s\-()]{7,20}$/ };
  function clean(p) { return String(p || '').replace(/[\s\-()]/g, ''); }

  function setErr(el, msg) {
    var box = el.closest('.col-md-6, .col-12') || el.parentNode, fbk = box.querySelector('.invalid-feedback');
    el.classList.toggle('is-invalid', !!msg); el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (fbk) { fbk.textContent = msg || ''; fbk.style.display = msg ? 'block' : 'none'; }
  }
  function validate(el) {
    var v = (el.type === 'checkbox' ? el.checked : el.value.trim()), msg = '';
    var c = $('f-country').value;
    if (el.required && !v) msg = el.id === 'f-consent' ? (FE.consent || FX.required) : (el.tagName === 'SELECT' ? (FX.errors || {}).select : (FE.required || FX.required));
    else if (el.id === 'f-phone' && v) {
      var rx = RX[c] || RX.other;
      if (!rx.test(clean(v))) msg = c === 'sa' ? FX.errors.phoneSa : c === 'eg' ? FX.errors.phoneEg : (FE.phone || FX.required);
    } else if (el.id === 'f-email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) msg = FE.email || FX.required;
    else if (el.id === 'f-details' && v && v.length < 10) msg = FE.detailsMin || FX.required;
    setErr(el, msg); return !msg;
  }
  var fields = ['f-fullName', 'f-country', 'f-phone', 'f-email', 'f-service', 'f-details', 'f-consent'].map($);
  fields.forEach(function (el) {
    el.addEventListener('blur', function () { if (el.value || el.checked || el.classList.contains('is-invalid')) validate(el); });
    el.addEventListener('input', function () { if (el.classList.contains('is-invalid')) validate(el); });
    el.addEventListener('change', function () { if (el.classList.contains('is-invalid')) validate(el); });
  });

  /* preselect service from ?service=slug */
  try { var qs = new URLSearchParams(location.search).get('service'), sel = $('f-service');
    if (qs && sel.querySelector('option[value="' + qs.replace(/[^\w-]/g, '') + '"]')) sel.value = qs; } catch (e) {}

  /* country-aware behaviour */
  $('f-country').addEventListener('change', function () {
    var c = this.value || 'other';
    $('f-phone').placeholder = (FX.phonePlaceholder || {})[c] || '';
    var cur = $('f-currency'); if (c === 'sa') cur.value = 'SAR'; else if (c === 'eg') cur.value = 'EGP'; else if (c === 'other') cur.value = 'USD';
    if ($('f-phone').value) validate($('f-phone'));
  });

  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
  function show(kind, title, text) {
    fb.innerHTML = '<div class="form-feedback-box is-' + kind + '" role="' + (kind === 'error' ? 'alert' : 'status') + '"><strong>' + esc(title) + '</strong><p class="mb-0">' + esc(text) + '</p></div>';
    fb.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  function data() {
    var o = {}; new FormData(form).forEach(function (v, k) { o[k] = typeof v === 'string' ? v.trim() : v; });
    o.currency = $('f-currency').value; o.language = LANG; o.page = location.href;
    return o;
  }
  function waItem(country) {
    return waList.filter(function (x) { return x.id === country; })[0] || waList[0];
  }
  function waText(d) {
    var L = FX.waLabels || {}, sv = $('f-service'), svt = sv.options[sv.selectedIndex].text;
    var cn = $('f-country').options[$('f-country').selectedIndex].text;
    var lines = [FX.waIntro, '', L.name + ': ' + d.fullName];
    if (d.company) lines.push(L.company + ': ' + d.company);
    lines.push(L.phone + ': ' + d.phone, L.email + ': ' + d.email, L.country + ': ' + cn, L.service + ': ' + svt);
    if (d.budget) lines.push(L.budget + ': ' + d.budget + ' ' + d.currency);
    lines.push(L.details + ': ' + d.details);
    return lines.join('\n');
  }
  function sendWa() {
    var d = data(), it = waItem(d.country);
    if (!it) { show('error', FX.notConfiguredTitle, FX.noChannel); return; }
    window.open(window.MS_waUrl(it, waText(d)), '_blank', 'noopener');
  }
  function allValid() {
    var ok = true, firstBad = null;
    fields.forEach(function (el) { if (!validate(el)) { ok = false; if (!firstBad) firstBad = el; } });
    if (firstBad) firstBad.focus();
    return ok;
  }
  waBtn.addEventListener('click', function () { if (allValid()) sendWa(); });

  form.addEventListener('submit', function (e) {
    e.preventDefault(); fb.innerHTML = '';
    if (form.elements.website && form.elements.website.value) return;          // honeypot
    if (!allValid()) return;
    if (Date.now() - opened < (fcfg.minFillMs || 3000)) { show('error', F.errorTitle || '', FE.tooFast || FX.required); return; }
    var ep = (fcfg.endpoint || '').trim();
    if (!ep) {                                                                  // honest fallback
      show('info', FX.notConfiguredTitle, FX.notConfiguredText);
      if (waList.length) waBtn.hidden = false;
      return;
    }
    var d = data(); if (fcfg.accessKey) d.access_key = fcfg.accessKey;
    btn.disabled = true; btn.querySelector('.spinner-border').classList.remove('d-none');
    fetch(ep, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(d) })
      .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r; })
      .then(function () {
        form.reset(); fields.forEach(function (el) { setErr(el, ''); });
        show('success', F.successTitle || '', F.successText || '');
      })
      .catch(function () {
        show('error', F.errorTitle || FX.notConfiguredTitle, FE.network || FE.generic || '');
        if (waList.length) waBtn.hidden = false;
      })
      .finally(function () { btn.disabled = false; btn.querySelector('.spinner-border').classList.add('d-none'); });
  });
})();
