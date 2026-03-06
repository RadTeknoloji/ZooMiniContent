const LANGS = ["en", "tr", "ar", "de", "es", "it", "pt", "fr"];
const STORAGE_KEY = "zoomini-content-studio-v1";

const state = {
  animals: [],
  selectedIndex: -1,
  selectedLanguage: "en",
  search: ""
};

const el = {
  search: document.getElementById("search"),
  animalList: document.getElementById("animal-list"),
  currentAnimalLabel: document.getElementById("current-animal-label"),
  editorEmpty: document.getElementById("editor-empty"),
  editor: document.getElementById("editor"),
  validationOutput: document.getElementById("validation-output"),
  validationSummary: document.getElementById("validation-summary"),
  inputJsonFile: document.getElementById("input-json-file"),
  btnImportJson: document.getElementById("btn-import-json"),
  btnExportJson: document.getElementById("btn-export-json"),
  btnValidate: document.getElementById("btn-validate"),
  btnAddAnimal: document.getElementById("btn-add-animal"),
  btnDuplicateAnimal: document.getElementById("btn-duplicate-animal"),
  btnDeleteAnimal: document.getElementById("btn-delete-animal"),
  btnCopyEnToMissing: document.getElementById("btn-copy-en-to-missing"),
  fieldLanguagePicker: document.getElementById("field-language-picker"),
  fieldId: document.getElementById("field-id"),
  fieldEmoji: document.getElementById("field-emoji"),
  fieldImageName: document.getElementById("field-image-name"),
  fieldSoundFile: document.getElementById("field-sound-file"),
  fieldSize1: document.getElementById("field-size-1"),
  fieldSize2: document.getElementById("field-size-2"),
  fieldSize3: document.getElementById("field-size-3"),
  fieldLocalizedName: document.getElementById("field-localized-name"),
  fieldFact24: document.getElementById("field-fact-2-4"),
  fieldFact57: document.getElementById("field-fact-5-7"),
  fieldFact810: document.getElementById("field-fact-8-10")
};

init();

function init() {
  hydrateFromStorage();
  bindEvents();
  buildLanguagePicker();
  if (state.animals.length === 0) {
    state.animals.push(createEmptyAnimal());
    state.selectedIndex = 0;
  } else if (state.selectedIndex < 0) {
    state.selectedIndex = 0;
  }

  render();
  runValidation();
}

function bindEvents() {
  el.search.addEventListener("input", (event) => {
    state.search = event.target.value.trim().toLowerCase();
    renderAnimalList();
  });

  el.btnAddAnimal.addEventListener("click", () => {
    state.animals.unshift(createEmptyAnimal());
    state.selectedIndex = 0;
    persistAndRender();
  });

  el.btnDuplicateAnimal.addEventListener("click", () => {
    const current = selectedAnimal();
    if (!current) {
      return;
    }
    const clone = deepCopy(current);
    clone.id = `${current.id || "animal"}_copy_${Date.now().toString().slice(-4)}`;
    state.animals.splice(state.selectedIndex + 1, 0, clone);
    state.selectedIndex += 1;
    persistAndRender();
  });

  el.btnDeleteAnimal.addEventListener("click", () => {
    if (state.selectedIndex < 0) {
      return;
    }
    const deleted = state.animals.splice(state.selectedIndex, 1);
    if (deleted.length === 0) {
      return;
    }
    state.selectedIndex = Math.max(0, Math.min(state.selectedIndex, state.animals.length - 1));
    if (state.animals.length === 0) {
      state.animals.push(createEmptyAnimal());
      state.selectedIndex = 0;
    }
    persistAndRender();
  });

  el.btnImportJson.addEventListener("click", () => {
    el.inputJsonFile.value = "";
    el.inputJsonFile.click();
  });

  el.inputJsonFile.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const text = await file.text();
    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) {
        throw new Error("JSON root must be array");
      }
      state.animals = parsed.map(normalizeAnimal);
      state.selectedIndex = state.animals.length > 0 ? 0 : -1;
      persistAndRender();
    } catch (error) {
      alert(`JSON okunamadı: ${error.message}`);
    }
  });

  el.btnExportJson.addEventListener("click", () => {
    const payload = JSON.stringify(state.animals, null, 2);
    downloadText(payload, "animals_index.json", "application/json");
  });

  el.btnValidate.addEventListener("click", runValidation);

  el.fieldLanguagePicker.addEventListener("change", (event) => {
    state.selectedLanguage = event.target.value;
    renderEditorFields();
  });

  [
    [el.fieldId, "id"],
    [el.fieldEmoji, "emoji"],
    [el.fieldImageName, "imageName"],
    [el.fieldSoundFile, "soundFile"]
  ].forEach(([node, key]) => {
    node.addEventListener("input", () => {
      const animal = selectedAnimal();
      if (!animal) {
        return;
      }
      animal[key] = node.value.trim();
      persistAndRender({ keepScroll: true });
    });
  });

  [el.fieldSize1, el.fieldSize2, el.fieldSize3].forEach((node, index) => {
    node.addEventListener("input", () => {
      const animal = selectedAnimal();
      if (!animal) {
        return;
      }
      animal.sizeComparisonImageNames[index] = node.value.trim();
      persistAndRender({ keepScroll: true });
    });
  });

  el.fieldLocalizedName.addEventListener("input", () => {
    const animal = selectedAnimal();
    if (!animal) {
      return;
    }
    animal.localizedNames[state.selectedLanguage] = el.fieldLocalizedName.value.trim();
    persistAndRender({ keepScroll: true });
  });

  el.fieldFact24.addEventListener("input", () => {
    updateFact("age_2_4", el.fieldFact24.value);
  });
  el.fieldFact57.addEventListener("input", () => {
    updateFact("age_5_7", el.fieldFact57.value);
  });
  el.fieldFact810.addEventListener("input", () => {
    updateFact("age_8_10", el.fieldFact810.value);
  });

  el.btnCopyEnToMissing.addEventListener("click", () => {
    const animal = selectedAnimal();
    if (!animal) {
      return;
    }
    const source = animal.factsByLanguage.en ?? emptyFacts();
    LANGS.forEach((lang) => {
      if (!animal.factsByLanguage[lang]) {
        animal.factsByLanguage[lang] = emptyFacts();
      }
      ["age_2_4", "age_5_7", "age_8_10"].forEach((key) => {
        if (!animal.factsByLanguage[lang][key]) {
          animal.factsByLanguage[lang][key] = source[key] || "";
        }
      });
    });
    persistAndRender({ keepScroll: true });
  });
}

function buildLanguagePicker() {
  el.fieldLanguagePicker.innerHTML = LANGS.map((lang) => `<option value="${lang}">${lang.toUpperCase()}</option>`).join("");
  el.fieldLanguagePicker.value = state.selectedLanguage;
}

function render() {
  renderAnimalList();
  renderEditorFields();
}

function renderAnimalList() {
  const filtered = state.animals
    .map((animal, index) => ({ animal, index }))
    .filter(({ animal }) => {
      if (!state.search) {
        return true;
      }
      const id = (animal.id || "").toLowerCase();
      const emoji = (animal.emoji || "").toLowerCase();
      const name = (animal.localizedNames?.[state.selectedLanguage] || animal.localizedNames?.en || "").toLowerCase();
      return id.includes(state.search) || emoji.includes(state.search) || name.includes(state.search);
    });

  el.animalList.innerHTML = filtered
    .map(({ animal, index }) => {
      const selectedClass = index === state.selectedIndex ? "active" : "";
      const title = escapeHtml(animal.localizedNames?.[state.selectedLanguage] || animal.localizedNames?.en || "(name)");
      return `
        <button class="animal-item ${selectedClass}" data-index="${index}">
          <div class="emoji">${escapeHtml(animal.emoji || "🦊")}</div>
          <div class="animal-meta">
            <p class="id">${escapeHtml(animal.id || "(id)")}</p>
            <p class="name">${title}</p>
          </div>
        </button>
      `;
    })
    .join("");

  el.animalList.querySelectorAll(".animal-item").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.index);
      state.selectedIndex = index;
      persistAndRender({ keepScroll: true });
    });
  });
}

function renderEditorFields() {
  const animal = selectedAnimal();
  if (!animal) {
    el.editor.classList.add("hidden");
    el.editorEmpty.classList.remove("hidden");
    el.currentAnimalLabel.textContent = "Seçili hayvan yok";
    return;
  }

  el.editor.classList.remove("hidden");
  el.editorEmpty.classList.add("hidden");
  el.currentAnimalLabel.textContent = `${animal.id || "(id)"} • ${animal.localizedNames[state.selectedLanguage] || "-"}`;

  el.fieldLanguagePicker.value = state.selectedLanguage;
  el.fieldId.value = animal.id || "";
  el.fieldEmoji.value = animal.emoji || "";
  el.fieldImageName.value = animal.imageName || "";
  el.fieldSoundFile.value = animal.soundFile || "";

  const sizeImages = normalizedSizeImages(animal);
  el.fieldSize1.value = sizeImages[0];
  el.fieldSize2.value = sizeImages[1];
  el.fieldSize3.value = sizeImages[2];

  const lang = state.selectedLanguage;
  const facts = normalizedFacts(animal, lang);
  el.fieldLocalizedName.value = animal.localizedNames[lang] || "";
  el.fieldFact24.value = facts.age_2_4;
  el.fieldFact57.value = facts.age_5_7;
  el.fieldFact810.value = facts.age_8_10;
}

function runValidation() {
  const issues = [];
  const warnings = [];

  if (state.animals.length === 0) {
    issues.push("En az 1 hayvan olmalı.");
  }

  const ids = new Set();

  state.animals.forEach((animal, idx) => {
    const ref = `${idx + 1}. kayıt (${animal.id || "id-yok"})`;
    if (!animal.id) {
      issues.push(`${ref}: id boş.`);
    } else if (ids.has(animal.id)) {
      issues.push(`${ref}: id tekrar ediyor (${animal.id}).`);
    } else {
      ids.add(animal.id);
    }

    if (!animal.emoji) {
      warnings.push(`${ref}: emoji boş.`);
    }
    if (!animal.imageName) {
      issues.push(`${ref}: imageName boş.`);
    }
    if (!animal.soundFile) {
      issues.push(`${ref}: soundFile boş.`);
    }

    const size = normalizedSizeImages(animal);
    if (size.some((item) => !item)) {
      issues.push(`${ref}: sizeComparisonImageNames 3 değer içermeli.`);
    }

    LANGS.forEach((lang) => {
      const name = (animal.localizedNames?.[lang] || "").trim();
      if (!name) {
        issues.push(`${ref}: localizedNames.${lang} eksik.`);
      }
    });

    const enFacts = normalizedFacts(animal, "en");
    if (!enFacts.age_2_4 || !enFacts.age_5_7 || !enFacts.age_8_10) {
      issues.push(`${ref}: English fact metinleri (2_4, 5_7, 8_10) zorunlu.`);
    }

    LANGS.filter((lang) => lang !== "en").forEach((lang) => {
      const facts = normalizedFacts(animal, lang);
      if (!facts.age_2_4 || !facts.age_5_7 || !facts.age_8_10) {
        warnings.push(`${ref}: ${lang.toUpperCase()} fact alanları eksik, uygulama EN fallback kullanır.`);
      }
    });
  });

  const lines = [
    `Toplam hayvan: ${state.animals.length}`,
    `Hata: ${issues.length}`,
    `Uyarı: ${warnings.length}`,
    ""
  ];

  if (issues.length > 0) {
    lines.push("HATALAR:");
    lines.push(...issues.map((m) => `- ${m}`));
    lines.push("");
  }

  if (warnings.length > 0) {
    lines.push("UYARILAR:");
    lines.push(...warnings.map((m) => `- ${m}`));
  }

  if (issues.length === 0 && warnings.length === 0) {
    lines.push("Her şey temiz görünüyor.");
  }

  el.validationOutput.textContent = lines.join("\n");
  el.validationSummary.textContent = issues.length === 0
    ? `Geçti (${warnings.length} uyarı)`
    : `Başarısız (${issues.length} hata)`;
}

function selectedAnimal() {
  if (state.selectedIndex < 0 || state.selectedIndex >= state.animals.length) {
    return null;
  }
  return state.animals[state.selectedIndex];
}

function persistAndRender(options = {}) {
  persist();
  render();
  runValidation();
  if (!options.keepScroll) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    animals: state.animals,
    selectedIndex: state.selectedIndex,
    selectedLanguage: state.selectedLanguage
  }));
}

function hydrateFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return;
  }
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.animals)) {
      state.animals = parsed.animals.map(normalizeAnimal);
    }
    if (typeof parsed.selectedIndex === "number") {
      state.selectedIndex = parsed.selectedIndex;
    }
    if (typeof parsed.selectedLanguage === "string" && LANGS.includes(parsed.selectedLanguage)) {
      state.selectedLanguage = parsed.selectedLanguage;
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function updateFact(key, value) {
  const animal = selectedAnimal();
  if (!animal) {
    return;
  }
  if (!animal.factsByLanguage[state.selectedLanguage]) {
    animal.factsByLanguage[state.selectedLanguage] = emptyFacts();
  }
  animal.factsByLanguage[state.selectedLanguage][key] = value.trim();
  persistAndRender({ keepScroll: true });
}

function normalizedFacts(animal, lang) {
  if (!animal.factsByLanguage) {
    animal.factsByLanguage = {};
  }
  if (!animal.factsByLanguage[lang]) {
    animal.factsByLanguage[lang] = emptyFacts();
  }
  const facts = animal.factsByLanguage[lang];
  facts.age_2_4 = facts.age_2_4 || "";
  facts.age_5_7 = facts.age_5_7 || "";
  facts.age_8_10 = facts.age_8_10 || "";
  return facts;
}

function normalizedSizeImages(animal) {
  if (!Array.isArray(animal.sizeComparisonImageNames)) {
    animal.sizeComparisonImageNames = ["", "", ""];
  }
  while (animal.sizeComparisonImageNames.length < 3) {
    animal.sizeComparisonImageNames.push("");
  }
  return animal.sizeComparisonImageNames.slice(0, 3);
}

function normalizeAnimal(animal) {
  const next = deepCopy(animal || {});
  next.id = next.id || "";
  next.emoji = next.emoji || "";
  next.imageName = next.imageName || "";
  next.soundFile = next.soundFile || "";
  next.localizedNames = next.localizedNames || {};
  next.factsByLanguage = next.factsByLanguage || {};
  next.sizeComparisonImageNames = Array.isArray(next.sizeComparisonImageNames)
    ? next.sizeComparisonImageNames.slice(0, 3)
    : [];
  next.sizeComparisons = Array.isArray(next.sizeComparisons) ? next.sizeComparisons : [];

  LANGS.forEach((lang) => {
    if (!next.localizedNames[lang]) {
      next.localizedNames[lang] = "";
    }
    if (!next.factsByLanguage[lang]) {
      next.factsByLanguage[lang] = emptyFacts();
    } else {
      next.factsByLanguage[lang] = {
        age_2_4: next.factsByLanguage[lang].age_2_4 || "",
        age_5_7: next.factsByLanguage[lang].age_5_7 || "",
        age_8_10: next.factsByLanguage[lang].age_8_10 || ""
      };
    }
  });

  while (next.sizeComparisonImageNames.length < 3) {
    next.sizeComparisonImageNames.push("");
  }

  return next;
}

function createEmptyAnimal() {
  const base = {
    id: `animal_${Date.now().toString().slice(-6)}`,
    emoji: "🦁",
    imageName: "",
    soundFile: "",
    localizedNames: {},
    factsByLanguage: {},
    sizeComparisonImageNames: ["", "", ""],
    sizeComparisons: []
  };
  return normalizeAnimal(base);
}

function downloadText(text, fileName, mimeType) {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function emptyFacts() {
  return {
    age_2_4: "",
    age_5_7: "",
    age_8_10: ""
  };
}

function deepCopy(value) {
  return JSON.parse(JSON.stringify(value));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}
