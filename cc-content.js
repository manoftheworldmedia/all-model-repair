/* Caspian Coast — general content loader (CMS-editable copy & images from content.json) */
(function () {
  var CONTENT = null;
  // Base URL = directory containing this script (works from / and /menu/ etc.)
  var BASE = (function () {
    var s = document.currentScript;
    if (!s) { var ss = document.getElementsByTagName('script'); for (var i = 0; i < ss.length; i++) { if (/cc-content\.js/.test(ss[i].src)) { s = ss[i]; break; } } }
    var src = s ? s.src : 'cc-content.js';
    return src.replace(/cc-content\.js(\?.*)?$/, '');
  })();
  function isFa() { return document.body.classList.contains('lang-fa'); }
  function get(path) {
    return path.split('.').reduce(function (o, k) { return (o && o[k] != null) ? o[k] : null; }, CONTENT);
  }
  function apply() {
    if (!CONTENT) return;
    var fa = isFa();
    // Images: data-cc-img="images.key"  -> sets src + alt (alt_fa when Farsi)
    document.querySelectorAll('[data-cc-img]').forEach(function (el) {
      var o = get(el.getAttribute('data-cc-img'));
      if (!o) return;
      if (o.src) { el.setAttribute('src', o.src); }
      var alt = fa ? (o.alt_fa || o.alt) : o.alt;
      if (alt != null) el.setAttribute('alt', alt);
    });
    // CSS background images: data-cc-bg="images.key"
    document.querySelectorAll('[data-cc-bg]').forEach(function (el) {
      var o = get(el.getAttribute('data-cc-bg'));
      if (o && o.src) el.style.backgroundImage = "url('" + o.src + "')";
    });
    // Text: data-cc-text="contact.hours" (uses <key>_fa when Farsi)
    document.querySelectorAll('[data-cc-text]').forEach(function (el) {
      var base = el.getAttribute('data-cc-text');
      var val = fa ? (get(base + '_fa') != null ? get(base + '_fa') : get(base)) : get(base);
      if (val != null) { el.textContent = val; if (fa) el.setAttribute('dir', 'rtl'); else el.removeAttribute('dir'); }
    });
    // HTML: data-cc-html="hero.titleHtml" (innerHTML, allows <br>/<em>; uses <key>_fa when Farsi)
    document.querySelectorAll('[data-cc-html]').forEach(function (el) {
      var base = el.getAttribute('data-cc-html');
      var val = fa ? (get(base + '_fa') != null ? get(base + '_fa') : get(base)) : get(base);
      if (val != null) el.innerHTML = val;
    });
    // Links: data-cc-href="contact.instagram"
    document.querySelectorAll('[data-cc-href]').forEach(function (el) {
      var val = get(el.getAttribute('data-cc-href'));
      if (val) el.setAttribute('href', val);
    });
    renderCarousel(fa);
  }
  function renderCarousel(fa) {
    var track = document.querySelector('[data-cc-carousel]');
    if (!track || !CONTENT || !Array.isArray(CONTENT.carousel)) return;
    var items = CONTENT.carousel.filter(function (it) { return it && it.show !== false && it.image; });
    if (!items.length) return;
    function card(it, dup) {
      var d = document.createElement('div');
      d.className = 'drink' + (it.secret ? ' secret' : '');
      if (it.secret) d.setAttribute('data-secret', '');
      if (dup) d.setAttribute('aria-hidden', 'true');
      var alt = dup ? '' : (fa ? (it.alt_fa || it.alt || '') : (it.alt || ''));
      var img = document.createElement('img');
      img.setAttribute('src', it.image); img.setAttribute('alt', alt);
      d.appendChild(img);
      if (it.secret) {
        var veil = document.createElement('div'); veil.className = 'secret-veil';
        veil.innerHTML = '<img class="sm-eye" src="' + BASE + 'img/eye-white.png" alt="" aria-hidden="true" /><span class="sm-label">' +
          (fa ? (it.secretLabel_fa || 'آیتم مخفی منو') : (it.secretLabel || 'Secret Menu Item')) + '</span>';
        d.appendChild(veil);
      }
      return d;
    }
    track.innerHTML = '';
    items.forEach(function (it) { track.appendChild(card(it, false)); });
    if (window.ccInitSecret) window.ccInitSecret();
    setTimeout(initMarquees, 50);
  }
  /* Transform-based infinite marquee + manual drag, idle auto-resume (site-wide on .menu-band) */
  function initMarquees() {
    document.querySelectorAll('.menu-band').forEach(function (band) {
      var track = band.querySelector('.menu-track');
      if (!track) return;
      if (band._marq) { band._marq.destroy(); }
      // Snapshot one logical "unit" = current children, then clone to overfill the viewport
      var unit = Array.prototype.slice.call(track.children);
      if (!unit.length) return;
      // strip any prior clones
      track.querySelectorAll('[data-clone]').forEach(function (n) { n.remove(); });
      unit = Array.prototype.slice.call(track.children).filter(function (n) { return !n.hasAttribute('data-clone'); });
      function unitWidth() {
        var w = 0; unit.forEach(function (n) { w += n.getBoundingClientRect().width + parseFloat(getComputedStyle(n).marginRight || 0); });
        return w;
      }
      var uw = unitWidth();
      if (uw <= 0) { setTimeout(initMarquees, 200); return; }
      // clone enough copies so total width >= unit + 2 viewports (seamless on any screen)
      var need = Math.ceil((band.clientWidth + uw) / uw) + 1;
      for (var c = 0; c < need; c++) {
        unit.forEach(function (n) { var cl = n.cloneNode(true); cl.setAttribute('data-clone', ''); cl.setAttribute('aria-hidden', 'true'); track.appendChild(cl); });
      }
      var offset = 0, speed = 0.55, paused = false, idle = null, raf = null;
      var down = false, sx = 0, so = 0, moved = false;
      function wrap() { offset = ((offset % uw) + uw) % uw; }
      function render() { track.style.transform = 'translateX(' + (-offset) + 'px)'; }
      function tick() { if (!paused) { offset += speed; wrap(); render(); } raf = requestAnimationFrame(tick); }
      function pause() { paused = true; clearTimeout(idle); }
      function resumeSoon() { clearTimeout(idle); idle = setTimeout(function () { paused = false; }, 1500); }
      band.addEventListener('pointerdown', function (e) {
        down = true; moved = false; sx = e.clientX; so = offset; pause(); band.classList.add('dragging');
        try { band.setPointerCapture(e.pointerId); } catch (err) {}
      });
      band.addEventListener('pointermove', function (e) {
        if (!down) return;
        var dx = e.clientX - sx; if (Math.abs(dx) > 3) moved = true;
        offset = so - dx; wrap(); render();
      });
      function endDrag() { if (!down) return; down = false; band.classList.remove('dragging'); resumeSoon(); }
      band.addEventListener('pointerup', endDrag);
      band.addEventListener('pointercancel', endDrag);
      band.addEventListener('pointerleave', function () { if (down) endDrag(); });
      band.addEventListener('wheel', function (e) {
        var d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        if (d) { offset += d; wrap(); render(); pause(); resumeSoon(); }
      }, { passive: true });
      band.addEventListener('click', function (e) { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
      render();
      raf = requestAnimationFrame(tick);
      band._marq = { destroy: function () { cancelAnimationFrame(raf); clearTimeout(idle); } };
    });
  }
  window.ccInitMarquees = initMarquees;
  function applyTheme() {
    if (!CONTENT || !CONTENT.theme) return;
    var t = CONTENT.theme;
    var map = { fontDisplay: '--font-display', fontSerif: '--font-serif', fontBody: '--font-body', fontEditorial: '--font-edit' };
    var fams = [];
    Object.keys(map).forEach(function (k) {
      if (t[k]) {
        document.documentElement.style.setProperty(map[k], "'" + t[k] + "', sans-serif");
        if (fams.indexOf(t[k]) === -1) fams.push(t[k]);
      }
    });
    // inject a Google Fonts link for any chosen families (weights cover display/body needs)
    if (fams.length) {
      var href = 'https://fonts.googleapis.com/css2?' + fams.map(function (f) {
        return 'family=' + f.replace(/ /g, '+') + ':ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500';
      }).join('&') + '&display=swap';
      var link = document.getElementById('cc-theme-fonts');
      if (!link) { link = document.createElement('link'); link.id = 'cc-theme-fonts'; link.rel = 'stylesheet'; document.head.appendChild(link); }
      link.href = href;
    }
  }
  window.ccApply = apply;
  fetch(BASE + 'content.json').then(function (r) { return r.json(); }).then(function (data) {
    CONTENT = data; applyTheme(); apply();
  }).catch(function () {});
  // re-apply on language toggle
  document.querySelectorAll('#langToggle button').forEach(function (b) {
    b.addEventListener('click', function () { setTimeout(apply, 0); });
  });
  // Clean scroll: smooth-scroll to in-page sections and never show "#" in the URL
  (function () {
    function navH() { var n = document.querySelector('header.nav'); return n ? n.getBoundingClientRect().height + 12 : 80; }
    function scrollToHash(hash, smooth) {
      var el = document.querySelector(hash);
      if (!el) return false;
      var y = el.getBoundingClientRect().top + window.pageYOffset - navH();
      window.scrollTo({ top: y, behavior: smooth ? 'smooth' : 'auto' });
      return true;
    }
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href*="#"]');
      if (!a) return;
      var href = a.getAttribute('href') || '';
      var hi = href.indexOf('#'); if (hi < 0) return;
      var hash = href.slice(hi);              // "#cafe"
      var path = href.slice(0, hi);           // "", "/", "../" etc.
      // only intercept if that section exists on THIS page
      if (document.querySelector(hash)) {
        e.preventDefault();
        scrollToHash(hash, true);
        history.replaceState(null, '', location.pathname + location.search);
        var mm = document.getElementById('mobileMenu'); if (mm) mm.classList.remove('open');
      }
      // else: link points to a section on another page — let it navigate; that page strips the hash on load
    });
    // On load: if arriving with a hash (cross-page jump), scroll then strip it
    if (location.hash && location.hash.length > 1) {
      var h = location.hash;
      setTimeout(function () { scrollToHash(h, false); history.replaceState(null, '', location.pathname + location.search); }, 200);
    }
  })();
})();
