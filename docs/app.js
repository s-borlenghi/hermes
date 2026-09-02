// Point this at your deployed Render service, e.g. "https://hermes-api.onrender.com"
const API_BASE_URL = "https://YOUR-RENDER-SERVICE.onrender.com";

const STATUS_LABELS = {
  wishlist: "Wishlist",
  applied: "Applied",
  phone_screen: "Phone screen",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
  accepted: "Accepted",
  withdrawn: "Withdrawn",
};

function $(selector) {
  return document.querySelector(selector);
}

function setStatus(kind, message) {
  const dot = $("#status-dot");
  const text = $("#status-text");
  dot.className = `status-dot ${kind}`;
  text.textContent = message;
}

function pct(value) {
  return `${Math.round(value * 100)}%`;
}

async function fetchJSON(path, { timeoutMs = 20000 } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, { signal: controller.signal });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

function renderStats(summary) {
  $("#stat-total").textContent = summary.total_applications;
  $("#stat-response").textContent = pct(summary.response_rate);
  $("#stat-interview").textContent = pct(summary.interview_rate);
  $("#stat-offer").textContent = pct(summary.offer_rate);

  const max = Math.max(1, ...summary.by_status.map((s) => s.count));
  const container = $("#status-bars");
  container.innerHTML = "";
  summary.by_status.forEach(({ status, count }) => {
    const row = document.createElement("div");
    row.className = "status-bar-row";
    row.innerHTML = `
      <span>${STATUS_LABELS[status] ?? status}</span>
      <span class="status-bar-track"><span class="status-bar-fill ${status}" style="width:${(count / max) * 100}%"></span></span>
      <span class="mono">${count}</span>
    `;
    container.appendChild(row);
  });
}

function renderTimeline(timeline) {
  const canvas = $("#timeline-chart");
  const ctx = canvas.getContext("2d");
  const points = timeline.points;
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  const max = Math.max(1, ...points.map((p) => p.count));
  const padding = { top: 14, right: 10, bottom: 24, left: 24 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const stepX = points.length > 1 ? chartW / (points.length - 1) : 0;

  ctx.strokeStyle = "#262b38";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 3; i++) {
    const y = padding.top + (chartH / 3) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
  }

  ctx.beginPath();
  points.forEach((p, i) => {
    const x = padding.left + stepX * i;
    const y = padding.top + chartH - (p.count / max) * chartH;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = "#6ee7b7";
  ctx.lineWidth = 2;
  ctx.stroke();

  points.forEach((p, i) => {
    const x = padding.left + stepX * i;
    const y = padding.top + chartH - (p.count / max) * chartH;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#6ee7b7";
    ctx.fill();

    ctx.fillStyle = "#9aa1b2";
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    ctx.fillText(p.period.slice(5), x, height - 8);
  });
}

function renderTable(applications) {
  const tbody = $("#applications-body");
  tbody.innerHTML = "";
  if (applications.length === 0) {
    $("#table-empty").hidden = false;
    return;
  }
  $("#table-empty").hidden = true;

  applications.slice(0, 8).forEach((app) => {
    const tr = document.createElement("tr");
    const applied = app.applied_date ? new Date(app.applied_date).toLocaleDateString() : "—";
    tr.innerHTML = `
      <td>${app.role_title}</td>
      <td>${app.company?.name ?? "—"}</td>
      <td><span class="pill ${app.status}">${STATUS_LABELS[app.status] ?? app.status}</span></td>
      <td>${app.source ?? "—"}</td>
      <td>${applied}</td>
    `;
    tbody.appendChild(tr);
  });
}

async function loadDashboard() {
  setStatus("pending", "Waking up the live API (free-tier hosting can take up to a minute to cold-start)…");
  try {
    const [applications, summary, timeline] = await Promise.all([
      fetchJSON("/demo/applications"),
      fetchJSON("/demo/stats/summary"),
      fetchJSON("/demo/stats/timeline?months=6"),
    ]);
    renderStats(summary);
    renderTimeline(timeline);
    renderTable(applications.items);
    setStatus("ok", "Live data pulled from the deployed API just now.");
  } catch (err) {
    console.error(err);
    setStatus("err", "Couldn't reach the live API right now — it may be cold-starting or asleep. Try reloading in a moment.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  $("#docs-link").href = `${API_BASE_URL}/docs`;
  $("#api-base-label").textContent = API_BASE_URL;
  loadDashboard();
});
