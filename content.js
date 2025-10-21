const CONFIG = {
  repeat: "100", // Ustaw na liczbe np "20" albo "off" off to znaczy ze musisz za kazdym razem kliukac uzupelnij a np jak dasz 20 to ci 20 razy kliknie uzupelnij
};

chrome.runtime.onMessage.addListener(async (message) => {
  if (message.action !== "fill") return;
  const lang = message.language;

  function buildDictionaryFromTxt(text) {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const translations = {};

    let i = 0;
    while (i < lines.length - 1) {
      const a = lines[i];
      const b = lines[i + 1];

      // filtrujemy tylko przyklaaadowe zdania (pierwsza linia)
      if (a.split(" ").length > 6 || a.includes(".")) {
        i++;
        continue;
      }

      // dodajem pare dwukierunkowo
      translations[a.toLowerCase()] = b;
      translations[b.toLowerCase()] = a;

      i += 2; // przechodzie do nastepnniej pary
    }

    return translations;
  }

  async function loadTranslations(lang) {
    const translations = {};

    try {
      const res = await fetch(chrome.runtime.getURL(`lang/${lang}.txt`));
      if (res.ok) {
        const text = await res.text();
        return buildDictionaryFromTxt(text);
      }
    } catch (e) {
      console.info("Brak pliku .txt lub błąd odczytu:", e);
    }

    try {
      const res = await fetch(chrome.runtime.getURL(`${lang}.json`));
      if (res.ok) {
        const obj = await res.json();
        for (const k in obj) {
          if (!Object.prototype.hasOwnProperty.call(obj, k)) continue;
          const v = obj[k];
          translations[String(k).toLowerCase()] = String(v);
          translations[String(v).toLowerCase()] = String(k);
        }
        return translations;
      }
    } catch (e) {
      console.info("Brak pliku .json lub błąd odczytu:", e);
    }

    throw new Error("Nie znaleziono pliku tłumaczeń (.txt lub .json).");
  }

  const normalize = (s) =>
    String(s)
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()”“"']/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const runOnce = async () => {
    const inputElement = document.querySelector("#flashcard_answer_input");
    const enterButton = document.querySelector("#enterBtn");

    if (!inputElement && enterButton) {
      console.log("Brak pola odpowiedzi - klikam Dalej");
      enterButton.click();
      return;
    }

    const wordElement = document.querySelector("#flashcard_main_text");
    if (!wordElement || !enterButton) {
      console.log("Brakuje elementów na stronie!");
      return;
    }

    const word = wordElement.textContent.trim();
    console.log("Szukam tłumaczenia dla:", word);

    try {
      const translations = await loadTranslations(lang);

      let translated = translations[word.toLowerCase()] || null;

      if (!translated) {
        const normWord = normalize(word);
        for (const k in translations) {
          if (normalize(k) === normWord) {
            translated = translations[k];
            break;
          }
        }
      }

      if (translated) {
        inputElement.value = translated;
        inputElement.focus();
        inputElement.dispatchEvent(new Event("input", { bubbles: true }));
        inputElement.dispatchEvent(new Event("change", { bubbles: true }));
        enterButton.click();
      } else {
        alert(`Brak tłumaczenia dla: ${word}`);
      }
    } catch (err) {
      console.error("Błąd ładowania pliku tłumaczeń:", err);
    }
  };

  if (CONFIG.repeat !== "off") {
    const repeatCount = parseInt(CONFIG.repeat) || 1;
    for (let i = 0; i < repeatCount; i++) {
      await runOnce();
      await new Promise((r) => setTimeout(r, 50));
    }
  } else {
    await runOnce();
  }
});

//  INEJCT GUI
function injectGUI() {
  if (document.getElementById("auto-lingos-gui")) return;

  const panel = document.createElement("div");
  panel.id = "auto-lingos-gui";
  panel.innerHTML = `
<div class="container">
  <h1>Auto-Lingos v4</h1>
  <h2>Wybierz język</h2>
  <select id="languageSelect">
    <option value="angielski">Angielski</option>
    <option value="niemiecki">Niemiecki</option>
    <option value="hiszpanski">Hiszpański</option>
  </select>
  <button id="fillButton">Uzupełnij</button>
  <div class="footer">
    <span>Twórca: X3zny</span>
    <div class="social-icons">
      <a href="https://discord.gg/BubPzgynPA" target="_blank" title="Discord" class="icon">
        <svg viewBox="0 0 24 24">
          <path d="M20.317 4.369a19.791 19.791 0 0 0-4.885-1.515.07.07 0 0 0-.073.035 13.827 13.827 0 0 0-.602 1.23 19.736 19.736 0 0 0-5.884 0 13.38 13.38 0 0 0-.614-1.23.07.07 0 0 0-.073-.035A19.736 19.736 0 0 0 3.677 4.37a.064.064 0 0 0-.031.027C.533 9.046-.32 13.58.099 18.057a.08.08 0 0 0 .031.056 19.967 19.967 0 0 0 5.993 3.012.07.07 0 0 0 .078-.027c.461-.63.873-1.295 1.226-1.987a.07.07 0 0 0-.041-.097 13.146 13.146 0 0 1-1.872-.89.07.07 0 0 1-.007-.116c.126-.094.252-.19.372-.287a.07.07 0 0 1 .071-.01c3.927 1.796 8.18 1.796 12.062 0a.07.07 0 0 1 .072.01c.12.096.245.193.371.287a.07.07 0 0 1-.006.116 12.64 12.64 0 0 1-1.872.89.07.07 0 0 0-.041.097c.36.692.772 1.358 1.226 1.987a.07.07 0 0 0 .078.027 19.934 19.934 0 0 0 6.002-3.012.07.07 0 0 0 .03-.056c.5-5.177-.838-9.666-3.548-13.662a.06.06 0 0 0-.03-.028zM8.02 15.331c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.418 2.157-2.418 1.21 0 2.182 1.093 2.157 2.418 0 1.334-.955 2.419-2.157 2.419zm7.974 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.418 2.157-2.418 1.21 0 2.182 1.093 2.157 2.418 0 1.334-.948 2.419-2.157 2.419z"/>
        </svg>
      </a>
      <a href="https://github.com/x3zny" target="_blank" title="GitHub" class="icon">
        <svg viewBox="0 0 24 24">
          <path d="M12 .297a12 12 0 0 0-3.792 23.405c.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.727-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.085 1.84 1.248 1.84 1.248 1.07 1.835 2.809 1.305 3.495.998.108-.776.419-1.305.762-1.605-2.665-.3-5.466-1.334-5.466-5.933 0-1.312.469-2.384 1.235-3.223-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23a11.45 11.45 0 0 1 3.003-.404c1.02.005 2.045.137 3.003.403 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.839 1.23 1.91 1.23 3.223 0 4.61-2.805 5.628-5.475 5.922.435.375.825 1.11.825 2.238 0 1.615-.015 2.915-.015 3.315 0 .315.21.694.825.576A12 12 0 0 0 12 .297z"/>
        </svg>
      </a>
    </div>
  </div>
</div>
`;

  document.body.appendChild(panel);

  // Obsługa kliknięcia
  document.getElementById("fillButton").addEventListener("click", () => {
    const language = document.getElementById("languageSelect").value;
    chrome.runtime.onMessage.dispatch({ action: "fill", language });
  });

  makeDraggable(panel);
}

function makeDraggable(el) {
  let isDown = false;
  let offset = [0, 0];

  el.addEventListener("mousedown", (e) => {
    isDown = true;
    offset = [el.offsetLeft - e.clientX, el.offsetTop - e.clientY];
    el.style.cursor = "grabbing";
  });

  document.addEventListener("mouseup", () => {
    isDown = false;
    el.style.cursor = "default";
  });

  document.addEventListener("mousemove", (e) => {
    if (isDown) {
      el.style.left = e.clientX + offset[0] + "px";
      el.style.top = e.clientY + offset[1] + "px";
    }
  });
}

injectGUI();
