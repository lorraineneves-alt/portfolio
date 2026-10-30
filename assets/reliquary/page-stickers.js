(() => {
  const toggle = document.getElementById("pageStickerToggle");
  const tray = document.getElementById("pageStickerTray");
  if (!toggle || !tray) return;

  const pageRoots = new Map([
    ["about", document.getElementById("aboutView")],
    ["works", document.getElementById("workView")],
    ["case", document.getElementById("caseView")],
    ["case-newsletter", document.getElementById("newsletterCaseView")],
    ["case-docs", document.getElementById("docsCaseView")],
    ["case-guides", document.getElementById("guidesCaseView")],
    ["contact", document.getElementById("contactView")]
  ]);
  const names = {
    "orbit-left": "Estrela com órbita",
    "silver-star": "Estrela cromada",
    "orbit-right": "Estrela inclinada com órbita",
    "kuromi-mona-lisa": "Kuromi Mona Lisa",
    "kuromi-pop-art-marilyn": "Kuromi Marilyn em pop art",
    "kuromi-joan-of-arc": "Kuromi Joana d’Arc",
    "kuromi-pearl-earring": "Kuromi com brinco de pérola",
    "kuromi-birth-of-venus": "Kuromi no Nascimento de Vênus"
  };
  const retiredOptions = new Set(["orbit-left", "silver-star", "orbit-right"]);
  tray.querySelectorAll("[data-sticker-variant]").forEach(button => {
    if (retiredOptions.has(button.dataset.stickerVariant)) button.remove();
  });
  const storageKey = "lorraine-portfolio-page-stickers-v1";
  const items = [];
  const layers = new Map();
  const surface = document.querySelector(".site-shell");
  if (!surface) return;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  for (const [page, root] of pageRoots) {
    if (!root) continue;
    const layer = document.createElement("div");
    layer.className = "visitor-sticker-layer";
    layer.dataset.page = page;
    layer.setAttribute("role", "group");
    layer.setAttribute("aria-label", `Stickers adicionados à página ${page}`);
    layer.hidden = page !== currentPage();
    surface.appendChild(layer);
    layers.set(page, layer);
  }

  function currentPage() {
    if (document.body.classList.contains("is-about-page")) return "about";
    if (document.body.classList.contains("is-works-page")) return "works";
    if (document.body.classList.contains("is-contact-page")) return "contact";
    if (document.body.classList.contains("is-guides-case-page")) return "case-guides";
    if (document.body.classList.contains("is-docs-case-page")) return "case-docs";
    if (document.body.classList.contains("is-newsletter-case-page")) return "case-newsletter";
    if (document.body.classList.contains("is-case-page")) return "case";
    return null;
  }

  function saveStickers() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(items.map(({ page, variant, x, y }) => ({ page, variant, x, y }))));
    } catch {
      // Stickers still work for this visit when storage is unavailable.
    }
  }

  function positionSticker(item) {
    const layer = layers.get(item.page);
    if (!layer || !layer.clientWidth || !layer.clientHeight) return;
    const maxLeft = Math.max(0, layer.clientWidth - item.node.offsetWidth);
    const maxTop = Math.max(0, layer.clientHeight - item.node.offsetHeight);
    item.node.style.left = `${item.x * maxLeft}px`;
    item.node.style.top = `${item.y * maxTop}px`;
  }

  function moveSticker(item, left, top) {
    const layer = layers.get(item.page);
    const maxLeft = Math.max(0, layer.clientWidth - item.node.offsetWidth);
    const maxTop = Math.max(0, layer.clientHeight - item.node.offsetHeight);
    const nextLeft = clamp(left, 0, maxLeft);
    const nextTop = clamp(top, 0, maxTop);
    item.x = maxLeft ? nextLeft / maxLeft : 0;
    item.y = maxTop ? nextTop / maxTop : 0;
    item.node.style.left = `${nextLeft}px`;
    item.node.style.top = `${nextTop}px`;
  }

  function removeSticker(item) {
    const index = items.indexOf(item);
    if (index >= 0) items.splice(index, 1);
    item.node.remove();
    saveStickers();
    toggle.focus();
    showToast("Sticker removido");
  }

  function createSticker(page, variant, x, y) {
    const layer = layers.get(page);
    if (!layer || !names[variant]) return null;

    const node = document.createElement("div");
    node.className = "visitor-sticker";
    node.dataset.stickerVariant = variant;
    node.setAttribute("role", "group");
    node.setAttribute("tabindex", "0");
    node.setAttribute("aria-label", `${names[variant]}. Arraste ou use as setas para mover. Pressione Delete para remover.`);
    const art = document.createElement("span");
    art.className = "page-sticker-art";
    art.setAttribute("aria-hidden", "true");
    const remove = document.createElement("button");
    remove.className = "visitor-sticker-delete";
    remove.type = "button";
    remove.setAttribute("aria-label", `Remover ${names[variant]}`);
    remove.textContent = "×";
    node.append(art, remove);
    layer.appendChild(node);

    const item = { page, variant, x: clamp(x, 0, 1), y: clamp(y, 0, 1), node };
    items.push(item);
    positionSticker(item);
    remove.addEventListener("click", event => {
      event.stopPropagation();
      removeSticker(item);
    });

    let drag = null;
    node.addEventListener("pointerdown", event => {
      event.stopPropagation();
      if (event.target === remove || (event.pointerType === "mouse" && event.button !== 0)) return;
      event.preventDefault();
      drag = { x: event.clientX, y: event.clientY, left: node.offsetLeft, top: node.offsetTop };
      node.classList.add("is-dragging");
      node.setPointerCapture(event.pointerId);
      node.focus({ preventScroll: true });
    });
    node.addEventListener("pointermove", event => {
      if (!drag) return;
      moveSticker(item, drag.left + event.clientX - drag.x, drag.top + event.clientY - drag.y);
    });
    const finishDrag = () => {
      if (!drag) return;
      drag = null;
      node.classList.remove("is-dragging");
      saveStickers();
    };
    node.addEventListener("pointerup", finishDrag);
    node.addEventListener("pointercancel", finishDrag);
    node.addEventListener("keydown", event => {
      if (event.target !== node) return;
      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        removeSticker(item);
        return;
      }
      const step = event.shiftKey ? 20 : 8;
      const directions = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      const direction = directions[event.key];
      if (!direction) return;
      event.preventDefault();
      moveSticker(item, node.offsetLeft + direction[0], node.offsetTop + direction[1]);
      saveStickers();
    });
    return item;
  }

  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
    if (Array.isArray(saved)) {
      for (const sticker of saved.slice(0, 120)) {
        if (!layers.has(sticker.page) || !names[sticker.variant] || !Number.isFinite(sticker.x) || !Number.isFinite(sticker.y)) continue;
        createSticker(sticker.page, sticker.variant, sticker.x, sticker.y);
      }
    }
  } catch {
    // Private browsing and malformed saved data leave an empty canvas.
  }

  const preview = document.createElement("div");
  preview.className = "page-sticker-preview";
  preview.setAttribute("aria-hidden", "true");
  preview.innerHTML = '<span class="page-sticker-art"></span>';
  preview.hidden = true;
  document.body.appendChild(preview);
  let selectedVariant = null;

  function selectSticker(variant) {
    selectedVariant = variant;
    document.body.classList.toggle("is-placing-page-sticker", Boolean(variant));
    toggle.setAttribute("aria-pressed", String(Boolean(variant)));
    toggle.setAttribute("aria-label", variant ? "Sticker selecionado. Clique na página para posicionar ou pressione Escape para cancelar" : "Adicionar stickers à página");
    preview.hidden = true;
    if (variant) {
      preview.dataset.stickerVariant = variant;
      document.body.classList.remove("has-custom-cursor");
      document.querySelector(".canvas-cursor")?.classList.remove("is-visible", "is-pressed");
    } else {
      delete preview.dataset.stickerVariant;
    }
  }

  function canPlaceAt(target) {
    return target instanceof Element && surface.contains(target) &&
      !target.closest(".topbar, .interior-footer, .canvas-footer, .visitor-sticker, .canvas-delete-action");
  }

  function setTrayOpen(open) {
    tray.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("is-page-sticker-tray-open", open);
    if (open) tray.querySelector("button")?.focus();
  }

  toggle.addEventListener("click", () => {
    if (selectedVariant) selectSticker(null);
    setTrayOpen(tray.hidden);
  });
  document.getElementById("playButton")?.addEventListener("click", () => {
    selectSticker(null);
    setTrayOpen(false);
  });
  document.addEventListener("pointerdown", event => {
    if (!tray.hidden && !event.target.closest(".portfolio-extras")) setTrayOpen(false);
  });
  document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    if (selectedVariant) {
      selectSticker(null);
      toggle.focus();
      showToast("Colocação do sticker cancelada");
    } else if (!tray.hidden) {
      setTrayOpen(false);
      toggle.focus();
    }
  });

  tray.querySelectorAll("[data-sticker-variant]").forEach(button => {
    button.addEventListener("click", () => {
      const page = currentPage();
      if (!layers.has(page)) return;
      if (items.filter(item => item.page === page).length >= 20) {
        showToast("Limite de 20 stickers nesta página");
        return;
      }
      if (page.startsWith("case")) document.getElementById("moveButton")?.click();
      selectSticker(button.dataset.stickerVariant);
      setTrayOpen(false);
      toggle.focus();
      showToast("Clique ou toque onde deseja colocar o sticker · Esc cancela");
    });
  });

  document.addEventListener("pointermove", event => {
    if (!selectedVariant) return;
    preview.hidden = !canPlaceAt(event.target) || event.pointerType === "touch";
    if (preview.hidden) return;
    preview.style.left = `${event.clientX}px`;
    preview.style.top = `${event.clientY}px`;
  });

  document.querySelector(".canvas-footer")?.addEventListener("click", () => selectSticker(null), true);

  document.addEventListener("pointerdown", event => {
    if (selectedVariant && canPlaceAt(event.target)) event.stopPropagation();
  }, true);

  document.addEventListener("click", event => {
    if (!selectedVariant || !canPlaceAt(event.target)) return;
    event.preventDefault();
    event.stopPropagation();
    const page = currentPage();
    const layer = layers.get(page);
    if (!layer) return;
    if (items.filter(item => item.page === page).length >= 20) {
      selectSticker(null);
      showToast("Limite de 20 stickers nesta página");
      return;
    }
    const rect = layer.getBoundingClientRect();
    const isKuromi = selectedVariant.startsWith("kuromi-");
    const size = window.matchMedia("(max-width: 600px)").matches
      ? (isKuromi ? 88 : 68)
      : (isKuromi ? 112 : 88);
    const maxLeft = Math.max(0, layer.clientWidth - size);
    const maxTop = Math.max(0, layer.clientHeight - size);
    const clientX = event.detail === 0 ? window.innerWidth / 2 : event.clientX;
    const clientY = event.detail === 0 ? window.innerHeight / 2 : event.clientY;
    const left = clamp(clientX - rect.left - size / 2, 0, maxLeft);
    const top = clamp(clientY - rect.top - size / 2, 0, maxTop);
    const item = createSticker(page, selectedVariant, maxLeft ? left / maxLeft : 0, maxTop ? top / maxTop : 0);
    if (!item) return;
    selectSticker(null);
    saveStickers();
    item.node.focus({ preventScroll: true });
    showToast("Sticker adicionado · arraste para ajustar");
  }, true);

  function refreshCurrentPageStickers() {
    const page = currentPage();
    for (const item of items) if (item.page === page) positionSticker(item);
  }
  document.addEventListener("portfolio:pagechange", () => {
    selectSticker(null);
    setTrayOpen(false);
    const page = currentPage();
    for (const [layerPage, layer] of layers) layer.hidden = layerPage !== page;
    requestAnimationFrame(refreshCurrentPageStickers);
  });
  window.addEventListener("resize", refreshCurrentPageStickers);
  requestAnimationFrame(refreshCurrentPageStickers);
})();
