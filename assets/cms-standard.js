/* ============================================================
   cms-standard.js — MOW CMS Standard loader for All Model Repair
   ------------------------------------------------------------
   Reads the MOW-Standard content files:
     content/home.json        (per-language: en / fa blocks)
     content/navigation.json  (menu items, label_en / label_fa)
     content/settings.json    (phone / address / social / footer)

   It progressively enhances the static HTML via attributes:
     data-cms-std="en.hero_title"   -> textContent (language auto-resolved
                                        when the path starts with "en."/"fa.")
     data-cms-img="images.hero"     -> <img src> (or background on non-img)
     data-cms-doc-title / -desc / -og-title / -og-desc / -og-image
                                    -> head meta from the home doc

   Language is read from <html lang="en|fa">. A "fa" page resolves the `fa`
   block of every document and falls back to `en` when a value is missing.

   Base path: pages in a subdirectory (e.g. /fa/) set <html data-base="../">
   so the content/ files at the site root resolve. This mirrors cms.js.

   Everything fails silently: if a fetch fails or a node/value is missing,
   the static HTML already on the page is left untouched.
   ============================================================ */
(function () {
  "use strict";

  var LANG = (document.documentElement.getAttribute("lang") || "en")
    .toLowerCase().indexOf("fa") === 0 ? "fa" : "en";
  var BASE = document.documentElement.getAttribute("data-base") || "";

  function getJSON(url) {
    return fetch(url + "?t=" + Date.now(), { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .catch(function () {
        return fetch(url, { cache: "no-cache" }).then(function (r) {
          if (!r.ok) throw new Error("HTTP " + r.status + " for " + url);
          return r.json();
        });
      });
  }

  function resolve(obj, path) {
    return String(path).split(".").reduce(function (o, k) {
      return o == null ? o : o[k];
    }, obj);
  }

  // Resolve a path, with language fallback: "en.x"/"fa.x" tries the current
  // language first, then English.
  function pickPath(obj, path) {
    var m = /^(en|fa)\.(.+)$/.exec(path);
    if (m) {
      var rest = m[2];
      var v = resolve(obj, LANG + "." + rest);
      if (v == null || v === "") v = resolve(obj, "en." + rest);
      return v;
    }
    return resolve(obj, path);
  }

  function setMeta(selector, value) {
    if (value == null || value === "") return;
    var el = document.head.querySelector(selector);
    if (el) el.setAttribute("content", value);
  }

  /* ---------------- HOME ---------------- */
  function applyHome(home) {
    if (!home) return;

    // text bindings
    document.querySelectorAll("[data-cms-std]").forEach(function (el) {
      var val = pickPath(home, el.getAttribute("data-cms-std"));
      if (val != null && typeof val !== "object") el.textContent = val;
    });

    // images
    document.querySelectorAll("[data-cms-img]").forEach(function (el) {
      var src = resolve(home, el.getAttribute("data-cms-img"));
      if (!src || typeof src !== "string") return;
      if (el.tagName === "IMG") el.setAttribute("src", BASE + src.replace(/^\//, ""));
      else el.style.backgroundImage = "url('" + BASE + src.replace(/^\//, "") + "')";
    });

    // head: title + meta + open graph / twitter, from the home doc
    var t = pickPath(home, "en.seo_title");
    var d = pickPath(home, "en.seo_description");
    if (t) {
      var titleEl = document.querySelector("[data-cms-doc-title]") || document.querySelector("title");
      if (titleEl) titleEl.textContent = t;
      setMeta('meta[property="og:title"]', t);
      setMeta('meta[name="twitter:title"]', t);
    }
    if (d) {
      setMeta('meta[name="description"]', d);
      setMeta('meta[property="og:description"]', d);
      setMeta('meta[name="twitter:description"]', d);
    }
    if (home.images && home.images.og_image) {
      var og = BASE + String(home.images.og_image).replace(/^\//, "");
      setMeta('meta[property="og:image"]', og);
      setMeta('meta[name="twitter:image"]', og);
    }
  }

  /* ---------------- NAVIGATION ---------------- */
  function applyNav(nav) {
    if (!nav || !Array.isArray(nav.items)) return;
    document.querySelectorAll("[data-cms-nav]").forEach(function (container) {
      // Only render if the container is explicitly opted-in AND empty markers exist.
      // We relabel existing links by matching order, leaving static markup intact
      // if counts differ (fail-safe).
      var links = container.querySelectorAll("a[data-cms-nav-item]");
      if (!links.length) return;
      links.forEach(function (a, i) {
        var item = nav.items[i];
        if (!item) return;
        var label = LANG === "fa" ? (item.label_fa || item.label_en) : item.label_en;
        if (label) a.textContent = label;
        if (item.url) a.setAttribute("href", BASE + item.url.replace(/^\//, ""));
        if (item.newTab) { a.setAttribute("target", "_blank"); a.setAttribute("rel", "noopener"); }
      });
    });
  }

  /* ---------------- SETTINGS ---------------- */
  function applySettings(s) {
    if (!s) return;

    if (s.phone) {
      var digits = s.phone.replace(/\D/g, "");
      document.querySelectorAll("[data-cms-std-phone]").forEach(function (el) { el.textContent = s.phone; });
      document.querySelectorAll("[data-cms-std-tel]").forEach(function (el) { el.setAttribute("href", "tel:" + digits); });
    }
    if (s.email) {
      document.querySelectorAll("[data-cms-std-email]").forEach(function (el) {
        el.textContent = s.email; el.setAttribute("href", "mailto:" + s.email);
      });
    }
    if (s.address) {
      var a = s.address;
      var street = LANG === "fa" ? (a.street_fa || a.street_en) : a.street_en;
      var city = LANG === "fa" ? (a.city_line_fa || a.city_line_en) : a.city_line_en;
      document.querySelectorAll("[data-cms-std-address]").forEach(function (el) {
        el.innerHTML = (street || "") + "<br />" + (city || "");
      });
      if (a.map_query) {
        var mapUrl = "https://www.google.com/maps?q=" + encodeURIComponent(a.map_query);
        document.querySelectorAll("[data-cms-std-maplink]").forEach(function (el) { el.setAttribute("href", mapUrl); });
      }
    }
    var tagline = s[LANG] && s[LANG].footer_tagline ? s[LANG].footer_tagline : (s.en && s.en.footer_tagline);
    if (tagline) document.querySelectorAll("[data-cms-std-tagline]").forEach(function (el) { el.textContent = tagline; });
  }

  /* ---------------- boot ---------------- */
  getJSON(BASE + "content/home.json").then(applyHome).catch(function (e) { console.warn("[cms-std] home:", e.message); });
  getJSON(BASE + "content/navigation.json").then(applyNav).catch(function (e) { console.warn("[cms-std] nav:", e.message); });
  getJSON(BASE + "content/settings.json").then(applySettings).catch(function (e) { console.warn("[cms-std] settings:", e.message); });
})();
