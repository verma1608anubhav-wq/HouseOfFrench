(function () {
  "use strict";

  document.getElementById("year").textContent = new Date().getFullYear();

  /* ---------------- Mobile nav ---------------- */
  var toggle = document.getElementById("navToggle");
  var nav = document.getElementById("primaryNav");

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------------- Review carousel ----------------
     Every card sits at the centre of the stage and is shifted out to its
     slot by transform, so moving to another review only animates
     transforms. Offsets wrap around, keeping the active card in the middle. */
  var reviews = document.querySelector(".reviews");

  if (reviews) {
    var stage = reviews.querySelector(".reviews-stage");
    var reviewCards = Array.prototype.slice.call(stage.children);
    var status = reviews.querySelector(".reviews-status");
    var count = reviewCards.length;
    var half = Math.floor(count / 2);
    var active = 0;

    var layoutReviews = function () {
      var step = reviewCards[0].offsetWidth * 0.62;

      reviewCards.forEach(function (card, i) {
        var offset = ((i - active + count + half) % count) - half;
        var isActive = offset === 0;
        var lift = isActive ? -26 : (offset % 2 ? 20 : 8);
        var tilt = isActive ? 0 : (offset % 2 ? 2.5 : -2.5);

        card.style.transform = "translate(" + offset * step + "px, " + lift + "px) rotate(" + tilt + "deg)";
        card.style.zIndex = count - Math.abs(offset);
        card.style.opacity = Math.abs(offset) > 3 ? 0 : 1;
        card.classList.toggle("is-active", isActive);
        card.setAttribute("aria-current", isActive ? "true" : "false");
      });

      status.textContent = active + 1 + " of " + count;
    };

    var showReview = function (index) {
      active = (index + count) % count;
      layoutReviews();
    };

    var dragStartX = null;
    var dragged = false;

    stage.addEventListener("pointerdown", function (event) {
      dragStartX = event.clientX;
      dragged = false;
    });
    stage.addEventListener("pointerup", function (event) {
      if (dragStartX === null) return;
      var dx = event.clientX - dragStartX;
      dragStartX = null;
      if (Math.abs(dx) > 40) {
        dragged = true;
        showReview(active + (dx < 0 ? 1 : -1));
      }
    });

    reviewCards.forEach(function (card, i) {
      card.addEventListener("click", function () {
        if (!dragged && i !== active) showReview(i);
      });
    });

    reviews.querySelectorAll("[data-dir]").forEach(function (button) {
      button.addEventListener("click", function () {
        showReview(active + Number(button.getAttribute("data-dir")));
      });
    });

    reviews.addEventListener("keydown", function (event) {
      if (event.key === "ArrowLeft") showReview(active - 1);
      if (event.key === "ArrowRight") showReview(active + 1);
    });

    layoutReviews();
    window.addEventListener("resize", layoutReviews);
  }

  /* ---------------- Stacked cards ----------------
     A sticky card pins its top edge to the top of the viewport, so any
     content below the fold can never be reached while it is pinned - the
     next card slides over it first. Cards taller than the viewport must
     therefore pin LATE: only once their bottom edge reaches the bottom of
     the screen, by which point everything in them has scrolled into view.
     That offset depends on each card's own height, which CSS can't express,
     so it is set here.

     Every card also gets trailing space, which is what it rests on - the
     next card can only start covering it once that space has scrolled by.
     Without it a card is covered the instant it lands, which reads as one
     card snapping straight into the next with no time to read either. */
  var CARD_REST = 0.4; // of a viewport, spent with the card fully visible
  var cards = Array.prototype.slice.call(document.querySelectorAll(".stack-card"));

  function readCardGap() {
    var probe = document.createElement("div");
    probe.style.cssText = "position:absolute;visibility:hidden;height:var(--card-gap-y)";
    document.body.appendChild(probe);
    var gap = probe.offsetHeight;
    document.body.removeChild(probe);
    return gap;
  }

  function syncStackOffsets() {
    var gap = readCardGap();
    var viewport = window.innerHeight;

    cards.forEach(function (card, i) {
      var height = card.getBoundingClientRect().height;
      // The last card is never covered by another, so its rest would just
      // sit at the foot of the page as dead space - the footer's own gap
      // is what separates it there.
      var isLast = i === cards.length - 1;

      card.style.top = Math.min(gap, viewport - height - gap) + "px";
      card.style.marginBottom = isLast ? "" : Math.round(viewport * CARD_REST) + "px";
    });
  }

  if (cards.length) {
    syncStackOffsets();

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(syncStackOffsets);
    }
    window.addEventListener("load", syncStackOffsets);

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(syncStackOffsets, 150);
    });
  }
})();
