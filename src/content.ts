import { parseRuntimeToMinutes, parseClockTimeToMinutes, formatMinutesToClockTime } from "./time-utils.js";

const PROCESSED_ATTR = "data-true-start-processed";
const STYLE_ID = "myvue-true-start-styles";

function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) {
    return;
  }
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .true-start-time__original {
      text-decoration: line-through;
      opacity: 0.6;
    }
    .true-start-time__computed {
      display: block;
      font-size: 0.85em;
      font-weight: 600;
      color: #de6a00;
    }
  `;
  document.head.appendChild(style);
}

// Reads the film's official run time (minutes) from a film card's detail list. Null for "TBC" or "0 minutes"
function getFilmRuntimeMinutes(filmCard: Element): number | null {
  const detailBlocks = filmCard.querySelectorAll(".text-detail");
  for (const block of Array.from(detailBlocks)) {
    const title = block.querySelector(".text-detail__title");
    const value = block.querySelector(".text-detail__value");
    if (title && value && title.textContent?.trim().toLowerCase() === "run time") {
      const minutes = parseRuntimeToMinutes(value.textContent ?? "");
      // Guard against "0 minutes" placeholder entries (e.g. not-yet-classified films).
      return minutes && minutes > 0 ? minutes : null;
    }
  }
  return null;
}

// Computes and annotates the true start time for one session anchor. Returns whether it annotated the session
function processSession(sessionEl: Element, filmRuntimeMinutes: number): boolean {
  if (sessionEl.hasAttribute(PROCESSED_ATTR)) {
    return false;
  }

  const startEl = sessionEl.querySelector<HTMLTimeElement>(".session-time__start");
  const endEl = sessionEl.querySelector<HTMLTimeElement>(".session-time__end");

  if (!startEl || !endEl) {
    return false;
  }

  const startRaw = startEl.getAttribute("datetime") ?? startEl.textContent ?? "";
  const endRaw = endEl.getAttribute("datetime") ?? endEl.textContent ?? "";

  const startMinutes = parseClockTimeToMinutes(startRaw);
  let endMinutes = parseClockTimeToMinutes(endRaw);

  if (startMinutes === null || endMinutes === null) {
    return false;
  }

  // Handle sessions that run past midnight (e.g. 21:50 -> 00:13)
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60;
  }

  const trueStartMinutes = endMinutes - filmRuntimeMinutes;

  // Sanity check — true start should fall within the booked slot
  if (trueStartMinutes < startMinutes || trueStartMinutes > endMinutes) {
    return false;
  }

  startEl.classList.add("true-start-time__original");

  const trueStartEl = document.createElement("span");
  trueStartEl.className = "true-start-time__computed";
  trueStartEl.textContent = `Film starts ~${formatMinutesToClockTime(trueStartMinutes)}`;
  startEl.insertAdjacentElement("afterend", trueStartEl);

  sessionEl.setAttribute(PROCESSED_ATTR, "true");
  return true;
}

// Scans every film card currently in the document and processes its sessions
function processPage(): void {
  const filmCards = document.querySelectorAll(".showing-film-card__info");
  console.log(`[MyVue True Start] Found ${filmCards.length} film card(s)`);

  if (filmCards.length === 0) {
    console.warn(
      "[MyVue True Start] No film cards found (.showing-film-card__info). " +
        "The page markup may have changed and this extension may need updating."
    );
    return;
  }

  let sessionsSeen = 0;
  let sessionsAnnotated = 0;

  filmCards.forEach((filmCard) => {
    const runtime = getFilmRuntimeMinutes(filmCard);
    if (runtime === null) {
      return;
    }
    filmCard.querySelectorAll(".session").forEach((sessionEl) => {
      sessionsSeen += 1;
      if (processSession(sessionEl, runtime)) {
        sessionsAnnotated += 1;
      }
    });
  });

  if (sessionsSeen > 0 && sessionsAnnotated === 0) {
    console.warn(
      "[MyVue True Start] Found sessions but annotated none of them. " +
        "The page markup may have changed and this extension may need updating."
    );
  }
}

function init(): void {
  injectStyles();
  processPage();

  // Listings are client-rendered and change (e.g. switching days), so
  // keep watching for new sessions, debounced to avoid excess work.
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  const observer = new MutationObserver((mutations) => {
    // Ignore mutations caused by our own annotations, so we don't rescan
    // the whole page every time we insert a computed-time span.
    const isOwnMutation = mutations.every((mutation) =>
      Array.from(mutation.addedNodes).every(
        (node) => node instanceof Element && node.classList.contains("true-start-time__computed")
      )
    );
    if (isOwnMutation) {
      return;
    }

    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(processPage, 150);
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

init();
