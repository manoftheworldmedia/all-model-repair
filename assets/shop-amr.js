/* ============================================================
   shop-amr.js — All Model Repair storefront (MOW CMS Standard)
   ------------------------------------------------------------
   Reads products straight from the CMS source of truth:
     content/products/<sku>.json   (one file per product)
   discovered via assets/shop-manifest.json (a flat list of SKUs —
   static hosts can't list a directory, so the manifest is the index;
   it lives OUTSIDE content/ so the schema validator ignores it).

   Honours content/settings.json -> shop_enabled / shop_currency.
   Each product links out to its own buy_url (external merch, no cart).

   Language from <html lang="en|fa">; falls back to English per field.
   Fails silently if anything is missing.
   ============================================================ */
(function () {
  "use strict";

  var LANG = (document.documentElement.getAttribute("lang") || "en")
    .toLowerCase().indexOf("fa") === 0 ? "fa" : "en";
  var BASE = document.documentElement.getAttribute("data-base") || "../";

  var CURRENCY_SYMBOL = { usd: "$", eur: "€", gbp: "£", cad: "CA$", aud: "A$" };

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

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function loc(p, key) {
    var block = p[LANG] && p[LANG][key] ? p[LANG][key] : (p.en && p.en[key]);
    return block || "";
  }

  function money(p, defaultCurrency) {
    var cur = (p.currency || defaultCurrency || "usd").toLowerCase();
    var sym = CURRENCY_SYMBOL[cur] || "$";
    var n = typeof p.price === "number" ? p.price : Number(p.price);
    if (isNaN(n)) return "";
    return sym + (n % 1 === 0 ? n.toFixed(0) : n.toFixed(2));
  }

  function render(products, settings) {
    var grid = document.getElementById("shop-grid");
    if (!grid) return;
    var defaultCurrency = settings && settings.shop_currency;
    var buyLabel = LANG === "fa" ? "خرید" : "Buy";
    var html = products
      .filter(function (p) { return p && p.active !== false; })
      .map(function (p) {
        var name = loc(p, "name");
        var desc = loc(p, "description");
        var img = p.image ? (BASE + String(p.image).replace(/^\//, "")) : "";
        var url = p.buy_url || "#";
        return '<article class="prod reveal in">' +
          (img ? '<div class="prod-img"><img src="' + esc(img) + '" alt="' + esc(name) + '" loading="lazy" /></div>' : "") +
          '<div class="prod-body">' +
            "<h3>" + esc(name) + "</h3>" +
            (desc ? '<p class="pdesc">' + esc(desc) + "</p>" : "") +
            '<div class="prod-foot">' +
              '<span class="prod-price">' + esc(money(p, defaultCurrency)) + "</span>" +
              '<a class="btn btn-primary prod-buy" href="' + esc(url) + '" target="_blank" rel="noopener">' + buyLabel + "</a>" +
            "</div>" +
          "</div>" +
        "</article>";
      }).join("");
    grid.innerHTML = html;
  }

  function boot() {
    getJSON(BASE + "content/settings.json").catch(function () { return {}; }).then(function (settings) {
      if (settings && settings.shop_enabled === false) {
        var grid = document.getElementById("shop-grid");
        if (grid) grid.innerHTML = '<p class="shop-empty">' +
          (LANG === "fa" ? "فروشگاه به‌زودی." : "The shop is coming soon.") + "</p>";
        return;
      }
      getJSON(BASE + "assets/shop-manifest.json").then(function (man) {
        var skus = (man && man.products) || [];
        return Promise.all(skus.map(function (sku) {
          return getJSON(BASE + "content/products/" + sku + ".json").catch(function () { return null; });
        })).then(function (list) {
          render(list.filter(Boolean), settings);
        });
      }).catch(function (e) { console.warn("[shop] manifest:", e.message); });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
