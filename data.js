const OTERO_DATA = {
  lastUpdated: "2026-08-01",
  verified: true,
  tarifas: {
    colon_sanjose: 2500,
    colon_brillante: 2500,
    colon_colorado: 2500,
    colon_liebig: 2500,
    sanjose_brillante: 2000,
    sanjose_colorado: 2000,
    sanjose_liebig: 2000,
    estudiantil: 1500,
    discapacidad: 0
  },
  paradas: [
    { id: "surquiza", nombre: "Sarmiento y Urquiza", localidad: "Colón" },
    { id: "laperla", nombre: "Panadería La Perla", localidad: "Colón" },
    { id: "tcolon", nombre: "Terminal Colón", localidad: "Colón" },
    { id: "tsanjose", nombre: "Terminal San José", localidad: "San José" },
    { id: "brillante", nombre: "B° El Brillante", localidad: "El Brillante" },
    { id: "colorado", nombre: "B° El Colorado", localidad: "El Colorado" },
    { id: "liebig", nombre: "Pueblo Liebig", localidad: "Pueblo Liebig" }
  ],
  horarios: {
    "colon-liebig": [
      { salida: "06:10", paradas: { surquiza:"06:10", laperla:"06:15", tcolon:"06:20", liebig:"06:40" }, directo: true, sabado: false },
      { salida: "07:00", paradas: { surquiza:"07:00", laperla:"07:05", tcolon:"07:10", tsanjose:"07:20", brillante:"07:30", colorado:"07:40", liebig:"07:50" }, directo: false, sabado: true },
      { salida: "08:00", paradas: { surquiza:"08:00", laperla:"08:05", tcolon:"08:15", tsanjose:"08:25", brillante:"08:35", colorado:"08:40", liebig:"08:55" }, directo: false, sabado: true },
      { salida: "10:20", paradas: { surquiza:"10:20", laperla:"10:25", tcolon:"10:30", tsanjose:"10:45", brillante:"10:55", colorado:"11:00", liebig:"11:05" }, directo: false, sabado: true },
      { salida: "12:35", paradas: { surquiza:"12:35", laperla:"12:40", tcolon:"12:45", tsanjose:"13:05", brillante:"13:15", colorado:"13:20", liebig:"13:30" }, directo: false, sabado: true },
      { salida: "15:25", paradas: { surquiza:"15:25", laperla:"15:30", tcolon:"15:35", tsanjose:"15:40", brillante:"15:50", colorado:"15:55", liebig:"16:00" }, directo: false, sabado: true },
      { salida: "17:50", paradas: { surquiza:"17:50", laperla:"17:55", tcolon:"18:00", tsanjose:"18:20", brillante:"18:30", colorado:"18:35", liebig:"18:45" }, directo: false, sabado: true },
      { salida: "19:50", paradas: { surquiza:"19:50", laperla:"19:55", tcolon:"20:00", tsanjose:"20:20", brillante:"20:30", colorado:"20:35", liebig:"20:45" }, directo: false, sabado: true }
    ],
    "liebig-colon": [
      { salida: "06:45", paradas: { liebig:"06:45", colorado:"06:50", brillante:"06:55", tsanjose:"07:10", tcolon:"07:30", laperla:"07:35", surquiza:"07:40" }, directo: false, sabado: false },
      { salida: "08:00", paradas: { liebig:"08:00", colorado:"08:05", brillante:"08:10", tsanjose:"08:20", tcolon:"08:50", laperla:"08:55", surquiza:"09:00" }, directo: false, sabado: true },
      { salida: "09:00", paradas: { liebig:"09:00", colorado:"09:10", brillante:"09:15", tsanjose:"09:25", tcolon:"09:55", laperla:"10:00", surquiza:"10:05" }, directo: false, sabado: true },
      { salida: "11:45", paradas: { liebig:"11:45", colorado:"11:50", brillante:"11:55", tsanjose:"12:05", tcolon:"12:35", laperla:"12:40", surquiza:"12:45" }, directo: false, sabado: true },
      { salida: "13:30", paradas: { liebig:"13:30", colorado:"13:40", brillante:"13:50", tsanjose:"14:00", tcolon:"14:30", laperla:"14:35", surquiza:"14:40" }, directo: false, sabado: true },
      { salida: "16:30", paradas: { liebig:"16:30", colorado:"16:35", brillante:"16:40", tsanjose:"16:50", tcolon:"17:20", laperla:"17:25", surquiza:"17:30" }, directo: false, sabado: true },
      { salida: "19:00", paradas: { liebig:"19:00", colorado:"19:05", brillante:"19:10", tsanjose:"19:20", tcolon:"19:45", laperla:"19:50", surquiza:"19:55" }, directo: false, sabado: true },
      { salida: "20:45", paradas: { liebig:"20:45", tcolon:"21:05", laperla:"21:10", surquiza:"21:15" }, directo: true, sabado: true }
    ]
  }
};
