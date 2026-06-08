/* ============================================================
   translate.js — Translation Helper for content.json & faq.json
   Fills the paired {en, fa} fields automatically using the free,
   keyless MyMemory API (CORS-enabled). You review, download, and
   commit the updated files. This runs only on translate.html — it
   is NOT part of the public site.
   ============================================================ */
(function () {
  "use strict";

  var FILES = ["content.json", "faq.json"];
  var data = {};            // filename -> parsed JSON
  var logEl, statusEl, emailEl;

  function log(msg) { logEl.textContent += msg + "\n"; logEl.scrollTop = logEl.scrollHeight; }
  function setStatus(s) { statusEl.textContent = s; }

  function getJSON(url) {
    return fetch(url + "?t=" + Date.now(), { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status + " for " + url);
      return r.json();
    });
  }

  // recursively collect every { en, fa } leaf pair
  function collectPairs(node, out) {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) { node.forEach(function (n) { collectPairs(n, out); }); return; }
    var keys = Object.keys(node);
    if (keys.indexOf("en") !== -1 && keys.indexOf("fa") !== -1 &&
        typeof node.en !== "object" && typeof node.fa !== "object") {
      out.push(node);
      return;
    }
    keys.forEach(function (k) { collectPairs(node[k], out); });
  }

  function delay(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function translateText(text, from, to) {
    if (!text || !text.trim()) return Promise.resolve("");
    var email = (emailEl.value || "").trim();
    var url = "https://api.mymemory.translated.net/get?q=" + encodeURIComponent(text) +
      "&langpair=" + from + "|" + to + (email ? "&de=" + encodeURIComponent(email) : "");
    return fetch(url).then(function (r) { return r.json(); }).then(function (j) {
      if (j && j.responseData && j.responseData.translatedText) {
        // MyMemory returns warnings in caps sometimes; guard against obvious errors
        var t = j.responseData.translatedText;
        if (/MYMEMORY WARNING|QUERY LENGTH LIMIT|INVALID/i.test(t)) throw new Error(t);
        return t;
      }
      throw new Error("no translation");
    });
  }

  function run(dir, mode) {
    var from = dir === "en2fa" ? "en" : "fa";
    var to = dir === "en2fa" ? "fa" : "en";
    var pairs = [];
    FILES.forEach(function (f) { if (data[f]) collectPairs(data[f], pairs); });

    // queue only the pairs that need work
    var queue = pairs.filter(function (p) {
      if (!p[from] || !String(p[from]).trim()) return false;
      if (mode === "empty") return !p[to] || !String(p[to]).trim();
      return true; // overwrite mode
    });

    if (!queue.length) { setStatus("Nothing to translate — every field already has " + to.toUpperCase() + " text."); return; }
    setStatus("Translating " + queue.length + " field(s) " + from.toUpperCase() + " → " + to.toUpperCase() + "…");
    log("\n--- " + from.toUpperCase() + " → " + to.toUpperCase() + " (" + queue.length + " fields) ---");

    var i = 0;
    function next() {
      if (i >= queue.length) {
        setStatus("Done. Review below, then download the updated files.");
        document.getElementById("downloads").style.display = "flex";
        return;
      }
      var p = queue[i];
      translateText(p[from], from, to).then(function (t) {
        p[to] = t;
        log("✓ " + p[from].slice(0, 42) + (p[from].length > 42 ? "…" : "") + "  →  " + t.slice(0, 42));
      }).catch(function (e) {
        log("✗ skipped (" + e.message.slice(0, 40) + ")");
      }).then(function () {
        i++;
        setStatus("Translating… " + i + " / " + queue.length);
        return delay(450); // be gentle with the free API rate limit
      }).then(next);
    }
    next();
  }

  function download(file) {
    var blob = new Blob([JSON.stringify(data[file], null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = file;
    a.click();
  }

  document.addEventListener("DOMContentLoaded", function () {
    logEl = document.getElementById("log");
    statusEl = document.getElementById("status");
    emailEl = document.getElementById("email");

    Promise.all(FILES.map(function (f) {
      return getJSON(f).then(function (j) { data[f] = j; }).catch(function (e) { log("Could not load " + f + ": " + e.message); });
    })).then(function () { setStatus("Loaded content.json and faq.json. Choose a direction below."); });

    document.getElementById("btn-en2fa").addEventListener("click", function () {
      run("en2fa", document.querySelector('input[name="mode"]:checked').value);
    });
    document.getElementById("btn-fa2en").addEventListener("click", function () {
      run("fa2en", document.querySelector('input[name="mode"]:checked').value);
    });
    document.getElementById("dl-content").addEventListener("click", function () { download("content.json"); });
    document.getElementById("dl-faq").addEventListener("click", function () { download("faq.json"); });
  });
})();
