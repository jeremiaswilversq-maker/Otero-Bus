document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  populateSelects();
  renderTarifas();
  renderRecorridos();
  renderHorariosTable("colon-liebig");

  document.getElementById("btn-buscar").addEventListener("click", buscarViaje);
  document.getElementById("info-actualizacion").innerText = `Última actualización: ${OTERO_DATA.lastUpdated}`;
  
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js");
  }
});

function initNavigation() {
  const btns = document.querySelectorAll(".nav-btn");
  btns.forEach(btn => {
    btn.addEventListener("click", () => {
      btns.forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(btn.dataset.tab).classList.add("active");
    });
  });

  const filterBtns = document.querySelectorAll(".btn-filter");
  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderHorariosTable(btn.dataset.sentido);
    });
  });
}

function populateSelects() {
  const orig = document.getElementById("select-origen");
  const dest = document.getElementById("select-destino");
  OTERO_DATA.paradas.forEach(p => {
    orig.add(new Option(`${p.nombre} (${p.localidad})`, p.id));
    dest.add(new Option(`${p.nombre} (${p.localidad})`, p.id));
  });
  dest.selectedIndex = OTERO_DATA.paradas.length - 1;
}

function buscarViaje() {
  const origen = document.getElementById("select-origen").value;
  const destino = document.getElementById("select-destino").value;
  const dia = document.getElementById("select-dia").value;
  const container = document.getElementById("resultados-busqueda");
  container.innerHTML = "";

  if (origen === destino) {
    container.innerHTML = `<div class="card"><p>El origen y destino deben ser diferentes.</p></div>`;
    return;
  }

  if (dia === "domingo") {
    container.innerHTML = `<div class="card"><p>⚠️ Los domingos no hay servicio disponible[span_9](start_span)[span_9](end_span).</p></div>`;
    return;
  }

  let sentido = "colon-liebig";
  const origIdx = OTERO_DATA.paradas.findIndex(p => p.id === origen);
  const destIdx = OTERO_DATA.paradas.findIndex(p => p.id === destino);

  if (origIdx > destIdx) sentido = "liebig-colon";

  const servicios = OTERO_DATA.horarios[sentido].filter(s => {
    if (dia === "sabado" && !s.sabado) return false;
    return s.paradas[origen] && s.paradas[destino];
  });

  if (servicios.length === 0) {
    container.innerHTML = `<div class="card"><p>No existen servicios directos o intermedios para este trayecto específico.</p></div>`;
    return;
  }

  servicios.forEach(s => {
    const card = document.createElement("div");
    card.className = "results-card";
    card.innerHTML = `
      ${s.directo ? '<span class="badge-directo">DIRECTO</span>' : ''}
      <p><strong>Sale:</strong> ${s.paradas[origen]} hs (${OTERO_DATA.paradas.find(p=>p.id===origen).nombre})</p>
      <p><strong>Llega:</strong> ${s.paradas[destino]} hs (${OTERO_DATA.paradas.find(p=>p.id===destino).nombre})</p>
      <small style="color: var(--text-muted);">Servicio estimado de línea</small>
    `;
    container.appendChild(card);
  });
}

function renderHorariosTable(sentido) {
  const container = document.getElementById("tabla-horarios-container");
  const lista = OTERO_DATA.horarios[sentido];
  
  let html = `<table><thead><tr><th>Servicio</th>`;
  OTERO_DATA.paradas.forEach(p => { html += `<th>${p.nombre}</th>`; });
  html += `</tr></thead><tbody>`;

  lista.forEach(s => {
    html += `<tr><td>${s.directo ? 'Directo' : 'Regular'}${s.sabado ? ' (Sáb)' : ''}</td>`;
    OTERO_DATA.paradas.forEach(p => {
      html += `<td>${s.paradas[p.id] || '-'}</td>`;
    });
    html += `</tr>`;
  });

  html += `</tbody></table>`;
  container.innerHTML = html;
}

function renderRecorridos() {
  const container = document.getElementById("timeline-paradas");
  OTERO_DATA.paradas.forEach(p => {
    const item = document.createElement("div");
    item.className = "timeline-item";
    item.innerHTML = `<strong>${p.nombre}</strong><br><span style="color:var(--text-muted); font-size:0.85rem;">${p.localidad}</span>`;
    container.appendChild(item);
  });
}

function renderTarifas() {
  const container = document.getElementById("contenedor-tarifas");
  const t = OTERO_DATA.tarifas;
  container.innerHTML = `
    <p>• <strong>Colón a San José / Brillante / Colorado / Liebig:</strong> $${t.colon_liebig}</p>
    <p>• <strong>San José a Brillante / Colorado / Liebig:</strong> $${t.sanjose_liebig}</p>
    <p>• <strong>Boleto Estudiantil:</strong> $${t.estudiantil}</p>
    <p>• <strong>Personas con discapacidad:</strong> Sin cargo (presentando CUD)[span_10](start_span)[span_10](end_span).</p>
  `;
}
