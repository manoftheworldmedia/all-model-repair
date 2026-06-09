/* ============================================================
   nav.js — clean in-page anchor scrolling
   • offsets for the sticky nav so targets aren't hidden
   • re-corrects after lazy images settle (fixes "two clicks")
   • strips the #hash from the URL after scrolling
   Load only on pages that HAVE the in-page sections (home + fa home).
   ============================================================ */
(function () {
  "use strict";

  function navOffset() {
    var n = document.getElementById("nav");
    return (n ? n.getBoundingClientRect().height : 0) + 14;
  }

  function scrollToId(id) {
    if (id === "top" || id === "") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return true;
    }
    var el = document.getElementById(id);
    if (!el) return false;
    function go() {
      var y = el.getBoundingClientRect().top + window.pageYOffset - navOffset();
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    }
    go();
    // re-correct after images/layout below settle so we land precisely in one click
    setTimeout(go, 300);
    setTimeout(go, 700);
    return true;
  }

  function cleanUrl() {
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
  }

  // one delegated listener — also catches dynamically-added links (blog cards)
  document.addEventListener("click", function (e) {
    var a = e.target.closest ? e.target.closest("a[href]") : null;
    if (!a) return;
    var href = a.getAttribute("href");
    if (!href) return;
    var hi = href.indexOf("#");
    if (hi < 0) return;
    var path = href.slice(0, hi);
    var id = href.slice(hi + 1);
    if (!id) return;
    var here = location.pathname.split("/").pop();
    var samePage = path === "" || path === "." || path === "./" || path === location.pathname || path === here;
    if (!samePage) return; // cross-page hash links navigate normally
    if (id === "top" || document.getElementById(id)) {
      e.preventDefault();
      scrollToId(id);
      cleanUrl();
      var nm = document.getElementById("nav-mobile");
      var nt = document.getElementById("nav-toggle");
      if (nm) nm.classList.remove("open");
      if (nt) nt.setAttribute("aria-expanded", "false");
    }
  });

  // arriving with a hash (e.g. from another page): offset-scroll, then clean URL
  if (location.hash.length > 1) {
    var id0 = location.hash.slice(1).replace(/[^\w-]/g, "");
    window.addEventListener("load", function () {
      setTimeout(function () { if (scrollToId(id0)) cleanUrl(); }, 90);
    });
  }
})();
