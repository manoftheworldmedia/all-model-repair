/* ============================================================
   cms.js — renders editable content from JSON (Pages CMS)
   Works on plain GitHub Pages, no build step.
   Language is read from <html lang="en|fa">. English loads
   content.json + faq.json; Farsi loads content.fa.json + faq.fa.json.
   Everything is progressive enhancement: if a fetch fails, the
   static HTML already in the page remains as a fallback.
   ============================================================ */
(function () {
  "use strict";

  var LANG = (document.documentElement.getAttribute("lang") || "en").toLowerCase().indexOf("fa") === 0 ? "fa" : "en";
  var CONTENT_FILE = "content.json";
  var FAQ_FILE = "faq.json";

  // paired fields: { en, fa } -> the current language's value (falls back to en)
  function pick(v) {
    if (v && typeof v === "object" && !Array.isArray(v) && ("en" in v || "fa" in v)) {
      return v[LANG] != null && v[LANG] !== "" ? v[LANG] : v.en;
    }
    return v;
  }

  // FAQ category tab labels per language (order matters)
  var FAQ_CATS = {
    en: [
      { id: "general", label: "General" },
      { id: "repairs", label: "Repairs & Maintenance" },
      { id: "detailing", label: "Detailing & Ceramic" },
      { id: "trust", label: "Trust & Service" }
    ],
    fa: [
      { id: "general", label: "عمومی" },
      { id: "repairs", label: "تعمیر و نگهداری" },
      { id: "detailing", label: "دیتیلینگ و سرامیک" },
      { id: "trust", label: "اعتماد و خدمات" }
    ]
  };

  // Service icon library (keys referenced from content.json)
  var ICONS = {
    general: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.3L3 18l3 3 6.4-6.3a4 4 0 0 0 5.3-5.4l-2.5 2.5-2.1-.4-.4-2.1z"/>',
    brakes: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.2"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/>',
    engine: '<path d="M5 9h2l2-2h4l1 2h3l2 2v4h-2l-2 2H8l-2-2H4v-4z"/><path d="M9 7V5h4v2"/>',
    transmission: '<circle cx="7" cy="7" r="3"/><circle cx="7" cy="7" r="0.5"/><path d="M7 10v7M7 17h10l-3-3M14 7h3"/>',
    electrical: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/>',
    smog: '<path d="M3 12h6l1-3 3 6 2-3h6"/><rect x="2" y="7" width="20" height="10" rx="2"/>',
    ac: '<path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M19 5l-3 3M8 16l-3 3"/><circle cx="12" cy="12" r="3"/>',
    body: '<path d="M3 13l2-5a2 2 0 0 1 1.9-1.4h10.2A2 2 0 0 1 19 8l2 5v5a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H6v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><circle cx="7" cy="16" r="1"/><circle cx="17" cy="16" r="1"/>',
    tuneup: '<path d="M12 14a6 6 0 0 0 6-6 6 6 0 0 0-12 0 6 6 0 0 0 6 6z"/><path d="M12 8v.01M12 14v7M9 21h6"/>',
    detailing: '<path d="M12 3l1.8 4.6L18 9l-4.2 1.4L12 15l-1.8-4.6L6 9z"/><path d="M5 16l.9 2.3L8 19l-2.1.7L5 22l-.9-2.3L2 19l2.1-.7z"/>'
  };

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // turn phone numbers in plain text into tappable tel: links (for FAQ answers)
  function linkifyPhones(text) {
    var safe = esc(text);
    return safe.replace(/\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g, function (m) {
      var digits = m.replace(/\D/g, "");
      return '<a href="tel:' + digits + '">' + m + "</a>";
    });
  }

  function getJSON(url) {
    return fetch(url, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status + " for " + url);
      return r.json();
    });
  }

  function setText(sel, value) {
    if (value == null) return;
    document.querySelectorAll(sel).forEach(function (el) { el.textContent = value; });
  }

  /* ---------------- CONTENT ---------------- */
  function applyContent(c) {
    if (!c) return;

    // simple [data-cms="path"] text bindings
    document.querySelectorAll("[data-cms]").forEach(function (el) {
      var val = pick(resolve(c, el.getAttribute("data-cms")));
      if (val != null && typeof val !== "object") el.textContent = val;
    });

    // hero headline (pre + accent + post)
    if (c.hero) {
      var h = document.querySelector('[data-cms-html="hero.headline"]');
      if (h) {
        h.innerHTML = esc(pick(c.hero.headlinePre)) +
          '<span class="accent">' + esc(pick(c.hero.headlineAccent)) + "</span>" +
          esc(pick(c.hero.headlinePost));
      }
    }

    // phone — display text + tel links
    if (c.phone) {
      var digits = c.phone.replace(/\D/g, "");
      document.querySelectorAll('[data-cms-phone]').forEach(function (el) { el.textContent = c.phone; });
      document.querySelectorAll('[data-cms-tel]').forEach(function (el) { el.setAttribute("href", "tel:" + digits); });
    }
    if (c.smsPhone) {
      document.querySelectorAll('[data-cms-sms]').forEach(function (el) {
        el.setAttribute("data-sms-number", c.smsPhone);
      });
    }

    // address + map links
    if (c.address) {
      var a = c.address;
      document.querySelectorAll('[data-cms-address]').forEach(function (el) {
        el.innerHTML = esc(pick(a.street)) + "<br />" + esc(pick(a.cityLine));
      });
      if (a.mapQuery) {
        var mapUrl = "https://www.google.com/maps?q=" + encodeURIComponent(a.mapQuery);
        document.querySelectorAll('[data-cms-maplink]').forEach(function (el) { el.setAttribute("href", mapUrl); });
        document.querySelectorAll('[data-cms-mapembed]').forEach(function (el) {
          el.setAttribute("src", "https://www.google.com/maps?q=" + encodeURIComponent(a.mapQuery) + "&output=embed");
        });
      }
    }

    // services grid
    if (Array.isArray(c.services)) {
      var grid = document.querySelector("[data-cms-services]");
      if (grid) {
        grid.innerHTML = c.services.map(function (s) {
          var icon = ICONS[s.icon] || ICONS.general;
          return '<article class="svc reveal in">' +
            '<div class="svc-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + icon + "</svg></div>" +
            "<h3>" + esc(pick(s.title)) + "</h3>" +
            "<p>" + esc(pick(s.text)) + "</p>" +
            "</article>";
        }).join("");
      }
    }

    // hours table + today + open status
    if (Array.isArray(c.hours)) renderHours(c.hours);
  }

  function resolve(obj, path) {
    return path.split(".").reduce(function (o, k) { return o == null ? o : o[k]; }, obj);
  }

  function parseMinutes(t) {
    // normalize Persian/Arabic digits to ASCII
    var s = String(t).replace(/[۰-۹]/g, function (d) { return "۰۱۲۳۴۵۶۷۸۹".indexOf(d); })
                     .replace(/[٠-٩]/g, function (d) { return "٠١٢٣٤٥٦٧٨٩".indexOf(d); });
    var m = /(\d{1,2}):(\d{2})/.exec(s);
    if (!m) return null;
    var hr = parseInt(m[1], 10), min = parseInt(m[2], 10);
    var pm = /PM|عصر|ظهر|ب\.?ظ/i.test(s);
    var am = /AM|صبح|ق\.?ظ/i.test(s);
    if (pm && hr < 12) hr += 12;
    if (am && hr === 12) hr = 0;
    return hr * 60 + min;
  }

  function renderHours(hours) {
    var table = document.getElementById("hours-table");
    var todayIdx = (new Date().getDay() + 6) % 7; // Mon=0 ... Sun=6
    if (table) {
      table.innerHTML = hours.map(function (row, i) {
        return '<tr' + (i === todayIdx ? ' class="today"' : "") + "><td>" +
          esc(pick(row.day)) + "</td><td>" + esc(pick(row.hours)) + "</td></tr>";
      }).join("");
    }
    // open-now status
    var todayRow = hours[todayIdx];
    var statusEl = document.getElementById("open-status");
    var todayEl = document.getElementById("hours-today");
    if (!todayRow) return;
    var todayHours = pick(todayRow.hours);
    var isClosedDay = /closed|تعطیل|بسته/i.test(todayHours);
    var open = false, label = todayHours;
    if (!isClosedDay) {
      var parts = todayHours.split(/[–-]/);
      if (parts.length === 2) {
        var o = parseMinutes(parts[0]), cl = parseMinutes(parts[1]);
        var now = new Date(); var mins = now.getHours() * 60 + now.getMinutes();
        if (o != null && cl != null) open = mins >= o && mins < cl;
      }
    }
    var W = LANG === "fa"
      ? { openNow: "باز است", closed: "بسته است", openToday: "امروز باز است", closedToday: "امروز تعطیل", closedNow: "اکنون بسته" }
      : { openNow: "Open Now", closed: "Closed", openToday: "Open today", closedToday: "Closed today", closedNow: "Closed now" };
    if (statusEl) {
      statusEl.innerHTML = open
        ? '<span style="color:#46c46a;">●</span>&nbsp;' + W.openNow
        : '<span style="color:#c4c8d0;">●</span>&nbsp;' + W.closed;
    }
    if (todayEl) {
      todayEl.innerHTML = open
        ? '<span class="ht-open">' + W.openToday + '</span> · ' + esc(label)
        : (isClosedDay
            ? '<span class="ht-closed">' + W.closedToday + '</span>'
            : '<span class="ht-closed">' + W.closedNow + '</span> · ' + esc(label));
    }
  }

  /* ---------------- FAQ ---------------- */
  function applyFaq(data) {
    if (!data || !Array.isArray(data.items)) return;
    var items = data.items;
    var cats = FAQ_CATS[LANG] || FAQ_CATS.en;

    // 1) JSON-LD (single source of truth for schema)
    var ld = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": items.map(function (it) {
        return {
          "@type": "Question",
          "name": pick(it.question),
          "acceptedAnswer": { "@type": "Answer", "text": pick(it.answer) }
        };
      })
    };
    var s = document.createElement("script");
    s.type = "application/ld+json";
    s.id = "faq-jsonld";
    s.textContent = JSON.stringify(ld);
    var old = document.getElementById("faq-jsonld");
    if (old) old.remove();
    document.head.appendChild(s);

    // 2) On-page accordion
    var list = document.getElementById("faq-list");
    var tabsWrap = document.getElementById("faq-tabs");
    if (!list) return;

    // only show tabs that actually have items
    var present = {};
    items.forEach(function (it) { present[it.category] = true; });
    var activeCats = cats.filter(function (c) { return present[c.id]; });
    var firstCat = activeCats.length ? activeCats[0].id : null;

    if (tabsWrap) {
      tabsWrap.innerHTML = activeCats.map(function (c, i) {
        return '<button class="faq-tab' + (i === 0 ? " is-active" : "") + '" data-cat="' + c.id + '">' + esc(c.label) + "</button>";
      }).join("");
    }

    list.innerHTML = items.map(function (it) {
      var hidden = it.category === firstCat ? "" : " hidden";
      return '<div class="faq-item reveal in" data-cat="' + esc(it.category) + '"' + hidden + ">" +
        '<button class="faq-q">' + esc(pick(it.question)) + ' <span class="pm">+</span></button>' +
        '<div class="faq-a"><p>' + linkifyPhones(pick(it.answer)) + "</p></div>" +
        "</div>";
    }).join("");

    bindFaq();
  }

  function bindFaq() {
    document.querySelectorAll("#faq-list .faq-q").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var item = btn.closest(".faq-item");
        var ans = item.querySelector(".faq-a");
        var isOpen = item.classList.contains("open");
        document.querySelectorAll("#faq-list .faq-item.open").forEach(function (o) {
          o.classList.remove("open");
          o.querySelector(".faq-a").style.maxHeight = null;
        });
        if (!isOpen) {
          item.classList.add("open");
          ans.style.maxHeight = ans.scrollHeight + "px";
        }
      });
    });

    var tabs = document.querySelectorAll("#faq-tabs .faq-tab");
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var cat = tab.getAttribute("data-cat");
        tabs.forEach(function (t) { t.classList.toggle("is-active", t === tab); });
        document.querySelectorAll("#faq-list .faq-item").forEach(function (item) {
          item.hidden = item.getAttribute("data-cat") !== cat;
          item.classList.remove("open");
          var a = item.querySelector(".faq-a");
          if (a) a.style.maxHeight = null;
        });
      });
    });
  }

  /* ---------------- boot ---------------- */
  getJSON(CONTENT_FILE).then(applyContent).catch(function (e) { console.warn("[cms] content:", e.message); });
  getJSON(FAQ_FILE).then(applyFaq).catch(function (e) { console.warn("[cms] faq:", e.message); });
})();
