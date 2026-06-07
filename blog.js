/* ============================================================
   blog.js — static, no-build blog for GitHub Pages + Pages CMS
   - Index pages: element #blog-index with data-posts-dir, data-lang,
     data-repo ("owner/repo"), data-branch.
   - Post pages: element #blog-post with the same data-* ; reads ?slug=.
   Posts are markdown files with YAML frontmatter in the posts dir.
   Discovery: GitHub Contents API (so CMS-added posts appear with no
   rebuild); falls back to <postsDir>/posts.json if the API is
   unavailable (e.g. before first push / rate-limited).
   Markdown: marked. Frontmatter: js-yaml.
   ============================================================ */
(function () {
  "use strict";

  var T = {
    en: { featured: "Featured", readGuide: "Read the article", readMore: "Read article →", back: "← All articles", loading: "Loading articles…", empty: "No articles yet — check back soon.", minRead: "min read" },
    fa: { featured: "ویژه", readGuide: "خواندن مقاله", readMore: "خواندن مقاله →", back: "← همهٔ مقاله‌ها", loading: "در حال بارگذاری مقاله‌ها…", empty: "هنوز مقاله‌ای منتشر نشده — به‌زودی سر بزنید.", minRead: "دقیقه مطالعه" }
  };

  function esc(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

  function getParam(name) {
    var m = new RegExp("[?&]" + name + "=([^&]+)").exec(location.search);
    return m ? decodeURIComponent(m[1].replace(/\+/g, " ")) : "";
  }

  function parseFrontmatter(raw) {
    var fm = {}, body = raw;
    var m = /^\uFEFF?---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
    if (m) {
      try { fm = (window.jsyaml ? jsyaml.load(m[1]) : {}) || {}; } catch (e) { fm = {}; }
      body = m[2];
    }
    return { fm: fm, body: body };
  }

  function fmtDate(dateStr, lang) {
    if (!dateStr) return "";
    var d = new Date(dateStr);
    if (isNaN(d)) return String(dateStr);
    try { return d.toLocaleDateString(lang === "fa" ? "fa-IR" : "en-US", { year: "numeric", month: "short" }); }
    catch (e) { return d.toISOString().slice(0, 10); }
  }

  function readingTime(body, lang) {
    var words = (body || "").trim().split(/\s+/).length;
    var mins = Math.max(1, Math.round(words / 200));
    return mins + " " + T[lang].minRead;
  }

  function cfg(el) {
    var repo = (el.getAttribute("data-repo") || "").split("/");
    var urlLang = getParam("lang");
    var lang = (urlLang || el.getAttribute("data-lang") || "en").toLowerCase().indexOf("fa") === 0 ? "fa" : "en";
    var dir = (el.getAttribute("data-posts-dir") || "blog/posts");
    if (lang === "fa" && el.getAttribute("data-posts-dir-fa")) dir = el.getAttribute("data-posts-dir-fa");
    return {
      dir: dir.replace(/\/$/, ""),
      lang: lang,
      owner: repo[0] || "",
      repo: repo[1] || "",
      branch: el.getAttribute("data-branch") || "main"
    };
  }

  function listSlugs(c) {
    // primary: GitHub Contents API
    var api = "https://api.github.com/repos/" + c.owner + "/" + c.repo + "/contents/" + c.dir + "?ref=" + c.branch;
    return fetch(api, { headers: { "Accept": "application/vnd.github+json" } })
      .then(function (r) { if (!r.ok) throw new Error("api " + r.status); return r.json(); })
      .then(function (arr) {
        if (!Array.isArray(arr)) throw new Error("api shape");
        return arr.filter(function (f) { return /\.md$/i.test(f.name); }).map(function (f) { return f.name; });
      })
      .catch(function () {
        // fallback: manifest committed alongside posts
        return fetch(c.dir + "/posts.json", { cache: "no-cache" })
          .then(function (r) { if (!r.ok) throw new Error("manifest " + r.status); return r.json(); })
          .then(function (arr) { return (arr || []).map(function (n) { return /\.md$/i.test(n) ? n : n + ".md"; }); })
          .catch(function () { return []; });
      });
  }

  function fetchPost(c, file) {
    return fetch(c.dir + "/" + file, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error("post " + r.status);
      return r.text();
    }).then(function (raw) {
      var p = parseFrontmatter(raw);
      return {
        slug: file.replace(/\.md$/i, ""),
        title: p.fm.title || file.replace(/\.md$/i, ""),
        date: p.fm.date || "",
        description: p.fm.description || "",
        cover: p.fm.cover || "img/social-card.png",
        category: p.fm.category || (Array.isArray(p.fm.tags) ? p.fm.tags[0] : "") || "",
        tags: Array.isArray(p.fm.tags) ? p.fm.tags : [],
        body: p.body
      };
    });
  }

  function loadAll(c) {
    return listSlugs(c).then(function (files) {
      return Promise.all(files.map(function (f) {
        return fetchPost(c, f).catch(function () { return null; });
      }));
    }).then(function (posts) {
      return posts.filter(Boolean).sort(function (a, b) {
        return new Date(b.date || 0) - new Date(a.date || 0);
      });
    });
  }

  function postHref(c, slug) {
    return "post.html?slug=" + encodeURIComponent(slug) + (c.lang === "fa" ? "&lang=fa" : "");
  }

  /* ---------------- INDEX ---------------- */
  function renderIndex(el) {
    var c = cfg(el);
    var t = T[c.lang];
    el.innerHTML = '<p class="blog-loading">' + t.loading + "</p>";
    loadAll(c).then(function (posts) {
      if (!posts.length) { el.innerHTML = '<p class="blog-loading">' + t.empty + "</p>"; return; }
      var feat = posts[0], rest = posts.slice(1);
      var html = "";
      html += '<article class="feature-post">' +
        '<a class="fp-media" href="' + postHref(c, feat.slug) + '">' +
          '<img src="' + esc(feat.cover) + '" alt="' + esc(feat.title) + '" loading="lazy" />' +
          (feat.category ? '<span class="post-cat">' + esc(feat.category) + "</span>" : "") +
        "</a>" +
        '<div class="fp-body">' +
          '<div class="post-meta">' + esc(t.featured) + " · " + esc(fmtDate(feat.date, c.lang)) + " · " + esc(readingTime(feat.body, c.lang)) + "</div>" +
          "<h2>" + esc(feat.title) + "</h2>" +
          "<p>" + esc(feat.description) + "</p>" +
          '<a class="btn btn-primary" href="' + postHref(c, feat.slug) + '">' + esc(t.readGuide) + "</a>" +
        "</div>" +
      "</article>";

      if (rest.length) {
        html += '<div class="blog-grid">' + rest.map(function (p) {
          return '<article class="post">' +
            '<a class="post-media" href="' + postHref(c, p.slug) + '">' +
              '<img src="' + esc(p.cover) + '" alt="' + esc(p.title) + '" loading="lazy" />' +
              (p.category ? '<span class="post-cat">' + esc(p.category) + "</span>" : "") +
            "</a>" +
            '<div class="post-body">' +
              '<div class="post-meta">' + esc(fmtDate(p.date, c.lang)) + " · " + esc(readingTime(p.body, c.lang)) + "</div>" +
              '<h3><a href="' + postHref(c, p.slug) + '">' + esc(p.title) + "</a></h3>" +
              "<p>" + esc(p.description) + "</p>" +
              '<a class="post-link" href="' + postHref(c, p.slug) + '">' + esc(t.readMore) + "</a>" +
            "</div>" +
          "</article>";
        }).join("") + "</div>";
      }
      el.innerHTML = html;
    });
  }

  /* ---------------- SINGLE POST ---------------- */
  function renderPost(el) {
    var c = cfg(el);
    var t = T[c.lang];
    var slug = getParam("slug").replace(/[^a-z0-9\-_]/gi, "");
    if (!slug) { location.href = c.lang === "fa" ? "blog-fa.html" : "blog.html"; return; }
    el.innerHTML = '<p class="blog-loading">' + t.loading + "</p>";
    fetchPost(c, slug + ".md").then(function (p) {
      document.title = p.title + " — All Model Repair";
      var desc = document.querySelector('meta[name="description"]');
      if (desc && p.description) desc.setAttribute("content", p.description);

      var bodyHtml = window.marked ? marked.parse(p.body) : esc(p.body);
      var backHref = c.lang === "fa" ? "blog-fa.html" : "blog.html";
      el.innerHTML =
        '<a class="post-back" href="' + backHref + '">' + esc(t.back) + "</a>" +
        '<div class="post-meta">' + esc(fmtDate(p.date, c.lang)) + " · " + esc(readingTime(p.body, c.lang)) + (p.category ? " · " + esc(p.category) : "") + "</div>" +
        "<h1>" + esc(p.title) + "</h1>" +
        (p.description ? '<p class="post-lede">' + esc(p.description) + "</p>" : "") +
        '<div class="post-cover"><img src="' + esc(p.cover) + '" alt="' + esc(p.title) + '" /></div>' +
        '<div class="post-content">' + bodyHtml + "</div>";

      var ld = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": p.title,
        "description": p.description,
        "datePublished": p.date,
        "image": new URL(p.cover, location.href).href,
        "author": { "@type": "Organization", "name": "All Model Repair" },
        "publisher": {
          "@type": "AutoRepair", "name": "All Model Repair",
          "logo": new URL("img/logo-icon.png", location.href).href,
          "telephone": "+18185488242"
        },
        "mainEntityOfPage": location.href,
        "inLanguage": c.lang === "fa" ? "fa" : "en-US"
      };
      var s = document.createElement("script");
      s.type = "application/ld+json";
      s.textContent = JSON.stringify(ld);
      document.head.appendChild(s);
    }).catch(function () {
      el.innerHTML = '<a class="post-back" href="' + (c.lang === "fa" ? "blog-fa.html" : "blog.html") + '">' + esc(t.back) + "</a><p class=\"blog-loading\">404</p>";
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var idx = document.getElementById("blog-index");
    var post = document.getElementById("blog-post");
    if (idx) renderIndex(idx);
    if (post) renderPost(post);
  });
})();
