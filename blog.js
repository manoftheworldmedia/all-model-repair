/* ============================================================
   blog.js — static, no-build blog for GitHub Pages + Pages CMS
   Reads ALL posts from a single file: blog/posts.json
   (a { "posts": [ … ] } list managed in Pages CMS).
   No GitHub API, no repo name, works on public OR private repos.
   - Index page: element #blog-index (data-lang, optional data-posts-file)
   - Post page:  element #blog-post  (data-lang) reads ?slug=
   Each post: { slug, date, cover, category{en,fa}, title{en,fa},
                description{en,fa}, body{en,fa} }   body = markdown/HTML
   ============================================================ */
(function () {
  "use strict";

  // base path prefix for subdirectory pages ("../" on /blog/, /post/, /fa/…)
  var BASE = document.documentElement.getAttribute("data-base") || "";

  var T = {
    en: { featured: "Featured", readGuide: "Read the article", readMore: "Read article →", back: "← All articles", loading: "Loading articles…", empty: "No articles yet — check back soon.", minRead: "min read" },
    fa: { featured: "ویژه", readGuide: "خواندن مقاله", readMore: "خواندن مقاله →", back: "← همهٔ مقاله‌ها", loading: "در حال بارگذاری مقاله‌ها…", empty: "هنوز مقاله‌ای منتشر نشده — به‌زودی سر بزنید.", minRead: "دقیقه مطالعه" }
  };

  function esc(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

  function getParam(name) {
    var m = new RegExp("[?&]" + name + "=([^&]+)").exec(location.search);
    return m ? decodeURIComponent(m[1].replace(/\+/g, " ")) : "";
  }

  function cfg(el) {
    var urlLang = getParam("lang");
    var lang = (urlLang || el.getAttribute("data-lang") || "en").toLowerCase().indexOf("fa") === 0 ? "fa" : "en";
    return { lang: lang, file: BASE + (el.getAttribute("data-posts-file") || "blog/posts.json") };
  }

  // paired { en, fa } -> current language (falls back to en, then the value itself)
  function pick(v, lang) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      return (v[lang] != null && v[lang] !== "") ? v[lang] : (v.en || "");
    }
    return v == null ? "" : v;
  }

  function normCover(cover) {
    if (!cover) return "img/social-card.png";
    cover = String(cover).trim();
    if (/^https?:\/\//i.test(cover)) return cover;
    return BASE + cover.replace(/^\.?\//, "");
  }

  function fmtDate(dateStr, lang) {
    if (!dateStr) return "";
    var d = new Date(dateStr);
    if (isNaN(d)) return String(dateStr);
    try { return d.toLocaleDateString(lang === "fa" ? "fa-IR" : "en-US", { year: "numeric", month: "short" }); }
    catch (e) { return d.toISOString().slice(0, 10); }
  }

  function readingTime(body, lang) {
    var words = String(body || "").replace(/[#>*_`\-]/g, " ").trim().split(/\s+/).length;
    return Math.max(1, Math.round(words / 200)) + " " + T[lang].minRead;
  }

  function loadAll(c) {
    function parse(data) {
      var arr = Array.isArray(data) ? data : (data && data.posts) || [];
      return arr.filter(function (p) { return p && p.slug; }).sort(function (a, b) {
        return new Date(b.date || 0) - new Date(a.date || 0);
      });
    }
    // try cache-busted first (best for GitHub Pages); if that fails
    // (e.g. a host that blocks query strings), retry the plain URL.
    return fetch(c.file + "?t=" + Date.now(), { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("posts " + r.status); return r.json(); })
      .catch(function () {
        return fetch(c.file, { cache: "no-cache" }).then(function (r) {
          if (!r.ok) throw new Error("posts " + r.status); return r.json();
        });
      })
      .then(parse);
  }

  function postHref(c, slug) {
    return BASE + "post/?slug=" + encodeURIComponent(slug) + (c.lang === "fa" ? "&lang=fa" : "");
  }

  /* ---------------- INDEX ---------------- */
  function renderIndex(el) {
    var c = cfg(el), t = T[c.lang];
    el.innerHTML = '<p class="blog-loading">' + t.loading + "</p>";
    loadAll(c).then(function (posts) {
      // show only posts that have content in this language (fallback to en handled by pick)
      if (!posts.length) { el.innerHTML = '<p class="blog-loading">' + t.empty + "</p>"; return; }
      var feat = posts[0], rest = posts.slice(1);

      function card(p, featured) {
        var title = esc(pick(p.title, c.lang));
        var desc = esc(pick(p.description, c.lang));
        var cat = esc(pick(p.category, c.lang));
        var cover = esc(normCover(p.cover));
        var meta = (featured ? esc(t.featured) + " · " : "") + esc(fmtDate(p.date, c.lang)) + " · " + esc(readingTime(pick(p.body, c.lang), c.lang));
        if (featured) {
          return '<article class="feature-post">' +
            '<a class="fp-media" href="' + postHref(c, p.slug) + '"><img src="' + cover + '" alt="' + title + '" loading="lazy" />' +
            (cat ? '<span class="post-cat">' + cat + "</span>" : "") + "</a>" +
            '<div class="fp-body"><div class="post-meta">' + meta + "</div><h2>" + title + "</h2><p>" + desc + "</p>" +
            '<a class="btn btn-primary" href="' + postHref(c, p.slug) + '">' + esc(t.readGuide) + "</a></div></article>";
        }
        return '<article class="post">' +
          '<a class="post-media" href="' + postHref(c, p.slug) + '"><img src="' + cover + '" alt="' + title + '" loading="lazy" />' +
          (cat ? '<span class="post-cat">' + cat + "</span>" : "") + "</a>" +
          '<div class="post-body"><div class="post-meta">' + meta + "</div>" +
          '<h3><a href="' + postHref(c, p.slug) + '">' + title + "</a></h3><p>" + desc + "</p>" +
          '<a class="post-link" href="' + postHref(c, p.slug) + '">' + esc(t.readMore) + "</a></div></article>";
      }

      var html = card(feat, true);
      if (rest.length) html += '<div class="blog-grid">' + rest.map(function (p) { return card(p, false); }).join("") + "</div>";
      el.innerHTML = html;
    }).catch(function () {
      el.innerHTML = '<p class="blog-loading">' + t.empty + "</p>";
    });
  }

  /* ---------------- SINGLE POST ---------------- */
  function renderPost(el) {
    var c = cfg(el), t = T[c.lang];
    var slug = getParam("slug").replace(/[\/\\]/g, "").replace(/\.\./g, "").trim();
    if (!slug) { location.href = BASE + (c.lang === "fa" ? "blog-fa/" : "blog/"); return; }
    el.innerHTML = '<p class="blog-loading">' + t.loading + "</p>";
    var backHref = BASE + (c.lang === "fa" ? "blog-fa/" : "blog/");
    loadAll(c).then(function (posts) {
      var p = null;
      for (var i = 0; i < posts.length; i++) { if (posts[i].slug === slug) { p = posts[i]; break; } }
      if (!p) { el.innerHTML = '<a class="post-back" href="' + backHref + '">' + esc(t.back) + '</a><p class="blog-loading">404</p>'; return; }

      var title = pick(p.title, c.lang), desc = pick(p.description, c.lang), body = pick(p.body, c.lang);
      var cover = normCover(p.cover);
      document.title = title + " — All Model Repair";
      var dmeta = document.querySelector('meta[name="description"]');
      if (dmeta && desc) dmeta.setAttribute("content", desc);

      var bodyHtml = window.marked ? marked.parse(body) : esc(body);
      el.innerHTML =
        '<a class="post-back" href="' + backHref + '">' + esc(t.back) + "</a>" +
        '<div class="post-meta">' + esc(fmtDate(p.date, c.lang)) + " · " + esc(readingTime(body, c.lang)) +
          (pick(p.category, c.lang) ? " · " + esc(pick(p.category, c.lang)) : "") + "</div>" +
        "<h1>" + esc(title) + "</h1>" +
        (desc ? '<p class="post-lede">' + esc(desc) + "</p>" : "") +
        '<div class="post-cover"><img src="' + esc(cover) + '" alt="' + esc(title) + '" /></div>' +
        '<div class="post-content">' + bodyHtml + "</div>";

      var ld = {
        "@context": "https://schema.org", "@type": "Article",
        "headline": title, "description": desc, "datePublished": p.date,
        "image": new URL(cover, location.href).href,
        "author": { "@type": "Organization", "name": "All Model Repair" },
        "publisher": { "@type": "AutoRepair", "name": "All Model Repair", "logo": new URL(BASE + "img/logo-icon.png", location.href).href, "telephone": "+18185488242" },
        "mainEntityOfPage": location.href,
        "inLanguage": c.lang === "fa" ? "fa" : "en-US"
      };
      var s = document.createElement("script");
      s.type = "application/ld+json";
      s.textContent = JSON.stringify(ld);
      document.head.appendChild(s);
    }).catch(function () {
      el.innerHTML = '<a class="post-back" href="' + backHref + '">' + esc(t.back) + '</a><p class="blog-loading">404</p>';
    });
  }

  /* ---------- HOME PREVIEW (posts flagged for home, else latest N) ---------- */
  function renderPreview(el) {
    var c = cfg(el), t = T[c.lang];
    var limit = parseInt(el.getAttribute("data-limit") || "3", 10);
    el.className = "blog-grid";
    el.innerHTML = '<p class="blog-loading">' + t.loading + "</p>";
    loadAll(c).then(function (posts) {
      if (!posts.length) { el.innerHTML = ""; return; }
      // prefer posts the owner flagged "show on home"; if none flagged, show newest
      var flagged = posts.filter(function (p) { return p.home === true || p.home === "true"; });
      var show = (flagged.length ? flagged : posts).slice(0, limit);
      el.innerHTML = show.map(function (p) {
        var title = esc(pick(p.title, c.lang)), desc = esc(pick(p.description, c.lang));
        var cat = esc(pick(p.category, c.lang)), cover = esc(normCover(p.cover));
        var meta = esc(fmtDate(p.date, c.lang)) + " · " + esc(readingTime(pick(p.body, c.lang), c.lang));
        return '<article class="post reveal in">' +
          '<a class="post-media" href="' + postHref(c, p.slug) + '"><img src="' + cover + '" alt="' + title + '" loading="lazy" />' +
          (cat ? '<span class="post-cat">' + cat + "</span>" : "") + "</a>" +
          '<div class="post-body"><div class="post-meta">' + meta + "</div>" +
          '<h3><a href="' + postHref(c, p.slug) + '">' + title + "</a></h3><p>" + desc + "</p>" +
          '<a class="post-link" href="' + postHref(c, p.slug) + '">' + esc(t.readMore) + "</a></div></article>";
      }).join("");
    }).catch(function () { el.innerHTML = ""; });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var idx = document.getElementById("blog-index");
    var post = document.getElementById("blog-post");
    var preview = document.getElementById("blog-preview") || document.getElementById("blog-home");
    if (idx) renderIndex(idx);
    if (post) renderPost(post);
    if (preview) renderPreview(preview);
  });
})();
