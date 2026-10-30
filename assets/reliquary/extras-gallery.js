(() => {
  "use strict";

  const dialog = document.getElementById("extrasCollectionDialog");
  const title = document.getElementById("extrasCollectionTitle");
  const description = document.getElementById("extrasCollectionDescription");
  const grid = document.getElementById("extrasCollectionGrid");
  if (!dialog || !title || !description || !grid) return;

  const collections = {
    "show-and-tell": {
      description: "Seis personagens em 3D para o Show & Tell.",
      images: [
        { file: "avatar-01.png", alt: "Avatar 3D de boné azul, óculos escuros e camisa listrada." },
        { file: "avatar-02.png", alt: "Avatar 3D de cabelo curto, barba e óculos escuros, com camiseta preta." },
        { file: "avatar-03.png", alt: "Avatar 3D de cabelo castanho com franja, óculos escuros e piercing no nariz." },
        { file: "avatar-04.png", alt: "Avatar 3D de cabelo ruivo longo, óculos brancos e camisa clara." },
        { file: "avatar-05.png", alt: "Avatar 3D de cabelo castanho curto, óculos escuros e blazer preto." },
        { file: "avatar-06.png", alt: "Avatar 3D de cabelo escuro longo, óculos brancos e suéter branco." }
      ]
    },
    "show-and-tell-robot": {
      description: "Quatro explorações de robôs em 3D para o Show & Tell.",
      images: [
        { file: "robot-01.png", width: 1616, height: 2094, alt: "Rosto de robô branco com detalhes rosa, antena e expressão sorridente." },
        { file: "robot-02.png", width: 2976, height: 3038, alt: "Robô branco e rosa com sorriso no visor e uma mão junto ao rosto." },
        { file: "robot-03.png", width: 2730, height: 2787, alt: "Robô branco e rosa com corações iluminados no visor." },
        { file: "robot-04.png", width: 2976, height: 3038, alt: "Robô branco e rosa acenando, com expressão animada no visor." }
      ]
    },
    "show-and-tell-avatars": {
      description: "Seis avatares em 3D para o Show & Tell.",
      images: [
        { file: "avatar-01.png", width: 2764, height: 2779, alt: "Avatar 3D de cabelo ruivo curto com mecha clara, óculos redondos e blusa preta, com moldura verde-lima." },
        { file: "avatar-02.png", width: 2758, height: 2772, alt: "Avatar 3D de cabelo escuro, barba e camiseta preta, com moldura verde-lima." },
        { file: "avatar-03.png", width: 2758, height: 2772, alt: "Avatar 3D de cabelo curto, bigode e suéter claro, com moldura verde-lima." },
        { file: "avatar-04.png", width: 2764, height: 2779, alt: "Avatar 3D de boné azul e camisa listrada, com moldura verde-lima." },
        { file: "avatar-05.png", width: 2764, height: 2779, alt: "Avatar 3D de cabelo castanho longo com franja e piercing no nariz, com moldura verde-lima." },
        { file: "avatar-06.png", width: 2674, height: 2689, alt: "Avatar 3D de cabelo castanho longo e blusa cinza, com moldura verde-lima." }
      ]
    },
    "simpsons": {
      description: "Retratos e cenas inspirados no universo dos Simpsons.",
      images: [
        { file: "simpsons-01.png", width: 1364, height: 1304, alt: "Retrato em estilo Simpsons de mulher com cabelo escuro longo e suéter branco, com fotografia de referência no canto." },
        { file: "simpsons-02.png", width: 1364, height: 1304, alt: "Retrato em estilo Simpsons de mulher ruiva com franja, piercing no nariz e camiseta branca, com fotografia de referência no canto." },
        { file: "simpsons-03.png", width: 1336, height: 1327, alt: "Retrato em estilo Simpsons de mulher com cabelo castanho curto, óculos e blusa preta, com fotografia de referência no canto." },
        { file: "simpsons-04.png", width: 1720, height: 1720, alt: "Mulher em estilo Simpsons com rabo de cavalo, óculos e braços tatuados, sentada diante de monitores e uma parede com notas adesivas." }
      ]
    }
  };

  let opener = null;
  let movedCursor = null;
  let cursorParent = null;

  function openCollection(button) {
    if (dialog.open) return;
    opener = button;
    title.textContent = button.dataset.collectionTitle;
    dialog.dataset.collection = button.dataset.extrasCollection;
    grid.setAttribute("aria-label", `Imagens da coleção ${title.textContent}`);

    const collection = collections[button.dataset.extrasCollection];
    description.textContent = collection?.description || "As imagens desta coleção serão adicionadas em breve.";
    const items = document.createDocumentFragment();
    if (collection?.images.length) {
      collection.images.forEach((image, index) => {
        const item = document.createElement("li");
        item.className = "extras-collection-art";
        const artwork = document.createElement("img");
        artwork.src = `assets/extras/${button.dataset.extrasCollection}/${image.file}`;
        artwork.alt = image.alt;
        artwork.width = image.width || 1000;
        artwork.height = image.height || 1000;
        artwork.loading = index < 3 ? "eager" : "lazy";
        artwork.decoding = "async";
        item.append(artwork);
        items.append(item);
      });
    } else {
      for (let index = 1; index <= 6; index += 1) {
        const item = document.createElement("li");
        item.className = "extras-collection-placeholder";
        item.setAttribute("aria-label", `Espaço para imagem ${index} — em breve`);
        const number = document.createElement("span");
        number.textContent = String(index).padStart(2, "0");
        number.setAttribute("aria-hidden", "true");
        const status = document.createElement("span");
        status.textContent = "Em breve";
        status.setAttribute("aria-hidden", "true");
        item.append(number, status);
        items.append(item);
      }
    }
    grid.replaceChildren(items);
    dialog.showModal();
    dialog.scrollTop = 0;
    document.body.classList.add("has-extras-collection-open");

    // O cursor precisa estar na mesma camada da janela modal.
    movedCursor = document.querySelector(".canvas-cursor");
    if (movedCursor) {
      cursorParent = movedCursor.parentElement;
      dialog.append(movedCursor);
    }
  }

  document.querySelectorAll("[data-extras-collection]").forEach(button => {
    button.addEventListener("click", () => openCollection(button));
  });
  dialog.querySelector(".extras-collection-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener("close", () => {
    document.body.classList.remove("has-extras-collection-open");
    if (movedCursor && cursorParent) cursorParent.append(movedCursor);
    movedCursor = null;
    cursorParent = null;
    if (opener?.isConnected && opener.getClientRects().length) opener.focus({ preventScroll: true });
    opener = null;
  });
  document.addEventListener("portfolio:pagechange", () => {
    if (dialog.open) dialog.close();
  });
})();
