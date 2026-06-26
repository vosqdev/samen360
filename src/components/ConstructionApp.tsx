import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { 
  AlertTriangle, 
  MapPin, 
  Calendar, 
  HelpCircle, 
  Phone, 
  FileWarning, 
  CheckCircle2, 
  ChevronRight, 
  Layers, 
  Heart, 
  Sparkles, 
  Gauge, 
  Wind, 
  Activity, 
  BarChart2, 
  Smile, 
  Map as MapIcon, 
  Construction,
  Info
} from "lucide-react";
import { MapMarker, UserRole, getRoleLabel } from "../types";

interface Complaint {
  id: string;
  category: string;
  location: string;
  lat: number;
  lng: number;
  desc: string;
  date: string;
  status: string;
}

interface ConstructionAppProps {
  markers?: MapMarker[];
  onAddMarker?: (newMarker: Omit<MapMarker, "id" | "date" | "likes">) => Promise<void>;
  onLikeMarker?: (id: string) => void;
  selectedRole?: UserRole;
  userName?: string;
}

export default function ConstructionApp({
  markers = [],
  onAddMarker,
  onLikeMarker,
  selectedRole = "Bewoner",
  userName = "Utrechtse Burger",
}: ConstructionAppProps) {
  // Navigation tabs for the map section
  const [activeMapTab, setActiveMapTab] = useState<"streetmap" | "plankaart">("streetmap");

  // Leaflet references
  const mainMapRef = useRef<HTMLDivElement>(null);
  const leafletMapInstanceRef = useRef<L.Map | null>(null);
  const leafletTileLayerRef = useRef<L.TileLayer | null>(null);
  const leafletMarkersGroupRef = useRef<L.LayerGroup | null>(null);

  // Map settings
  const [mapLayer, setMapLayer] = useState<"standard" | "topographical" | "zoning">("standard");

  // In-app complaints state
  const [complaints, setComplaints] = useState<Complaint[]>([
    { 
      id: "c1", 
      category: "Geluidshinder", 
      location: "Kadegebied Spoorzone", 
      lat: 52.0912, 
      lng: 5.1209,
      desc: "Zwaar heien om 07:15 uur 's ochtends, dit zou pas na 08:00 uur mogen conform de afspraken.", 
      date: "2026-06-10", 
      status: "In Behandeling" 
    },
    { 
      id: "c2", 
      category: "Verkeershinder", 
      location: "Toegangsweg Bouwhub A (Pletterijstraat)", 
      lat: 52.0889, 
      lng: 5.1235,
      desc: "Betonwagen blokkeert het gehele fietspad waardoor scholieren over de drukke rijbaan moeten uitwijken.", 
      date: "2026-06-11", 
      status: "Geklaard" 
    }
  ]);

  const [hinderCategory, setHinderCategory] = useState("Geluidshinder");
  const [hinderLoc, setHinderLoc] = useState("");
  const [hinderDesc, setHinderDesc] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Track active visual hover elements
  const [activePlankaartMarker, setActivePlankaartMarker] = useState<MapMarker | null>(null);

  // Construction timeline tasks schedule
  const constructionSchedule = [
    { task: "Sanering & Grondklaar maken", date: "Q3 2028 - Q4 2028", status: "Gepland", details: "Afvoeren vervuilde grond oude gasfabriek." },
    { task: "Graven WKO-putten & Fundering", date: "Q1 2029 - Q2 2029", status: "Gepland", details: "Heipalen trillingsvrij boren." },
    { task: "Ruwbouw Spoorzone Blokken", date: "Medio 2029", status: "Gepland", details: "Houtskeletbouw & Prefab kranen." },
    { task: "Afbouw & Wijkpark aanleg", date: "Eind 2029", status: "Gepland", details: "Inrichten 35% onverharde wadizones." }
  ];

  // 1. Initialize Map
  useEffect(() => {
    if (activeMapTab !== "streetmap" || !mainMapRef.current) return;

    if (!leafletMapInstanceRef.current) {
      // Center map around Spoorzone West Utrecht [52.0907, 5.1214]
      const map = L.map(mainMapRef.current, {
        center: [52.0907, 5.1214],
        zoom: 15,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      leafletMapInstanceRef.current = map;
      leafletMarkersGroupRef.current = L.layerGroup().addTo(map);
    }

    // Force size check
    const timer = setTimeout(() => {
      if (leafletMapInstanceRef.current) {
        leafletMapInstanceRef.current.invalidateSize();
      }
    }, 200);

    return () => {
      clearTimeout(timer);
    };
  }, [activeMapTab]);

  // 2. Map layers switcher
  useEffect(() => {
    const map = leafletMapInstanceRef.current;
    if (activeMapTab !== "streetmap" || !map) return;

    if (leafletTileLayerRef.current) {
      leafletTileLayerRef.current.remove();
    }

    let url = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    let attribution = '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>';

    if (mapLayer === "topographical") {
      url = "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png";
      attribution = '&copy; Humanitarian OSM Team';
    } else if (mapLayer === "zoning") {
      url = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
      attribution = "Tiles &copy; Esri &mdash; Gegevens van gemeenten & sateliet";
    }

    leafletTileLayerRef.current = L.tileLayer(url, { attribution }).addTo(map);
  }, [mapLayer, activeMapTab]);

  // 3. Render Leaflet Markers (OMLEIDINGEN, MONITORS and complaints combined)
  useEffect(() => {
    const map = leafletMapInstanceRef.current;
    const markersGroup = leafletMarkersGroupRef.current;
    if (activeMapTab !== "streetmap" || !map || !markersGroup) return;

    markersGroup.clearLayers();

    // Context static pins for construction status
    const staticPins = [
      {
        id: "hub-a",
        title: "Bouwhub A Utrecht West",
        lat: 52.0925,
        lng: 5.1185,
        type: "hub",
        desc: "Primaire leverancier betonstaal en logistiek.",
        color: "bg-amber-600",
        icon: "🏗️",
      },
      {
        id: "omleiding-1",
        title: "Tijdelijke Fietsomleiding",
        lat: 52.0895,
        lng: 52.0895, // correction below
        lng_fixed: 5.1225,
        type: "detour",
        desc: "Fietsers omgeleid via Cartesiusweg i.v.m. kraanafzet.",
        color: "bg-blue-600",
        icon: "🚴",
      },
      {
        id: "sensor-sound",
        title: "Live dB Sensor (Noordzijde)",
        lat: 52.0931,
        lng: 5.1238,
        type: "sensor",
        desc: "Continu geluidsmeter. Momenteel: 72 dB. Grens: 80 dB.",
        color: "bg-purple-600",
        icon: "🔊",
      },
      {
        id: "sensor-dust",
        title: "Live Fijnstof Sensor",
        lat: 52.0881,
        lng: 5.1192,
        type: "sensor",
        desc: "Particulate Matter: 24.1 µg/m³. Norm: < 40 µg/m³.",
        color: "bg-teal-650",
        icon: "🌬️",
      }
    ];

    // Render Static indicators
    staticPins.forEach((pin) => {
      const latVal = pin.lat;
      const lngVal = pin.id === "omleiding-1" ? pin.lng_fixed : pin.lng;

      const html = `
        <div class="relative group cursor-pointer">
          <div class="absolute -inset-1 rounded-full ${pin.color}/30 animate-pulse"></div>
          <div class="relative w-8 h-8 rounded-full ${pin.color} border-2 border-white flex items-center justify-center text-white shadow-md">
            <span class="text-xs font-bold leading-none">${pin.icon}</span>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: "custom-leaflet-marker",
        html: html,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const lfMarker = L.marker([latVal, lngVal], { icon: customIcon }).addTo(markersGroup);
      lfMarker.bindPopup(`
        <div class="p-2 select-text font-sans text-neutral-900 leading-normal" style="width: 200px;">
          <h4 class="font-extrabold text-xs text-neutral-800 uppercase tracking-tight">${pin.title}</h4>
          <p class="text-[11px] text-neutral-600 mt-1">${pin.desc}</p>
          <span class="inline-block mt-2 text-[9px] bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded font-black uppercase">Spoorzone West</span>
        </div>
      `);
    });

    // Render complaints as Red Alert indicators on the map
    complaints.forEach((c) => {
      const isPending = c.status === "In Behandeling";
      const iconText = isPending ? "⚠️" : "✅";
      const colorBg = isPending ? "bg-red-650" : "bg-emerald-600";

      const html = `
        <div class="relative group cursor-pointer">
          <div class="absolute -inset-1.5 rounded-full ${colorBg}/20 animate-ping"></div>
          <div class="relative w-8 h-8 rounded-full ${colorBg} border-2 border-white flex items-center justify-center text-white shadow-md">
            <span class="text-xs font-bold leading-none">${iconText}</span>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: "custom-leaflet-marker",
        html: html,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const complaintMarker = L.marker([c.lat, c.lng], { icon: customIcon }).addTo(markersGroup);
      complaintMarker.bindPopup(`
        <div class="p-2.5 font-sans leading-normal text-slate-900" style="width: 210px;">
          <div class="flex justify-between items-center bg-slate-50 border-b border-slate-100 pb-1.5 mb-1.5">
            <span class="font-black text-[10px] text-red-650 uppercase tracking-wide">${c.category}</span>
            <span class="text-[9px] font-bold text-slate-500">${c.date}</span>
          </div>
          <p class="font-extrabold text-xs text-slate-800">${c.location}</p>
          <p class="text-[10px] text-slate-600 mt-1 italic">"${c.desc}"</p>
          <div class="mt-2.5 pt-2 border-t border-slate-100 flex justify-between items-center">
            <span class="text-[9px] text-slate-400">Locaal loket</span>
            <span class="text-[10px] bg-amber-500/10 text-amber-900 font-extrabold px-1.5 py-0.5 rounded uppercase">${c.status}</span>
          </div>
        </div>
      `);
    });

  }, [complaints, activeMapTab]);

  const handleMeldHinder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hinderDesc.trim() || !hinderLoc.trim()) return;

    // Generate coordinate close to Utrecht Spoorzone West central box
    const centerLat = 52.0907;
    const centerLng = 5.1214;
    const offsetLat = (Math.random() - 0.5) * 0.007; // ~500m spread
    const offsetLng = (Math.random() - 0.5) * 0.007;

    const newCompl: Complaint = {
      id: `c-${Date.now()}`,
      category: hinderCategory,
      location: hinderLoc,
      lat: centerLat + offsetLat,
      lng: centerLng + offsetLng,
      desc: hinderDesc,
      date: new Date().toISOString().split("T")[0],
      status: "In Behandeling"
    };

    setComplaints([newCompl, ...complaints]);
    setHinderLoc("");
    setHinderDesc("");
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="bg-stone-900 text-stone-105 rounded-3xl p-6 border-2 border-amber-500/20 shadow-2xl relative overflow-hidden" id="bouwapp-module animate-in fade-in duration-300">
      
      {/* Striped construction border */}
      <div className="absolute top-0 inset-x-0 h-2.5 bg-gradient-to-r from-amber-500 via-stone-900 to-amber-500 repeating-stripes"></div>

      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-stone-800 pb-4 mb-6 pt-3">
        <div>
          <span className="text-[9px] bg-amber-500 text-stone-950 font-black px-2.5 py-1 rounded-full uppercase tracking-widest inline-block mb-1.5 animate-pulse">
            🚧 Live Bouwfase Mode Active
          </span>
          <h3 className="font-extrabold text-white text-lg md:text-xl flex items-center gap-2">
            <span>Utrecht Havenkwartier Bouw-App & Live Monitors</span>
          </h3>
          <p className="text-xs text-stone-400 mt-1">
            Real-time updates over actieve omleidingen, geluidshindermetingen, fijnstofsensoren en de digitale plankaart van de wijk.
          </p>
        </div>

        {/* Support contact info */}
        <div className="flex items-center gap-3 bg-stone-950/75 border border-amber-500/20 px-4.5 py-2 rounded-2xl shrink-0">
          <Phone className="w-4 h-4 text-amber-500" />
          <div className="text-[11px]">
            <p className="text-stone-400 font-bold uppercase leading-none">Omgevingsmanager Spoorzone</p>
            <p className="font-black text-white mt-1">030 - 242 88 55 (Spreekuur: 08-16u)</p>
          </div>
        </div>
      </div>

      {/* 5-Column Live KPI Indicators layout */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-6">
        
        {/* KPI 1: Geluidsmeting */}
        <div className="bg-stone-950/80 border border-stone-800 p-3.5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] text-purple-400/90 font-bold uppercase tracking-wider">Lawaainiveau</span>
            <span className="p-1 rounded bg-purple-500/10 text-purple-400"><Gauge className="w-3.5 h-3.5" /></span>
          </div>
          <div>
            <span className="text-xl font-black text-white">72.3 dB</span>
            <div className="flex items-center gap-1.5 mt-1 text-[10px] font-semibold text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Conform norm (&lt;80 dB)</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Luchtkwaliteit */}
        <div className="bg-stone-950/80 border border-stone-800 p-3.5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] text-teal-400 font-bold uppercase tracking-wider">Luchtkwaliteit</span>
            <span className="p-1 rounded bg-teal-500/10 text-teal-400"><Wind className="w-3.5 h-3.5" /></span>
          </div>
          <div>
            <span className="text-xl font-black text-white">24.1 rPM</span>
            <div className="flex items-center gap-1.5 mt-1 text-[10px] font-semibold text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>PM10 Goedgekeurd</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Trillingen */}
        <div className="bg-stone-950/80 border border-stone-800 p-3.5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] text-amber-400 font-bold uppercase tracking-wider">Trillingsmeting</span>
            <span className="p-1 rounded bg-amber-500/10 text-amber-400"><Activity className="w-3.5 h-3.5" /></span>
          </div>
          <div>
            <span className="text-xl font-black text-white">1.1 mm/s</span>
            <div className="flex items-center gap-1.5 mt-1 text-[10px] font-semibold text-amber-400 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              <span>Trillingsvrij Boren Actief</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Co-creatie Support */}
        <div className="bg-stone-950/80 border border-stone-800 p-3.5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">Burger Inbreng</span>
            <span className="p-1 rounded bg-emerald-500/10 text-emerald-400"><Smile className="w-3.5 h-3.5" /></span>
          </div>
          <div>
            <span className="text-xl font-black text-white">82% Steun</span>
            <div className="flex items-center gap-1.5 mt-1 text-[10px] font-semibold text-stone-400">
              <span className="text-emerald-400 font-bold">18k+</span>
              <span>Gemeenschaps-interacties</span>
            </div>
          </div>
        </div>

        {/* KPI 5: Complaints Desk status */}
        <div className="bg-stone-950/80 border border-stone-800 p-3.5 rounded-2xl flex flex-col justify-between col-span-2 md:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] text-red-400 font-bold uppercase tracking-wider">Hinderloket</span>
            <span className="p-1 rounded bg-red-500/10 text-red-400"><FileWarning className="w-3.5 h-3.5" /></span>
          </div>
          <div>
            <span className="text-xl font-black text-rose-450">92% Geklaard</span>
            <div className="text-[10px] font-semibold text-rose-300 mt-1">
              <span>{complaints.filter(x => x.status === "In Behandeling").length} openstaand</span>
            </div>
          </div>
        </div>

      </section>

      {/* Primary columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Interactive workspace maps (Tabbed between Streetmap and Digitale Plankaart) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          
          <div className="bg-stone-950 rounded-2xl border border-stone-800 overflow-hidden flex flex-col h-[540px]">
            
            {/* Maps toggles and controllers */}
            <div className="bg-stone-900 border-b border-stone-800 px-4 py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 p-1 bg-stone-950 border border-stone-800 rounded-xl select-none">
                <button
                  type="button"
                  onClick={() => setActiveMapTab("streetmap")}
                  className={`px-4 py-2 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeMapTab === "streetmap"
                      ? "bg-amber-500 text-stone-950 shadow-sm"
                      : "text-stone-400 hover:text-white"
                  }`}
                >
                  <MapIcon className="w-3.5 h-3.5" />
                  <span>🗺️ Streetmap Omgevingskaart</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMapTab("plankaart")}
                  className={`px-4 py-2 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeMapTab === "plankaart"
                      ? "bg-amber-500 text-stone-950 shadow-sm"
                      : "text-stone-400 hover:text-white"
                  }`}
                >
                  <Construction className="w-3.5 h-3.5" />
                  <span>📐 Digitale Plankaart Co-Creatie</span>
                </button>
              </div>

              {/* Dynamic Sub-options based on active selection */}
              {activeMapTab === "streetmap" ? (
                <div className="flex items-center gap-1 bg-stone-950/70 border border-stone-800 rounded-xl p-1 select-none text-[10px] font-extrabold">
                  <button
                    onClick={() => setMapLayer("standard")}
                    className={`px-2 py-1 rounded-md transition ${mapLayer === "standard" ? "bg-stone-850 text-amber-450" : "text-stone-450 hover:text-white"}`}
                  >
                    Standaard
                  </button>
                  <button
                    onClick={() => setMapLayer("topographical")}
                    className={`px-2 py-1 rounded-md transition ${mapLayer === "topographical" ? "bg-stone-850 text-amber-450" : "text-stone-450 hover:text-white"}`}
                  >
                    Topografie
                  </button>
                  <button
                    onClick={() => setMapLayer("zoning")}
                    className={`px-2 py-1 rounded-md transition ${mapLayer === "zoning" ? "bg-stone-850 text-amber-450" : "text-stone-450 hover:text-white"}`}
                  >
                    Sateliet
                  </button>
                </div>
              ) : (
                <span className="text-[10px] text-amber-400/90 font-mono flex items-center gap-1 py-1.5 px-3 bg-stone-950 border border-stone-800 rounded-xl">
                  <Sparkles className="w-3.5 h-3.5" /> Toekomstig Ontwerpplan Utrecht
                </span>
              )}

            </div>

            {/* Viewport 1: Leaflet Street Map */}
            {activeMapTab === "streetmap" && (
              <div className="flex-1 w-full relative h-full flex flex-col justify-between">
                
                {/* Embedded OSM Leaflet container */}
                <div ref={mainMapRef} className="absolute inset-0 w-full h-full z-0 pointer-events-auto" style={{ minHeight: "360px" }}></div>
                
                {/* Absolute overlay elements explaining layout controls in bottom margin */}
                <div className="absolute bottom-3 left-3 bg-stone-950/90 border border-stone-800 p-2.5 rounded-xl text-[10px] text-stone-300 z-10 flex items-center gap-2 pointer-events-none select-none max-w-sm backdrop-blur-xs">
                  <span className="w-2 h-2 rounded-full bg-red-600 block animate-pulse"></span>
                  <p className="leading-tight">
                    <strong className="text-white block">Streetmap Live Status:</strong> Click pins to inspect detour metrics & localized decibel measurements.
                  </p>
                </div>

                <div className="absolute top-2 right-2 bg-stone-950/90 border border-stone-800 px-2 py-1 rounded text-[9px] text-stone-400 capitalize font-bold z-10 select-none">
                  Laag: {mapLayer === "standard" ? "OSM Standaard" : mapLayer === "topographical" ? "Humanitaire Kaart" : "Esri Sateliet"}
                </div>
              </div>
            )}

            {/* Viewport 2: Digitale Plankaart SVG vector-art */}
            {activeMapTab === "plankaart" && (
              <div className="flex-1 w-full relative bg-[#FAF9F6] border-t border-stone-800 relative select-none">
                
                <svg viewBox="0 0 800 500" className="w-full h-full object-cover">
                  {/* Grid overlay */}
                  <pattern id="planGrid" width="25" height="25" patternUnits="userSpaceOnUse">
                    <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#e4e4e7" strokeWidth="0.5" />
                  </pattern>
                  <rect width="100%" height="100%" fill="url(#planGrid)" opacity="0.6" />

                  {/* Water canals */}
                  <path
                    d="M 20 20 C 150 50, 180 180, 120 300 C 80 380, 100 480, 150 490 L 10 490 L 10 10"
                    fill="#e0f2fe"
                    stroke="#bae6fd"
                    strokeWidth="3"
                    opacity="0.95"
                  />
                  <path
                    d="M 120 300 Q 220 320, 280 250 T 400 240 L 410 280 Q 280 280, 130 350 Z"
                    fill="#e0f2fe"
                    stroke="#bae6fd"
                    strokeWidth="2.5"
                  />

                  {/* Utrecht Rail track representation */}
                  <g>
                    <path
                      d="M 750 10 L 750 490"
                      stroke="#64748b"
                      strokeWidth="9"
                      strokeDasharray="14 9"
                    />
                    <path
                      d="M 746 10 L 746 490 M 754 10 L 754 490"
                      stroke="#94a3b8"
                      strokeWidth="1.5"
                    />
                    <text x="732" y="250" fill="#64748b" fontSize="8" transform="rotate(-90 732 250)" fontFamily="monospace" letterSpacing="1">
                      SPOORTRAJECT UTRECHT WEST
                    </text>
                  </g>

                  {/* Planned Spoor-Geluidswal (The Acoustical Wall) */}
                  <path
                    d="M 725 20 L 725 480"
                    stroke="#e9d5ff"
                    strokeWidth="7"
                    strokeLinecap="round"
                    opacity="0.75"
                  />
                  <path
                    d="M 725 20 L 725 480"
                    stroke="#9333ea"
                    strokeWidth="1.5"
                    strokeDasharray="4 6"
                    strokeLinecap="round"
                  />
                  <text x="712" y="30" fill="#7e22ce" fontSize="8" fontWeight="bold">Geluidswal (4m)</text>

                  {/* Central Green Area - Proposed Havenpark */}
                  <path
                    d="M 320 80 Q 420 120, 410 200 T 560 210 Q 580 350, 480 410 T 300 380 Q 240 200, 320 80 Z"
                    fill="#dcfce7"
                    stroke="#86efac"
                    strokeWidth="1.5"
                    opacity="0.8"
                  />
                  <text x="350" y="215" fill="#15803d" fontSize="13" fontWeight="950" className="opacity-95 tracking-wide">
                    GEPLAND HAVENPARK
                  </text>
                  <text x="350" y="228" fill="#166534" fontSize="8" className="opacity-80 font-bold">
                    (35% Begroeid, Boszones & Regenretentie)
                  </text>

                  {/* Residential Blocks */}
                  {/* Housing Block East */}
                  <g>
                    <rect x="580" y="45" width="105" height="70" rx="6" fill="#fef3c7" stroke="#fcd34d" strokeWidth="1.5" opacity="0.9" />
                    <text x="590" y="68" fill="#92400e" fontSize="10" fontWeight="extrabold">Spoor-woningen</text>
                    <text x="590" y="80" fill="#b45309" fontSize="8">Blok A (Geluidwerend)</text>
                  </g>
                  {/* Housing Block West */}
                  <g>
                    <rect x="200" y="105" width="85" height="110" rx="6" fill="#fef3c7" stroke="#fcd34d" strokeWidth="1.5" opacity="0.9" />
                    <text x="208" y="130" fill="#92400e" fontSize="10" fontWeight="extrabold">Kadekwartier</text>
                    <text x="208" y="143" fill="#b45309" fontSize="8">Blok B (Sociale huur)</text>
                  </g>
                  {/* Housing Block South */}
                  <g>
                    <rect x="420" y="325" width="120" height="75" rx="6" fill="#fef3c7" stroke="#fcd34d" strokeWidth="1.5" opacity="0.9" />
                    <text x="430" y="350" fill="#92400e" fontSize="10" fontWeight="extrabold">Spoorzone Zuid</text>
                    <text x="430" y="362" fill="#b45309" fontSize="8">Blok C (Vrije sector)</text>
                  </g>

                  {/* MobiliteitsHubs */}
                  <g>
                    <rect x="550" y="410" width="120" height="60" rx="8" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" />
                    <rect x="550" y="410" width="120" height="15" rx="2" fill="#475569" />
                    <text x="590" y="421" fill="#ffffff" fontSize="8" fontWeight="bold">PARKEERHUB B</text>
                    <text x="558" y="445" fill="#334155" fontSize="9" fontWeight="bold">Deelmobiliteit & Bakfietsen</text>
                  </g>
                  <g>
                    <rect x="150" y="25" width="110" height="60" rx="8" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" />
                    <rect x="150" y="25" width="110" height="15" rx="2" fill="#475569" />
                    <text x="185" y="36" fill="#ffffff" fontSize="8" fontWeight="bold">PARKEERHUB A</text>
                    <text x="158" y="58" fill="#334155" fontSize="9" fontWeight="bold">PV Shuttles & Laadpool</text>
                  </g>

                  {/* Historic crane */}
                  <circle cx="120" cy="300" r="8" fill="#f59e0b" />
                  <path d="M 120 300 L 95 260 L 130 250" stroke="#78350f" strokeWidth="2.5" fill="none" />
                  <text x="80" y="245" fill="#78350f" fontSize="8" fontWeight="bold">Historische Havenkraan</text>

                  {/* Render dynamically passed live participation pins on Plankaart */}
                  {markers.map((m) => {
                    let pinColor = "#7e22ce"; // Purple category
                    if (m.category === "Groen") pinColor = "#16a34a";
                    if (m.category === "Water") pinColor = "#2563eb";
                    if (m.category === "Verkeer") pinColor = "#ea580c";
                    if (m.category === "Geluid") pinColor = "#db2777";

                    return (
                      <g 
                        key={m.id} 
                        className="cursor-pointer group pointer-events-auto"
                        onClick={() => {
                          if (activePlankaartMarker?.id === m.id) {
                            setActivePlankaartMarker(null);
                          } else {
                            setActivePlankaartMarker(m);
                          }
                        }}
                      >
                        <circle 
                          cx={`${m.x}%`} 
                          cy={`${m.y}%`} 
                          r="12" 
                          fill={pinColor} 
                          opacity="0.25" 
                          className="animate-ping"
                        />
                        <circle 
                          cx={`${m.x}%`} 
                          cy={`${m.y}%`} 
                          r="6" 
                          fill={pinColor} 
                          stroke="#ffffff" 
                          strokeWidth="1.5"
                          className="group-hover:scale-125 transition-transform"
                        />
                      </g>
                    );
                  })}
                </svg>

                {/* Floating details overlay drawer on active click for Plankaart */}
                {activePlankaartMarker ? (
                  <div className="absolute top-4 left-4 right-4 bg-white/95 border border-purple-200 p-4.5 rounded-2xl shadow-xl z-20 text-stone-900 max-w-sm animate-in fade-in duration-200 backdrop-blur-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] bg-purple-100 text-purple-800 font-extrabold px-2 py-0.5 rounded-full uppercase">
                          {activePlankaartMarker.category} inbreng
                        </span>
                        <h5 className="font-extrabold text-xs text-stone-900 mt-1 block">Door: {activePlankaartMarker.author}</h5>
                      </div>
                      <button 
                        onClick={() => setActivePlankaartMarker(null)}
                        className="text-stone-400 hover:text-stone-700 font-bold text-xs bg-slate-100 py-0.5 px-2 rounded-lg"
                      >
                        Sluiten
                      </button>
                    </div>
                    <p className="text-[11px] text-stone-700 leading-normal italic mt-2.5">
                      "{activePlankaartMarker.text}"
                    </p>
                    <div className="flex justify-between items-center text-[9px] text-stone-400 mt-3 pt-2 border-t border-slate-100">
                      <span>Bijgedragen als: <strong>{getRoleLabel(activePlankaartMarker.role)}</strong></span>
                      {onLikeMarker && (
                        <button 
                          onClick={() => {
                            onLikeMarker(activePlankaartMarker.id);
                            // Update dynamic reference inside state if applicable
                          }}
                          className="flex items-center gap-1 text-purple-700 font-bold"
                        >
                          <Heart className="w-3 h-3 text-red-650 fill-red-650" /> Like
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="absolute top-3 left-3 bg-stone-900/90 border border-stone-800 p-2 rounded-xl text-[9px] text-stone-300 z-10 max-w-xs cursor-pointer" onClick={() => {
                    if (markers.length > 0) setActivePlankaartMarker(markers[0]);
                  }}>
                    💡 Click circles on the blueprint map to preview direct neighborhood planning proposals! (Total items: {markers.length})
                  </div>
                )}

              </div>
            )}

          </div>

          {/* Construction Schedule timeline milestones below */}
          <div className="bg-stone-950/45 rounded-2xl border border-stone-850 p-5 flex flex-col gap-3">
            <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
              <Calendar className="w-4.5 h-4.5 text-amber-500" />
              <span>Spoorzone Utrecht West Bouwplanning & Milieunormen</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {constructionSchedule.map((sched, idx) => (
                <div key={idx} className="bg-stone-950 border border-stone-800 p-3 rounded-xl hover:border-stone-700 transition">
                  <div className="flex justify-between items-center text-[10px] text-stone-400 font-bold">
                    <span>Mijlpaal: {sched.date}</span>
                    <span className="text-amber-500 font-extrabold bg-amber-500/10 px-2 py-0.5 rounded">Gepland</span>
                  </div>
                  <h5 className="font-extrabold text-stone-100 text-xs mt-1.5">{sched.task}</h5>
                  <p className="text-[10px] text-stone-400 mt-1 leading-normal">{sched.details}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Live complaints desk Loket */}
        <div className="bg-stone-950/65 rounded-2xl border border-stone-800 p-5 shadow-xs flex flex-col gap-4">
          <div className="border-b border-stone-800 pb-3">
            <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
              <FileWarning className="w-5 h-5 text-amber-500" />
              <span>Hinder loket & Omleidingsmeldpunt</span>
            </h4>
            <p className="text-[11px] text-stone-400 mt-0.5">Ervaart u hinder? Meld direct lawaai, trillingen of foute leveranciers. We reageren conform wettelijke verplichting binnen 4 uur.</p>
          </div>

          <form onSubmit={handleMeldHinder} className="flex flex-col gap-3">
            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">Type overlast categorie:</label>
              <select
                value={hinderCategory}
                onChange={(e) => setHinderCategory(e.target.value)}
                className="w-full bg-stone-900 border border-stone-750 text-stone-100 text-xs rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
              >
                <option value="Geluidshinder">Geluidshinder (Heien/Boren)</option>
                <option value="Stof- en Milieuhinder">Stofhinder (Sloop/Slijpen)</option>
                <option value="Verkeershinder">Verkeers- & Omleidingshinder</option>
                <option value="Trillingen">Fysieke Trillingen</option>
                <option value="Overig">Overige hinder</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">Locatie incident:</label>
              <input
                type="text"
                placeholder="Bijv: Kade voor nr 22, of Toerit Hub A..."
                value={hinderLoc}
                onChange={(e) => setHinderLoc(e.target.value)}
                required
                className="w-full bg-stone-950 border border-stone-750 text-stone-100 text-xs rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">Wat ervaart u precies?</label>
              <textarea
                placeholder="Geef optie aan van voertuigen, tijden, en impact..."
                value={hinderDesc}
                onChange={(e) => setHinderDesc(e.target.value)}
                required
                rows={3}
                className="w-full bg-stone-950 border border-stone-750 text-stone-100 text-xs rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
              />
            </div>

            <button
              type="submit"
              disabled={!hinderDesc.trim() || !hinderLoc.trim()}
              className="w-full bg-amber-500 hover:bg-amber-600 text-stone-950 font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition active:scale-95 disabled:bg-stone-800 disabled:text-stone-650 cursor-pointer"
            >
              {submitted ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-stone-950" />
                  <span>Hinder Melding Ingediend!</span>
                </>
              ) : (
                <>
                  <span>Klacht Insturen & Kaarten bijwerken</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Active submitted complaints tracker list */}
          <div className="pt-2 border-t border-stone-800">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[9px] uppercase font-bold text-stone-450 block">Live Meldingen feed ({complaints.length}):</span>
              <span className="text-[8px] bg-red-950 text-rose-350 font-mono px-2 py-0.5 rounded">Real-time GPS</span>
            </div>
            
            <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1">
              {complaints.map((c) => (
                <div key={c.id} className="bg-stone-950 border border-stone-850 p-2.5 rounded-xl text-[10px] leading-relaxed transition hover:border-stone-750">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-amber-400 font-extrabold">{c.category}</span>
                    <span className={c.status === "Geklaard" ? "text-emerald-400 font-bold" : "text-amber-500 font-bold"}>
                      {c.status}
                    </span>
                  </div>
                  <p className="text-stone-300 font-medium mt-1">"{c.desc}"</p>
                  <div className="text-stone-500 text-[9px] font-medium mt-1.5 flex justify-between items-center">
                    <span>Lokaliteit: {c.location}</span>
                    <span>{c.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
