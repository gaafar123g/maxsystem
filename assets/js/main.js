/* MAX SYSTEM — main.js (vanilla, no dependencies besides Bootstrap bundle) */
(function () {
  'use strict';
  var C = window.MAXSYSTEM || {};
  var LANG = window.MS_LANG || 'ar';
  var T = window.MS_I18N || {};
  var doc = document, root = doc.documentElement;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  function safe(fn) { try { return fn(); } catch (e) { return null; } }
  function loc(v) { return v && typeof v === 'object' ? (v[LANG] || '') : (v || ''); }
  function digits(s) { return String(s || '').replace(/[^\d]/g, ''); }
  function telHref(s) { var p = String(s || '').trim(); return 'tel:' + (p.charAt(0) === '+' ? '+' : '') + digits(p); }
  function tpl(s, o) { return String(s).replace(/\{(\w+)\}/g, function (_, k) { return o[k]; }); }

  var waList = ((C.contact || {}).whatsapp || []).filter(function (x) { return digits(x.number); });
  var phoneList = ((C.contact || {}).phone || []).filter(function (x) { return String(x.number || '').trim(); });
  var email = ((C.contact || {}).email || '').trim();
  var address = loc((C.contact || {}).address);
  var hours = loc((C.contact || {}).hours);
  var socialAll = C.social || {};
  var SOCIAL = {
    facebook: { icon: 'bi-facebook', name: 'Facebook' }, instagram: { icon: 'bi-instagram', name: 'Instagram' },
    linkedin: { icon: 'bi-linkedin', name: 'LinkedIn' }, x: { icon: 'bi-twitter-x', name: 'X' },
    youtube: { icon: 'bi-youtube', name: 'YouTube' }, tiktok: { icon: 'bi-tiktok', name: 'TikTok' },
    snapchat: { icon: 'bi-snapchat', name: 'Snapchat' }
  };
  var socials = Object.keys(SOCIAL).filter(function (k) { return /^https?:\/\//i.test(socialAll[k] || ''); });

  function waUrl(item, text) {
    var msg = text != null ? text : loc((C.contact || {}).whatsappMessage);
    return 'https://wa.me/' + digits(item.number) + (msg ? '?text=' + encodeURIComponent(msg) : '');
  }
  window.MS_waUrl = waUrl; window.MS_waList = waList;

  /* ---------- preloader + hero delay ---------- */
  var first = !root.hasAttribute('data-preloaded');
  if (first) {
    root.style.setProperty('--hero-delay', '3.1s');
    setTimeout(function () { root.style.removeProperty('--hero-delay'); }, 4200);
    safe(function () { sessionStorage.setItem('ms-preloaded', '2'); });
    setTimeout(function () { var p = $('#preloader'); if (p) p.remove(); }, 2900);
  } else { var p0 = $('#preloader'); if (p0) p0.remove(); }

  /* ---------- header ---------- */
  var header = $('#site-header');
  function onScroll() { if (header) header.classList.toggle('is-scrolled', window.scrollY > 10); }
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- reveal ---------- */
  $$('[data-stagger]').forEach(function (g) {
    $$(':scope > *', g).forEach(function (c, i) {
      if (!c.hasAttribute('data-reveal')) c.setAttribute('data-reveal', 'up');
      if (!c.hasAttribute('data-delay')) c.setAttribute('data-delay', String(Math.min(i + 1, 6)));
    });
  });
  var rev = $$('[data-reveal]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    rev.forEach(function (el) { io.observe(el); });
  } else rev.forEach(function (el) { el.classList.add('is-visible'); });

  /* ---------- language preference ---------- */
  $$('[data-lang-switch]').forEach(function (a) {
    a.addEventListener('click', function () {
      var target = a.getAttribute('hreflang') || (LANG === 'ar' ? 'en' : 'ar');
      safe(function () { localStorage.setItem('ms-lang', target); });
    });
  });

  /* ---------- year ---------- */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- contact lists (footer + contact page) ---------- */
  function li(iconCls, inner) { var l = doc.createElement('li'); l.innerHTML = '<i class="bi ' + iconCls + '" aria-hidden="true"></i>' + inner; return l; }
  function esc(s) { var d = doc.createElement('div'); d.textContent = s; return d.innerHTML; }
  var hasContact = waList.length || phoneList.length || email || address || hours;
  $$('[data-contact-list]').forEach(function (ul) {
    if (!hasContact) return;
    $$('[data-contact-pending]', ul).forEach(function (n) { n.remove(); });
    var multi = function (list, icon, hrefFn) {
      var g = '<div class="grp">' + list.map(function (x) {
        return '<span><a dir="ltr" href="' + hrefFn(x) + '">' + esc(x.display || ('+' + digits(x.number) === x.number ? x.number : x.number)) + '</a>' +
          (list.length > 1 ? ' <small>' + esc(loc(x.label)) + '</small>' : '') + '</span>';
      }).join('') + '</div>';
      ul.appendChild(li(icon, g));
    };
    if (phoneList.length) multi(phoneList, 'bi-telephone', function (x) { return telHref(x.number); });
    if (waList.length) multi(waList.map(function (x) { return { number: (x.number.charAt(0) === '+' ? '' : '+') + x.number, label: x.label, _o: x }; }), 'bi-whatsapp', function (x) { return waUrl(x._o); });
    if (email) ul.appendChild(li('bi-envelope', '<a dir="ltr" href="mailto:' + esc(email) + '">' + esc(email) + '</a>'));
    if (address) ul.appendChild(li('bi-geo-alt', '<span>' + esc(address) + '</span>'));
    if (hours) ul.appendChild(li('bi-clock', '<span>' + esc(hours) + '</span>'));
  });

  /* ---------- social lists (icons are always shown; unconfigured ones lead to the contact page) ---------- */
  var DEFAULT_SOCIALS = ['facebook', 'instagram', 'tiktok', 'snapchat', 'linkedin'];
  var shownSocials = socials.length ? socials : DEFAULT_SOCIALS;
  var contactHref = (window.MS_ASSETS === '/' ? (LANG === 'en' ? '/en/' : '/') : '') + 'contact.html';
  function socialLink(k) {
    var on = socials.indexOf(k) > -1;
    return { href: on ? socialAll[k] : contactHref, ext: on };
  }
  $$('[data-social-wrap]').forEach(function (w) { w.hidden = false; });
  $$('[data-social-list]').forEach(function (ul) {
    shownSocials.forEach(function (k) {
      var s = SOCIAL[k], l = doc.createElement('li'), t = socialLink(k);
      l.innerHTML = '<a href="' + esc(t.href) + '"' + (t.ext ? ' target="_blank" rel="noopener noreferrer"' : '') + ' aria-label="' + s.name + (t.ext ? ' ' + esc((T.a11y || {}).externalLink || '') : '') + '" title="' + s.name + '"><i class="bi ' + s.icon + '" aria-hidden="true"></i></a>';
      ul.appendChild(l);
    });
  });

  /* ---------- top bar: real links once config.js has the numbers; otherwise they lead to the contact page ---------- */
  $$('[data-tb]').forEach(function (a) {
    var k = a.getAttribute('data-tb'), txt = $('span', a);
    if (k === 'phone' && phoneList.length) {
      a.href = telHref(phoneList[0].number);
      if (txt) txt.innerHTML = '<bdi class="tb-num">' + esc(phoneList[0].display || phoneList[0].number) + '</bdi>';
    } else if (k === 'whatsapp' && waList.length) {
      a.href = waUrl(waList[0]); a.target = '_blank'; a.rel = 'noopener noreferrer';
    } else if (k === 'email' && email) {
      a.href = 'mailto:' + email;
    }
  });

  /* ---------- WhatsApp links / chooser card ---------- */
  if (waList.length) {
    $$('[data-wa]').forEach(function (a) { a.hidden = false; a.removeAttribute('hidden'); a.href = waUrl(waList[0]); a.target = '_blank'; a.rel = 'noopener noreferrer'; });
    var card = $('[data-wa-chooser]');
    if (card) {
      card.hidden = false;
      var box = $('[data-wa-buttons]', card);
      waList.forEach(function (x) {
        var a = doc.createElement('a');
        a.className = 'btn btn-wa'; a.href = waUrl(x); a.target = '_blank'; a.rel = 'noopener noreferrer';
        a.innerHTML = '<i class="bi bi-whatsapp" aria-hidden="true"></i> ' + esc(waList.length > 1 ? loc(x.label) : ((T.common || {}).whatsapp || 'WhatsApp'));
        box.appendChild(a);
      });
    }
  }

  /* ---------- floating widget ---------- */
  var SVG_WA = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/></svg>';
  var SVG_CALL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1.02z"/></svg>';
  var SVG_SHARE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 16a3 3 0 0 0-2.1.9l-7-4.1a3 3 0 0 0 0-1.6l6.9-4A3 3 0 1 0 15 5a3 3 0 0 0 .1.8l-6.9 4a3 3 0 1 0 0 4.4l7 4.1A3 3 0 1 0 18 16z"/></svg>';
  var ui = T.ui || {}, a11y = T.a11y || {};
  (function buildWidget() {
    var fc = doc.createElement('div'); fc.className = 'fc'; fc.setAttribute('role', 'group'); fc.setAttribute('aria-label', a11y.floatingContact || '');
    var ul = doc.createElement('ul'); ul.className = 'fc-social'; ul.hidden = true; ul.id = 'fc-social';
    shownSocials.forEach(function (k) {
      var l = doc.createElement('li'), t = socialLink(k);
      l.innerHTML = '<a class="fc-btn" href="' + esc(t.href) + '"' + (t.ext ? ' target="_blank" rel="noopener noreferrer"' : '') + ' data-tip="' + SOCIAL[k].name + '" aria-label="' + SOCIAL[k].name + '"><i class="bi ' + SOCIAL[k].icon + '" aria-hidden="true"></i></a>';
      ul.appendChild(l);
    });
    fc.appendChild(ul);
    var tg = doc.createElement('button'); tg.type = 'button'; tg.className = 'fc-btn fc-toggle';
    tg.setAttribute('aria-expanded', 'false'); tg.setAttribute('aria-controls', 'fc-social'); tg.setAttribute('aria-label', a11y.openSocial || '');
    tg.setAttribute('data-tip', a11y.openSocial || ''); tg.innerHTML = SVG_SHARE;
    tg.addEventListener('click', function () {
      var open = ul.hidden; ul.hidden = !open; tg.setAttribute('aria-expanded', String(open));
      tg.setAttribute('aria-label', open ? (a11y.closeSocial || '') : (a11y.openSocial || ''));
    });
    fc.appendChild(tg);

    var call = doc.createElement('a'); call.className = 'fc-btn fc-call';
    call.href = phoneList.length ? telHref(phoneList[0].number) : contactHref;
    call.setAttribute('data-tip', ui.call || ''); call.setAttribute('aria-label', ui.call || ''); call.innerHTML = SVG_CALL;
    if (phoneList.length > 1) {
      var cw = doc.createElement('div'); cw.className = 'fc-wrap';
      var cb = doc.createElement('button'); cb.type = 'button'; cb.className = call.className; cb.setAttribute('data-tip', ui.call || ''); cb.setAttribute('aria-label', ui.call || ''); cb.setAttribute('aria-expanded', 'false'); cb.innerHTML = SVG_CALL;
      var cpop = doc.createElement('div'); cpop.className = 'fc-pop'; cpop.hidden = true;
      cpop.innerHTML = '<strong>' + esc(ui.chooseNumber || '') + '</strong>' + phoneList.map(function (x) {
        return '<a href="' + telHref(x.number) + '">' + SVG_CALL + esc(loc(x.label)) + '</a>';
      }).join('');
      cb.addEventListener('click', function (e) { e.stopPropagation(); cpop.hidden = !cpop.hidden; cb.setAttribute('aria-expanded', String(!cpop.hidden)); });
      doc.addEventListener('click', function (e) { if (!cw.contains(e.target)) { cpop.hidden = true; cb.setAttribute('aria-expanded', 'false'); } });
      cw.appendChild(cb); cw.appendChild(cpop); fc.appendChild(cw);
    } else fc.appendChild(call);

    var wrap = doc.createElement('div'); wrap.className = 'fc-wrap';
    var wa = doc.createElement(waList.length > 1 ? 'button' : 'a'); wa.className = 'fc-btn fc-wa';
    wa.setAttribute('data-tip', ui.whatsapp || 'WhatsApp'); wa.setAttribute('aria-label', ui.openWhatsapp || 'WhatsApp'); wa.innerHTML = SVG_WA;
    if (waList.length > 1) {
      wa.type = 'button'; wa.setAttribute('aria-expanded', 'false');
      var pop = doc.createElement('div'); pop.className = 'fc-pop'; pop.hidden = true;
      pop.innerHTML = '<strong>' + esc(ui.chooseNumber || '') + '</strong>' + waList.map(function (x) {
        return '<a href="' + waUrl(x) + '" target="_blank" rel="noopener noreferrer">' + SVG_WA + esc(loc(x.label)) + '</a>';
      }).join('');
      wa.addEventListener('click', function (e) { e.stopPropagation(); pop.hidden = !pop.hidden; wa.setAttribute('aria-expanded', String(!pop.hidden)); });
      doc.addEventListener('click', function (e) { if (!wrap.contains(e.target)) { pop.hidden = true; wa.setAttribute('aria-expanded', 'false'); } });
      doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') { pop.hidden = true; wa.setAttribute('aria-expanded', 'false'); } });
      wrap.appendChild(pop);
    } else if (waList.length) { wa.href = waUrl(waList[0]); wa.target = '_blank'; wa.rel = 'noopener noreferrer'; }
    else wa.href = contactHref;
    wrap.insertBefore(wa, wrap.firstChild);
    fc.appendChild(wrap);
    doc.body.appendChild(fc);
  })();

  /* ---------- hero slider (full width, fade, autoplay) ---------- */
  $$('[data-slider]').forEach(function (sl) {
    var slides = $$('.fs-slide', sl), dots = $$('[data-slider-dot]', sl), i = 0, timer = null;
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    function go(n) {
      i = (n + slides.length) % slides.length;
      slides.forEach(function (x, k) { x.classList.toggle('is-active', k === i); x.setAttribute('aria-hidden', String(k !== i)); });
      dots.forEach(function (x, k) { x.classList.toggle('is-active', k === i); x.setAttribute('aria-current', k === i ? 'true' : 'false'); });
    }
    function play() { if (reduce || timer) return; sl.classList.remove('is-paused'); timer = setInterval(function () { go(i + 1); }, 6000); }
    function stop() { clearInterval(timer); timer = null; sl.classList.add('is-paused'); }
    var pv = $('[data-slider-prev]', sl), nx = $('[data-slider-next]', sl);
    if (pv) pv.addEventListener('click', function () { go(i - 1); stop(); play(); });
    if (nx) nx.addEventListener('click', function () { go(i + 1); stop(); play(); });
    dots.forEach(function (d) { d.addEventListener('click', function () { go(+d.getAttribute('data-slider-dot')); stop(); play(); }); });
    sl.addEventListener('mouseenter', stop); sl.addEventListener('mouseleave', function () { go(i); play(); });
    sl.addEventListener('focusin', stop); sl.addEventListener('focusout', play);
    var tx = null;
    sl.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
    sl.addEventListener('touchend', function (e) { if (tx == null) return; var dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 40) { go(i + (dx < 0 ? 1 : -1)); } tx = null; });
    go(0); play();
  });

  /* ---------- JSON-LD enrichment ---------- */
  var ld = $('#ld-org');
  if (ld) safe(function () {
    var o = JSON.parse(ld.textContent), pts = [];
    phoneList.forEach(function (x) { pts.push({ '@type': 'ContactPoint', telephone: '+' + digits(x.number), contactType: 'customer service', areaServed: x.id === 'sa' ? 'SA' : x.id === 'eg' ? 'EG' : undefined }); });
    if (email) pts.push({ '@type': 'ContactPoint', email: email, contactType: 'customer service' });
    if (pts.length) o.contactPoint = pts;
    if (socials.length) o.sameAs = socials.map(function (k) { return socialAll[k]; });
    ld.textContent = JSON.stringify(o);
  });

  /* ---------- filters + search ---------- */
  $$('[data-filter-group]').forEach(function (group) {
    var name = group.getAttribute('data-filter-group');
    var list = $('[data-filter-items="' + name + '"]'); if (!list) return;
    var items = $$(':scope > [data-category]', list);
    var empty = $('[data-filter-empty="' + name + '"]');
    var search = $('[data-search="' + name + '"]');
    var cat = 'all';
    function apply() {
      var q = search ? search.value.trim().toLowerCase() : '', n = 0;
      items.forEach(function (it) {
        var ok = (cat === 'all' || it.getAttribute('data-category') === cat) && (!q || (it.getAttribute('data-text') || '').indexOf(q) > -1);
        it.hidden = !ok; if (ok) { n++; var r = $('[data-reveal]', it); if (r) r.classList.add('is-visible'); it.classList.add('is-visible'); }
      });
      if (empty) empty.hidden = n > 0;
    }
    $$('[data-filter]', group).forEach(function (b) {
      b.addEventListener('click', function () {
        cat = b.getAttribute('data-filter');
        $$('[data-filter]', group).forEach(function (x) { var on = x === b; x.classList.toggle('active', on); x.setAttribute('aria-pressed', String(on)); });
        apply();
      });
    });
    if (search) search.addEventListener('input', apply);
  });

  /* ---------- share ---------- */
  $$('[data-share]').forEach(function (bar) {
    var url = location.href.split('#')[0], title = bar.getAttribute('data-title') || doc.title;
    var map = {
      facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url),
      x: 'https://twitter.com/intent/tweet?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(title),
      linkedin: 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url),
      whatsapp: 'https://wa.me/?text=' + encodeURIComponent(title + ' ' + url)
    };
    $$('[data-share-net]', bar).forEach(function (a) { a.href = map[a.getAttribute('data-share-net')] || '#'; });
    var cp = $('[data-copy-link]', bar);
    if (cp) cp.addEventListener('click', function () {
      var msg = (T.blog || {}).copied || 'Copied';
      var done = function () { cp.setAttribute('title', msg); var live = $('[data-copied-msg]', bar); if (live) { live.textContent = msg; setTimeout(function () { live.textContent = ''; }, 2500); } };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, done);
      else { var t = doc.createElement('textarea'); t.value = url; doc.body.appendChild(t); t.select(); safe(function () { doc.execCommand('copy'); }); t.remove(); done(); }
    });
  });

  /* ---------- analytics + cookie consent (only if an ID is configured) ---------- */
  var A = C.analytics || {};
  var anyAn = A.gtmId || A.ga4Id || A.metaPixelId;
  function loadScript(src) { var s = doc.createElement('script'); s.async = true; s.src = src; doc.head.appendChild(s); }
  function loadAnalytics() {
    window.dataLayer = window.dataLayer || [];
    if (A.gtmId) { window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' }); loadScript('https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(A.gtmId)); }
    else if (A.ga4Id) { window.gtag = function () { window.dataLayer.push(arguments); }; gtag('js', new Date()); gtag('config', A.ga4Id); loadScript('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(A.ga4Id)); }
    if (A.metaPixelId) {
      !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, doc, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', A.metaPixelId); fbq('track', 'PageView');
    }
  }
  if (anyAn) {
    var consent = safe(function () { return localStorage.getItem('ms-consent'); });
    if (consent === 'yes') loadAnalytics();
    else if (consent !== 'no') {
      var ck = T.cookie || {};
      var b = doc.createElement('div'); b.className = 'cookie-banner'; b.setAttribute('role', 'dialog'); b.setAttribute('aria-label', ck.title || '');
      b.innerHTML = '<div class="cookie-card"><strong>' + esc(ck.title || '') + '</strong><p>' + esc(ck.text || '') + ' <a href="' + (window.MS_ASSETS || '') + 'privacy-policy.html">' + esc(ck.learn || '') + '</a></p><div class="d-flex gap-2"><button type="button" class="btn btn-cta btn-sm" data-c="yes">' + esc(ck.accept || '') + '</button><button type="button" class="btn btn-outline-brand btn-sm" data-c="no">' + esc(ck.decline || '') + '</button></div></div>';
      doc.body.appendChild(b); root.setAttribute('data-cookie-banner', '');
      b.addEventListener('click', function (e) {
        var v = e.target.closest && e.target.closest('[data-c]'); if (!v) return;
        safe(function () { localStorage.setItem('ms-consent', v.getAttribute('data-c')); });
        b.remove(); root.removeAttribute('data-cookie-banner'); if (v.getAttribute('data-c') === 'yes') loadAnalytics();
      });
    }
  }
})();
