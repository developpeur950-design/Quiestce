// =============================================================
// elements.js — Base de données des éléments chimiques
// Contient les 118 éléments + fonctions utilitaires
// =============================================================

// ─── COULEURS PAR CATÉGORIE ───────────────────────────────────
const CATEGORY_COLORS = {
  "alkali":          { bg: "#e74c3c", text: "#fff", label: "Métal alcalin" },
  "alkaline-earth":  { bg: "#e67e22", text: "#fff", label: "Métal alcalino-terreux" },
  "transition":      { bg: "#f39c12", text: "#fff", label: "Métal de transition" },
  "post-transition": { bg: "#27ae60", text: "#fff", label: "Métal post-transition" },
  "metalloid":       { bg: "#16a085", text: "#fff", label: "Métalloïde" },
  "nonmetal":        { bg: "#2980b9", text: "#fff", label: "Non-métal" },
  "halogen":         { bg: "#8e44ad", text: "#fff", label: "Halogène" },
  "noble":           { bg: "#2c3e50", text: "#fff", label: "Gaz noble" },
  "lanthanide":      { bg: "#c0392b", text: "#fff", label: "Lanthanide" },
  "actinide":        { bg: "#7f8c8d", text: "#fff", label: "Actinide" },
};

// ─── TABLEAU DES ÉLÉMENTS ─────────────────────────────────────
// Chaque élément : { number, symbol, name, mass, category,
//                   state (solid/liquid/gas), period, group,
//                   radioactive, metallic, row, col }
const ELEMENTS = [
  // Période 1
  { number:1,  symbol:"H",  name:"Hydrogène",    mass:1.008,   category:"nonmetal",        state:"gas",    period:1, group:1,  radioactive:false, metallic:false, row:1,  col:1  },
  { number:2,  symbol:"He", name:"Hélium",        mass:4.003,   category:"noble",           state:"gas",    period:1, group:18, radioactive:false, metallic:false, row:1,  col:18 },
  // Période 2
  { number:3,  symbol:"Li", name:"Lithium",       mass:6.941,   category:"alkali",          state:"solid",  period:2, group:1,  radioactive:false, metallic:true,  row:2,  col:1  },
  { number:4,  symbol:"Be", name:"Béryllium",     mass:9.012,   category:"alkaline-earth",  state:"solid",  period:2, group:2,  radioactive:false, metallic:true,  row:2,  col:2  },
  { number:5,  symbol:"B",  name:"Bore",          mass:10.811,  category:"metalloid",       state:"solid",  period:2, group:13, radioactive:false, metallic:false, row:2,  col:13 },
  { number:6,  symbol:"C",  name:"Carbone",       mass:12.011,  category:"nonmetal",        state:"solid",  period:2, group:14, radioactive:false, metallic:false, row:2,  col:14 },
  { number:7,  symbol:"N",  name:"Azote",         mass:14.007,  category:"nonmetal",        state:"gas",    period:2, group:15, radioactive:false, metallic:false, row:2,  col:15 },
  { number:8,  symbol:"O",  name:"Oxygène",       mass:15.999,  category:"nonmetal",        state:"gas",    period:2, group:16, radioactive:false, metallic:false, row:2,  col:16 },
  { number:9,  symbol:"F",  name:"Fluor",         mass:18.998,  category:"halogen",         state:"gas",    period:2, group:17, radioactive:false, metallic:false, row:2,  col:17 },
  { number:10, symbol:"Ne", name:"Néon",          mass:20.180,  category:"noble",           state:"gas",    period:2, group:18, radioactive:false, metallic:false, row:2,  col:18 },
  // Période 3
  { number:11, symbol:"Na", name:"Sodium",        mass:22.990,  category:"alkali",          state:"solid",  period:3, group:1,  radioactive:false, metallic:true,  row:3,  col:1  },
  { number:12, symbol:"Mg", name:"Magnésium",     mass:24.305,  category:"alkaline-earth",  state:"solid",  period:3, group:2,  radioactive:false, metallic:true,  row:3,  col:2  },
  { number:13, symbol:"Al", name:"Aluminium",     mass:26.982,  category:"post-transition", state:"solid",  period:3, group:13, radioactive:false, metallic:true,  row:3,  col:13 },
  { number:14, symbol:"Si", name:"Silicium",      mass:28.086,  category:"metalloid",       state:"solid",  period:3, group:14, radioactive:false, metallic:false, row:3,  col:14 },
  { number:15, symbol:"P",  name:"Phosphore",     mass:30.974,  category:"nonmetal",        state:"solid",  period:3, group:15, radioactive:false, metallic:false, row:3,  col:15 },
  { number:16, symbol:"S",  name:"Soufre",        mass:32.065,  category:"nonmetal",        state:"solid",  period:3, group:16, radioactive:false, metallic:false, row:3,  col:16 },
  { number:17, symbol:"Cl", name:"Chlore",        mass:35.453,  category:"halogen",         state:"gas",    period:3, group:17, radioactive:false, metallic:false, row:3,  col:17 },
  { number:18, symbol:"Ar", name:"Argon",         mass:39.948,  category:"noble",           state:"gas",    period:3, group:18, radioactive:false, metallic:false, row:3,  col:18 },
  // Période 4
  { number:19, symbol:"K",  name:"Potassium",     mass:39.098,  category:"alkali",          state:"solid",  period:4, group:1,  radioactive:false, metallic:true,  row:4,  col:1  },
  { number:20, symbol:"Ca", name:"Calcium",       mass:40.078,  category:"alkaline-earth",  state:"solid",  period:4, group:2,  radioactive:false, metallic:true,  row:4,  col:2  },
  { number:21, symbol:"Sc", name:"Scandium",      mass:44.956,  category:"transition",      state:"solid",  period:4, group:3,  radioactive:false, metallic:true,  row:4,  col:3  },
  { number:22, symbol:"Ti", name:"Titane",        mass:47.867,  category:"transition",      state:"solid",  period:4, group:4,  radioactive:false, metallic:true,  row:4,  col:4  },
  { number:23, symbol:"V",  name:"Vanadium",      mass:50.942,  category:"transition",      state:"solid",  period:4, group:5,  radioactive:false, metallic:true,  row:4,  col:5  },
  { number:24, symbol:"Cr", name:"Chrome",        mass:51.996,  category:"transition",      state:"solid",  period:4, group:6,  radioactive:false, metallic:true,  row:4,  col:6  },
  { number:25, symbol:"Mn", name:"Manganèse",     mass:54.938,  category:"transition",      state:"solid",  period:4, group:7,  radioactive:false, metallic:true,  row:4,  col:7  },
  { number:26, symbol:"Fe", name:"Fer",           mass:55.845,  category:"transition",      state:"solid",  period:4, group:8,  radioactive:false, metallic:true,  row:4,  col:8  },
  { number:27, symbol:"Co", name:"Cobalt",        mass:58.933,  category:"transition",      state:"solid",  period:4, group:9,  radioactive:false, metallic:true,  row:4,  col:9  },
  { number:28, symbol:"Ni", name:"Nickel",        mass:58.693,  category:"transition",      state:"solid",  period:4, group:10, radioactive:false, metallic:true,  row:4,  col:10 },
  { number:29, symbol:"Cu", name:"Cuivre",        mass:63.546,  category:"transition",      state:"solid",  period:4, group:11, radioactive:false, metallic:true,  row:4,  col:11 },
  { number:30, symbol:"Zn", name:"Zinc",          mass:65.38,   category:"transition",      state:"solid",  period:4, group:12, radioactive:false, metallic:true,  row:4,  col:12 },
  { number:31, symbol:"Ga", name:"Gallium",       mass:69.723,  category:"post-transition", state:"solid",  period:4, group:13, radioactive:false, metallic:true,  row:4,  col:13 },
  { number:32, symbol:"Ge", name:"Germanium",     mass:72.631,  category:"metalloid",       state:"solid",  period:4, group:14, radioactive:false, metallic:false, row:4,  col:14 },
  { number:33, symbol:"As", name:"Arsenic",       mass:74.922,  category:"metalloid",       state:"solid",  period:4, group:15, radioactive:false, metallic:false, row:4,  col:15 },
  { number:34, symbol:"Se", name:"Sélénium",      mass:78.971,  category:"nonmetal",        state:"solid",  period:4, group:16, radioactive:false, metallic:false, row:4,  col:16 },
  { number:35, symbol:"Br", name:"Brome",         mass:79.904,  category:"halogen",         state:"liquid", period:4, group:17, radioactive:false, metallic:false, row:4,  col:17 },
  { number:36, symbol:"Kr", name:"Krypton",       mass:83.798,  category:"noble",           state:"gas",    period:4, group:18, radioactive:false, metallic:false, row:4,  col:18 },
  // Période 5
  { number:37, symbol:"Rb", name:"Rubidium",      mass:85.468,  category:"alkali",          state:"solid",  period:5, group:1,  radioactive:false, metallic:true,  row:5,  col:1  },
  { number:38, symbol:"Sr", name:"Strontium",     mass:87.62,   category:"alkaline-earth",  state:"solid",  period:5, group:2,  radioactive:false, metallic:true,  row:5,  col:2  },
  { number:39, symbol:"Y",  name:"Yttrium",       mass:88.906,  category:"transition",      state:"solid",  period:5, group:3,  radioactive:false, metallic:true,  row:5,  col:3  },
  { number:40, symbol:"Zr", name:"Zirconium",     mass:91.224,  category:"transition",      state:"solid",  period:5, group:4,  radioactive:false, metallic:true,  row:5,  col:4  },
  { number:41, symbol:"Nb", name:"Niobium",       mass:92.906,  category:"transition",      state:"solid",  period:5, group:5,  radioactive:false, metallic:true,  row:5,  col:5  },
  { number:42, symbol:"Mo", name:"Molybdène",     mass:95.95,   category:"transition",      state:"solid",  period:5, group:6,  radioactive:false, metallic:true,  row:5,  col:6  },
  { number:43, symbol:"Tc", name:"Technétium",    mass:98,      category:"transition",      state:"solid",  period:5, group:7,  radioactive:true,  metallic:true,  row:5,  col:7  },
  { number:44, symbol:"Ru", name:"Ruthénium",     mass:101.07,  category:"transition",      state:"solid",  period:5, group:8,  radioactive:false, metallic:true,  row:5,  col:8  },
  { number:45, symbol:"Rh", name:"Rhodium",       mass:102.906, category:"transition",      state:"solid",  period:5, group:9,  radioactive:false, metallic:true,  row:5,  col:9  },
  { number:46, symbol:"Pd", name:"Palladium",     mass:106.42,  category:"transition",      state:"solid",  period:5, group:10, radioactive:false, metallic:true,  row:5,  col:10 },
  { number:47, symbol:"Ag", name:"Argent",        mass:107.868, category:"transition",      state:"solid",  period:5, group:11, radioactive:false, metallic:true,  row:5,  col:11 },
  { number:48, symbol:"Cd", name:"Cadmium",       mass:112.414, category:"transition",      state:"solid",  period:5, group:12, radioactive:false, metallic:true,  row:5,  col:12 },
  { number:49, symbol:"In", name:"Indium",        mass:114.818, category:"post-transition", state:"solid",  period:5, group:13, radioactive:false, metallic:true,  row:5,  col:13 },
  { number:50, symbol:"Sn", name:"Étain",         mass:118.711, category:"post-transition", state:"solid",  period:5, group:14, radioactive:false, metallic:true,  row:5,  col:14 },
  { number:51, symbol:"Sb", name:"Antimoine",     mass:121.760, category:"metalloid",       state:"solid",  period:5, group:15, radioactive:false, metallic:false, row:5,  col:15 },
  { number:52, symbol:"Te", name:"Tellure",       mass:127.60,  category:"metalloid",       state:"solid",  period:5, group:16, radioactive:false, metallic:false, row:5,  col:16 },
  { number:53, symbol:"I",  name:"Iode",          mass:126.904, category:"halogen",         state:"solid",  period:5, group:17, radioactive:false, metallic:false, row:5,  col:17 },
  { number:54, symbol:"Xe", name:"Xénon",         mass:131.293, category:"noble",           state:"gas",    period:5, group:18, radioactive:false, metallic:false, row:5,  col:18 },
  // Période 6
  { number:55, symbol:"Cs", name:"Césium",        mass:132.905, category:"alkali",          state:"solid",  period:6, group:1,  radioactive:false, metallic:true,  row:6,  col:1  },
  { number:56, symbol:"Ba", name:"Baryum",        mass:137.327, category:"alkaline-earth",  state:"solid",  period:6, group:2,  radioactive:false, metallic:true,  row:6,  col:2  },
  { number:57, symbol:"La", name:"Lanthane",      mass:138.905, category:"lanthanide",      state:"solid",  period:6, group:3,  radioactive:false, metallic:true,  row:8,  col:3  },
  { number:58, symbol:"Ce", name:"Cérium",        mass:140.116, category:"lanthanide",      state:"solid",  period:6, group:4,  radioactive:false, metallic:true,  row:8,  col:4  },
  { number:59, symbol:"Pr", name:"Praséodyme",    mass:140.908, category:"lanthanide",      state:"solid",  period:6, group:5,  radioactive:false, metallic:true,  row:8,  col:5  },
  { number:60, symbol:"Nd", name:"Néodyme",       mass:144.242, category:"lanthanide",      state:"solid",  period:6, group:6,  radioactive:false, metallic:true,  row:8,  col:6  },
  { number:61, symbol:"Pm", name:"Prométhium",    mass:145,     category:"lanthanide",      state:"solid",  period:6, group:7,  radioactive:true,  metallic:true,  row:8,  col:7  },
  { number:62, symbol:"Sm", name:"Samarium",      mass:150.36,  category:"lanthanide",      state:"solid",  period:6, group:8,  radioactive:false, metallic:true,  row:8,  col:8  },
  { number:63, symbol:"Eu", name:"Europium",      mass:151.964, category:"lanthanide",      state:"solid",  period:6, group:9,  radioactive:false, metallic:true,  row:8,  col:9  },
  { number:64, symbol:"Gd", name:"Gadolinium",    mass:157.25,  category:"lanthanide",      state:"solid",  period:6, group:10, radioactive:false, metallic:true,  row:8,  col:10 },
  { number:65, symbol:"Tb", name:"Terbium",       mass:158.925, category:"lanthanide",      state:"solid",  period:6, group:11, radioactive:false, metallic:true,  row:8,  col:11 },
  { number:66, symbol:"Dy", name:"Dysprosium",    mass:162.500, category:"lanthanide",      state:"solid",  period:6, group:12, radioactive:false, metallic:true,  row:8,  col:12 },
  { number:67, symbol:"Ho", name:"Holmium",       mass:164.930, category:"lanthanide",      state:"solid",  period:6, group:13, radioactive:false, metallic:true,  row:8,  col:13 },
  { number:68, symbol:"Er", name:"Erbium",        mass:167.259, category:"lanthanide",      state:"solid",  period:6, group:14, radioactive:false, metallic:true,  row:8,  col:14 },
  { number:69, symbol:"Tm", name:"Thulium",       mass:168.934, category:"lanthanide",      state:"solid",  period:6, group:15, radioactive:false, metallic:true,  row:8,  col:15 },
  { number:70, symbol:"Yb", name:"Ytterbium",     mass:173.045, category:"lanthanide",      state:"solid",  period:6, group:16, radioactive:false, metallic:true,  row:8,  col:16 },
  { number:71, symbol:"Lu", name:"Lutétium",      mass:174.967, category:"lanthanide",      state:"solid",  period:6, group:17, radioactive:false, metallic:true,  row:8,  col:17 },
  { number:72, symbol:"Hf", name:"Hafnium",       mass:178.486, category:"transition",      state:"solid",  period:6, group:4,  radioactive:false, metallic:true,  row:6,  col:4  },
  { number:73, symbol:"Ta", name:"Tantale",       mass:180.948, category:"transition",      state:"solid",  period:6, group:5,  radioactive:false, metallic:true,  row:6,  col:5  },
  { number:74, symbol:"W",  name:"Tungstène",     mass:183.84,  category:"transition",      state:"solid",  period:6, group:6,  radioactive:false, metallic:true,  row:6,  col:6  },
  { number:75, symbol:"Re", name:"Rhénium",       mass:186.207, category:"transition",      state:"solid",  period:6, group:7,  radioactive:false, metallic:true,  row:6,  col:7  },
  { number:76, symbol:"Os", name:"Osmium",        mass:190.23,  category:"transition",      state:"solid",  period:6, group:8,  radioactive:false, metallic:true,  row:6,  col:8  },
  { number:77, symbol:"Ir", name:"Iridium",       mass:192.217, category:"transition",      state:"solid",  period:6, group:9,  radioactive:false, metallic:true,  row:6,  col:9  },
  { number:78, symbol:"Pt", name:"Platine",       mass:195.084, category:"transition",      state:"solid",  period:6, group:10, radioactive:false, metallic:true,  row:6,  col:10 },
  { number:79, symbol:"Au", name:"Or",            mass:196.967, category:"transition",      state:"solid",  period:6, group:11, radioactive:false, metallic:true,  row:6,  col:11 },
  { number:80, symbol:"Hg", name:"Mercure",       mass:200.592, category:"transition",      state:"liquid", period:6, group:12, radioactive:false, metallic:true,  row:6,  col:12 },
  { number:81, symbol:"Tl", name:"Thallium",      mass:204.383, category:"post-transition", state:"solid",  period:6, group:13, radioactive:false, metallic:true,  row:6,  col:13 },
  { number:82, symbol:"Pb", name:"Plomb",         mass:207.2,   category:"post-transition", state:"solid",  period:6, group:14, radioactive:false, metallic:true,  row:6,  col:14 },
  { number:83, symbol:"Bi", name:"Bismuth",       mass:208.980, category:"post-transition", state:"solid",  period:6, group:15, radioactive:false, metallic:true,  row:6,  col:15 },
  { number:84, symbol:"Po", name:"Polonium",      mass:209,     category:"post-transition", state:"solid",  period:6, group:16, radioactive:true,  metallic:true,  row:6,  col:16 },
  { number:85, symbol:"At", name:"Astate",        mass:210,     category:"halogen",         state:"solid",  period:6, group:17, radioactive:true,  metallic:false, row:6,  col:17 },
  { number:86, symbol:"Rn", name:"Radon",         mass:222,     category:"noble",           state:"gas",    period:6, group:18, radioactive:true,  metallic:false, row:6,  col:18 },
  // Période 7
  { number:87, symbol:"Fr", name:"Francium",      mass:223,     category:"alkali",          state:"solid",  period:7, group:1,  radioactive:true,  metallic:true,  row:7,  col:1  },
  { number:88, symbol:"Ra", name:"Radium",        mass:226,     category:"alkaline-earth",  state:"solid",  period:7, group:2,  radioactive:true,  metallic:true,  row:7,  col:2  },
  { number:89, symbol:"Ac", name:"Actinium",      mass:227,     category:"actinide",        state:"solid",  period:7, group:3,  radioactive:true,  metallic:true,  row:9,  col:3  },
  { number:90, symbol:"Th", name:"Thorium",       mass:232.038, category:"actinide",        state:"solid",  period:7, group:4,  radioactive:true,  metallic:true,  row:9,  col:4  },
  { number:91, symbol:"Pa", name:"Protactinium",  mass:231.036, category:"actinide",        state:"solid",  period:7, group:5,  radioactive:true,  metallic:true,  row:9,  col:5  },
  { number:92, symbol:"U",  name:"Uranium",       mass:238.029, category:"actinide",        state:"solid",  period:7, group:6,  radioactive:true,  metallic:true,  row:9,  col:6  },
  { number:93, symbol:"Np", name:"Neptunium",     mass:237,     category:"actinide",        state:"solid",  period:7, group:7,  radioactive:true,  metallic:true,  row:9,  col:7  },
  { number:94, symbol:"Pu", name:"Plutonium",     mass:244,     category:"actinide",        state:"solid",  period:7, group:8,  radioactive:true,  metallic:true,  row:9,  col:8  },
  { number:95, symbol:"Am", name:"Américium",     mass:243,     category:"actinide",        state:"solid",  period:7, group:9,  radioactive:true,  metallic:true,  row:9,  col:9  },
  { number:96, symbol:"Cm", name:"Curium",        mass:247,     category:"actinide",        state:"solid",  period:7, group:10, radioactive:true,  metallic:true,  row:9,  col:10 },
  { number:97, symbol:"Bk", name:"Berkélium",     mass:247,     category:"actinide",        state:"solid",  period:7, group:11, radioactive:true,  metallic:true,  row:9,  col:11 },
  { number:98, symbol:"Cf", name:"Californium",   mass:251,     category:"actinide",        state:"solid",  period:7, group:12, radioactive:true,  metallic:true,  row:9,  col:12 },
  { number:99, symbol:"Es", name:"Einsteinium",   mass:252,     category:"actinide",        state:"solid",  period:7, group:13, radioactive:true,  metallic:true,  row:9,  col:13 },
  { number:100,symbol:"Fm", name:"Fermium",       mass:257,     category:"actinide",        state:"solid",  period:7, group:14, radioactive:true,  metallic:true,  row:9,  col:14 },
  { number:101,symbol:"Md", name:"Mendélévium",   mass:258,     category:"actinide",        state:"solid",  period:7, group:15, radioactive:true,  metallic:true,  row:9,  col:15 },
  { number:102,symbol:"No", name:"Nobélium",      mass:259,     category:"actinide",        state:"solid",  period:7, group:16, radioactive:true,  metallic:true,  row:9,  col:16 },
  { number:103,symbol:"Lr", name:"Lawrencium",    mass:266,     category:"actinide",        state:"solid",  period:7, group:17, radioactive:true,  metallic:true,  row:9,  col:17 },
  { number:104,symbol:"Rf", name:"Rutherfordium", mass:267,     category:"transition",      state:"solid",  period:7, group:4,  radioactive:true,  metallic:true,  row:7,  col:4  },
  { number:105,symbol:"Db", name:"Dubnium",       mass:268,     category:"transition",      state:"solid",  period:7, group:5,  radioactive:true,  metallic:true,  row:7,  col:5  },
  { number:106,symbol:"Sg", name:"Seaborgium",    mass:269,     category:"transition",      state:"solid",  period:7, group:6,  radioactive:true,  metallic:true,  row:7,  col:6  },
  { number:107,symbol:"Bh", name:"Bohrium",       mass:270,     category:"transition",      state:"solid",  period:7, group:7,  radioactive:true,  metallic:true,  row:7,  col:7  },
  { number:108,symbol:"Hs", name:"Hassium",       mass:277,     category:"transition",      state:"solid",  period:7, group:8,  radioactive:true,  metallic:true,  row:7,  col:8  },
  { number:109,symbol:"Mt", name:"Meitnérium",    mass:278,     category:"transition",      state:"solid",  period:7, group:9,  radioactive:true,  metallic:true,  row:7,  col:9  },
  { number:110,symbol:"Ds", name:"Darmstadtium",  mass:281,     category:"transition",      state:"solid",  period:7, group:10, radioactive:true,  metallic:true,  row:7,  col:10 },
  { number:111,symbol:"Rg", name:"Roentgenium",   mass:282,     category:"transition",      state:"solid",  period:7, group:11, radioactive:true,  metallic:true,  row:7,  col:11 },
  { number:112,symbol:"Cn", name:"Copernicium",   mass:285,     category:"transition",      state:"gas",    period:7, group:12, radioactive:true,  metallic:true,  row:7,  col:12 },
  { number:113,symbol:"Nh", name:"Nihonium",      mass:286,     category:"post-transition", state:"solid",  period:7, group:13, radioactive:true,  metallic:true,  row:7,  col:13 },
  { number:114,symbol:"Fl", name:"Flérovium",     mass:289,     category:"post-transition", state:"solid",  period:7, group:14, radioactive:true,  metallic:true,  row:7,  col:14 },
  { number:115,symbol:"Mc", name:"Moscovium",     mass:290,     category:"post-transition", state:"solid",  period:7, group:15, radioactive:true,  metallic:true,  row:7,  col:15 },
  { number:116,symbol:"Lv", name:"Livermorium",   mass:293,     category:"post-transition", state:"solid",  period:7, group:16, radioactive:true,  metallic:true,  row:7,  col:16 },
  { number:117,symbol:"Ts", name:"Tennesse",      mass:294,     category:"halogen",         state:"solid",  period:7, group:17, radioactive:true,  metallic:false, row:7,  col:17 },
  { number:118,symbol:"Og", name:"Oganesson",     mass:294,     category:"noble",           state:"gas",    period:7, group:18, radioactive:true,  metallic:false, row:7,  col:18 },
];

// ─── QUESTIONS RAPIDES PRÉDÉFINIES ───────────────────────────
const QUICK_QUESTIONS = [
  { text: "Est-il un métal ?",                  key: "metallic" },
  { text: "Est-il un gaz noble ?",              key: "noble" },
  { text: "Est-il un halogène ?",               key: "halogen" },
  { text: "Est-il radioactif ?",                key: "radioactive" },
  { text: "Est-il gazeux à 25°C ?",             key: "gas" },
  { text: "Est-il liquide à 25°C ?",            key: "liquid" },
  { text: "Est-il solide à 25°C ?",             key: "solid" },
  { text: "Son numéro atomique est-il ≤ 20 ?",  key: "number_lte_20" },
  { text: "Son numéro atomique est-il ≤ 50 ?",  key: "number_lte_50" },
  { text: "Son numéro atomique est-il > 50 ?",  key: "number_gt_50" },
  { text: "Est-il en période 1 ou 2 ?",         key: "period_1_2" },
  { text: "Est-il en période 3 ou 4 ?",         key: "period_3_4" },
  { text: "Sa masse atomique est-elle < 50 ?",  key: "mass_lt_50" },
  { text: "Est-il un métal de transition ?",    key: "transition" },
  { text: "Est-il un métal alcalin ?",          key: "alkali" },
  { text: "Est-il un métalloïde ?",             key: "metalloid" },
  { text: "Est-il un non-métal ?",              key: "nonmetal" },
  { text: "Est-il dans le groupe 1 ?",          key: "group_1" },
  { text: "Est-il dans le groupe 18 ?",         key: "group_18" },
  { text: "A-t-il un symbole d'une lettre ?",   key: "one_letter" },
];

/**
 * Évalue automatiquement une question rapide sur un élément
 * @param {string} key - clé de la question
 * @param {Object} element - l'élément chimique
 * @returns {boolean|null} - true/false ou null si question libre
 */
function evaluateQuestion(key, element) {
  switch(key) {
    case "metallic":       return element.metallic === true;
    case "noble":          return element.category === "noble";
    case "halogen":        return element.category === "halogen";
    case "radioactive":    return element.radioactive === true;
    case "gas":            return element.state === "gas";
    case "liquid":         return element.state === "liquid";
    case "solid":          return element.state === "solid";
    case "number_lte_20":  return element.number <= 20;
    case "number_lte_50":  return element.number <= 50;
    case "number_gt_50":   return element.number > 50;
    case "period_1_2":     return element.period <= 2;
    case "period_3_4":     return element.period === 3 || element.period === 4;
    case "mass_lt_50":     return element.mass < 50;
    case "transition":     return element.category === "transition";
    case "alkali":         return element.category === "alkali";
    case "metalloid":      return element.category === "metalloid";
    case "nonmetal":       return element.category === "nonmetal";
    case "group_1":        return element.group === 1;
    case "group_18":       return element.group === 18;
    case "one_letter":     return element.symbol.length === 1;
    default:               return null; // question libre → réponse manuelle
  }
}

/**
 * Retourne un élément par son numéro atomique
 */
function getElementById(number) {
  return ELEMENTS.find(e => e.number === number) || null;
}

/**
 * Génère le HTML d'un badge élément coloré
 */
function renderElementBadge(element, size = "normal") {
  if (!element) return "<div class='element-badge-empty'>?</div>";
  const color = CATEGORY_COLORS[element.category] || { bg:"#555", text:"#fff" };
  return `
    <div class="element-tile ${size}" style="background:${color.bg};color:${color.text}">
      <span class="tile-number">${element.number}</span>
      <span class="tile-symbol">${element.symbol}</span>
      <span class="tile-name">${element.name}</span>
      <span class="tile-mass">${parseFloat(element.mass).toFixed(1)}</span>
    </div>
  `;
}
