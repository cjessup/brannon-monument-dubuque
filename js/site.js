(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.textContent = open ? "Close" : "Menu";
    });
    var links = nav.querySelectorAll("a");
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.textContent = "Menu";
      });
    }
  }

  if (!reduce && "IntersectionObserver" in window) {
    var nodes = document.querySelectorAll(".reveal");
    var observer = new IntersectionObserver(function (entries) {
      for (var e = 0; e < entries.length; e++) {
        if (!entries[e].isIntersecting) continue;
        entries[e].target.classList.remove("is-pending");
        entries[e].target.classList.add("is-in");
        observer.unobserve(entries[e].target);
      }
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    for (var n = 0; n < nodes.length; n++) {
      nodes[n].classList.add("is-pending");
      nodes[n].style.transitionDelay = (n % 4) * 70 + "ms";
      observer.observe(nodes[n]);
    }
  }

  var slider = document.querySelector("[data-slider]");
  if (slider && !reduce) {
    var slides = slider.querySelectorAll("img");
    if (slides.length > 1) {
      slider.classList.add("is-fade");
      var current = 0;
      var timer = null;
      var paused = false;
      function show(index) {
        current = (index + slides.length) % slides.length;
        for (var s = 0; s < slides.length; s++) {
          if (s === current) slides[s].classList.add("is-shown");
          else slides[s].classList.remove("is-shown");
        }
      }
      function queue() {
        clearTimeout(timer);
        if (paused) return;
        timer = setTimeout(function () {
          show(current + 1);
          queue();
        }, 5500);
      }
      show(0);
      queue();
      slider.addEventListener("mouseenter", function () { paused = true; clearTimeout(timer); });
      slider.addEventListener("mouseleave", function () { paused = false; queue(); });
      var prev = slider.querySelector("[data-prev]");
      var next = slider.querySelector("[data-next]");
      var pauseBtn = slider.querySelector("[data-pause]");
      if (prev) prev.addEventListener("click", function () { show(current - 1); queue(); });
      if (next) next.addEventListener("click", function () { show(current + 1); queue(); });
      if (pauseBtn) {
        pauseBtn.addEventListener("click", function () {
          paused = !paused;
          pauseBtn.textContent = paused ? "Play" : "Pause";
          pauseBtn.setAttribute("aria-pressed", paused ? "true" : "false");
          if (paused) clearTimeout(timer);
          else queue();
        });
      }
    }
  }

  var lightbox = document.querySelector(".lightbox");
  if (lightbox) {
    var lightImg = lightbox.querySelector("img");
    var closeBtn = lightbox.querySelector(".lightbox-close");
    var prevBtn = lightbox.querySelector("[data-light-prev]");
    var nextBtn = lightbox.querySelector("[data-light-next]");
    var group = [];
    var index = 0;
    var lastFocus = null;

    function render() {
      var item = group[index];
      if (!item) return;
      if (reduce) {
        lightImg.src = item.src;
        lightImg.alt = item.alt;
        return;
      }
      lightImg.classList.add("is-fading");
      var pre = new Image();
      pre.onload = function () {
        lightImg.src = pre.src;
        lightImg.alt = item.alt;
        window.requestAnimationFrame(function () {
          lightImg.classList.remove("is-fading");
        });
      };
      pre.onerror = function () {
        lightImg.classList.remove("is-fading");
      };
      pre.src = item.src;
    }

    function openAt(list, i, opener) {
      group = list;
      index = i;
      lastFocus = opener;
      render();
      lightbox.hidden = false;
      document.body.classList.add("lightbox-open");
      closeBtn.focus();
    }

    function close() {
      lightbox.hidden = true;
      document.body.classList.remove("lightbox-open");
      if (lastFocus) lastFocus.focus();
    }

    function shift(step) {
      if (!group.length) return;
      index = (index + step + group.length) % group.length;
      render();
    }

    var buttons = document.querySelectorAll("[data-full]");
    for (var b = 0; b < buttons.length; b++) {
      buttons[b].addEventListener("click", function () {
        var name = this.getAttribute("data-group") || "gallery";
        var all = document.querySelectorAll('[data-group="' + name + '"]');
        var visible = [];
        for (var k = 0; k < all.length; k++) {
          if (!all[k].closest(".is-hidden") && !all[k].closest("[hidden]")) visible.push(all[k]);
        }
        var list = [];
        var at = 0;
        for (var v = 0; v < visible.length; v++) {
          var img = visible[v].tagName === "IMG" ? visible[v] : visible[v].querySelector("img");
          list.push({
            src: visible[v].getAttribute("data-full"),
            alt: img ? img.alt : ""
          });
          if (visible[v] === this) at = v;
        }
        openAt(list, at, this);
      });
    }

    closeBtn.addEventListener("click", close);
    prevBtn.addEventListener("click", function () { shift(-1); });
    nextBtn.addEventListener("click", function () { shift(1); });
    lightbox.addEventListener("click", function (event) {
      if (event.target === lightbox) close();
    });
    document.addEventListener("keydown", function (event) {
      if (lightbox.hidden) return;
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") shift(-1);
      if (event.key === "ArrowRight") shift(1);
    });
  }

  var filterBar = document.querySelector("[data-filters]");
  if (filterBar) {
    var shots = document.querySelectorAll(".shot");
    var empty = document.querySelector(".empty-note");
    var filterButtons = filterBar.querySelectorAll("button");
    var gallery = document.querySelector(".gallery");
    function paint(cat) {
      var shown = 0;
      for (var s = 0; s < shots.length; s++) {
        var match = cat === "all" || shots[s].getAttribute("data-cat") === cat;
        shots[s].classList.toggle("is-hidden", !match);
        if (match) shown++;
      }
      if (empty) empty.classList.toggle("is-on", shown === 0);
    }
    function apply(cat) {
      if (reduce || !gallery) {
        paint(cat);
        return;
      }
      gallery.style.opacity = "0";
      setTimeout(function () {
        paint(cat);
        gallery.style.opacity = "1";
      }, 180);
    }
    for (var f = 0; f < filterButtons.length; f++) {
      filterButtons[f].addEventListener("click", function () {
        for (var j = 0; j < filterButtons.length; j++) {
          filterButtons[j].setAttribute("aria-pressed", filterButtons[j] === this ? "true" : "false");
        }
        apply(this.getAttribute("data-filter"));
      });
    }
  }

  var videoButtons = document.querySelectorAll("[data-video]");
  var panes = document.querySelectorAll(".video-pane");
  if (videoButtons.length && panes.length) {
    for (var vb = 0; vb < videoButtons.length; vb++) {
      videoButtons[vb].addEventListener("click", function (event) {
        if (!this.getAttribute("data-video")) return;
        event.preventDefault();
        var id = this.getAttribute("data-video");
        for (var p = 0; p < panes.length; p++) {
          panes[p].classList.toggle("is-active", panes[p].id === id);
        }
        for (var q = 0; q < videoButtons.length; q++) {
          videoButtons[q].setAttribute("aria-pressed", videoButtons[q] === this ? "true" : "false");
        }
      });
    }
  }

  var form = document.querySelector(".demo-form");
  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var result = form.querySelector(".form-result");
      if (result) {
        result.hidden = false;
        result.textContent = "This is a demo form. Nothing was sent.";
      }
    });
  }
})();
