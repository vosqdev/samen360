import React, { useState, useRef, useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapMarker, UserRole, getRoleLabel } from "../types";
import { MapPin, Sparkles, Image, Plus, Heart, Layers } from "lucide-react";

interface InteractiveMapProps {
  markers: MapMarker[];
  onAddMarker: (newMarker: Omit<MapMarker, "id" | "date" | "likes">) => Promise<void>;
  onLikeMarker: (id: string) => void;
  onDeleteMarker?: (id: string) => void;
  selectedRole: UserRole;
  userName: string;
  projectId?: string;
  projectLat?: number;
  projectLng?: number;
  projectPolygon?: string;
}

export default function InteractiveMap({
  markers,
  onAddMarker,
  onLikeMarker,
  onDeleteMarker,
  selectedRole,
  userName,
  projectId = "hierdenbuiten",
  projectLat = 52.3831,
  projectLng = 5.6796,
  projectPolygon = ""
}: InteractiveMapProps) {
  const [filterCategory, setFilterCategory] = useState<string>("Alle");
  const [showHeatmap, setShowHeatmap] = useState<boolean>(false);
  const [activeMarker, setActiveMarker] = useState<MapMarker | null>(null);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [clickCoords, setClickCoords] = useState<{ x: number; y: number } | null>(null);

  const projectLatVal = projectLat || 52.3831;
  const projectLngVal = projectLng || 5.6796;

  const LNG_TO_X = (lng: number) => ((lng - (projectLngVal - 0.005)) / 0.010) * 100;
  const LAT_TO_Y = (lat: number) => (((projectLatVal + 0.005) - lat) / 0.010) * 100;
  const X_TO_LNG = (x: number) => (projectLngVal - 0.005) + (x / 100) * 0.010;
  const Y_TO_LAT = (y: number) => (projectLatVal + 0.005) - (y / 100) * 0.010;

  const projectCoordsRef = useRef({ lat: projectLatVal, lng: projectLngVal });
  useEffect(() => {
    projectCoordsRef.current = { lat: projectLatVal, lng: projectLngVal };
  }, [projectLatVal, projectLngVal]);

  const onMapClickRef = useRef<(e: L.LeafletMouseEvent) => void>(() => {});
  useEffect(() => {
    onMapClickRef.current = (e: L.LeafletMouseEvent) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      const pLat = projectCoordsRef.current.lat;
      const pLng = projectCoordsRef.current.lng;
      const x = Math.round(((lng - (pLng - 0.005)) / 0.010) * 100);
      const y = Math.round((((pLat + 0.005) - lat) / 0.010) * 100);

      setClickCoords({ x, y });
      setIsAdding(true);
      setActiveMarker(null);
    };
  }, []);
  
  // New marker form state
  const [markerText, setMarkerText] = useState("");
  const [markerCategory, setMarkerCategory] = useState("Groen");
  const [simulatedPhoto, setSimulatedPhoto] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Leaflet references
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const heatmapGroupRef = useRef<L.LayerGroup | null>(null);
  const tempMarkerRef = useRef<L.Marker | null>(null);

  const categories = [
    "Alle",
    "Verkeer",
    "Groen",
    "Water",
    "Wonen",
    "Werken",
    "Energie",
    "Geluid",
    "Veiligheid",
    "Parkeren",
    "Speelruimte",
    "Overig",
  ];

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [projectLatVal, projectLngVal],
      zoom: 15,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    mapInstanceRef.current = map;
    markersGroupRef.current = L.layerGroup().addTo(map);
    heatmapGroupRef.current = L.layerGroup().addTo(map);

    tileLayerRef.current = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
    }).addTo(map);

    // Map click handler to place a pin via ref to avoid stale closures
    map.on("click", (e: L.LeafletMouseEvent) => {
      if (onMapClickRef.current) {
        onMapClickRef.current(e);
      }
    });

    // Force resize check
    setTimeout(() => map.invalidateSize(), 200);
  }, []);

  // 1.5. Center Map & Render Boundary Polygon on Project Change
  const polygonLayerRef = useRef<L.Polygon | null>(null);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Center map to active project
    map.setView([projectLatVal, projectLngVal], 15);

    // Draw project boundary if it exists
    if (polygonLayerRef.current) {
      polygonLayerRef.current.remove();
      polygonLayerRef.current = null;
    }

    if (projectPolygon) {
      try {
        const points = JSON.parse(projectPolygon) as [number, number][];
        if (Array.isArray(points) && points.length >= 3) {
          polygonLayerRef.current = L.polygon(points, {
            color: '#9333ea', // Purple project boundary
            fillColor: '#9333ea',
            fillOpacity: 0.1,
            weight: 3,
            dashArray: '5, 8'
          }).addTo(map);

          // Frame view to boundary
          const bounds = polygonLayerRef.current.getBounds();
          map.fitBounds(bounds, { padding: [30, 30] });
        }
      } catch (err) {
        console.error("Failed to render project polygon:", err);
      }
    }
  }, [projectLatVal, projectLngVal, projectPolygon]);

  // Update temp marker when adding
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !clickCoords || !isAdding) {
      if (tempMarkerRef.current) {
        tempMarkerRef.current.remove();
        tempMarkerRef.current = null;
      }
      return;
    }

    const lat = Y_TO_LAT(clickCoords.y);
    const lng = X_TO_LNG(clickCoords.x);

    const html = `
      <div class="relative group cursor-pointer animate-pulse">
        <div class="absolute -inset-2 rounded-full border-2 border-emerald-500 bg-emerald-500/20"></div>
        <div class="relative w-4 h-4 rounded-full bg-emerald-600 border-2 border-white"></div>
      </div>
    `;

    const icon = L.divIcon({
      className: "custom-leaflet-marker",
      html,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    if (tempMarkerRef.current) {
      tempMarkerRef.current.setLatLng([lat, lng]);
    } else {
      tempMarkerRef.current = L.marker([lat, lng], { icon }).addTo(map);
    }
  }, [clickCoords, isAdding, projectLatVal, projectLngVal]);

  // Render markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    const filtered = markers.filter((m) => {
      if (filterCategory === "Alle") return true;
      return m.category === filterCategory;
    });

    filtered.forEach((m) => {
      const lat = Y_TO_LAT(m.y);
      const lng = X_TO_LNG(m.x);
      
      let markerColor = "bg-purple-600 border-purple-800"; // default positive/neutral
      if (m.sentiment === "negative") markerColor = "bg-red-600 border-red-800";
      if (m.sentiment === "neutral") markerColor = "bg-amber-500 border-amber-700";

      const html = `
        <div class="relative group cursor-pointer">
          <div class="absolute -inset-1 rounded-full ${markerColor.split(' ')[0]}/20 group-hover:animate-ping group-hover:scale-150 transition-all duration-300"></div>
          <div class="relative w-5 h-5 rounded-full ${markerColor} border-2 border-white shadow-md"></div>
        </div>
      `;

      const icon = L.divIcon({
        className: "custom-leaflet-marker",
        html,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const lfMarker = L.marker([lat, lng], { icon }).addTo(markersGroup);
      
      lfMarker.on("click", (e) => {
        L.DomEvent.stopPropagation(e as any);
        setActiveMarker(m);
        setIsAdding(false);
      });
    });

  }, [markers, filterCategory, projectLatVal, projectLngVal]);

  // Heatmap rendering (simulated with circles)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const heatmapGroup = heatmapGroupRef.current;
    if (!map || !heatmapGroup) return;

    heatmapGroup.clearLayers();

    if (showHeatmap) {
      // Hotspot 1: Parkeren zorg (Negative)
      L.circle([52.091, 5.120], {
        color: 'transparent',
        fillColor: '#ef4444',
        fillOpacity: 0.5,
        radius: 120
      }).addTo(heatmapGroup);
      
      L.circle([52.091, 5.120], {
        color: 'transparent',
        fillColor: '#ef4444',
        fillOpacity: 0.7,
        radius: 50
      }).addTo(heatmapGroup);

      // Hotspot 2: Groen verzoek (Positive)
      L.circle([52.093, 5.123], {
        color: 'transparent',
        fillColor: '#9333ea',
        fillOpacity: 0.4,
        radius: 100
      }).addTo(heatmapGroup);
      
      L.circle([52.093, 5.123], {
        color: 'transparent',
        fillColor: '#9333ea',
        fillOpacity: 0.6,
        radius: 40
      }).addTo(heatmapGroup);

      // Hotspot 3: Verkeer knelpunt
      L.circle([52.088, 5.118], {
        color: 'transparent',
        fillColor: '#ef4444',
        fillOpacity: 0.45,
        radius: 80
      }).addTo(heatmapGroup);
    }
  }, [showHeatmap]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!markerText.trim() || !clickCoords) return;

    setIsAnalyzing(true);
    try {
      await onAddMarker({
        author: userName || "Anonieme Buurtbewoner",
        role: selectedRole,
        text: markerText,
        category: markerCategory,
        sentiment: "neutral", // will be analyzed by parent
        x: clickCoords.x,
        y: clickCoords.y,
        photoUrl: simulatedPhoto || undefined,
      });

      // Reset
      setMarkerText("");
      setSimulatedPhoto("");
      setIsAdding(false);
      setClickCoords(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const PRESET_PHOTOS = [
    { name: "Groene zone", url: "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=300&auto=format&fit=crop" },
    { name: "Verkeersdrukte", url: "https://images.unsplash.com/photo-1494883756111-95c2a1290327?q=80&w=300&auto=format&fit=crop" },
    { name: "Waterspeelplek", url: "https://images.unsplash.com/photo-1546483875-5f01450a83d4?q=80&w=300&auto=format&fit=crop" },
  ];

  return (
    <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm overflow-hidden flex flex-col h-[650px] lg:h-[720px] relative transition-all" id="kaart-dashboard">
      {/* Top action bar */}
      <div className="p-4 bg-stone-50 border-b border-stone-200/60 flex flex-col md:flex-row md:items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-emerald-700" />
          <h3 className="font-semibold text-stone-800 text-base md:text-lg">Digitale Co-Creatie Kaart</h3>
          <span className="text-xs bg-emerald-100 text-emerald-800 font-medium px-2 py-0.5 rounded-full">
            Utrecht Spoorzone
          </span>
        </div>

        {/* Quick controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              showHeatmap
                ? "bg-amber-100 border border-amber-300 text-amber-900"
                : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-100"
            }`}
            title="Toon plekken waar veel bezorgdheid of activiteit is"
            id="heatmap-toggle-btn"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {showHeatmap ? "Heatmap Aan" : "Toon Heatmap"}
          </button>
        </div>
      </div>

      {/* Category Horizontal scroll filter */}
      <div className="px-4 py-3 bg-white border-b border-stone-100 overflow-x-auto flex items-center gap-1.5 no-scrollbar scroll-smooth z-10">
        <span className="text-xs text-stone-500 font-medium mr-1 shrink-0">Inzoomen op:</span>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
              filterCategory === cat
                ? "bg-emerald-600 text-white border-emerald-600 active:scale-95"
                : "bg-stone-50 text-stone-600 border-stone-200/80 hover:bg-stone-100"
            }`}
            id={`filter-cat-${cat}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Map workspace */}
      <div className="flex-1 w-full relative overflow-hidden relative">
        {/* Leaflet Map Container */}
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0 font-sans"></div>

        {/* Small map indicator legend */}
        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl border border-stone-200/80 text-[10px] text-stone-500 flex items-center gap-3 z-[400] pointer-events-none shadow-sm font-semibold max-w-[90%] flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 border border-white block"></span>
            <span>Positief</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-white block"></span>
            <span>Neutraal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 border border-white block"></span>
            <span>Zorg / Negatief</span>
          </div>
          <div className="border-l border-stone-300 h-3"></div>
          <span>📍 Klik op de openstreetmap kaart om zelf een marker te plaatsen</span>
        </div>

        {/* Marker click popup modal */}
        {activeMarker && (
          <div
            className="absolute bottom-4 right-4 max-w-[340px] md:max-w-[380px] bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border border-stone-200 p-4 z-[410] flex flex-col gap-3 transition-all duration-300 animate-in fade-in slide-in-from-bottom-5"
            id={`popup-marker-${activeMarker.id}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase tracking-wide font-extrabold text-stone-500 bg-stone-100 rounded px-1.5 py-0.5">
                  {activeMarker.category}
                </span>
                <span className="ml-2 text-xs font-semibold text-emerald-800">
                  {activeMarker.sentiment === "positive" ? "👍 Positieve Inbreng" : activeMarker.sentiment === "negative" ? "⚠️ Zorg / Aandachtspunt" : "ℹ️ Informatief"}
                </span>
              </div>
              <button
                onClick={() => setActiveMarker(null)}
                className="text-stone-400 hover:text-stone-700 font-bold text-sm w-6 h-6 flex items-center justify-center rounded-full bg-stone-100"
              >
                ×
              </button>
            </div>

            <p className="text-stone-700 text-xs md:text-sm leading-relaxed italic">
              "{activeMarker.text}"
            </p>

            {activeMarker.photoUrl && (
              <div className="w-full h-32 rounded-xl overflow-hidden border border-stone-100">
                <img
                  src={activeMarker.photoUrl}
                  alt="Civic upload"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}

            <div className="flex items-center justify-between border-t border-stone-100 pt-2 text-[11px] text-stone-500">
              <div className="flex flex-col">
                <span className="font-bold text-stone-700">{activeMarker.author}</span>
                <span>{getRoleLabel(activeMarker.role)} ({activeMarker.date})</span>
              </div>
              
              <div className="flex items-center gap-2">
                {selectedRole === "Admin" && onDeleteMarker && (
                  <button
                    onClick={() => {
                       onDeleteMarker(activeMarker.id);
                       setActiveMarker(null);
                    }}
                    className="flex items-center gap-1 bg-red-50 text-red-800 font-bold px-2 py-1 rounded-xl hover:bg-red-100 transition-colors active:scale-95 cursor-pointer"
                  >
                    <span>🗑️ Wis</span>
                  </button>
                )}
                <button
                  onClick={() => onLikeMarker(activeMarker.id)}
                  className="flex items-center gap-1 bg-emerald-50 text-emerald-800 font-bold px-2.5 py-1 rounded-xl hover:bg-emerald-100 transition-colors active:scale-95 cursor-pointer"
                >
                  <Heart className="w-3.5 h-3.5 fill-emerald-800/20 text-emerald-800" />
                  <span>Mee eens ({activeMarker.likes})</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic add-marker form sliding overlay */}
        {isAdding && clickCoords && (
          <div
            className="absolute top-4 right-4 left-4 md:left-auto md:w-[400px] bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl border-2 border-emerald-700/30 p-4 z-[420] flex flex-col gap-3 animate-in fade-in zoom-in-95 pointer-events-auto"
            id="nieuwe-marker-form"
          >
            <div className="flex justify-between items-center pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-700 animate-bounce" />
                <h4 className="font-bold text-stone-800 text-sm">Feedback Marker Toevoegen</h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setClickCoords(null);
                }}
                className="text-stone-400 hover:text-stone-700 text-lg font-bold w-6 h-6 flex items-center justify-center rounded-full bg-stone-100 cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="text-[11px] text-stone-500 bg-stone-50 p-2 rounded-xl font-medium">
              Geplaatste locatie: <span className="font-mono text-emerald-800 font-bold">Lat: {Y_TO_LAT(clickCoords.y).toFixed(4)}, Lng: {X_TO_LNG(clickCoords.x).toFixed(4)}</span>
            </div>

            <form onSubmit={handleFormSubmit} className="flex flex-col gap-3">
              {/* Category selector */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Kies een Thema:
                </label>
                <select
                  value={markerCategory}
                  onChange={(e) => setMarkerCategory(e.target.value)}
                  className="w-full bg-white border border-stone-200 text-stone-800 text-xs rounded-xl p-2 focus:ring-2 focus:ring-emerald-700 focus:outline-none cursor-pointer"
                >
                  {categories.slice(1).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Text Input */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Uw opmerking, zorg of idee:
                </label>
                <textarea
                  value={markerText}
                  onChange={(e) => setMarkerText(e.target.value)}
                  placeholder="Laat ons concreet weten wat belangrijk is op deze plek..."
                  required
                  rows={3}
                  className="w-full bg-white border border-stone-200 text-stone-800 text-xs rounded-xl p-2 focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                />
              </div>

              {/* Photo option */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <Image className="w-3 h-3 text-stone-500" />
                  <span>Foto Toevoegen (Simulatie):</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PRESET_PHOTOS.map((photo) => (
                    <button
                      key={photo.name}
                      type="button"
                      onClick={() => setSimulatedPhoto(simulatedPhoto === photo.url ? "" : photo.url)}
                      className={`relative h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                        simulatedPhoto === photo.url ? "border-emerald-700 scale-95" : "border-stone-200 grayscale opacity-70"
                      }`}
                    >
                      <img
                        src={photo.url}
                        alt={photo.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute bottom-0 inset-x-0 bg-stone-900/75 text-[8px] text-white py-0.5 text-center font-bold">
                        {photo.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <button
                type="submit"
                disabled={isAnalyzing || !markerText.trim()}
                className="w-full bg-emerald-600 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 hover:bg-emerald-700 active:scale-95 disabled:bg-stone-300 transition-all cursor-pointer shadow-md"
              >
                {isAnalyzing ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>AI Analyseert Sentiment...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Inzenden & AI Categorie Toetsen</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
