import React, { useState, useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { 
  Compass, 
  MapPin, 
  Trophy, 
  ChevronRight, 
  Users, 
  Activity, 
  MessageCircle, 
  Calendar, 
  ListTodo, 
  Search, 
  Layers, 
  ArrowRight, 
  LogOut, 
  Lock, 
  Sparkles,
  Server,
  Workflow,
  MousePointerClick,
  Info,
  Pencil,
  Trash2,
  RotateCcw,
  Archive,
  ExternalLink,
  Tag
} from "lucide-react";
import { UserRole } from "../types";
import { getCBSNeighborhoods } from "./DashboardStats";

// High-fidelity Project definition
export interface NationalProject {
  id: string;
  name: string;
  city: string;
  description: string;
  lat: number; // For plotting
  lng: number; // For plotting
  x: number;   // Percentage x on NL map
  y: number;   // Percentage y on NL map
  phase: string;
  phaseNumber: number;
  totalPhases: number;
  runningActions: string[];
  openComments: number;
  planning: string;
  supportIndex: number;
  participants: number;
  views: number;
  image: string;
  address?: string; // Optioneel adres
  polygon?: string; // Stringified coordinates array voor het tekenen van het gebied
  archived?: boolean; // Archived flag for custom items
  websiteUrl?: string; // Optionele website link
  projectType?: string; // Optioneel soort project
}

const NATIONAL_PROJECTS: NationalProject[] = [
  {
    id: "hierdenbuiten",
    name: "HierdenBuiten",
    city: "Hierden",
    description: "Prachtige, duurzame en natuurinclusieve herinrichting van de woonomgeving HierdenBuiten met oog voor landschap, biodiversiteit en lokale burgerparticipatie.",
    lat: 52.3831,
    lng: 5.6796,
    x: 60,
    y: 41,
    phase: "Fase 3: Participatie (Directe inspraak)",
    phaseNumber: 3,
    totalPhases: 9,
    runningActions: [
      "Landschappelijke inpassing groenstroken bepalen",
      "Input enquête ontsluitingsweg verwerken",
      "Klimaatadaptieve wadi's ontwerpen"
    ],
    openComments: 64,
    planning: "Concept-stedenbouwkundig plan Q3 2026 • Realisatie vanaf 2027",
    supportIndex: 88,
    participants: 320,
    views: 1120,
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=600&auto=format&fit=crop",
    address: "Hierderesch, Hierden",
    polygon: "[[52.389, 5.675], [52.388, 5.685], [52.380, 5.682], [52.381, 5.672]]",
    websiteUrl: "https://www.hierdenbuiten.nl",
    projectType: "uitbreiding / buitengebied",
    archived: true
  },
  {
    id: "spoorzone-utrecht",
    name: "Spoorzone Havenkwartier",
    city: "Utrecht West",
    description: "Duurzame stedelijke transformatie van een voormalig overslagterrein naar 750 gasloze, energie-coöperatieve woningen langs het spoor.",
    lat: 52.0907,
    lng: 5.1214,
    x: 51,
    y: 53,
    phase: "Fase 3: Participatie (Directe inspraak)",
    phaseNumber: 3,
    totalPhases: 9,
    runningActions: [
      "Uitzoeken laadpalencapaciteit voor e-bakfietsen",
      "Voorbereiden fysieke maquettebijeenkomst 'De Helling'",
      "Geluidsabsorptietest begroeide wal Peutz afronden"
    ],
    openComments: 146,
    planning: "Conceptvisie 14 aug 2026 • Start bouw Q2 2028 • Oplevering 2029",
    supportIndex: 82,
    participants: 1842,
    views: 4510,
    image: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=600&auto=format&fit=crop",
    address: "Veilinghavenkade 12, 3521 AK Utrecht",
    polygon: "[[52.093, 5.118], [52.092, 5.125], [52.088, 5.123], [52.089, 5.117]]",
    projectType: "transformatie",
    archived: true
  },
  {
    id: "strijps-eindhoven",
    name: "Strijp-S Fase 3",
    city: "Eindhoven West",
    description: "Transformatie van de laatste voormalige Philips-fabrieksarealen tot creatieve lofts, buurtmoestuinen en slimme mobiliteitshubs.",
    lat: 51.4485,
    lng: 5.4571,
    x: 62,
    y: 81,
    phase: "Fase 5: Schetsontwerpen & Vorm",
    phaseNumber: 5,
    totalPhases: 9,
    runningActions: [
      "Toetsing zonne-energieopbrengst gevelpanelen",
      "Overleg met stichting erfgoed Philips-historie",
      "Inrichtingseisen deelfietsenstalling hub oost"
    ],
    openComments: 76,
    planning: "Selectie bouwconsortium Q3 2026 • Detailuitwerking Q1 2027",
    supportIndex: 88,
    participants: 1430,
    views: 4120,
    image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=600&auto=format&fit=crop",
    address: "Torenallee 20, BD Eindhoven",
    polygon: "[[51.451, 5.452], [51.450, 5.462], [51.446, 5.459], [51.447, 5.451]]",
    projectType: "transformatie",
    archived: true
  }
];

interface NationalPortalProps {
  onSelectProject: (id: string) => void;
  selectedRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (loggedIn: boolean) => void;
  projects?: NationalProject[];
  onAddProject?: (newProject: Omit<NationalProject, "openComments" | "supportIndex" | "participants" | "views">) => Promise<void>;
  onDeleteProject?: (id: string) => Promise<void>;
  onUpdateProject?: (id: string, updatedFields: Partial<NationalProject>) => Promise<void>;
}

export default function NationalPortal({ 
  onSelectProject, 
  selectedRole, 
  onRoleChange, 
  isLoggedIn, 
  setIsLoggedIn,
  projects,
  onAddProject,
  onDeleteProject,
  onUpdateProject
}: NationalPortalProps) {
  const projectsList = projects || NATIONAL_PROJECTS;

  const [archiveTab, setArchiveTab] = useState<"active" | "archived">("active");

  const isArchived = (p: NationalProject) => {
    return p.archived === true;
  };

  const activeProjects = React.useMemo(() => projectsList.filter(p => !isArchived(p)), [projectsList]);
  const archivedProjects = React.useMemo(() => projectsList.filter(p => isArchived(p)), [projectsList]);

  // Determine what list to render based on archiveTab and selectedRole
  const currentViewProjects = React.useMemo(() => {
    return (selectedRole === "Admin" && archiveTab === "archived") ? archivedProjects : activeProjects;
  }, [selectedRole, archiveTab, archivedProjects, activeProjects]);

  useEffect(() => {
    if (selectedRole !== "Admin") {
      setArchiveTab("active");
    }
  }, [selectedRole]);

  // New admin project parameters state
  const [isShowingAddModal, setIsShowingAddModal] = useState(false);
  const [newProjName, setNewProjName] = useState("");
  const [newProjCity, setNewProjCity] = useState("");
  const [newProjDescription, setNewProjDescription] = useState("");
  const [newProjAddress, setNewProjAddress] = useState("");
  const [newProjLat, setNewProjLat] = useState(52.0907); // Default Utrecht
  const [newProjLng, setNewProjLng] = useState(5.1214);
  const [newProjPhase, setNewProjPhase] = useState("Fase 3: Participatie (Directe inspraak)");
  const [newProjPhaseNumber, setNewProjPhaseNumber] = useState(3);
  const [newProjTotalPhases, setNewProjTotalPhases] = useState(9);
  const [newProjPlanning, setNewProjPlanning] = useState("Ontwerptraject Q3 2026 • Realisatiefase vanaf 2028");
  const [newProjImage, setNewProjImage] = useState("https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=600&auto=format&fit=crop");
  const [newProjActionsStr, setNewProjActionsStr] = useState("Uitschrijven participatietraject, Keuze van klimaatbomen vaststellen");
  const [newProjWebsiteUrl, setNewProjWebsiteUrl] = useState("");
  const [newProjProjectType, setNewProjProjectType] = useState("herstructurering");
  const [isSavingProject, setIsSavingProject] = useState(false);

  // Edit project states
  const [isShowingEditModal, setIsShowingEditModal] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState("");
  const [editProjName, setEditProjName] = useState("");
  const [editProjCity, setEditProjCity] = useState("");
  const [editProjDescription, setEditProjDescription] = useState("");
  const [editProjAddress, setEditProjAddress] = useState("");
  const [editProjLat, setEditProjLat] = useState(52.0907);
  const [editProjLng, setEditProjLng] = useState(5.1214);
  const [editProjPhase, setEditProjPhase] = useState("Fase 3: Participatie (Directe inspraak)");
  const [editProjPhaseNumber, setEditProjPhaseNumber] = useState(3);
  const [editProjTotalPhases, setEditProjTotalPhases] = useState(9);
  const [editProjPlanning, setEditProjPlanning] = useState("Ontwerptraject Q3 2026 • Realisatiefase vanaf 2028");
  const [editProjImage, setEditProjImage] = useState("");
  const [editProjActionsStr, setEditProjActionsStr] = useState("");
  const [editProjWebsiteUrl, setEditProjWebsiteUrl] = useState("");
  const [editProjProjectType, setEditProjProjectType] = useState("herstructurering");
  const [isSavingEditProject, setIsSavingEditProject] = useState(false);

  const editingProject = projectsList.find(p => p.id === editingProjectId);
  const isEditingProjectArchived = editingProject?.archived === true;

  const handleOpenEditModal = (proj: NationalProject) => {
    setEditingProjectId(proj.id);
    setEditingProjectName(proj.name);
    setEditProjName(proj.name);
    setEditProjCity(proj.city);
    setEditProjDescription(proj.description || "");
    setEditProjAddress(proj.address || "");
    setEditProjLat(proj.lat);
    setEditProjLng(proj.lng);
    setEditProjPhase(proj.phase);
    setEditProjPhaseNumber(proj.phaseNumber || 3);
    setEditProjTotalPhases(proj.totalPhases || 9);
    setEditProjPlanning(proj.planning || "");
    setEditProjImage(proj.image || "");
    setEditProjActionsStr((proj.runningActions || []).join(", "));
    setEditProjWebsiteUrl(proj.websiteUrl || "");
    setEditProjProjectType(proj.projectType || "herstructurering");
    setIsShowingEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProjectId || !editProjName || !editProjCity || !editProjDescription) return;
    if (!onUpdateProject) return;

    setIsSavingEditProject(true);
    try {
      const runningActions = editProjActionsStr
        .split(",")
        .map((act) => act.trim())
        .filter((act) => act.length > 0);

      await onUpdateProject(editingProjectId, {
        name: editProjName,
        city: editProjCity,
        description: editProjDescription,
        address: editProjAddress,
        lat: Number(editProjLat),
        lng: Number(editProjLng),
        phase: editProjPhase,
        phaseNumber: Number(editProjPhaseNumber),
        totalPhases: Number(editProjTotalPhases),
        runningActions,
        planning: editProjPlanning,
        image: editProjImage,
        archived: isEditingProjectArchived,
        websiteUrl: editProjWebsiteUrl,
        projectType: editProjProjectType
      });

      setIsShowingEditModal(false);
      setEditingProjectId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingEditProject(false);
    }
  };

  // Address search states & handler
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [addressSearchError, setAddressSearchError] = useState("");

  const handleSearchAddress = async () => {
    if (!newProjAddress.trim()) {
      setAddressSearchError("Vul eerst een adres of locatie in.");
      return;
    }
    setIsSearchingAddress(true);
    setAddressSearchError("");
    try {
      const queryStr = `${newProjAddress}${newProjCity ? `, ${newProjCity}` : ""}, Netherlands`;
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(queryStr)}`);
      if (!res.ok) throw new Error("Fout tijdens ophalen locatie");
      const data = await res.json();
      if (data && data.length > 0) {
        const first = data[0];
        const lat = parseFloat(first.lat);
        const lng = parseFloat(first.lon);
        setNewProjLat(Number(lat.toFixed(6)));
        setNewProjLng(Number(lng.toFixed(6)));
        
        if (modalMapInstanceRef.current) {
          modalMapInstanceRef.current.setView([lat, lng], 15);
        }
      } else {
        setAddressSearchError("Adres niet gevonden op de kaart. Controleer spelling of voeg de stad toe.");
      }
    } catch (err) {
      console.error("Nominatim Geocoding Error:", err);
      setAddressSearchError("Netwerkfout bij het zoeken op adres.");
    } finally {
      setIsSearchingAddress(false);
    }
  };

  // Modal map drawing states
  const [modalDrawMode, setModalDrawMode] = useState<"marker" | "polygon">("marker");
  const [modalPolygonPoints, setModalPolygonPoints] = useState<[number, number][]>([]);
  const [modalMapLayer, setModalMapLayer] = useState<"standard" | "zoning" | "kadaster">("standard");

  const modalMapContainerRef = useRef<HTMLDivElement>(null);
  const modalMapInstanceRef = useRef<L.Map | null>(null);
  const modalTileLayerRef = useRef<L.TileLayer | null>(null);
  const modalMarkerRef = useRef<L.Marker | null>(null);
  const modalPolygonRef = useRef<L.Polygon | null>(null);

  const modalDrawModeRef = useRef<"marker" | "polygon">("marker");
  const modalPolygonPointsRef = useRef<[number, number][]>([]);

  // Login simulation states
  const [digidUsername, setDigidUsername] = useState("");
  const [digidPassword, setDigidPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMapProject, setSelectedMapProject] = useState<NationalProject | null>(null);

  useEffect(() => {
    if (!selectedMapProject) {
      if (currentViewProjects.length > 0) {
        setSelectedMapProject(currentViewProjects[0]);
      }
    } else {
      const latestProject = currentViewProjects.find(p => p.id === selectedMapProject.id);
      if (latestProject) {
        // Prevent infinite render loop by checking actual model differences rather than reference identity
        const isDifferent = 
          latestProject.id !== selectedMapProject.id ||
          latestProject.archived !== selectedMapProject.archived ||
          latestProject.name !== selectedMapProject.name ||
          latestProject.city !== selectedMapProject.city ||
          latestProject.phase !== selectedMapProject.phase ||
          latestProject.phaseNumber !== selectedMapProject.phaseNumber ||
          latestProject.supportIndex !== selectedMapProject.supportIndex ||
          latestProject.openComments !== selectedMapProject.openComments ||
          latestProject.participants !== selectedMapProject.participants ||
          latestProject.views !== selectedMapProject.views;

        if (isDifferent) {
          setSelectedMapProject(latestProject);
        }
      } else {
        setSelectedMapProject(currentViewProjects[0] || null);
      }
    }
  }, [currentViewProjects, selectedMapProject]);

  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName || !newProjCity || !newProjDescription) {
      return;
    }
    if (!onAddProject) return;

    setIsSavingProject(true);
    try {
      const runningActions = newProjActionsStr
        .split(",")
        .map((act) => act.trim())
        .filter((act) => act.length > 0);

      // Generate a nice, safe id from name + city + random
      const safeId = `${newProjName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${newProjCity.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Math.floor(100 + Math.random() * 900)}`;

      await onAddProject({
        id: safeId,
        name: newProjName,
        city: newProjCity,
        description: newProjDescription,
        lat: Number(newProjLat),
        lng: Number(newProjLng),
        x: 50,
        y: 50,
        phase: newProjPhase,
        phaseNumber: Number(newProjPhaseNumber),
        totalPhases: Number(newProjTotalPhases),
        runningActions,
        planning: newProjPlanning,
        image: newProjImage,
        address: newProjAddress || "",
        polygon: modalPolygonPoints.length > 0 ? JSON.stringify(modalPolygonPoints) : "",
        websiteUrl: newProjWebsiteUrl,
        projectType: newProjProjectType
      });

      // Reset form
      setNewProjName("");
      setNewProjCity("");
      setNewProjDescription("");
      setNewProjAddress("");
      setNewProjWebsiteUrl("");
      setNewProjProjectType("herstructurering");
      setModalPolygonPoints([]);
      setModalDrawMode("marker");
      setIsShowingAddModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingProject(false);
    }
  };

  const [mapLayer, setMapLayer] = useState<"standard" | "topographical" | "zoning">("standard");
  const [projectPendingRoleSelect, setProjectPendingRoleSelect] = useState<NationalProject | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const polygonsRef = useRef<Record<string, L.Polygon>>({});

  // Synchronize modal refs with reactive state to ensure event handlers have the latest values
  useEffect(() => {
    modalDrawModeRef.current = modalDrawMode;
  }, [modalDrawMode]);

  useEffect(() => {
    modalPolygonPointsRef.current = modalPolygonPoints;
    if (modalMapInstanceRef.current) {
      if (modalPolygonRef.current) {
        modalPolygonRef.current.setLatLngs(modalPolygonPoints);
      } else if (modalPolygonPoints.length > 0) {
        modalPolygonRef.current = L.polygon(modalPolygonPoints, {
          color: "#8b5cf6",
          fillColor: "#a78bfa",
          fillOpacity: 0.4,
          weight: 2
        }).addTo(modalMapInstanceRef.current);
      }
    }
  }, [modalPolygonPoints]);

  // Adjust modal marker position when newProjLat / newProjLng changes via inputs or presets
  useEffect(() => {
    if (modalMarkerRef.current && modalMapInstanceRef.current) {
      const markerPos = modalMarkerRef.current.getLatLng();
      if (Math.abs(markerPos.lat - newProjLat) > 0.0001 || Math.abs(markerPos.lng - newProjLng) > 0.0001) {
        modalMarkerRef.current.setLatLng([newProjLat, newProjLng]);
        modalMapInstanceRef.current.panTo([newProjLat, newProjLng]);
      }
    }
  }, [newProjLat, newProjLng]);

  // Handle modal map initialization & destruction
  useEffect(() => {
    if (!isShowingAddModal) {
      if (modalMapInstanceRef.current) {
        modalMapInstanceRef.current.remove();
        modalMapInstanceRef.current = null;
        modalMarkerRef.current = null;
        modalPolygonRef.current = null;
        modalTileLayerRef.current = null;
      }
      return;
    }

    const initTimer = setTimeout(() => {
      if (!modalMapContainerRef.current || modalMapInstanceRef.current) return;

      const modMap = L.map(modalMapContainerRef.current, {
        center: [newProjLat, newProjLng],
        zoom: 12,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      modalMapInstanceRef.current = modMap;

      // Base tile layer
      const osmTile = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap'
      }).addTo(modMap);
      modalTileLayerRef.current = osmTile;

      // Draggable marker
      const marker = L.marker([newProjLat, newProjLng], {
        draggable: true,
        icon: L.divIcon({
          className: "custom-leaflet-marker",
          html: `
            <div class="relative flex items-center justify-center cursor-pointer">
              <div class="relative flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow-lg bg-indigo-650 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.74a2 2 0 0 1-2.6 0C8.331 20.193 3 14.99" /><circle cx="12" cy="10" r="3" /></svg>
              </div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        })
      }).addTo(modMap);

      modalMarkerRef.current = marker;

      marker.on("dragend", (e: any) => {
        const position = e.target.getLatLng();
        setNewProjLat(Number(position.lat.toFixed(6)));
        setNewProjLng(Number(position.lng.toFixed(6)));
      });

      // Click to place marker or add point to polygon
      modMap.on("click", (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        if (modalDrawModeRef.current === "marker") {
          setNewProjLat(Number(lat.toFixed(6)));
          setNewProjLng(Number(lng.toFixed(6)));
          if (modalMarkerRef.current) {
            modalMarkerRef.current.setLatLng([lat, lng]);
          }
        } else {
          setModalPolygonPoints((prev) => [...prev, [Number(lat.toFixed(6)), Number(lng.toFixed(6))]]);
        }
      });

      // Render polygon if there is a pre-existing selection
      if (modalPolygonPointsRef.current.length > 0) {
        modalPolygonRef.current = L.polygon(modalPolygonPointsRef.current, {
          color: "#8b5cf6",
          fillColor: "#a78bfa",
          fillOpacity: 0.4,
          weight: 2
        }).addTo(modMap);
      }

      // Initial size reset
      modMap.invalidateSize();
    }, 300);

    return () => {
      clearTimeout(initTimer);
    };
  }, [isShowingAddModal]);

  // Toggle tile layer on modal map (Standard vs zoning / satellite)
  useEffect(() => {
    const modMap = modalMapInstanceRef.current;
    if (!modMap || !isShowingAddModal) return;

    if (modalTileLayerRef.current) {
      modalTileLayerRef.current.remove();
    }

    let url = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    let attribution = '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>';

    if (modalMapLayer === "zoning") {
      url = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
      attribution = "Tiles &copy; Esri";
    } else if (modalMapLayer === "kadaster") {
      url = "https://service.pdok.nl/brt/achtergrondkaart/wmts/v2_0/standaard/EPSG:3857/{z}/{x}/{y}.png";
      attribution = '&copy; <a href="https://www.pdok.nl">PDOK / Kadaster</a>';
    }

    modalTileLayerRef.current = L.tileLayer(url, { attribution }).addTo(modMap);
  }, [modalMapLayer, isShowingAddModal]);

  // 1. Initialize map once
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Create map
      const map = L.map(mapContainerRef.current, {
        center: [52.1, 5.2], // Center around Utrecht / middle of Netherlands
        zoom: 7,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      mapInstanceRef.current = map;
    }

    // Force reflow and size recalculation after render
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 250);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  // 2. Dynamic Tile layers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }

    let url = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    let attribution = '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>';

    if (mapLayer === "topographical") {
      url = "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png";
      attribution = '&copy; Humanitarian OSM Team';
    } else if (mapLayer === "zoning") {
      url = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
      attribution = "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community";
    }

    tileLayerRef.current = L.tileLayer(url, { attribution }).addTo(map);
  }, [mapLayer]);

  // 3. Sync Markers & Selection Style
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    currentViewProjects.forEach((proj) => {
      const isSelected = selectedMapProject?.id === proj.id;

      const customIcon = L.divIcon({
        className: "custom-leaflet-marker",
        html: `
          <div class="relative flex items-center justify-center cursor-pointer">
            <div class="absolute -left-3.5 -top-3.5 w-10.5 h-10.5 flex items-center justify-center pointer-events-none">
              <span class="absolute w-7 h-7 rounded-full ${isSelected ? 'bg-emerald-500/30 animate-pulse' : 'bg-transparent'}"></span>
              <span class="absolute w-4 h-4 rounded-full ${isSelected ? 'bg-emerald-500/50' : 'bg-transparent'}"></span>
            </div>
            <div class="relative flex items-center justify-center w-8 h-8 rounded-full border-2 shadow-lg transition-transform ${
              isSelected 
                ? 'bg-emerald-600 border-white text-white scale-110 z-40' 
                : 'bg-white border-emerald-600 text-emerald-800 hover:scale-105'
            }">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.74a2 2 0 0 1-2.6 0C8.331 20.193 3 14.99" /><circle cx="12" cy="10" r="3" /></svg>
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const lfMarker = L.marker([proj.lat, proj.lng], { icon: customIcon }).addTo(map);
      
      lfMarker.on("click", () => {
        setSelectedMapProject(proj);
      });

      markersRef.current[proj.id] = lfMarker;
    });
  }, [selectedMapProject, currentViewProjects]);

  // 4. Pan to selected project
  useEffect(() => {
    if (selectedMapProject && mapInstanceRef.current) {
      mapInstanceRef.current.setView([selectedMapProject.lat, selectedMapProject.lng], 9, {
        animate: true,
        duration: 0.8,
      });
    }
  }, [selectedMapProject]);

  // 4.5 Sync Polygons on Main Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old polygons
    Object.values(polygonsRef.current).forEach((p) => p.remove());
    polygonsRef.current = {};

    currentViewProjects.forEach((proj) => {
      if (!proj.polygon) return;
      try {
        const coords: [number, number][] = JSON.parse(proj.polygon);
        if (coords && Array.isArray(coords) && coords.length >= 3) {
          const isSelected = selectedMapProject?.id === proj.id;
          
          const poly = L.polygon(coords, {
            color: isSelected ? "#059669" : "#7c3aed", // emerald-600 if selected, violet-600 otherwise
            fillColor: isSelected ? "#10b981" : "#a78bfa",
            fillOpacity: isSelected ? 0.35 : 0.15,
            weight: isSelected ? 3 : 1.5,
            dashArray: isSelected ? "" : "3, 3"
          }).addTo(map);

          // Click on polygon to select project
          poly.on("click", () => {
            setSelectedMapProject(proj);
          });

          polygonsRef.current[proj.id] = poly;
        }
      } catch (err) {
        console.error("Error plotting polygon of project " + proj.id, err);
      }
    });

    return () => {
      Object.values(polygonsRef.current).forEach((p) => p.remove());
      polygonsRef.current = {};
    };
  }, [selectedMapProject, currentViewProjects]);

  // Simulated login processing
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError("");

    setTimeout(() => {
      setIsLoggedIn(true);
      setIsLoggingIn(false);
    }, 1200);
  };

  const filteredProjects = currentViewProjects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Totals for National Dashboard Stats
  const nationalParticipants = currentViewProjects.reduce((sum, p) => {
    const neighborhoods = getCBSNeighborhoods(p.id, p.name);
    const populationSum = neighborhoods.reduce((acc, n) => acc + n.population2025, 0);
    return sum + populationSum;
  }, 0);
  const nationalViews = currentViewProjects.reduce((sum, p) => sum + p.views, 0);
  const avgSupport = currentViewProjects.length > 0 ? Math.round(currentViewProjects.reduce((sum, p) => sum + p.supportIndex, 0) / currentViewProjects.length) : 0;
  const totalComments = currentViewProjects.reduce((sum, p) => sum + p.openComments, 0);

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-400" id="national-portal-root">
      
      {!isLoggedIn && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-amber-900 shadow-sm animate-in slide-in-from-top-3 duration-350" id="logout-banner-alert">
          <div className="flex gap-2.5 items-center">
            <Lock className="w-4 h-4 text-amber-700 shrink-0" />
            <p className="font-semibold text-left">
              <strong className="font-extrabold mr-1">Gasttoegang Actief:</strong> U bekijkt het portaal nu als gast. Selecteer uw gewenste rol in de bovenbalk om u aan te melden en reacties bij projecten in te dienen.
            </p>
          </div>
          <button
            onClick={() => {
              onRoleChange("Bewoner");
              setIsLoggedIn(true);
            }}
            className="bg-amber-600 hover:bg-amber-700 text-stone-950 font-black px-3.5 py-1.5 rounded-xl text-xs transition whitespace-nowrap border-none cursor-pointer"
          >
            Inloggen als Bewoner
          </button>
        </div>
      )}
      


      {/* Primary KPI overview cards ribbon */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Actieve Projecten</span>
            <strong className="text-xl font-extrabold text-slate-900 block mt-0.5">{currentViewProjects.length} Locaties</strong>
          </div>
          <div className="w-9 h-9 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center">
            <Compass className="w-4.5 h-4.5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between animate-in zoom-in-95 duration-200">
          <div>
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Totaal Participanten</span>
            <strong className="text-xl font-extrabold text-slate-900 block mt-0.5">{nationalParticipants.toLocaleString("nl-NL")} burgers</strong>
          </div>
          <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
            <Users className="w-4.5 h-4.5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between animate-in zoom-in-95 duration-200">
          <div>
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Interacties</span>
            <strong className="text-xl font-extrabold text-slate-900 block mt-0.5">{nationalViews.toLocaleString("nl-NL")} unieke bezoeken</strong>
          </div>
          <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
            <Activity className="w-4.5 h-4.5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Gem. Draagvlak</span>
            <strong className="text-xl font-extrabold text-slate-900 block mt-0.5">{avgSupport}% tevreden</strong>
          </div>
          <div className="w-9 h-9 bg-amber-50 text-amber-700 rounded-full flex items-center justify-center">
            <Trophy className="w-4.5 h-4.5" />
          </div>
        </div>
      </section>

      {/* Toelichtend filmpje Omgevingswet in het Dashboard */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 md:p-6 shadow-sm" id="omgevingswet-dashboard-info">
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="flex-grow space-y-2 text-left">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xl">📖</span>
              <h4 className="font-extrabold text-slate-900 text-base">
                Omgevingswet Toelichting
              </h4>
              <span className="text-[10px] text-purple-700 font-extrabold bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100 font-sans select-none">
                Inspraak & Wetgeving
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed max-w-4xl font-medium">
              De Omgevingswet bundelt en vereenvoudigt de regels voor ruimtelijke projecten, wonen, infrastructuur, milieu, natuur en water. Hiermee stimuleert de wet een integrale benadering van de fysieke leefomgeving en biedt het meer ruimte voor lokale inspraak, burgerparticipatie en snellere besluitvorming.
            </p>
          </div>
          <div className="w-full md:w-auto shrink-0 flex justify-end">
            <a
              href="https://www.youtube.com/watch?v=-yfLzLLbXXw"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-98 transition text-white text-xs font-bold shadow-md cursor-pointer"
              id="dashboard-omgevingswet-video-btn"
            >
              <span>Bekijk video-toelichting</span>
              <ExternalLink className="w-4 h-4 text-purple-200" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Grid: Left is map, Right is list + popup */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Interactive Netherlands Map (lg:col-span-8) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-sm p-4 flex flex-col justify-between overflow-hidden min-h-[580px] lg:min-h-[640px] relative">
          
          {/* Map Header & Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3 mb-3 z-10 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 block animate-pulse"></span>
              <h3 className="font-extrabold text-slate-950 text-sm">
                Streetmap-Niveau Nederland: Locaties
              </h3>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 text-[11px] font-bold text-slate-600 border border-slate-200">
                <button
                  onClick={() => setMapLayer("standard")}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    mapLayer === "standard" ? "bg-white text-emerald-800 shadow-xs" : "hover:bg-slate-205"
                  }`}
                >
                  Standaard
                </button>
                <button
                  onClick={() => setMapLayer("topographical")}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    mapLayer === "topographical" ? "bg-white text-emerald-800 shadow-xs" : "hover:bg-slate-205"
                  }`}
                >
                  Topografisch
                </button>
                <button
                  onClick={() => setMapLayer("zoning")}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    mapLayer === "zoning" ? "bg-white text-emerald-800 shadow-xs" : "hover:bg-slate-205"
                  }`}
                >
                  Sateliet
                </button>
              </div>
            </div>
          </div>

          {/* Map Area */}
          <div className="flex-grow relative rounded-2xl bg-sky-50 border border-slate-200/60 overflow-hidden flex items-center justify-center min-h-[440px] md:min-h-[500px]">
            
            {/* Leaflet Map elements */}
            <div ref={mapContainerRef} className="absolute inset-0 w-full h-full rounded-2xl z-0" style={{ minHeight: "440px" }} id="openstreetmap-national-map"></div>

            {/* Informational streetmap legend in bottom left corner */}
            <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur shadow-sm rounded-xl p-2.5 text-[9px] border border-slate-200 z-10 flex flex-col gap-1">
              <span className="font-bold text-slate-800 uppercase block tracking-wider">Streetmap Layer Info</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2.5 h-1 bg-amber-500 block"></span>
                <span className="text-slate-500 font-semibold">Actieve Laag: {mapLayer === "standard" ? "OSM Standaard" : mapLayer === "topographical" ? "Humanitair" : "Sateliet (Esri)"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 block animate-pulse"></span>
                <span className="text-slate-500 font-bold text-emerald-700">Participatie-Hoven NL</span>
              </div>
            </div>

            {/* Click assistance guidance badge */}
            <div className="absolute top-3 left-3 bg-slate-900/80 text-white rounded-lg px-2.5 py-1 text-[10px] font-semibold flex items-center gap-1 z-10">
              <MousePointerClick className="w-3.5 h-3.5 text-emerald-400" />
              <span>Scroll om te zoomen, klik of sleep</span>
            </div>
            
          </div>
        </div>

        {/* Project List / Sidebar Details (lg:col-span-4) */}
        <div className="lg:col-span-4 flex flex-col gap-5 justify-between">
          
          {/* Projects Search / Selection Sidebar list */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 flex flex-col flex-1 min-h-[300px]">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Participatie Projecten</span>
              {selectedRole === "Admin" && onAddProject && (
                <button
                  type="button"
                  onClick={() => setIsShowingAddModal(true)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-purple-600 to-indigo-650 hover:from-purple-700 hover:to-indigo-750 text-white rounded-xl text-[11px] font-extrabold transition-all cursor-pointer shadow-xs active:scale-95 border-none"
                  id="btn-open-add-project-modal"
                >
                  <Sparkles className="w-3 h-3 text-purple-150 shrink-0" />
                  <span>Nieuw Project</span>
                </button>
              )}
            </div>

            <div className="relative mb-3">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Zoeken op project of stad..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none text-slate-800 placeholder-slate-400"
              />
            </div>

            {selectedRole === "Admin" && (
              <div className="flex bg-slate-100 p-1 rounded-xl mb-3 gap-1 border border-slate-200" id="admin-archive-tabs">
                <button
                  type="button"
                  onClick={() => setArchiveTab("active")}
                  className={`flex-1 text-center py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                    archiveTab === "active" 
                      ? "bg-white text-emerald-800 shadow-xs ring-1 ring-slate-100" 
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  🟢 Actief ({activeProjects.length})
                </button>
                <button
                  type="button"
                  onClick={() => setArchiveTab("archived")}
                  className={`flex-1 text-center py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                    archiveTab === "archived" 
                      ? "bg-white text-purple-800 shadow-xs ring-1 ring-slate-100" 
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  📁 Archief ({archivedProjects.length})
                </button>
              </div>
            )}

            <div className="flex-grow space-y-2.5 overflow-y-auto max-h-[240px] lg:max-h-[290px] pr-1">
              {filteredProjects.length > 0 ? (
                filteredProjects.map((proj) => {
                  const isSelected = selectedMapProject?.id === proj.id;
                  return (
                    <div
                      key={proj.id}
                      onClick={() => setSelectedMapProject(proj)}
                      className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center gap-3 cursor-pointer ${
                        isSelected 
                          ? "bg-emerald-50/70 border-emerald-400 text-slate-900" 
                          : "bg-slate-50/50 hover:bg-slate-50 border-slate-200/60 text-slate-700"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-200 overflow-hidden shrink-0">
                        <img 
                          src={proj.image} 
                          alt={proj.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-center">
                          <h4 className="font-extrabold text-xs truncate text-slate-900">{proj.name}</h4>
                          <span className="text-[9px] bg-slate-200 px-1 py-0.5 rounded text-slate-500 shrink-0 font-mono">
                            {proj.openComments} pins
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5 truncate">{proj.city}</p>
                        
                        <div className="flex justify-between items-center mt-1 text-[9px] font-bold">
                          <span className={proj.phaseNumber >= 3 ? "text-emerald-700 font-semibold" : "text-amber-700"}>
                            {proj.phase.split(":")[0]}
                          </span>
                          {selectedRole === "Admin" ? (
                            <div className="flex items-center gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                title="Bewerken"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditModal(proj);
                                }}
                                className="p-1 hover:bg-slate-200/60 rounded text-slate-500 hover:text-blue-600 transition active:scale-90"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                              {archiveTab === "active" ? (
                                <button
                                  type="button"
                                  title="Archiveren"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (confirm(`Weet u zeker dat u het project '${proj.name}' wilt verplaatsen naar het archief?`)) {
                                      if (selectedMapProject?.id === proj.id) {
                                        const nextProj = currentViewProjects.find(p => p.id !== proj.id) || null;
                                        setSelectedMapProject(nextProj);
                                      }
                                      await onUpdateProject?.(proj.id, { archived: true });
                                    }
                                  }}
                                  className="p-1 hover:bg-slate-200/60 rounded text-slate-500 hover:text-amber-600 transition active:scale-90"
                                >
                                  <Archive className="w-3 h-3" />
                                </button>
                              ) : (
                                <div className="flex items-center gap-0.5">
                                  <button
                                    type="button"
                                    title="Dossier Terugzetten"
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      if (confirm(`Wilt u '${proj.name}' terugzetten naar actieve projecten?`)) {
                                        await onUpdateProject?.(proj.id, { archived: false });
                                      }
                                    }}
                                    className="p-1 hover:bg-slate-200/60 rounded text-slate-500 hover:text-emerald-600 transition active:scale-90"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                  </button>
                                  {onDeleteProject && (
                                    <button
                                      type="button"
                                      title="Definitief Verwijderen"
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        if (confirm(`Weet u zeker dat u '${proj.name}' permanent wilt verwijderen? Dit is onomkeerbaar!`)) {
                                          if (selectedMapProject?.id === proj.id) {
                                            const nextProj = currentViewProjects.find(p => p.id !== proj.id) || null;
                                            setSelectedMapProject(nextProj);
                                          }
                                          await onDeleteProject(proj.id);
                                        }
                                      }}
                                      className="p-1 hover:bg-red-50 rounded text-red-500 hover:text-red-700 transition active:scale-90"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 font-mono">{proj.supportIndex}% draagvlak</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-xs text-slate-400">
                  Geen projecten gevonden voor '{searchQuery}'
                </div>
              )}
            </div>
          </div>

          {/* Detailed Project Info Card / Popup Overlay Panel */}
          {selectedMapProject ? (
            <div className="bg-white rounded-3xl border-2 border-emerald-600 shadow-lg p-5 flex flex-col gap-4 animate-in slide-in-from-bottom duration-300 relative">
              <div className="absolute top-2.5 right-2 text-emerald-800 font-black">
                <span className="text-[9px] uppercase tracking-widest bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                  {selectedMapProject.city}
                </span>
              </div>

              {/* Sleek project header image with website click-through */}
              <div className="w-full h-32 rounded-2xl overflow-hidden relative group bg-slate-100 shrink-0 mt-3" id="selected-project-image-box">
                <img
                  src={selectedMapProject.image}
                  alt={selectedMapProject.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"></div>
                
                {/* Website Link action buttons directly on the image */}
                <div className="absolute bottom-2 left-2 flex items-center gap-1.5 z-10">
                  {selectedMapProject.websiteUrl ? (
                    <a
                      href={selectedMapProject.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-900 rounded-xl text-[10px] font-black flex items-center gap-1 shadow-md transition active:scale-95 whitespace-nowrap cursor-pointer decoration-none"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 inline"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                      <span>Projectwebsite</span>
                    </a>
                  ) : (
                    <div className="text-[10px] text-white/85 font-semibold px-2 py-1 bg-black/40 rounded-lg backdrop-blur-xs">
                      Geen website link
                    </div>
                  )}

                  {selectedRole === "Admin" && (
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(selectedMapProject)}
                      className="px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-extrabold flex items-center gap-1 shadow-md transition active:scale-95 cursor-pointer border-none"
                      title="Website link bewerken"
                      id={`btn-edit-website-${selectedMapProject.id}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="inline text-white"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" /></svg>
                      <span>{selectedMapProject.websiteUrl ? "Aanpassen" : "Link Toevoegen"}</span>
                    </button>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-extrabold text-slate-950 text-base leading-snug">
                  {selectedMapProject.name}
                </h3>
                <p className="text-[11px] text-slate-500 leading-normal mt-1">
                  {selectedMapProject.description}
                </p>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100">
                {/* Soort project */}
                {selectedMapProject.projectType && (
                  <div className="flex gap-2">
                    <Tag className="w-4.5 h-4.5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-[10px] uppercase font-bold text-slate-400">Soort project</h5>
                      <p className="text-xs font-extrabold text-slate-800 leading-tight capitalize">
                        {selectedMapProject.projectType}
                      </p>
                    </div>
                  </div>
                )}

                {/* 1. Participatiefase */}
                <div className="flex gap-2">
                  <Compass className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-[10px] uppercase font-bold text-slate-400">Participatiefase</h5>
                    <p className="text-xs font-extrabold text-slate-800 leading-tight">
                      {selectedMapProject.phase}
                    </p>
                  </div>
                </div>

                {/* 2. Lopende acties */}
                <div className="flex gap-2">
                  <ListTodo className="w-4.5 h-4.5 text-indigo-600 shrink-0 mt-0.5" />
                  <div className="w-full min-w-0">
                    <h5 className="text-[10px] uppercase font-bold text-slate-400">Lopende acties ({selectedMapProject.runningActions.length})</h5>
                    <ul className="space-y-1 mt-1 font-semibold text-slate-700 text-[11px] pl-1.5 list-disc leading-tight">
                      {selectedMapProject.runningActions.map((action, idx) => (
                        <li key={idx} className="truncate">{action}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 3. Open reacties */}
                <div className="flex gap-2">
                  <MessageCircle className="w-4.5 h-4.5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-[10px] uppercase font-bold text-slate-400">Inspraak & reacties</h5>
                    <p className="text-xs font-bold text-slate-800 leading-tight">
                      <strong>{selectedMapProject.openComments} Markers op kaart</strong>
                      <span className="text-slate-400 pl-1.5 font-mono">({selectedMapProject.supportIndex}% positieve sentiment-index)</span>
                    </p>
                  </div>
                </div>

                {/* 4. Planning */}
                <div className="flex gap-2">
                  <Calendar className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-[10px] uppercase font-bold text-slate-400">Planning & Termijn</h5>
                    <p className="text-xs font-semibold text-slate-700 leading-snug">
                      {selectedMapProject.planning}
                    </p>
                  </div>
                </div>

                {/* 5. Locatie / Adres */}
                {selectedMapProject.address && (
                  <div className="flex gap-2">
                    <MapPin className="w-4.5 h-4.5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-[10px] uppercase font-bold text-slate-400">Adres / Locatie</h5>
                      <p className="text-xs font-semibold text-slate-705 leading-snug">
                        {selectedMapProject.address}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* GA NAAR SAMEN360 DIRECT LINK CLICK THROUGH BUTTON WITH ADMIN DELETION AS PROPORTIONAL OPTION */}
              <div className="flex gap-2.5 w-full">
                <button
                  onClick={() => setProjectPendingRoleSelect(selectedMapProject)}
                  className="flex-grow bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-2 transition active:scale-[0.98] shadow-md shadow-emerald-950/15 cursor-pointer border-none"
                  id={`btn-open-project-${selectedMapProject.id}`}
                >
                  <span>Naar Samen360</span>
                  <ArrowRight className="w-4.5 h-4.5" />
                </button>
                {selectedRole === "Admin" && (
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(selectedMapProject)}
                    className="px-4 py-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-650 rounded-2xl text-xs font-bold transition active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
                    title="Project bewerken"
                    id="btn-edit-selected-project"
                  >
                    <Pencil className="w-4.5 h-4.5 text-blue-600" />
                  </button>
                )}
                {selectedRole === "Admin" && onDeleteProject && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (confirm(`Weet u zeker dat u het project "${selectedMapProject.name}" wilt verwijderen?`)) {
                        const nextProj = currentViewProjects.find(p => p.id !== selectedMapProject.id) || null;
                        setSelectedMapProject(nextProj);
                        await onDeleteProject(selectedMapProject.id);
                      }
                    }}
                    className="px-4 py-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-650 rounded-2xl text-xs font-bold transition active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
                    title="Project verwijderen"
                    id="btn-delete-project"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-600"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-8 text-center flex flex-col justify-center items-center h-48">
              <MapPin className="w-8 h-8 text-slate-300 mb-2 animate-bounce" />
              <p className="text-xs text-slate-400 font-semibold">Selecteer een project marker op de kaart of uit de lijst om de details te tonen</p>
            </div>
          )}

        </div>
        
      </section>

      {/* GORGEOUS MODAL FOR PROJECT CREATION */}
      {isShowingAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-100 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-650 p-6 text-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-extrabold text-lg leading-tight flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-200" />
                  <span>Nieuw Project Aanmaken</span>
                </h3>
                <p className="text-xs text-purple-100 mt-1 font-semibold">Voer alle benodigde participatie details in</p>
              </div>
              <button
                type="button"
                onClick={() => setIsShowingAddModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer border-none text-xl font-bold"
              >
                &times;
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmitProject} className="p-6 overflow-y-auto space-y-4 flex-grow text-left">
              
              {/* Row 1: Name */}
              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">Projectnaam *</label>
                <input
                  type="text"
                  required
                  placeholder="Bijv. Spoorzone Havenkwartier"
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none text-slate-800"
                />
              </div>

              {/* Row 2: City */}
              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">Stad / Deelgebied *</label>
                <input
                  type="text"
                  required
                  placeholder="Bijv. Utrecht West"
                  value={newProjCity}
                  onChange={(e) => setNewProjCity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none text-slate-800"
                />
              </div>

              {/* Row 2.5: Adres */}
              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">Adres & Kaart verificatie (Optioneel)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Bijv. Maliebaan 10, 3581 CD Utrecht"
                    value={newProjAddress}
                    onChange={(e) => setNewProjAddress(e.target.value)}
                    className="flex-grow bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none text-slate-800"
                  />
                  <button
                    type="button"
                    disabled={isSearchingAddress}
                    onClick={handleSearchAddress}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-extrabold px-3 py-2 rounded-xl text-xs flex items-center gap-1 cursor-pointer transition border-none"
                  >
                    <span>{isSearchingAddress ? "Zoeken..." : "Zoek op kaart"}</span>
                  </button>
                </div>
                {addressSearchError && (
                  <p className="text-[10px] text-red-500 font-bold mt-1">{addressSearchError}</p>
                )}
                <p className="text-[9px] text-slate-400 mt-0.5">Voer een adres in en klik 'Zoek op kaart' om de coördinaten en marker op de kaart direct te centreren.</p>
              </div>

              {/* Row 3: Description */}
              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">Project Toelichting / Doelstelling *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Beschrijf de doelen, de context en wat er met de input van bewoners gedaan zal worden..."
                  value={newProjDescription}
                  onChange={(e) => setNewProjDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none text-slate-800 resize-none font-semibold"
                />
              </div>

              {/* Row 4: Coordinates Selector Presets & Polygon Area Drawer */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider">Projectlocatie & Gebied *</label>
                  <span className="text-[10px] font-mono text-purple-600 font-bold uppercase tracking-wider">OpenStreetMap & Kadastraal</span>
                </div>

                {/* Preset badges for quick view adjustment */}
                <div className="space-y-1">
                  <span className="block text-[9px] font-bold text-slate-500">Snel Zoomen:</span>
                  <div className="flex flex-wrap gap-1.5 pb-1">
                    {[
                      { label: "📍 Utrecht", lat: 52.0907, lng: 5.1214 },
                      { label: "📍 Amsterdam", lat: 52.3676, lng: 4.9041 },
                      { label: "📍 Rotterdam", lat: 51.9054, lng: 4.5167 },
                      { label: "📍 Eindhoven", lat: 51.4485, lng: 5.4571 },
                      { label: "📍 Gouda", lat: 52.0116, lng: 4.6853 },
                      { label: "📍 Groningen", lat: 53.2194, lng: 6.5665 }
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setNewProjLat(preset.lat);
                          setNewProjLng(preset.lng);
                        }}
                        className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[9px] font-extrabold cursor-pointer transition active:scale-95"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pb-1">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-550 mb-0.5">Breedtegraad hoofdlocatie (Lat)</label>
                    <input
                      type="number"
                      step="0.000001"
                      required
                      value={newProjLat}
                      onChange={(e) => setNewProjLat(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-3 text-xs focus:ring-1 focus:ring-purple-600 outline-none text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-550 mb-0.5">Lengtegraad hoofdlocatie (Lng)</label>
                    <input
                      type="number"
                      step="0.000001"
                      required
                      value={newProjLng}
                      onChange={(e) => setNewProjLng(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-3 text-xs focus:ring-1 focus:ring-purple-600 outline-none text-slate-800"
                    />
                  </div>
                </div>

                {/* Draw mode switcher & quick buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/60 font-medium">
                  <div className="flex space-x-1">
                    <button
                      type="button"
                      onClick={() => setModalDrawMode("marker")}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-lg cursor-pointer transition ${
                        modalDrawMode === "marker"
                          ? "bg-purple-600 text-white shadow-sm"
                          : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                      }`}
                    >
                      📍 Marker herplaatsen
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalDrawMode("polygon")}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-lg cursor-pointer transition ${
                        modalDrawMode === "polygon"
                          ? "bg-purple-600 text-white shadow-sm"
                          : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                      }`}
                    >
                      ⬡ Gebied tekenen (Polygoon)
                    </button>
                  </div>

                  <div className="flex space-x-1">
                    <button
                      type="button"
                      disabled={modalPolygonPoints.length === 0}
                      onClick={() => setModalPolygonPoints((prev) => prev.slice(0, -1))}
                      className="px-2 py-1 text-[9px] font-bold text-slate-600 bg-white hover:bg-slate-100 disabled:opacity-50 border border-slate-200 rounded-lg cursor-pointer animate-none"
                    >
                      ↩ Undo
                    </button>
                    <button
                      type="button"
                      disabled={modalPolygonPoints.length === 0}
                      onClick={() => setModalPolygonPoints([])}
                      className="px-2 py-1 text-[9px] font-bold text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50 border border-red-200 rounded-lg cursor-pointer animate-none"
                    >
                      🗑 Wissen
                    </button>
                  </div>
                </div>

                {/* Micro instructions */}
                <p className="text-[10px] text-slate-500 italic leading-relaxed">
                  {modalDrawMode === "marker"
                    ? "Klik op de kaart om de hoofdcoördinator-marker direct te herpositioneren, of versleep de marker."
                    : "Klik achtereenvolgend op de kaart om de hoekpunten van de polygoon te tekenen. Minimale invoer is 3 punten."}
                </p>

                {/* Sub-kaart container */}
                <div className="relative w-full h-64 rounded-xl overflow-hidden border border-slate-200 shadow-inner z-10">
                  <div ref={modalMapContainerRef} className="w-full h-full" id="admin-draw-modal-map" />
                  
                  {/* Floating Kadastraal Layer Toggle */}
                  <div className="absolute top-2 right-2 flex space-x-1 bg-white/95 backdrop-blur-sm p-1 rounded-lg shadow-md z-[500] border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setModalMapLayer("standard")}
                      className={`px-1.5 py-0.5 text-[8px] font-extrabold rounded transition cursor-pointer ${
                        modalMapLayer === "standard"
                          ? "bg-purple-600 text-white"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      OSM Kaart
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalMapLayer("kadaster")}
                      className={`px-1.5 py-0.5 text-[8px] font-extrabold rounded transition cursor-pointer ${
                        modalMapLayer === "kadaster"
                          ? "bg-purple-600 text-white"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      PDOK / Kadaster
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalMapLayer("zoning")}
                      className={`px-1.5 py-0.5 text-[8px] font-extrabold rounded transition cursor-pointer ${
                        modalMapLayer === "zoning"
                          ? "bg-purple-600 text-white"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      Luchtfoto
                    </button>
                  </div>

                  {/* Polygon indicator badges */}
                  <div className="absolute bottom-2 left-2 bg-slate-900/95 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[9px] text-white font-mono z-[500] shadow flex items-center space-x-1.5">
                    <span className={`w-2 h-2 rounded-full ${modalPolygonPoints.length >= 3 ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`}></span>
                    <span>
                      {modalPolygonPoints.length === 0
                        ? "Gebied leeg"
                        : `${modalPolygonPoints.length} punt${modalPolygonPoints.length > 1 ? "en" : ""} getekend`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 5: Active Phase & Total Phases */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">Huidige Fase *</label>
                  <input
                    type="text"
                    required
                    value={newProjPhase}
                    onChange={(e) => setNewProjPhase(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none text-slate-800 font-semibold"
                    placeholder="Bijv. Fase 3: Participatie"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">Planning / Termijn *</label>
                  <input
                    type="text"
                    required
                    value={newProjPlanning}
                    onChange={(e) => setNewProjPlanning(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none text-slate-800 font-semibold"
                  />
                </div>
              </div>

              {/* Row 6: Image Selection / URL */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider">Projectafbeelding URL *</label>
                
                {/* Visual presets */}
                <div className="grid grid-cols-4 gap-2 pb-1">
                  {[
                    { name: "🔨 Bouw", url: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=600&auto=format&fit=crop" },
                    { name: "🏢 Ruimte", url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=600&auto=format&fit=crop" },
                    { name: "🌳 Groen", url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=600&auto=format&fit=crop" },
                    { name: "🏗️ Wending", url: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=600&auto=format&fit=crop" }
                  ].map((img) => (
                    <button
                      key={img.url}
                      type="button"
                      onClick={() => setNewProjImage(img.url)}
                      className={`relative rounded-xl overflow-hidden h-12 border-2 cursor-pointer transition ${
                        newProjImage === img.url ? 'border-purple-600 scale-[1.02]' : 'border-transparent opacity-80'
                      }`}
                    >
                      <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-[9px] font-black">
                        {img.name}
                      </div>
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  required
                  value={newProjImage}
                  onChange={(e) => setNewProjImage(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-3 text-xs focus:ring-1 focus:ring-purple-600 outline-none text-slate-800 font-mono"
                />
              </div>

              {/* Row 6.5: Project Website URL */}
              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">Project Website URL <span className="text-[9px] font-mono text-slate-400 capitalize bg-slate-100 px-1 py-0.5 rounded">(optioneel)</span></label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={newProjWebsiteUrl}
                  onChange={(e) => setNewProjWebsiteUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:ring-1 focus:ring-purple-600 outline-none text-slate-800 font-mono"
                />
              </div>

              {/* Row 6.7: Soort Project (Type Selection Option) */}
              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">Soort project *</label>
                <select
                  value={newProjProjectType}
                  onChange={(e) => setNewProjProjectType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:ring-1 focus:ring-purple-600 outline-none text-slate-800 font-semibold cursor-pointer"
                >
                  <option value="renovatie">Renovatie</option>
                  <option value="verduurzaming / energetische verbetering">Verduurzaming / energetische verbetering</option>
                  <option value="herstructurering">Herstructurering</option>
                  <option value="verdichting / inbreiding">Verdichting / inbreiding</option>
                  <option value="uitbreiding / buitengebied">Uitbreiding / buitengebied</option>
                  <option value="transformatie">Transformatie</option>
                  <option value="flex / tijdelijk">Flex / tijdelijk</option>
                </select>
              </div>

              {/* Row 7: Running Actions */}
              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">
                  Lopende Acties <span className="text-[9px] font-mono text-slate-400 capitalize bg-slate-100 px-1 py-0.5 rounded">(door komma's gescheiden)</span>
                </label>
                <input
                  type="text"
                  value={newProjActionsStr}
                  onChange={(e) => setNewProjActionsStr(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none text-slate-800 font-semibold"
                  placeholder="Bijv. Uitzoeken laadpalencapaciteit voor e-bakfietsen, Detailontwerp kade"
                />
              </div>

              {/* Footer Actions inside form */}
              <div className="border-t border-slate-150 pt-4 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsShowingAddModal(false)}
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-250 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  disabled={isSavingProject}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-black rounded-xl text-xs flex items-center gap-1.5 transition active:scale-[0.98] cursor-pointer shadow-md border-none"
                >
                  {isSavingProject ? "Opslaan..." : "Project Toevoegen"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* STUNNING MODAL OVERLAY FOR PROJECT EDITING (Pen) */}
      {isShowingEditModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-100 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-650 p-6 text-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-extrabold text-lg leading-tight flex items-center gap-2">
                  <Pencil className="w-5 h-5 text-blue-200" />
                  <span>Project Bewerken</span>
                </h3>
                <p className="text-xs text-blue-100 mt-1 font-semibold">Pas de details aan voor '{editingProjectName}'</p>
              </div>
              <button
                type="button"
                onClick={() => setIsShowingEditModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer border-none text-xl font-bold"
              >
                &times;
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto space-y-4 flex-grow text-left">
              {/* Row 1: Name */}
              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">Projectnaam *</label>
                <input
                  type="text"
                  required
                  value={editProjName}
                  onChange={(e) => setEditProjName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-slate-800 font-semibold"
                />
              </div>

              {/* Row 2: City */}
              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">Stad / Deelgebied *</label>
                <input
                  type="text"
                  required
                  value={editProjCity}
                  onChange={(e) => setEditProjCity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-slate-800 font-semibold"
                />
              </div>

              {/* Row 3: Address */}
              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">Adres</label>
                <input
                  type="text"
                  value={editProjAddress}
                  onChange={(e) => setEditProjAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-slate-800 font-semibold"
                  placeholder="Bijv. Dorpstraat 12, Hierden"
                />
              </div>

              {/* Row 4: Description */}
              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">Project Toelichting / Doelstelling *</label>
                <textarea
                  required
                  rows={4}
                  value={editProjDescription}
                  onChange={(e) => setEditProjDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-slate-800 resize-none font-semibold"
                />
              </div>

              {/* Row 5: Planning */}
              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">Planning status *</label>
                <input
                  type="text"
                  required
                  value={editProjPlanning}
                  onChange={(e) => setEditProjPlanning(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-slate-800 font-semibold"
                />
              </div>

              {/* Row 6: Image URL */}
              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">Projectafbeelding URL *</label>
                <input
                  type="text"
                  required
                  value={editProjImage}
                  onChange={(e) => setEditProjImage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-3 text-xs focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-slate-800 font-mono text-[10px]"
                />
              </div>

              {/* Row 6.5: Project Website URL */}
              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">Project Website URL <span className="text-[9px] font-mono text-slate-400 capitalize bg-slate-100 px-1 py-0.5 rounded">(optioneel)</span></label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={editProjWebsiteUrl}
                  onChange={(e) => setEditProjWebsiteUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-slate-800 font-mono"
                />
              </div>

              {/* Row 6.7: Soort Project (Type Selection Option) */}
              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">Soort project *</label>
                <select
                  value={editProjProjectType}
                  onChange={(e) => setEditProjProjectType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-slate-800 font-semibold cursor-pointer"
                >
                  <option value="renovatie">Renovatie</option>
                  <option value="verduurzaming / energetische verbetering">Verduurzaming / energetische verbetering</option>
                  <option value="herstructurering">Herstructurering</option>
                  <option value="verdichting / inbreiding">Verdichting / inbreiding</option>
                  <option value="uitbreiding / buitengebied">Uitbreiding / buitengebied</option>
                  <option value="transformatie">Transformatie</option>
                  <option value="flex / tijdelijk">Flex / tijdelijk</option>
                </select>
              </div>

              {/* Row 7: Running Actions */}
              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">
                  Lopende Acties <span className="text-[9px] font-mono text-slate-400 capitalize bg-slate-100 px-1 py-0.5 rounded">(door komma's gescheiden)</span>
                </label>
                <input
                  type="text"
                  value={editProjActionsStr}
                  onChange={(e) => setEditProjActionsStr(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-slate-800 font-semibold"
                />
              </div>

              {/* Row 8: Active Phase & Coordinates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">Huidige Fase *</label>
                  <input
                    type="text"
                    required
                    value={editProjPhase}
                    onChange={(e) => setEditProjPhase(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-slate-800 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">Fase getal (1-9) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={15}
                    value={editProjPhaseNumber}
                    onChange={(e) => setEditProjPhaseNumber(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-slate-800 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">Totaantal Fasen *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={15}
                    value={editProjTotalPhases}
                    onChange={(e) => setEditProjTotalPhases(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-slate-800 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">Breedtegraad (Lat) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={editProjLat}
                    onChange={(e) => setEditProjLat(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-slate-800 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">Lengtegraad (Lng) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={editProjLng}
                    onChange={(e) => setEditProjLng(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-slate-800 font-semibold"
                  />
                </div>
              </div>

              {/* Footer Actions inside form */}
              <div className="border-t border-slate-150 pt-4 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
                <div className="flex gap-2 w-full sm:w-auto justify-start">
                  {onDeleteProject && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm(`Weet u zeker dat u '${editingProjectName}' permanent wilt verwijderen? Dit is onomkeerbaar!`)) {
                          if (selectedMapProject?.id === editingProjectId) {
                            const nextProj = currentViewProjects.find(p => p.id !== editingProjectId) || null;
                            setSelectedMapProject(nextProj);
                          }
                          await onDeleteProject(editingProjectId!);
                          setIsShowingEditModal(false);
                          setEditingProjectId(null);
                        }
                      }}
                      className="px-3.5 py-2 bg-red-50 hover:bg-red-100 hover:text-red-700 text-red-600 rounded-xl text-xs font-black transition active:scale-95 cursor-pointer flex items-center gap-1 border border-red-200"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      <span>Verwijderen</span>
                    </button>
                  )}
                  {onUpdateProject && (
                    <button
                      type="button"
                      onClick={async () => {
                        const nextArchivedState = !isEditingProjectArchived;
                        const confirmMsg = nextArchivedState 
                          ? `Wilt u '${editingProjectName}' archiveren?`
                          : `Wilt u '${editingProjectName}' terugzetten naar actieve projecten?`;
                        if (confirm(confirmMsg)) {
                          await onUpdateProject(editingProjectId!, { archived: nextArchivedState });
                          setIsShowingEditModal(false);
                          setEditingProjectId(null);
                        }
                      }}
                      className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 hover:text-amber-800 text-amber-700 rounded-xl text-xs font-black transition active:scale-95 cursor-pointer flex items-center gap-1 border border-amber-200"
                    >
                      {isEditingProjectArchived ? (
                        <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                      ) : (
                        <Archive className="w-3.5 h-3.5 text-amber-500" />
                      )}
                      <span>{isEditingProjectArchived ? "Terugzetten" : "Archiveren"}</span>
                    </button>
                  )}
                </div>
                <div className="flex gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setIsShowingEditModal(false)}
                    className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-250 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Annuleren
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingEditProject}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black rounded-xl text-xs flex items-center gap-1.5 transition active:scale-[0.98] cursor-pointer shadow-md border-none"
                  >
                    {isSavingEditProject ? "Opslaan..." : "Wijzigingen Opslaan"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GORGEOUS MODAL OVERLAY FOR USER ROLE SELECTION ON PROJECT TRANSITION */}
      {projectPendingRoleSelect && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          {/* Backdrop with blur */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity"
            onClick={() => setProjectPendingRoleSelect(null)}
          ></div>
          
          {/* Modal Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl relative w-full max-w-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh] md:max-h-[80vh]">
            {/* Header banner */}
            <div className="bg-emerald-600 text-white p-5 md:p-6 relative">
              <button 
                onClick={() => setProjectPendingRoleSelect(null)}
                className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-emerald-750/40 p-1.5 rounded-full transition cursor-pointer"
                aria-label="Sluiten"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
              
              <div className="flex items-center gap-1.5 text-emerald-100 font-extrabold text-[9px] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                <span>Interactieve Toegang conform Omgevingswet</span>
              </div>
              <h3 className="text-lg md:text-xl font-black mt-1 tracking-tight">Selecteer uw gebruikersrol</h3>
              <p className="text-emerald-100/90 text-xs mt-1 font-medium">
                {projectPendingRoleSelect.name} &bull; {projectPendingRoleSelect.city}
              </p>
            </div>
            
            {/* Scrollable list/grid of roles */}
            <div className="p-5 md:p-6 overflow-y-auto space-y-4 flex-grow">
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Kies de hoedanigheid waarin u dit project wilt betreden. De functionaliteiten, informatiepanelen en de AI-Coach dialoogvensters worden toegesneden op uw rol.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {[
                  {
                    roleType: "Bewoner" as UserRole,
                    title: "🙋 burger / bewoner",
                    description: "U bent lokale bewoner. Dien ideeën en reacties in, geef wensen aan en overleg over de wijk.",
                    color: "border-emerald-100 hover:border-emerald-500 hover:bg-emerald-50/20"
                  },
                  {
                    roleType: "Gemeente" as UserRole,
                    title: "🏛️ stakeholder / overheid",
                    description: "Bekijk het beleid, analyseer burgerwensen en genereer rapportages via de AI Coach.",
                    color: "border-sky-100 hover:border-sky-500 hover:bg-sky-50/20"
                  },
                  {
                    roleType: "Projectontwikkelaar" as UserRole,
                    title: "🏗️ projectontwikkelaar",
                    description: "Ontwerp de plannen, analyseer draagvlakstatistieken en reageer op burgerinitiatieven.",
                    color: "border-amber-100 hover:border-amber-500 hover:bg-amber-50/20"
                  },
                  {
                    roleType: "Ondernemer" as UserRole,
                    title: "💼 ondernemer",
                    description: "Focus op economische impact, infrastructuur, mobiliteitshubs en logistieke bereikbaarheid.",
                    color: "border-indigo-100 hover:border-indigo-500 hover:bg-indigo-50/20"
                  },
                  {
                    roleType: "Adviseur" as UserRole,
                    title: "📈 adviseur derden",
                    description: "Bied technische expertise aan, bestudeer milieueffecten en toets bestemmingsplan-data.",
                    color: "border-purple-100 hover:border-purple-500 hover:bg-purple-50/20"
                  },
                  {
                    roleType: "Admin" as UserRole,
                    title: "👑 beheerder / admin",
                    description: "U krijgt volledige beheerdersrechten over de plankaart, ideeën, fasering en projectinstellingen.",
                    color: "border-purple-200 hover:border-purple-600 hover:bg-purple-50/20"
                  },
                  {
                    roleType: "Bezoeker" as UserRole,
                    title: "🚴 bezoeker / geïnteresseerde",
                    description: "U bent geïnteresseerd in de algemene voortgang, schetsontwerpen en participatiescores.",
                    color: "border-slate-150 hover:border-slate-500 hover:bg-slate-50/20"
                  }
                ].map((item) => (
                  <button
                    key={item.roleType}
                    onClick={() => {
                      onRoleChange(item.roleType);
                      onSelectProject(projectPendingRoleSelect.id);
                      setProjectPendingRoleSelect(null);
                    }}
                    className={`text-left p-3.5 rounded-2xl border-2 transition-all duration-150 hover:scale-[1.01] flex flex-col gap-1 cursor-pointer bg-white group ${item.color}`}
                    id={`modal-role-btn-${item.roleType}`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="font-extrabold text-slate-900 text-xs tracking-tight group-hover:text-emerald-950">
                        {item.title}
                      </span>
                      {selectedRole === item.roleType && (
                        <span className="text-[9px] font-extrabold uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                          Selectie
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-550 leading-relaxed font-semibold">
                      {item.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Modal footer */}
            <div className="bg-slate-50 p-4 px-6 border-t border-slate-100 flex justify-between items-center shrink-0">
              <span className="text-[9px] text-slate-400 font-semibold">
                🔒 Vrij van formele registratieplicht
              </span>
              <button
                onClick={() => setProjectPendingRoleSelect(null)}
                className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-250 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Annuleren
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
