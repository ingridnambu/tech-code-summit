const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[character]));

async function getApiData(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Não foi possível carregar as informações. Tente novamente.");
  return response.json();
}

function showLoadError(container, error) {
  container.innerHTML = `<p class="load-error" role="alert">${escapeHtml(error.message)}</p>`;
}

const trackPaths = {
  "engenharia-de-software": "/trilhas/engenharia-de-software.html",
  "inteligencia-artificial": "/trilhas/inteligencia-artificial.html",
  mobile: "/trilhas/mobile.html",
  "embarcados-e-iot": "/trilhas/embarcados-e-iot.html",
};

async function renderTrackCards(containerId, compact) {
  const container = document.getElementById(containerId);
  if (!container) return;
  try {
    const tracks = await getApiData("/api/tracks");
    container.innerHTML = tracks.map((track, index) => {
      const path = trackPaths[track.slug];
      return compact
        ? `<a class="track-card" href="${path}"><span class="track-icon">${escapeHtml(track.icon)}</span><span class="track-number">0${index + 1} / TRILHA</span><h3>${escapeHtml(track.name)}</h3><p>${escapeHtml(track.description)}</p><span class="card-arrow">↗</span></a>`
        : `<article class="track-row"><div class="track-icon">${escapeHtml(track.icon)}</div><div class="track-row-copy"><p class="eyebrow">TRILHA 0${index + 1}</p><h2>${escapeHtml(track.name)}</h2><p>${escapeHtml(track.description)}</p><div class="speaker-inline">${track.speakers.map((speaker) => `<span>${escapeHtml(speaker.name)} · ${escapeHtml(speaker.role)}</span>`).join("")}</div></div><a class="round-arrow" href="${path}" aria-label="Ver trilha ${escapeHtml(track.name)}">↗</a></article>`;
    }).join("");
  } catch (error) {
    showLoadError(container, error);
  }
}

async function renderSchedule(day) {
  const container = document.getElementById("schedule-list");
  if (!container) return;
  try {
    const sessions = await getApiData("/api/schedule");
    const filtered = sessions.filter((session) => session.day === day);
    container.innerHTML = filtered.map((session) => `<article class="schedule-item"><time>${escapeHtml(session.time)}</time><div><span class="schedule-type">${escapeHtml(session.type)} · ${escapeHtml(session.stage)}</span><h3>${escapeHtml(session.title)}</h3></div><span class="schedule-arrow">↗</span></article>`).join("");
  } catch (error) {
    showLoadError(container, error);
  }
}

function setupRegistration() {
  const form = document.getElementById("registration-form");
  if (!form) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    const message = document.getElementById("registration-message");
    button.disabled = true;
    message.textContent = "Registrando sua inscrição…";
    try {
      const data = Object.fromEntries(new FormData(form));
      const response = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Não foi possível registrar a inscrição.");
      window.location.href = `/pagamento.html?registrationId=${encodeURIComponent(result.registrationId)}`;
    } catch (error) {
      message.textContent = error.message;
      button.disabled = false;
    }
  });
}

function setupPayment() {
  const button = document.getElementById("simulate-payment");
  if (!button) return;
  const registrationId = new URLSearchParams(window.location.search).get("registrationId");
  const message = document.getElementById("payment-message");
  if (!registrationId) {
    button.disabled = true;
    message.textContent = "Inscrição não encontrada. Volte e preencha o formulário para continuar.";
    return;
  }
  button.addEventListener("click", async () => {
    button.disabled = true;
    message.textContent = "Processando a simulação…";
    try {
      const response = await fetch("/api/payments/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Não foi possível simular o pagamento.");
      message.innerHTML = `Inscrição confirmada! Protocolo simulado: <strong>${escapeHtml(result.paymentId)}</strong>.`;
      button.hidden = true;
    } catch (error) {
      message.textContent = error.message;
      button.disabled = false;
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderTrackCards("track-preview", true);
  renderTrackCards("all-tracks", false);
  const scheduleList = document.getElementById("schedule-list");
  if (scheduleList) {
    renderSchedule("18 de setembro");
    document.querySelectorAll(".schedule-tab").forEach((tab) => tab.addEventListener("click", () => {
      document.querySelectorAll(".schedule-tab").forEach((item) => item.classList.toggle("active", item === tab));
      renderSchedule(tab.dataset.day);
    }));
  }
  const eventDescription = document.getElementById("event-description");
  if (eventDescription) getApiData("/api/event").then((data) => {
    eventDescription.textContent = data.description;
  }).catch((error) => {
    eventDescription.textContent = error.message;
    eventDescription.setAttribute("role", "alert");
  });
  setupRegistration();
  setupPayment();
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".main-nav");
  if (toggle && nav) toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!expanded));
    nav.classList.toggle("nav-open", !expanded);
  });
});
