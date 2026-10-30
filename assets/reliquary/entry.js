(() => {
  "use strict";

  const entry = document.getElementById("reliquaryEntry");
  const openButton = document.getElementById("reliquaryOpen");
  const stage = document.getElementById("reliquaryStage");
  const status = document.getElementById("reliquaryStatus");
  const about = document.getElementById("aboutView");
  if (!entry || !openButton || !stage) return;

  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  let openingTimer = 0;
  let arrivalTimer = 0;
  let tiltFrame = 0;
  let focusFrame = 0;
  let opening = false;

  function resetTilt() {
    cancelAnimationFrame(tiltFrame);
    entry.style.removeProperty("--reliquary-rotate-x");
    entry.style.removeProperty("--reliquary-rotate-y");
  }

  function resetEntry() {
    clearTimeout(openingTimer);
    openingTimer = 0;
    opening = false;
    entry.classList.remove("is-opening");
    openButton.disabled = false;
    openButton.removeAttribute("aria-busy");
    if (status) status.textContent = "";
    resetTilt();
  }

  function enterPortfolio() {
    if (!document.body.classList.contains("is-home-page")) {
      resetEntry();
      return;
    }
    openingTimer = 0;
    navigatePortfolioPage("about", { animate: false });
    if (!motionPreference.matches && about) {
      about.classList.add("is-reliquary-arrival");
      clearTimeout(arrivalTimer);
      arrivalTimer = window.setTimeout(() => {
        about.classList.remove("is-reliquary-arrival");
        arrivalTimer = 0;
      }, 700);
    }
  }

  openButton.addEventListener("click", () => {
    if (opening || !document.body.classList.contains("is-home-page")) return;
    opening = true;
    openButton.disabled = true;
    openButton.setAttribute("aria-busy", "true");
    if (status) status.textContent = "Abrindo o portfólio…";
    resetTilt();
    if (motionPreference.matches) {
      enterPortfolio();
      return;
    }
    entry.classList.add("is-opening");
    openingTimer = window.setTimeout(enterPortfolio, 1000);
  });

  stage.addEventListener("pointermove", event => {
    if (opening || motionPreference.matches || event.pointerType !== "mouse") return;
    const bounds = stage.getBoundingClientRect();
    const horizontal = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1));
    const vertical = Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1));
    cancelAnimationFrame(tiltFrame);
    tiltFrame = requestAnimationFrame(() => {
      entry.style.setProperty("--reliquary-rotate-x", `${(-vertical * 4).toFixed(2)}deg`);
      entry.style.setProperty("--reliquary-rotate-y", `${(-4 + horizontal * 7).toFixed(2)}deg`);
    });
  }, { passive: true });
  stage.addEventListener("pointerleave", resetTilt);

  // Route changes cancel pending openings and transfer focus out of hidden views.
  document.addEventListener("portfolio:pagechange", event => {
    const page = event.detail.page;
    resetEntry();
    if (page !== "about") {
      clearTimeout(arrivalTimer);
      arrivalTimer = 0;
      about?.classList.remove("is-reliquary-arrival");
    }
    cancelAnimationFrame(focusFrame);
    focusFrame = requestAnimationFrame(() => {
      const viewIds = {
        about: "aboutView", works: "workView", contact: "contactView", case: "caseView",
        "case-newsletter": "newsletterCaseView", "case-docs": "docsCaseView",
        "case-guides": "guidesCaseView"
      };
      const target = page === "home" ? openButton : document.getElementById(viewIds[page])?.querySelector("h1");
      if (target) {
        if (page !== "home") target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      }
    });
  });

  motionPreference.addEventListener("change", () => {
    resetTilt();
    if (opening && motionPreference.matches) {
      clearTimeout(openingTimer);
      enterPortfolio();
    }
  });
})();
