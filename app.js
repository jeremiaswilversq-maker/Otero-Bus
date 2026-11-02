// Application Logic for OTERO BUS PWA + Live Bus Simulation

document.addEventListener("DOMContentLoaded", () => {
    initApp();
});

let mapInstance = null;
let liveMapInstance = null;
let liveMarkers = [];
let currentTabDay = "weekday";
let liveInterval = null;

function initApp() {
    setupNavigation();
    setupSearchForm();
    setupScheduleView();
    setupMapView();
    setupOfflineListener();
    registerServiceWorker();
    
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.getElementById("searchTime").value = `${hours}:${minutes}`;

    performSearch();
    setTimeout(initLiveMap, 200);
}

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(err => console.error(err));
    }
}

function setupOfflineListener() {
    const badge = document.getElementById("offlineBadge");
    const updateOnlineStatus = () => {
        if (!navigator.onLine) badge.classList.add("show");
        else badge.classList.remove("show");
    };
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();
}

function setupNavigation() {
    const navItems = document.querySelectorAll(".nav-item");
    const views = document.querySelectorAll(".view");

    navItems.forEach(item => {
        item.addEventListener("click", () => {
            const targetView = item.getAttribute("data-view");

            navItems.forEach(n => n.classList.remove("active"));
            views.forEach(v => v.classList.remove("active"));

            item.classList.add("active");
            document.getElementById(`view-${targetView}`).classList.add("active");

            if (targetView === "recorridos") {
                setTimeout(renderMap, 100);
            } else if (targetView === "inicio") {
                setTimeout(() => {
                    if (liveMapInstance) liveMapInstance.invalidateSize();
                    updateLiveBuses();
                }, 100);
            }
        });
    });
}

function setupSearchForm() {
    const btnSearch = document.getElementById("btnSearch");
    const btnSwap = document.getElementById("btnSwap");
    const originSelect = document.getElementById("searchOrigin");
    const destSelect = document.getElementById("searchDestination");

    btnSwap.addEventListener("click", () => {
        const temp = originSelect.value;
        originSelect.value = destSelect.value;
        destSelect.value = temp;
        performSearch();
    });

    btnSearch.addEventListener("click", performSearch);
}

function getSelectedDayType() {
    const val = document.getElementById("searchDayType").value;
    if (val !== "auto") return val;
    const day = new Date().getDay();
    if (day === 0) return "sunday";
    if (day === 6) return "saturday";
    return "weekday";
}

// ==========================================
// SIMULACIÓN EN TIEMPO REAL DE LOS 2 COLECTIVOS
// ==========================================

const ROUTE_COORDS = {
    colonToLiebig: [
        [-32.2229, -58.1438], // Colón (Sarmiento/Perla/Terminal)
        [-32.2114, -58.2175], // San José
        [-32.1950, -58.2030], // El Brillante
        [-32.1780, -58.1950], // El Colorado
        [-32.1558, -58.1884]  // Liebig
    ],
    liebigToColon: [
        [-32.1558, -58.1884], // Liebig
        [-32.1780, -58.1950], // El Colorado
        [-32.1950, -58.2030], // El Brillante
        [-32.2114, -58.2175], // San José
        [-32.2229, -58.1438]  // Colón
    ]
};

function initLiveMap() {
    if (liveMapInstance) return;
    
    liveMapInstance = L.map('liveMap').setView([-32.1850, -58.1800], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; OpenStreetMap'
    }).addTo(liveMapInstance);

    // Dibujar líneas de referencia en el mapa de inicio
    L.polyline(ROUTE_COORDS.colonToLiebig, { color: '#00b4d8', weight: 3, opacity: 0.6, dashArray: '5, 5' }).addTo(liveMapInstance);
    L.polyline(ROUTE_COORDS.liebigToColon, { color: '#f59e0b', weight: 3, opacity: 0.6, dashArray: '5, 5' }).addTo(liveMapInstance);

    updateLiveBuses();
    if (liveInterval) clearInterval(liveInterval);
    liveInterval = setInterval(updateLiveBuses, 15000); // Actualiza cada 15 seg
}

function updateLiveBuses() {
    if (!liveMapInstance) return;

    // Limpiar marcadores anteriores
    liveMarkers.forEach(m => liveMapInstance.removeLayer(m));
    liveMarkers = [];

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const dayType = getSelectedDayType();

    if (dayType === "sunday") {
        // Sin servicio dominical
        return;
    }

    // Buscar servicio activo Colón -> Liebig (Celeste)
    const cLServices = OTERO_DATA.schedules.COLON_LIEBIG[dayType] || [];
    let activeCL = findActiveBus(cLServices, currentMinutes, "COLON_LIEBIG");

    // Buscar servicio activo Liebig -> Colón (Naranja)
    const lCServices = OTERO_DATA.schedules.LIEBIG_COLON[dayType] || [];
    let activeLC = findActiveBus(lCServices, currentMinutes, "LIEBIG_COLON");

    // Renderizar Colectivo Colón ➔ Liebig (#00b4d8)
    const posCL = getBusPosition(activeCL, currentMinutes, ROUTE_COORDS.colonToLiebig);
    if (posCL) {
        const marker = L.circleMarker(posCL.coords, {
            radius: 9,
            fillColor: "#00b4d8",
            color: "#ffffff",
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9
        }).addTo(liveMapInstance).bindPopup(`<b>🚌 Colectivo en Ruta</b><br>Sentido: Colón ➔ Liebig<br>Progreso estimado: ${posCL.progress}%<br><i>Para en cada esquina</i>`);
        liveMarkers.push(marker);
    }

    // Renderizar Colectivo Liebig ➔ Colón (#f59e0b)
    const posLC = getBusPosition(activeLC, currentMinutes, ROUTE_COORDS.liebigToColon);
    if (posLC) {
        const marker = L.circleMarker(posLC.coords, {
            radius: 9,
            fillColor: "#f59e0b",
            color: "#ffffff",
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9
        }).addTo(liveMapInstance).bindPopup(`<b>🚌 Colectivo en Ruta</b><br>Sentido: Liebig ➔ Colón<br>Progreso estimado: ${posLC.progress}%<br><i>Para en cada esquina</i>`);
        liveMarkers.push(marker);
    }
}

function timeStrToMinutes(str) {
    if (!str || str === "Directo") return null;
    const [h, m] = str.split(":").map(Number);
    return h * 60 + m;
}

function findActiveBus(services, currentMinutes, direction) {
    for (let s of services) {
        let startStr = direction === "COLON_LIEBIG" ? s.colon || s.sarmiento : s.liebig;
        let endStr = direction === "COLON_LIEBIG" ? s.liebig : s.colon || s.sarmiento;
        
        let startMin = timeStrToMinutes(startStr);
        let endMin = timeStrToMinutes(endStr);

        if (startMin !== null && endMin !== null) {
            if (currentMinutes >= startMin && currentMinutes <= endMin) {
                return { startMin, endMin };
            }
        }
    }
    return null;
}

function getBusPosition(activeTrip, currentMinutes, coordsList) {
    if (!activeTrip) return null;
    let totalDuration = activeTrip.endMin - activeTrip.startMin;
    if (totalDuration <= 0) totalDuration = 30; // fallback

    let elapsed = currentMinutes - activeTrip.startMin;
    let ratio = Math.max(0, Math.min(1, elapsed / totalDuration));
    let progress = Math.round(ratio * 100);

    let segmentIndex = Math.floor(ratio * (coordsList.length - 1));
    let segmentRatio = (ratio * (coordsList.length - 1)) - segmentIndex;

    if (segmentIndex >= coordsList.length - 1) {
        segmentIndex = coordsList.length - 2;
        segmentRatio = 1;
    }

    let p1 = coordsList[segmentIndex];
    let p2 = coordsList[segmentIndex + 1];

    let lat = p1[0] + (p2[0] - p1[0]) * segmentRatio;
    let lng = p1[1] + (p2[1] - p1[1]) * segmentRatio;

    return { coords: [lat, lng], progress };
}

// ==========================================
// BUSCADOR INTELIGENTE
// ==========================================

function performSearch() {
    const origin = document.getElementById("searchOrigin").value;
    const dest = document.getElementById("searchDestination").value;
    const timeVal = document.getElementById("searchTime").value || "00:00";
    const dayType = getSelectedDayType();
    const resultsContainer = document.getElementById("searchResults");
    const metaTag = document.getElementById("searchMetaTag");

    resultsContainer.innerHTML = "";
    const dayNameMap = { weekday: "Lunes a Viernes", saturday: "Sábado / Feriado", sunday: "Domingo" };
    metaTag.innerText = dayNameMap[dayType] || "";

    if (origin === dest) {
        resultsContainer.innerHTML = `<div style="text-align:center; color: var(--text-muted); padding:20px;">Por favor, selecciona localidades distintas.</div>`;
        return;
    }

    if (dayType === "sunday") {
        resultsContainer.innerHTML = `<div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius:12px; padding:20px; text-align:center; color: #f87171;"><strong>Sin Servicio</strong><br>Los días domingos no se prestan servicios[span_1](start_span)[span_1](end_span).</div>`;
        return;
    }

    let directionKey = "COLON_LIEBIG";
    const orderIndex = { "Colón": 0, "San José": 1, "El Brillante": 2, "El Colorado": 3, "Liebig": 4 };
    if (orderIndex[origin] > orderIndex[dest]) directionKey = "LIEBIG_COLON";

    const scheduleList = OTERO_DATA.schedules[directionKey][dayType] || [];
    const keyMap = { "Colón": "colon", "San José": "sanjose", "El Brillante": "brillante", "El Colorado": "colorado", "Liebig": "liebig" };

    const originKey = keyMap[origin];
    const destKey = keyMap[dest];
    const validTrips = [];

    scheduleList.forEach(item => {
        const departure = item[originKey];
        const arrival = item[destKey];
        if (departure && arrival && departure !== "Directo" && arrival !== "Directo") {
            validTrips.push({ departureTime: departure, arrivalTime: arrival, isDirect: item.isDirect, id: item.id });
        }
    });

    if (validTrips.length === 0) {
        resultsContainer.innerHTML = `<div style="text-align:center; color: var(--text-muted); padding:20px;">No hay trayectos disponibles entre estas paradas.</div>`;
        return;
    }

    validTrips.sort((a, b) => a.departureTime.localeCompare(b.departureTime));

    let foundNext = false;
    let html = "";

    validTrips.forEach(trip => {
        const isAfter = trip.departureTime >= timeVal;
        let isNextUp = false;
        if (isAfter && !foundNext) {
            isNextUp = true;
            foundNext = true;
        }

        const durationMinutes = calculateDuration(trip.departureTime, trip.arrivalTime);
        const durationText = durationMinutes ? `${durationMinutes} min estim.` : "Directo";

        html += `
            <div class="trip-item ${isNextUp ? 'next-up' : ''} ${trip.isDirect ? 'direct' : ''}">
                <div class="trip-times">
                    <div class="time-box">
                        <div class="time">${trip.departureTime}</div>
                        <div class="label">${origin}</div>
                    </div>
                    <div class="trip-arrow">➔</div>
                    <div class="time-box">
                        <div class="time">${trip.arrivalTime}</div>
                        <div class="label">${dest}</div>
                    </div>
                </div>
                <div class="trip-details">
                    ${isNextUp ? '<span class="badge badge-green">PRÓXIMO</span><br>' : ''}
                    <span class="badge ${trip.isDirect ? 'badge-red' : 'badge-blue'}">${trip.isDirect ? 'DIRECTO' : 'REGULAR'}</span>
                    <div class="duration-text">${durationText}</div>
                </div>
            </div>
        `;
    });

    resultsContainer.innerHTML = html;
}

function calculateDuration(startStr, endStr) {
    if (!startStr || !endStr || startStr === "Directo" || endStr === "Directo") return null;
    const [h1, m1] = startStr.split(":").map(Number);
    const [h2, m2] = endStr.split(":").map(Number);
    let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (diff < 0) diff += 24 * 60;
    return diff;
}

// ==========================================
// HORARIOS Y RECORRIDOS
// ==========================================

function setupScheduleView() {
    const tabBtns = document.querySelectorAll(".tabs .tab-btn");
    const directionSelect = document.getElementById("scheduleDirection");

    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            tabBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentTabDay = btn.getAttribute("data-day");
            renderScheduleTable();
        });
    });

    directionSelect.addEventListener("change", renderScheduleTable);
    renderScheduleTable();
}

function renderScheduleTable() {
    const dir = document.getElementById("scheduleDirection").value;
    const wrapper = document.getElementById("scheduleTableWrapper");

    if (currentTabDay === "sunday") {
        wrapper.innerHTML = `<div style="padding:25px; text-align:center; color:#f87171;"><strong>DOMINGOS SIN SERVICIO</strong>[span_2](start_span)[span_2](end_span)</div>`;
        return;
    }

    const dataObj = OTERO_DATA.schedules[dir];
    const headers = dataObj.stopsOrder;
    const rows = dataObj[currentTabDay] || [];

    let tableHtml = `<table class="timetable"><thead><tr>`;
    headers.forEach(h => { tableHtml += `<th>${h}</th>`; });
    tableHtml += `</tr></thead><tbody>`;

    if (rows.length === 0) {
        tableHtml += `<tr><td colspan="${headers.length}">No hay salidas registradas.</td></tr>`;
    } else {
        rows.forEach(r => {
            tableHtml += `<tr>`;
            if (dir === "COLON_LIEBIG") {
                tableHtml += `<td>${formatTableCell(r.sarmiento)}</td><td>${formatTableCell(r.perla)}</td><td>${formatTableCell(r.colon)}</td><td>${formatTableCell(r.sanjose)}</td><td>${formatTableCell(r.brillante)}</td><td>${formatTableCell(r.colorado)}</td><td>${formatTableCell(r.liebig)}</td>`;
            } else {
                tableHtml += `<td>${formatTableCell(r.liebig)}</td><td>${formatTableCell(r.colorado)}</td><td>${formatTableCell(r.brillante)}</td><td>${formatTableCell(r.sanjose)}</td><td>${formatTableCell(r.colon)}</td><td>${formatTableCell(r.perla)}</td><td>${formatTableCell(r.sarmiento)}</td>`;
            }
            tableHtml += `</tr>`;
        });
    }

    tableHtml += `</tbody></table>`;
    wrapper.innerHTML = tableHtml;
}

function formatTableCell(val) {
    if (!val) return "-";
    if (val === "Directo") return `<span class="direct-cell">Directo</span>`;
    return `<span class="highlight">${val}</span>`;
}

function setupMapView() {
    const routeSelect = document.getElementById("mapRouteSelect");
    routeSelect.addEventListener("change", renderMap);
}

function renderMap() {
    const routeKey = document.getElementById("mapRouteSelect").value;
    const stopsList = document.getElementById("stopsList");

    if (!mapInstance) {
        mapInstance = L.map('map').setView([-32.1850, -58.1800], 11);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; OpenStreetMap' }).addTo(mapInstance);
    }

    mapInstance.eachLayer(layer => {
        if (layer instanceof L.Marker || layer instanceof L.Polyline) mapInstance.removeLayer(layer);
    });

    const routeStopsOrder = routeKey === "COLON_LIEBIG" 
        ? ["Colón", "San José", "El Brillante", "El Colorado", "Liebig"]
        : ["Liebig", "El Colorado", "El Brillante", "San José", "Colón"];

    const polylineCoords = [];
    let stopsHtml = "";

    routeStopsOrder.forEach((key, index) => {
        const stop = OTERO_DATA.stops[key];
        polylineCoords.push(stop.coords);

        L.marker(stop.coords).addTo(mapInstance).bindPopup(`<b>${index + 1}. ${stop.name}</b><br>Parada oficial (Paran en cada esquina)`);

        stopsHtml += `
            <div style="padding: 10px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 6px; display: flex; align-items: center; gap: 10px;">
                <span style="background: var(--primary-teal); color: #000; font-weight: bold; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem;">${index + 1}</span>
                <div>
                    <strong style="font-size: 0.9rem; color: #fff;">${stop.name}</strong>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">${stop.details} • Paran en cada esquina</div>
                </div>
            </div>
        `;
    });

    const lineColor = routeKey === "COLON_LIEBIG" ? '#00b4d8' : '#f59e0b';
    L.polyline(polylineCoords, { color: lineColor, weight: 4, opacity: 0.8, dashArray: '8, 8' }).addTo(mapInstance);
    mapInstance.fitBounds(L.polyline(polylineCoords).getBounds(), { padding: [30, 30] });

    stopsList.innerHTML = stopsHtml;
}
