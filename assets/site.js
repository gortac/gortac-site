(function () {
  "use strict";
  var btn = document.querySelector(".menu-btn");
  var nav = document.getElementById("mobile-nav");
  if (btn && nav) {
    btn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.setAttribute("aria-label", open ? "メニューを閉じる" : "メニューを開く");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        nav.classList.remove("open");
        btn.setAttribute("aria-expanded", "false");
        btn.setAttribute("aria-label", "メニューを開く");
      }
    });
  }
  document.querySelectorAll('a[data-line-pending]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      if (a.dataset.done) return;
      a.dataset.done = "1";
      var label = a.querySelector(".entry-action") || a.lastChild;
      var original = label.textContent;
      label.textContent = "LINEは開設準備中です";
      setTimeout(function () { label.textContent = original; delete a.dataset.done; }, 2500);
    });
  });
})();
