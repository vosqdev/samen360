import React, { useState, useEffect } from "react";
import { UserRole, ProjectPhase, MapMarker, Idea, Decision, NewsArticle, Task, ProjectStats, Publication, getRoleLabel } from "./types";
import { collection, onSnapshot, query, orderBy, getDocs, doc, getDocFromServer, addDoc, setDoc, updateDoc, increment, serverTimestamp, deleteDoc } from "firebase/firestore";
import {
  auth,
  loginWithGoogle,
  logout as firebaseLogout,
  db,
  handleFirestoreError,
  OperationType
} from "./firebase";
import { onAuthStateChanged, User, signInAnonymously } from "firebase/auth";
import {
  INITIAL_PHASES,
  INITIAL_MARKERS,
  INITIAL_IDEAS,
  INITIAL_DECISIONS,
  INITIAL_NEWS,
  INITIAL_STAKEHOLDERS,
  INITIAL_TASKS,
  SURVEY_TEMPLATES,
} from "./data";

// Modular Components
import InteractiveMap from "./components/InteractiveMap";
import AICoach from "./components/AICoach";
import DashboardStats from "./components/DashboardStats";
import StakeholderMatrix from "./components/StakeholderMatrix";
import ReportGenerator from "./components/ReportGenerator";
import TimelineView from "./components/TimelineView";
import IdeaBoard from "./components/IdeaBoard";
import DecisionRegister from "./components/DecisionRegister";
import NieuwsCentrum from "./components/NieuwsCentrum";
import ConstructionApp from "./components/ConstructionApp";
import NationalPortal from "./components/NationalPortal";
import { GebiedsatelierSurvey } from "./components/GebiedsatelierSurvey";

// Visual Icons
import {
  Sparkles,
  MapPin,
  Compass,
  Trophy,
  ChevronRight,
  TrendingUp,
  MessageCircle,
  Settings,
  Shield,
  HelpCircle,
  Cpu,
  Bookmark,
  Activity,
  AlertOctagon,
  Award,
  BookOpen,
  CheckCircle,
  LogOut,
  ExternalLink,
} from "lucide-react";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // App primary state
  const [viewMode, setViewMode] = useState<"portal" | "project">("portal");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("hierdenbuiten");
  const [role, setRole] = useState<UserRole>("Bewoner");
  const [userName, setUserName] = useState("Utrechtse Burger");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [adminAuthError, setAdminAuthError] = useState<string | null>(null);
  
  // Tab-navigation state
  const [activeTab, setActiveTab] = useState<"dashboard" | "coach" | "ideas" | "survey" | "monitor" | "lab" | "news">("dashboard");
  const [activePhaseId, setActivePhaseId] = useState<string>("3"); // default to "Participatie"
  const [constructionMode, setConstructionMode] = useState<boolean>(false);

  // Pre-seeded functional states
  const [dbProjects, setDbProjects] = useState<Record<string, any>>({});
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, "up" | "down" | "love" | "light" | null>>(() => {
    try {
      const saved = localStorage.getItem("utrecht_civil_user_votes");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem("utrecht_civil_user_votes", JSON.stringify(userVotes));
  }, [userVotes]);

  const [decisions, setDecisions] = useState<Decision[]>(INITIAL_DECISIONS);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [surveyResponses, setSurveyResponses] = useState<any[]>([]);
  const [news, setNews] = useState<NewsArticle[]>(INITIAL_NEWS);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);

  // Redirect non-admin users if they are on a restricted tab
  useEffect(() => {
    if (role !== "Admin" && (activeTab === "coach" || activeTab === "lab")) {
      setActiveTab("dashboard");
    }
  }, [role, activeTab]);

  // Ensure that construction mode is turned off for non-admin roles
  useEffect(() => {
    if (role !== "Admin") {
      setConstructionMode(false);
    }
  }, [role]);

  useEffect(() => {
    // Validate connection
    getDocFromServer(doc(db, 'test', 'connection')).catch(e => {
      if(e instanceof Error && e.message.includes('the client is offline')) {
        console.error("Please check your Firebase configuration.");
      }
    });

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        if (user.email === "vosqdevelopment@gmail.com") {
          setRole("Admin");
          setUserName(user.displayName || "Beheerder");
          setIsLoggedIn(true);
          setAdminAuthError(null);
        } else {
          // If a non-authorized email logs in, sign them out immediately
          firebaseLogout();
          setRole("Bewoner");
          setUserName("Utrechtse Burger");
          setIsLoggedIn(false);
          setAdminAuthError("Toegang geweigerd: Alleen vosqdevelopment@gmail.com kan zich aanmelden als beheerder.");
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // List of active projects with their detailed settings dynamically merged with database custom projects
  const projectsDetails: Record<string, { name: string; city: string; subtitle: string; bgImage: string; participants: number; views: number; supportIndex: number; activePhase: string }> = {
    "hierdenbuiten": {
      name: "HierdenBuiten",
      city: "Hierden",
      subtitle: "Natuurinclusieve herinrichting HierdenBuiten",
      bgImage: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=800&auto=format&fit=crop",
      participants: 320,
      views: 1120,
      supportIndex: 88,
      activePhase: "Participatie"
    },
    "spoorzone-utrecht": {
      name: "Spoorzone Havenkwartier",
      city: "Utrecht West",
      subtitle: "Utrecht West • 750 duurzame woningen",
      bgImage: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=800&auto=format&fit=crop",
      participants: 1842,
      views: 4510,
      supportIndex: 82,
      activePhase: "Participatie"
    },
    "strijps-eindhoven": {
      name: "Strijp-S Fase 3",
      city: "Eindhoven West",
      subtitle: "Gebiedsontwikkeling Strijp-S • Slimme mobiele hubs",
      bgImage: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=800&auto=format&fit=crop",
      participants: 1430,
      views: 4120,
      supportIndex: 88,
      activePhase: "Schetsontwerp"
    },
    ...Object.entries(dbProjects).reduce((acc, [idx, p]: [string, any]) => {
      acc[idx] = {
        name: p.name,
        city: p.city,
        subtitle: `${p.city} • ${p.planning || "Participatie Buurtontwerp"}`,
        bgImage: p.image || "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=600&auto=format&fit=crop",
        participants: p.participants || 25,
        views: p.views || 75,
        supportIndex: p.supportIndex || 85,
        activePhase: p.phase || "Participatie"
      };
      return acc;
    }, {} as Record<string, any>)
  };

  useEffect(() => {
    // Listen to Projects
    const qProjects = collection(db, 'projects');
    const unsubProjects = onSnapshot(qProjects, (snapshot) => {
      const projs: Record<string, any> = {};
      snapshot.forEach((d) => {
        projs[d.id] = { ...d.data(), id: d.id };
      });
      setDbProjects(projs);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'projects'));

    // Listen to Markers
    const qMarkers = query(collection(db, 'markers'), orderBy('createdAt', 'desc'));
    const unsubMarkers = onSnapshot(qMarkers, (snapshot) => {
      const dbMarkers: MapMarker[] = [];
      snapshot.forEach((d) => {
        const item = d.data() as Omit<MapMarker, "id">;
        dbMarkers.push({ ...item, id: d.id });
      });
      setMarkers(dbMarkers.length > 0 ? dbMarkers : INITIAL_MARKERS);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'markers'));

    // Listen to Ideas
    const qIdeas = query(collection(db, 'ideas'), orderBy('createdAt', 'desc'));
    const unsubIdeas = onSnapshot(qIdeas, (snapshot) => {
      const dbIdeas: Idea[] = [];
      snapshot.forEach((d) => {
        const item = d.data() as Omit<Idea, "id">;
        dbIdeas.push({ ...item, id: d.id });
      });
      const mergedIdeas = [...dbIdeas, ...INITIAL_IDEAS.filter(i => !dbIdeas.some(di => di.id === i.id))];
      setIdeas(mergedIdeas);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'ideas'));

    // Listen to News & Publications
    const qNews = query(collection(db, 'news'), orderBy('createdAt', 'desc'));
    const unsubNews = onSnapshot(qNews, (snapshot) => {
      const dbNews: NewsArticle[] = [];
      snapshot.forEach((d) => {
        const item = d.data();
        dbNews.push({
          id: d.id,
          title: item.title || "",
          summary: item.summary || "",
          content: item.content || "",
          date: item.date || "",
          category: item.category || "Nieuws",
          image: item.image || "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=600&auto=format&fit=crop",
          readTime: item.readTime || "3 min leestijd",
          documents: item.documents || [],
          views: item.views || 0
        });
      });
      const mergedNews = [...dbNews, ...INITIAL_NEWS.filter(n => !dbNews.some(dn => dn.id === n.id))];
      setNews(mergedNews);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'news'));

    // Listen to Decisions
    const qDecisions = query(collection(db, 'decisions'), orderBy('date', 'desc'));
    const unsubDecisions = onSnapshot(qDecisions, (snapshot) => {
      const dbDecisions: Decision[] = [];
      snapshot.forEach((d) => {
        const item = d.data();
        dbDecisions.push({
          id: d.id,
          title: item.title || "",
          category: item.category || "",
          decisionText: item.decisionText || "",
          motivation: item.motivation || "",
          underpinning: item.underpinning || "",
          date: item.date || "",
          status: item.status || "Definitief",
          version: item.version || "v1.0",
          relatedParticipation: item.relatedParticipation || "",
          documents: item.documents || []
        });
      });
      const mergedDecisions = [...dbDecisions, ...INITIAL_DECISIONS.filter(id => !dbDecisions.some(dd => dd.id === id.id))];
      setDecisions(mergedDecisions);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'decisions'));

    // Listen to Publications
    const qPublications = query(collection(db, 'publications'), orderBy('createdAt', 'desc'));
    const unsubPublications = onSnapshot(qPublications, (snapshot) => {
      const dbPublications: Publication[] = [];
      snapshot.forEach((d) => {
        const item = d.data();
        dbPublications.push({
          id: d.id,
          projectId: item.projectId || "",
          phaseId: item.phaseId || "",
          title: item.title || "",
          fileName: item.fileName || "",
          fileSize: item.fileSize || "Onbekend",
          downloadUrl: item.downloadUrl || "",
          uploadedBy: item.uploadedBy || "",
          createdAt: item.createdAt
        });
      });
      setPublications(dbPublications);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'publications'));

    // Listen to Survey Responses
    const qSurveyResponses = collection(db, 'survey_responses');
    const unsubSurveyResponses = onSnapshot(qSurveyResponses, (snapshot) => {
      const dbResponses: any[] = [];
      snapshot.forEach((d) => {
        const item = d.data();
        dbResponses.push({
          id: d.id,
          projectId: item.projectId || "",
          answers: item.answers || [],
          createdAt: item.createdAt
        });
      });
      setSurveyResponses(dbResponses);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'survey_responses'));

    return () => {
      unsubProjects();
      unsubMarkers();
      unsubIdeas();
      unsubNews();
      unsubDecisions();
      unsubPublications();
      unsubSurveyResponses();
    };
  }, []);  // Landsbrede projecten configuratie dynamically merged with custom database projects
  const staticProjectsList = [
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
      archived: true
    }
  ];

  const handleAdminAuthCheckAndSet = () => {
    return loginWithGoogle().then((result) => {
      if (result.user.email === "vosqdevelopment@gmail.com") {
        setRole("Admin");
        setUserName(result.user.displayName || "Beheerder");
        setIsLoggedIn(true);
        setAdminAuthError(null);
        return true;
      } else {
        firebaseLogout();
        setRole("Bewoner");
        setUserName("Utrechtse Burger");
        setIsLoggedIn(false);
        setAdminAuthError("Toegang geweigerd: Alleen vosqdevelopment@gmail.com kan zich aanmelden als beheerder.");
        return false;
      }
    }).catch((err) => {
      console.warn("Google Sign-In mislukt of geblokkeerd:", err);
      setRole("Bewoner");
      setUserName("Utrechtse Burger");
      setIsLoggedIn(false);
      setAdminAuthError("Inloggen als beheerder via Google Auth mislukt of geannuleerd.");
      return false;
    });
  };

  const mappedNationalProjects: any[] = React.useMemo(() => {
    return [
      ...staticProjectsList.map((sp) => {
        const dbProj = dbProjects[sp.id];
        const defaultQs = [
          `Moet er meer budget naar groenvoorziening dan naar autoparkeerruimte in ${sp.name}?`,
          "Maakt u zich zorgen over mogelijke geluidsoverlast van de nieuwe horecavoorzieningen?",
          "Is een nieuwe veilige snelfietsverbinding gewenst voor de aansluiting met het stadscentrum?",
          "Wilt u gebruik kunnen maken van gedeelde e-bakfietsen in de lokale mobiliteitshubs?"
        ];
        
        // Calculate dynamic additions
        const pId = sp.id;
        const additions = (markers?.filter(m => m.projectId === pId).length || 0) + 
                          (ideas?.filter(i => i.projectId === pId).length || 0) + 
                          (surveyResponses?.filter(r => r.projectId === pId).length || 0);
        
        const dynamicParticipants = additions;
        const dynamicViews = additions * 4;

        return {
          ...sp,
          ...(dbProj || {}),
          archived: dbProj && dbProj.archived !== undefined ? dbProj.archived : false,
          projectType: dbProj?.projectType || sp.projectType || "herstructurering",
          participants: dynamicParticipants,
          views: dynamicViews,
          surveyQuestions: dbProj?.surveyQuestions || sp.surveyQuestions || defaultQs,
          isGebiedsatelierEnabled: dbProj?.isGebiedsatelierEnabled !== undefined ? dbProj.isGebiedsatelierEnabled : true
        };
      }),
      ...Object.values(dbProjects)
        .filter((p: any) => !staticProjectsList.some((sp) => sp.id === p.id))
        .map((p: any) => {
          const defaultQs = [
            `Moet er meer budget naar groenvoorziening dan naar autoparkeerruimte in ${p.name}?`,
            "Maakt u zich zorgen over mogelijke geluidsoverlast van de nieuwe horecavoorzieningen?",
            "Is een nieuwe veilige snelfietsverbinding gewenst voor de aansluiting met het stadscentrum?",
            "Wilt u gebruik kunnen maken van gedeelde e-bakfietsen in de lokale mobiliteitshubs?"
          ];

          // Calculate dynamic additions
          const pId = p.id;
          const additions = (markers?.filter(m => m.projectId === pId).length || 0) + 
                            (ideas?.filter(i => i.projectId === pId).length || 0) + 
                            (surveyResponses?.filter(r => r.projectId === pId).length || 0);

          const dynamicParticipants = additions;
          const dynamicViews = additions * 4;

          return {
            id: p.id,
            name: p.name,
            city: p.city,
            description: p.description,
            lat: Number(p.lat || 52.0907),
            lng: Number(p.lng || 5.1214),
            x: Number(p.x || 50),
            y: Number(p.y || 50),
            phase: p.phase || "Fase 3: Participatie",
            phaseNumber: Number(p.phaseNumber || 3),
            totalPhases: Number(p.totalPhases || 9),
            runningActions: p.runningActions || [],
            openComments: Number(p.openComments || 0),
            planning: p.planning || "Algemene projectvisie",
            supportIndex: Number(p.supportIndex || 85),
            participants: dynamicParticipants,
            views: dynamicViews,
            image: p.image || "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=600&auto=format&fit=crop",
            address: p.address || "",
            polygon: p.polygon || "",
            archived: p.archived !== undefined ? p.archived : false,
            websiteUrl: p.websiteUrl || "",
            projectType: p.projectType || "herstructurering",
            surveyQuestions: p.surveyQuestions || defaultQs,
            isGebiedsatelierEnabled: p.isGebiedsatelierEnabled !== undefined ? p.isGebiedsatelierEnabled : true
          };
        })
    ].filter((p: any) => !p.deleted);
  }, [dbProjects, markers, ideas, surveyResponses]);

  const handleAddProject = async (newProj: any) => {
    try {
      await setDoc(doc(db, "projects", newProj.id), {
        name: newProj.name,
        city: newProj.city,
        description: newProj.description,
        lat: Number(newProj.lat),
        lng: Number(newProj.lng),
        x: Number(newProj.x || 50),
        y: Number(newProj.y || 50),
        phase: newProj.phase,
        phaseNumber: Number(newProj.phaseNumber),
        totalPhases: Number(newProj.totalPhases),
        runningActions: newProj.runningActions,
        planning: newProj.planning,
        image: newProj.image,
        address: newProj.address || "",
        polygon: newProj.polygon || "",
        websiteUrl: newProj.websiteUrl || "",
        projectType: newProj.projectType || "herstructurering",
        openComments: 0,
        supportIndex: 85,
        participants: 25,
        views: 75,
        archived: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, "projects");
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      const staticIds = ["hierdenbuiten"];
      if (staticIds.includes(id)) {
        await setDoc(doc(db, "projects", id), {
          deleted: true,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } else {
        await deleteDoc(doc(db, "projects", id));
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `projects/${id}`);
    }
  };

  const handleUpdateProject = async (id: string, updatedFields: Partial<any>) => {
    try {
      const existingDbProj = dbProjects[id];
      if (existingDbProj) {
        await updateDoc(doc(db, "projects", id), {
          ...updatedFields,
          updatedAt: serverTimestamp()
        });
      } else {
        const staticProj = staticProjectsList.find(p => p.id === id);
        if (staticProj) {
          await setDoc(doc(db, "projects", id), {
            name: staticProj.name,
            city: staticProj.city,
            description: staticProj.description,
            lat: Number(staticProj.lat),
            lng: Number(staticProj.lng),
            x: Number(staticProj.x || 50),
            y: Number(staticProj.y || 50),
            phase: staticProj.phase,
            phaseNumber: Number(staticProj.phaseNumber),
            totalPhases: Number(staticProj.totalPhases),
            runningActions: staticProj.runningActions || [],
            planning: staticProj.planning || "",
            image: staticProj.image || "",
            address: staticProj.address || "",
            polygon: staticProj.polygon || "",
            openComments: Number(staticProj.openComments || 0),
            supportIndex: Number(staticProj.supportIndex || 85),
            participants: Number(staticProj.participants || 25),
            views: Number(staticProj.views || 75),
            ...updatedFields,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `projects/${id}`);
    }
  };

  const handleUpdateSurveyQuestions = async (projectId: string, questions: string[]) => {
    try {
      const existingDbProj = dbProjects[projectId];
      if (existingDbProj) {
        await updateDoc(doc(db, "projects", projectId), {
          surveyQuestions: questions,
          updatedAt: serverTimestamp()
        });
      } else {
        const staticProj = staticProjectsList.find(p => p.id === projectId);
        if (staticProj) {
          await setDoc(doc(db, "projects", projectId), {
            name: staticProj.name,
            city: staticProj.city,
            description: staticProj.description,
            lat: Number(staticProj.lat),
            lng: Number(staticProj.lng),
            x: Number(staticProj.x || 50),
            y: Number(staticProj.y || 50),
            phase: staticProj.phase,
            phaseNumber: Number(staticProj.phaseNumber || 3),
            totalPhases: Number(staticProj.totalPhases || 9),
            runningActions: staticProj.runningActions || [],
            planning: staticProj.planning,
            image: staticProj.image,
            address: staticProj.address || "",
            polygon: staticProj.polygon || "",
            openComments: Number(staticProj.openComments || 0),
            supportIndex: Number(staticProj.supportIndex || 85),
            participants: Number(staticProj.participants || 25),
            views: Number(staticProj.views || 75),
            surveyQuestions: questions,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `projects/${projectId}`);
    }
  };

  const handleUpdateProjectPhase = async (projectId: string, newPhaseNumber: number) => {
    try {
      const existingDbProj = dbProjects[projectId];
      const phaseObj = INITIAL_PHASES.find(p => p.id === String(newPhaseNumber)) || INITIAL_PHASES[2];
      const phaseText = `Fase ${phaseObj.id}: ${phaseObj.label}`;
      
      if (existingDbProj) {
        await updateDoc(doc(db, "projects", projectId), {
          phase: phaseText,
          phaseNumber: newPhaseNumber,
          updatedAt: serverTimestamp()
        });
      } else {
        const staticProj = staticProjectsList.find(p => p.id === projectId);
        if (staticProj) {
          await setDoc(doc(db, "projects", projectId), {
            name: staticProj.name,
            city: staticProj.city,
            description: staticProj.description,
            lat: Number(staticProj.lat),
            lng: Number(staticProj.lng),
            x: Number(staticProj.x || 50),
            y: Number(staticProj.y || 50),
            phase: phaseText,
            phaseNumber: newPhaseNumber,
            totalPhases: Number(staticProj.totalPhases || 9),
            runningActions: staticProj.runningActions || [],
            planning: staticProj.planning,
            image: staticProj.image,
            address: staticProj.address || "",
            polygon: staticProj.polygon || "",
            openComments: Number(staticProj.openComments || 0),
            supportIndex: Number(staticProj.supportIndex || 85),
            participants: Number(staticProj.participants || 25),
            views: Number(staticProj.views || 75),
            surveyQuestions: staticProj.surveyQuestions || [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `projects/${projectId}`);
    }
  };

  const handleCreateDecision = async (decision: Omit<Decision, "id">) => {
    try {
      const docRef = doc(collection(db, "decisions"));
      await setDoc(docRef, {
        ...decision,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, "decisions");
    }
  };

  const handleUpdateDecision = async (decisionId: string, updatedFields: Partial<Omit<Decision, "id">>) => {
    try {
      await updateDoc(doc(db, "decisions", decisionId), {
        ...updatedFields,
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      // If the document doesn't exist yet in DB because it was part of INITIAL_DECISIONS (static), we can seed it with setDoc!
      const staticDec = INITIAL_DECISIONS.find(d => d.id === decisionId);
      if (staticDec) {
        await setDoc(doc(db, "decisions", decisionId), {
          projectId: selectedProjectId,
          phaseId: activePhaseId,
          title: staticDec.title,
          category: staticDec.category,
          decisionText: staticDec.decisionText,
          motivation: staticDec.motivation,
          underpinning: staticDec.underpinning,
          date: staticDec.date,
          status: staticDec.status,
          version: staticDec.version,
          relatedParticipation: staticDec.relatedParticipation,
          documents: staticDec.documents,
          ...updatedFields,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else {
        handleFirestoreError(e, OperationType.UPDATE, `decisions/${decisionId}`);
      }
    }
  };

  const handleDeleteDecision = async (decisionId: string) => {
    try {
      await deleteDoc(doc(db, "decisions", decisionId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `decisions/${decisionId}`);
    }
  };

  const handleCreatePublication = async (publication: Omit<Publication, "id" | "createdAt">) => {
    try {
      const docRef = doc(collection(db, "publications"));
      await setDoc(docRef, {
        ...publication,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, "publications");
    }
  };

  const handleDeletePublication = async (publicationId: string) => {
    try {
      await deleteDoc(doc(db, "publications", publicationId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `publications/${publicationId}`);
    }
  };

  const handleCreateNewsArticle = async (article: Omit<NewsArticle, "id">) => {
    try {
      await addDoc(collection(db, "news"), {
        ...article,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, "news");
    }
  };

  const handleDeleteNewsArticle = async (id: string) => {
    try {
      await deleteDoc(doc(db, "news", id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `news/${id}`);
    }
  };
  
  const currentProject = projectsDetails[selectedProjectId] || projectsDetails["hierdenbuiten"];

  const selectedProject = mappedNationalProjects.find(p => p.id === selectedProjectId) || mappedNationalProjects[0];

  const isGebiedsatelierEnabled = selectedProject?.isGebiedsatelierEnabled !== false;

  const filteredMarkers = markers.filter(
    (m) => (m.projectId || "hierdenbuiten") === selectedProjectId
  );

  const filteredIdeas = ideas.filter(
    (i) => (i.projectId || "hierdenbuiten") === selectedProjectId
  );

  // Synchroniseer stappenplan focus met de werkelijke fase van het project bij wissel of wijziging
  useEffect(() => {
    if (selectedProject) {
      const activeNum = Number(selectedProject.phaseNumber || 3);
      setActivePhaseId(String(activeNum));
    }
  }, [selectedProjectId, selectedProject?.phaseNumber]);

  const stats = React.useMemo<ProjectStats>(() => {
    const baseParticipants = 0;
    const baseViews = 0;

    // Filter survey responses for the current project
    const activeProjectResponses = surveyResponses.filter(r => r.projectId === selectedProjectId);

    // Default baseline to 80% if there is no survey response, otherwise calculate based on Ja/Nee ratio
    let baseSupport = 80;
    if (activeProjectResponses.length > 0) {
      let totalJa = 0;
      let totalNee = 0;
      activeProjectResponses.forEach(r => {
        if (r.answers && Array.isArray(r.answers)) {
          r.answers.forEach(ans => {
            if (ans === "Ja") totalJa++;
            else if (ans === "Nee") totalNee++;
          });
        }
      });
      if (totalJa + totalNee > 0) {
        baseSupport = Math.round((totalJa / (totalJa + totalNee)) * 100);
      }
    }

    // Calculate interactive additions
    const totalAdditions = filteredMarkers.length + filteredIdeas.length + activeProjectResponses.length;
    
    // Calculate custom sentiment impact from dynamic markers
    const positiveCount = filteredMarkers.filter(m => m.sentiment === "positive").length;
    const negativeCount = filteredMarkers.filter(m => m.sentiment === "negative").length;
    const sentimentSupportDelta = positiveCount - negativeCount;

    const finalSupportIndex = Math.min(100, Math.max(0, baseSupport + sentimentSupportDelta));

    // Calculate responseRate
    const responseRate = Math.min(100, Math.max(40, Math.round(finalSupportIndex * 0.9)));

    return {
      participants: baseParticipants + totalAdditions,
      uniqueViews: baseViews + totalAdditions * 4,
      supportIndex: finalSupportIndex,
      responseRate: responseRate,
    };
  }, [currentProject, selectedProjectId, filteredMarkers, filteredIdeas, surveyResponses]);

  // Dynamic AI Survey States (Halen van informatie - Ja/Nee/Geen mening)
  const [surveyStep, setSurveyStep] = useState(1);
  const [surveyAnswers, setSurveyAnswers] = useState<("Ja" | "Nee" | "Geen mening" | null)[]>([]);
  const [submittingSurvey, setSubmittingSurvey] = useState(false);
  const [surveyFinished, setSurveyFinished] = useState(false);
  const [isGebiedsatelierOpen, setIsGebiedsatelierOpen] = useState(false);

  // Admin survey question edit states
  const [isEditingSurveyQs, setIsEditingSurveyQs] = useState(false);
  const [editSurveyQuestions, setEditSurveyQuestions] = useState<string[]>([]);

  useEffect(() => {
    if (selectedProject) {
      const defaultQs = [
        `Moet er meer budget naar groenvoorziening dan naar autoparkeerruimte in ${selectedProject.name || "dit project"}?`,
        "Maakt u zich zorgen over mogelijke geluidsoverlast van de nieuwe horecavoorzieningen?",
        "Is een nieuwe veilige snelfietsverbinding gewenst voor de aansluiting met het stadscentrum?",
        "Wilt u gebruik kunnen maken van gedeelde e-bakfietsen in de lokale mobiliteitshubs?"
      ];
      const targetQs = selectedProject.surveyQuestions || defaultQs;
      setEditSurveyQuestions((p) => {
        if (JSON.stringify(p) === JSON.stringify(targetQs)) return p;
        return targetQs;
      });
    }
  }, [selectedProjectId, selectedProject?.name, JSON.stringify(selectedProject?.surveyQuestions)]);

  // 1. Interactive callback to place and analyse marker on the map
  const handleAddMarker = async (newMarker: Omit<MapMarker, "id" | "date" | "likes">) => {
    let finalSentiment: "positive" | "neutral" | "negative" = "neutral";
    let b1Result = newMarker.text;

    try {
      const response = await fetch("/api/analyze-comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newMarker.text }),
      });
      const data = await response.json();
      if (response.ok && data.sentiment) {
        finalSentiment = data.sentiment;
        b1Result = data.b1_translation;
      }
    } catch (err) {
      console.warn("AI Sentiment Fallback:", err);
    }

    const markerInstance = {
      ...newMarker,
      projectId: selectedProjectId,
      authorId: auth.currentUser?.uid || "anonymous",
      date: new Date().toISOString().split("T")[0],
      sentiment: finalSentiment,
      text: b1Result, // Save translated B1-level friendly text if processed
      likes: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    try {
      await addDoc(collection(db, 'markers'), markerInstance);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'markers');
    }
  };

  const handleLikeMarker = async (id: string) => {
    try {
      if (id.startsWith('m-')) {
        setMarkers((prev) => prev.map((m) => m.id === id ? { ...m, likes: m.likes + 1 } : m));
        return;
      }
      const docRef = doc(db, 'markers', id);
      await updateDoc(docRef, { likes: increment(1), updatedAt: serverTimestamp() });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `markers/${id}`);
    }
  };

  // 2. Interactive callback to submit local civic ideas
  const handleAddIdea = async (newIdea: Omit<Idea, "id" | "date" | "upvotes" | "downvotes" | "loves" | "lightbulbs">) => {
    try {
      await addDoc(collection(db, 'ideas'), {
        ...newIdea,
        projectId: selectedProjectId,
        authorId: auth.currentUser?.uid || "anonymous",
        date: new Date().toISOString().split("T")[0],
        upvotes: 0,
        downvotes: 0,
        loves: 0,
        lightbulbs: 0,
        clusteredId: "c_nieuw",
        clusteredTitle: "Nog te categoriseren ideeën",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'ideas');
    }
  };

  const handleVoteIdea = async (id: string, voteType: "up" | "down" | "love" | "light") => {
    try {
      const prevVote = userVotes[id] || null;
      let newVote: "up" | "down" | "love" | "light" | null = voteType;

      if (prevVote === voteType) {
        newVote = null;
      }

      // Calculate vote delta modifications
      const changes: Record<string, number> = {
        upvotes: 0,
        downvotes: 0,
        loves: 0,
        lightbulbs: 0
      };

      const fieldMap: Record<string, string> = {
        up: "upvotes",
        down: "downvotes",
        love: "loves",
        light: "lightbulbs"
      };

      if (prevVote) {
        const prevField = fieldMap[prevVote];
        changes[prevField] = -1;
      }

      if (newVote) {
        const newField = fieldMap[newVote];
        changes[newField] = (changes[newField] || 0) + 1;
      }

      // Update user votes state with structural persistence
      setUserVotes(prev => ({
        ...prev,
        [id]: newVote
      }));

      const isStaticIdea = INITIAL_IDEAS.some(item => item.id === id);

      if (isStaticIdea) {
        setIdeas((prevList) =>
          prevList.map((i) => {
            if (i.id !== id) return i;
            return {
              ...i,
              upvotes: Math.max(0, i.upvotes + (changes.upvotes || 0)),
              downvotes: Math.max(0, i.downvotes + (changes.downvotes || 0)),
              loves: Math.max(0, i.loves + (changes.loves || 0)),
              lightbulbs: Math.max(0, i.lightbulbs + (changes.lightbulbs || 0))
            };
          })
        );
      } else {
        const docRef = doc(db, 'ideas', id);
        const updates: any = { updatedAt: serverTimestamp() };
        
        if (changes.upvotes !== 0) updates.upvotes = increment(changes.upvotes);
        if (changes.downvotes !== 0) updates.downvotes = increment(changes.downvotes);
        if (changes.loves !== 0) updates.loves = increment(changes.loves);
        if (changes.lightbulbs !== 0) updates.lightbulbs = increment(changes.lightbulbs);

        await updateDoc(docRef, updates);
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `ideas/${id}`);
    }
  };

  // Admin only deletions
  const handleDeleteMarker = async (id: string) => {
    try {
      if (id.startsWith('m-')) {
        setMarkers(prev => prev.filter(m => m.id !== id));
        return;
      }
      await deleteDoc(doc(db, 'markers', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `markers/${id}`);
    }
  };

  const handleDeleteIdea = async (id: string) => {
    try {
      if (id.startsWith('i-')) {
        setIdeas(prev => prev.filter(i => i.id !== id));
        return;
      }
      await deleteDoc(doc(db, 'ideas', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `ideas/${id}`);
    }
  };

  // 3. Callback from AI Coach to append unestablished items as tasks on the planner board
  const handleTaskLoggedByCoach = (taskTitle: string) => {
    const taskInstance: Task = {
      id: `t-${Date.now()}`,
      title: taskTitle,
      status: "Open",
      source: "AI Coach",
      reporter: "Burger-vraag n.a.v. onbekende beleid",
      assignedTo: "Stadsplanners Spoorzone West",
      date: new Date().toISOString().split("T")[0],
    };

    setTasks((prev) => [taskInstance, ...prev]);
  };

  // 4. Submit active AI Inquiry / Vragenlijst (Halen van informatie)
  const handleSurveySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingSurvey(true);

    const defaultQs = [
      `Moet er meer budget naar groenvoorziening dan naar autoparkeerruimte in ${selectedProject?.name || "dit project"}?`,
      "Maakt u zich zorgen over mogelijke geluidsoverlast van de nieuwe horecavoorzieningen?",
      "Is een nieuwe veilige snelfietsverbinding gewenst voor de aansluiting met het stadscentrum?",
      "Wilt u gebruik kunnen maken van gedeelde e-bakfietsen in de lokale mobiliteitshubs?"
    ];
    const currentQuestions = selectedProject?.surveyQuestions || defaultQs;
    const answersArray = currentQuestions.map((_, idx) => surveyAnswers[idx] || "Geen mening");

    try {
      // 1. Save answers array to survey_responses collection
      await addDoc(collection(db, "survey_responses"), {
        projectId: selectedProjectId,
        answers: answersArray,
        createdAt: serverTimestamp()
      });

      // 2. Generate custom map marker summary insturen on the map
      const markerText = `Enquête ingevuld: ` +
        answersArray.map((ans, idx) => `${idx + 1}) ${ans}`).join(" • ");

      await handleAddMarker({
        author: userName || "Buurtenquête Deelnemer",
        role: role,
        text: markerText,
        category: "Groen",
        x: Math.round(30 + Math.random() * 40),
        y: Math.round(25 + Math.random() * 45),
      });

      setSurveyFinished(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingSurvey(false);
    }
  };

  // 4b. Submit active Gebiedsatelier Visual Survey Response
  const handleSaveGebiedsatelierResponse = async (answers: Record<number, string | string[]>) => {
    try {
      // Create a readable list or key-value of responses
      const answersList = Object.entries(answers)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([item, val]) => {
          return `Stap ${item}: ${Array.isArray(val) ? val.join(", ") : val}`;
        });

      await addDoc(collection(db, "survey_responses"), {
        projectId: selectedProjectId,
        answers: answersList,
        rawAnswers: answers,
        surveyType: "gebiedsatelier",
        userName: userName || "Buurtenquête Deelnemer",
        createdAt: serverTimestamp()
      });

      // Show marker on map summarizing their vision profile beautifully
      const summaryParts = [];
      if (answers[1]) summaryParts.push(`Leeftijd: ${answers[1]}`);
      if (answers[3]) summaryParts.push(`Woonplaats: ${answers[3]}`);
      if (answers[13]) summaryParts.push(`Sfeer: ${answers[13]}`);
      if (answers[21]) summaryParts.push(`Parkeren: ${answers[21]}`);
      
      const markerText = `Gebiedsatelier ingevuld: ${summaryParts.join(" • ")}`;
      
      await handleAddMarker({
        author: userName || "Buurtenquête Deelnemer",
        role: role,
        text: markerText,
        category: "Overig",
        x: Math.round(30 + Math.random() * 40),
        y: Math.round(25 + Math.random() * 45),
      });
    } catch (e) {
      console.error("Fout in handleSaveGebiedsatelierResponse:", e);
      throw e;
    }
  };

  // 5. Select active project and transit back and forth
  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setViewMode("project");
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#F4F6F5] text-slate-800 font-sans antialiased selection:bg-emerald-100 flex flex-col justify-between" id="applet-root">
      
      {/* Top Main Brand Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm px-4 md:px-8 py-3.5 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-extrabold shadow-md shadow-emerald-950/10 pointer-events-none">
            <Compass className="w-6 h-6 rotate-45 text-emerald-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-slate-900 text-lg tracking-tight leading-none">Samen360</h1>
              <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                Omgevingswet NL
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Samen bouwen aan de leefomgeving van morgen</p>
          </div>
        </div>

        {/* Global Administrative controls */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Back to National Portal button */}
          {viewMode === "project" && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setViewMode("portal");
                  if (role !== "Admin") {
                    setConstructionMode(false);
                  }
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-250 text-emerald-800 rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs"
                id="back-to-portal-button"
              >
                <Compass className="w-4 h-4 rotate-45 text-emerald-600" />
                <span>🗺️ Dashboard</span>
              </button>

              {role === "Admin" && (
                <button
                  onClick={() => setConstructionMode(!constructionMode)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all relative cursor-pointer ${
                    constructionMode
                      ? "bg-amber-500 text-stone-950 border-2 border-amber-500 shadow-md animate-pulse"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200 border border-stone-200"
                  }`}
                  id="mode-toggle-element"
                  title="Schakel tussen de participatiewebsite en de bouw-app conform vergunningsstatus"
                >
                  <AlertOctagon className="w-4 h-4" />
                  <span>{constructionMode ? "Hinder Bouwapp-Mode Aan" : "Verander naar Bouwapp"}</span>
                </button>
              )}
            </div>
          )}
          
          {/* Role Login Select Dropdown in the top header */}
          {!isLoggedIn ? (
            <div className="flex items-center gap-2" id="header-role-login-container">
              <span className="text-[10px] uppercase font-black tracking-wider text-stone-500 hidden sm:inline">
                Aanmelden als:
              </span>
              <select
                value=""
                onChange={(e) => {
                  const val = e.target.value as UserRole;
                  if (val === "Admin") {
                    handleAdminAuthCheckAndSet();
                  } else if (val) {
                    setRole(val);
                    setUserName(
                      val === "Gemeente"
                        ? "Stadsarchitect Utrecht"
                        : val === "Projectontwikkelaar"
                        ? "Ontwikkelaar Combinatie West"
                        : val === "Bewoner"
                        ? "Utrechtse Burger"
                        : `${val} Partner`
                    );
                    setIsLoggedIn(true);
                    setAdminAuthError(null);
                  }
                }}
                className="bg-[#f4f3ff] border border-[#ddd6fe] text-xs text-[#2e1065] font-black focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-2xl px-4 py-2.5 cursor-pointer shadow-xs transition active:scale-95"
                id="header-role-login-select"
              >
                <option value="" disabled>--- Kies een rol om in te loggen ---</option>
                <option value="Admin">🛡️ beheerder / admin (Google Auth)</option>
                <option value="Bewoner">🙋 burger / bewoner</option>
                <option value="Ondernemer">💼 ondernemer</option>
                <option value="Bezoeker">🚴 bezoeker / geïnteresseerde</option>
                <option value="Gemeente">🏛️ stakeholder / overheid</option>
                <option value="Adviseur">📈 adviseur derden</option>
                <option value="Projectontwikkelaar">🏗️ projectontwikkelaar</option>
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-2" id="header-user-status-pill">
              <div className="flex flex-col text-left px-5 py-2 bg-[#f4f3ff] border border-[#ddd6fe] rounded-2xl">
                <span className="text-[9px] text-purple-500/95 font-bold uppercase tracking-wider leading-none mb-1">
                  INGELOGD ALS ROL
                </span>
                <span className="text-xs text-[#2e1065] font-black capitalize">
                  {getRoleLabel(role)}
                </span>
              </div>
              <button
                onClick={() => {
                  if (role === "Admin") firebaseLogout();
                  setIsLoggedIn(false);
                }}
                className="w-10 h-10 flex items-center justify-center bg-[#f4f3ff] text-purple-700 hover:bg-[#eae6ff] hover:text-purple-800 rounded-2xl border border-[#ddd6fe] cursor-pointer transition active:scale-95 shadow-xs"
                title="Uitloggen"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>
          )}

        </div>
      </header>

      {/* Main content body */}
      <main className="flex-grow p-4 md:p-8 max-w-7xl w-full mx-auto flex flex-col gap-8">

        {/* Admin Auth Error Banner */}
        {adminAuthError && (
          <div className="w-full animate-in fade-in slide-in-from-top-5 duration-200" id="admin-auth-error-banner">
            <div className="bg-red-50 border border-red-200 text-red-950 px-5 py-4 rounded-3xl flex items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="text-xl">⚠️</span>
                <div className="text-xs font-semibold leading-relaxed">
                  <span className="font-extrabold block text-red-700">Toegang Geweigerd</span>
                  {adminAuthError}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAdminAuthError(null)}
                className="text-red-500 hover:text-red-800 font-extrabold text-[11px] bg-red-100/60 hover:bg-red-100 px-3 py-1.5 rounded-xl cursor-pointer transition"
              >
                Sluiten
              </button>
            </div>
          </div>
        )}

        {viewMode === "portal" ? (
          <NationalPortal 
            onSelectProject={handleSelectProject} 
            selectedRole={role}
            onRoleChange={(val) => {
              if (val === "Admin") {
                if (currentUser?.email === "vosqdevelopment@gmail.com") {
                  setRole("Admin");
                  setUserName(currentUser.displayName || "Beheerder");
                  setIsLoggedIn(true);
                  setAdminAuthError(null);
                } else {
                  handleAdminAuthCheckAndSet();
                }
              } else {
                setRole(val);
                setUserName(
                  val === "Gemeente"
                    ? "Stadsarchitect Utrecht"
                    : val === "Projectontwikkelaar"
                    ? "Ontwikkelaar Combinatie West"
                    : val === "Bewoner"
                    ? "Utrechtse Burger"
                    : `${val} Partner`
                );
                setIsLoggedIn(true);
                setAdminAuthError(null);
              }
            }}
            isLoggedIn={isLoggedIn}
            setIsLoggedIn={setIsLoggedIn}
            projects={mappedNationalProjects}
            onAddProject={handleAddProject}
            onDeleteProject={handleDeleteProject}
            onUpdateProject={handleUpdateProject}
          />
        ) : (
          <>
            {/* HOME INTRODUCTORY HERO SECTION (Homepagina Project) */}
            {!constructionMode && (
          <section className="bg-white rounded-3xl border border-stone-200/80 overflow-hidden shadow-xs flex flex-col lg:flex-row relative transition duration-300 pointer-events-auto" id="project-hero-banner">
            
            {/* Visual background pattern */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

            {/* Banner Photo placeholder */}
            <div className="lg:w-[480px] h-64 lg:h-auto relative shrink-0">
              <img
                src={currentProject.bgImage}
                alt={currentProject.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/35 to-transparent"></div>

              {/* Dynamic Project website link overlay */}
              <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-2">
                {selectedProject?.websiteUrl && (
                  <a
                    href={selectedProject.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 bg-white/95 hover:bg-white text-slate-900 rounded-2xl text-[11px] font-extrabold flex items-center gap-1.5 shadow-lg backdrop-blur-xs transition active:scale-95 cursor-pointer no-underline group"
                    title="Bezoek de officiële projectenwebsite"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                    <span>Website Project</span>
                  </a>
                )}
                {role === "Admin" && (
                  <button
                    type="button"
                    onClick={async () => {
                      const currentUrl = selectedProject?.websiteUrl || "";
                      const nextUrl = prompt(`Voer de website URL in voor project ${selectedProject?.name || ""}:`, currentUrl);
                      if (nextUrl !== null) {
                        await handleUpdateProject(selectedProjectId, { websiteUrl: nextUrl.trim() });
                      }
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[11px] font-extrabold flex items-center gap-1.5 shadow-lg transition active:scale-95 border-none cursor-pointer"
                    title="Projectwebsite link bewerken (Admin)"
                    id="btn-add-edit-homepage-website"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="inline text-white"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" /></svg>
                    <span>{selectedProject?.websiteUrl ? "Wijzig Link" : "Link Toevoegen"}</span>
                  </button>
                )}
              </div>
              
              <div className="absolute bottom-5 left-5 text-white">
                <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-600 text-emerald-100 px-2.5 py-1 rounded-full">
                  {currentProject.city}
                </span>
                <h2 className="font-black text-lg md:text-xl mt-2 tracking-tight">{currentProject.name}</h2>
                <p className="text-[11px] text-emerald-100 font-medium">{currentProject.subtitle}</p>
              </div>
            </div>

            {/* Quick KPIs & Status details */}
            <div className="p-6 md:p-8 flex-grow flex flex-col justify-between gap-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] text-emerald-800 font-extrabold uppercase tracking-wide block">Huidige status:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 block animate-pulse"></span>
                    <strong className="text-sm text-stone-900">Participatieronde Open ({currentProject.activePhase})</strong>
                  </div>
                </div>

                {/* Score badge */}
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl shrink-0">
                  <Trophy className="w-5 h-5 text-emerald-600" />
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block leading-none">Participatiescore</span>
                    <strong className="text-emerald-905 font-black text-sm block mt-1">
                      {selectedProjectId === "hierdenbuiten" ? "88 / 100" : "80 / 100"}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Bento quick briefs list */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-600 font-semibold">
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Deelnemers</span>
                  <strong className="text-slate-900 text-sm block mt-0.5">{stats.participants}</strong>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Unieke Bezoeken</span>
                  <strong className="text-slate-900 text-sm block mt-0.5">{stats.uniqueViews}</strong>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Planfase</span>
                  <strong className="text-slate-900 text-sm block mt-0.5">Actief ({currentProject.activePhase})</strong>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Draagvlakindex</span>
                  <strong className="text-slate-900 text-sm block mt-0.5">{stats.supportIndex}%</strong>
                </div>
              </div>

              {/* Action buttons CTA */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border-t border-stone-100 pt-4 mt-1">
                <p className="text-xs text-stone-500 leading-relaxed max-w-md">
                  Rapportage verloopt volledig transparant. Klik hieronder om mee te praten of geef uw wensen door via de digitale plankaart.
                </p>
                <button
                  onClick={() => {
                    setActiveTab("dashboard");
                    // Scroll to map
                    document.getElementById("kaart-dashboard")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-md shadow-emerald-950/15 cursor-pointer pointer-events-auto"
                >
                  <span>Denk Mee & Plaats Pin</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </section>
        )}

        {/* BRIDGED SUB-APP: If Construction Mode is TRUE, render construction interface completely */}
        {constructionMode ? (
          <div className="animate-in fade-in zoom-in-95 duration-400" id="bouwapp-mode-wrapper">
            <ConstructionApp 
              markers={markers}
              onAddMarker={handleAddMarker}
              onLikeMarker={handleLikeMarker}
              selectedRole={role}
              userName={userName}
            />
          </div>
        ) : (
          /* OTHERWISE: RENDER STANDARD CIVIC PARTICIPATION TAB MODULES */
          <div className="flex flex-col gap-6" id="participatiewerk-mode-wrapper">
            
            {/* Modular Tab navigation bar */}
            <div className="bg-white border-b border-slate-200 rounded-2xl p-1.5 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar shrink-0 select-none shadow-sm sticky top-16 md:top-20 z-45">
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer pointer-events-auto ${
                    activeTab === "dashboard"
                      ? "bg-emerald-600 text-white"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                  id="tab-dashboard"
                >
                  <Compass className="w-4 h-4" />
                  <span>Plankaart & KPI's</span>
                </button>

                {role === "Admin" && (
                  <button
                    onClick={() => setActiveTab("coach")}
                    className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer pointer-events-auto ${
                      activeTab === "coach"
                        ? "bg-emerald-600 text-white"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                    id="tab-coach"
                  >
                    <Cpu className="w-4 h-4" />
                    <span>AI Coach Chat</span>
                  </button>
                )}

                <button
                  onClick={() => setActiveTab("ideas")}
                  className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer pointer-events-auto ${
                    activeTab === "ideas"
                      ? "bg-emerald-600 text-white"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                  id="tab-ideas"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Buurt-Ideeën</span>
                </button>

                <button
                  onClick={() => setActiveTab("survey")}
                  className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer pointer-events-auto ${
                    activeTab === "survey"
                      ? "bg-emerald-600 text-white"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                  id="tab-survey"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Enquêtes & Informatie</span>
                </button>

                <button
                  onClick={() => setActiveTab("monitor")}
                  className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer pointer-events-auto ${
                    activeTab === "monitor"
                      ? "bg-emerald-600 text-white"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                  id="tab-monitor"
                >
                  <Activity className="w-4 h-4" />
                  <span>Participatiemonitor</span>
                </button>

                {role === "Admin" && (
                  <button
                    onClick={() => setActiveTab("lab")}
                    className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer pointer-events-auto ${
                      activeTab === "lab"
                        ? "bg-emerald-600 text-white"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                    id="tab-lab"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>AI Publicatie Lab</span>
                  </button>
                )}

                <button
                  onClick={() => setActiveTab("news")}
                  className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer pointer-events-auto ${
                    activeTab === "news"
                      ? "bg-emerald-600 text-white"
                      : "text-slate-600 hover:bg-slate-50 animate-pulse"
                  }`}
                  id="tab-news"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Nieuwscentrum</span>
                </button>
              </div>

              {/* Small state counter */}
              <div className="hidden md:flex items-center gap-1 text-[11px] font-bold text-stone-500 bg-stone-50 border border-stone-150 rounded px-2.5 py-1 shrink-0 mr-1 select-none">
                <span>Plankaart reacties:</span>
                <span className="text-emerald-800 font-extrabold font-mono">{filteredMarkers.length}</span>
              </div>
            </div>

            {/* VIEWPORT 1: Plankaart & KPI Dashboard */}
            {activeTab === "dashboard" && (
              <div className="flex flex-col gap-8 animate-in fade-in duration-300">
                {/* Visual layout - Full width Interactive Map */}
                <div className="w-full flex flex-col gap-4">
                  <InteractiveMap
                    projectId={selectedProjectId}
                    projectLat={selectedProject?.lat || 52.0907}
                    projectLng={selectedProject?.lng || 5.1214}
                    projectPolygon={selectedProject?.polygon || ""}
                    markers={filteredMarkers}
                    onAddMarker={handleAddMarker}
                    onLikeMarker={handleLikeMarker}
                    onDeleteMarker={handleDeleteMarker}
                    selectedRole={role}
                    userName={userName}
                  />
                </div>
              </div>
            )}

            {/* VIEWPORT 7: Enquêtes & Informatie */}
            {activeTab === "survey" && (
              <div className="animate-in fade-in duration-300 max-w-6xl mx-auto w-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                  
                  {/* LINKERKOLOM: Interactief Buurtonderzoek (Quick-stellingen) */}
                  <div className="w-full bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-md flex flex-col justify-between text-left" id="ai-survey-box">
                    <div className="border-b border-slate-150 pb-3 mb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 mb-1.5">
                          <Sparkles className="w-4 h-4 animate-pulse" />
                          <span>Halen van Informatie</span>
                        </div>
                        {role === "Admin" && (
                          <button
                            type="button"
                            onClick={() => setIsEditingSurveyQs(!isEditingSurveyQs)}
                            className="bg-amber-100 hover:bg-amber-200 text-amber-800 font-extrabold text-[10px] px-2.5 py-1 rounded-lg transition shrink-0"
                          >
                            {isEditingSurveyQs ? "Stellingen Bekijken" : "⚙️ Stellingen bewerken"}
                          </button>
                        )}
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-base">
                        {isEditingSurveyQs ? "Edit Enquêtevragen" : "Interactief Buurtonderzoek"}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        {isEditingSurveyQs 
                          ? "Pas als beheerder de vragen van de participatie-enquête aan voor dit specifieke project."
                          : "Beantwoord de stellingen om in real-time invloed uit te oefenen op de KPI-cijfers en draagvlakindex."}
                      </p>
                    </div>

                    {isEditingSurveyQs ? (
                      <div className="flex flex-col gap-4 flex-grow animate-in fade-in duration-200 text-left">
                        {/* Predefined Templates (Sjablonen) Picker from PDF */}
                        <div className="bg-amber-50/30 border border-amber-200 p-3 rounded-2xl">
                          <label className="text-[10px] font-extrabold text-amber-900 block mb-2 uppercase tracking-wide">
                            📋 Kies een standaardsjabloon (Enquête formats):
                          </label>
                          <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                            {SURVEY_TEMPLATES.map((tpl) => (
                              <button
                                key={tpl.id}
                                type="button"
                                onClick={() => {
                                  setEditSurveyQuestions([...tpl.questions]);
                                }}
                                className="w-full text-left text-[11px] font-bold p-2.5 rounded-xl border border-stone-200 bg-white hover:border-emerald-600 hover:bg-emerald-50/20 active:scale-99 transition flex items-center justify-between group cursor-pointer shadow-2xs"
                              >
                                <span className="truncate pr-2 text-stone-800 font-extrabold">{tpl.title}</span>
                                <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-100 font-extrabold shrink-0 group-hover:bg-emerald-100">
                                  {tpl.questions.length} stellingen
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Editable questions section */}
                        <div className="space-y-3.5 flex-grow max-h-[300px] overflow-y-auto pr-1">
                          <div className="flex justify-between items-center pb-1 border-b border-stone-100">
                            <span className="text-[10px] font-extrabold text-stone-500 uppercase tracking-wide">
                              Enquêtevragen ({editSurveyQuestions.length} stellingen)
                            </span>
                            <button
                              type="button"
                              onClick={() => setEditSurveyQuestions([...editSurveyQuestions, ""])}
                              className="text-[10px] text-emerald-800 hover:text-emerald-950 font-bold bg-emerald-100/60 hover:bg-emerald-100 px-2.5 py-1 rounded-xl transition cursor-pointer"
                            >
                              + Stelling toevoegen
                            </button>
                          </div>

                          {editSurveyQuestions.map((qText, idx) => (
                            <div key={idx} className="bg-white border border-stone-200 p-3 rounded-xl space-y-1.5 relative shadow-2xs">
                              <div className="flex justify-between items-center">
                                <label className="text-[9px] font-bold text-stone-400 uppercase">Stelling {idx + 1}</label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditSurveyQuestions(editSurveyQuestions.filter((_, i) => i !== idx));
                                  }}
                                  className="text-[9px] text-rose-500 hover:text-rose-700 font-extrabold"
                                >
                                  Verwijder
                                </button>
                              </div>
                              <textarea
                                value={qText}
                                onChange={(e) => {
                                  const updated = [...editSurveyQuestions];
                                  updated[idx] = e.target.value;
                                  setEditSurveyQuestions(updated);
                                }}
                                rows={2}
                                placeholder="Typ hier de participatie-stelling..."
                                className="w-full bg-stone-50/20 border border-stone-200 rounded-lg p-2 text-xs text-stone-850 font-semibold focus:outline-emerald-850 focus:bg-white"
                              />
                            </div>
                          ))}

                          {editSurveyQuestions.length === 0 && (
                            <p className="text-center text-xs text-stone-400 py-6">Geen stellingen ingesteld. Kies hierboven een sjabloon of voeg stellingen handmatig toe.</p>
                          )}
                        </div>

                        <div className="flex gap-2.5 pt-3 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setIsEditingSurveyQs(false)}
                            className="flex-1 border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold text-xs py-2.5 rounded-xl transition cursor-pointer"
                          >
                            Annuleren
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const cleanQs = editSurveyQuestions.filter(q => q.trim() !== "");
                                if (cleanQs.length === 0) {
                                  alert("Voeg minimaal één stelling toe.");
                                  return;
                                }
                                await handleUpdateSurveyQuestions(selectedProjectId, cleanQs);
                                setIsEditingSurveyQs(false);
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                            className="flex-1 bg-emerald-850 hover:bg-emerald-950 text-white font-extrabold text-xs py-2.5 rounded-xl transition shadow-sm cursor-pointer"
                          >
                            Vragen Opslaan
                          </button>
                        </div>
                      </div>
                    ) : surveyFinished ? (
                      <div className="bg-emerald-50 border border-emerald-250 p-5 rounded-2xl text-center flex flex-col items-center justify-center gap-3 py-12 animate-in zoom-in-95 duration-300 flex-grow">
                        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 border-2 border-emerald-300">
                          <CheckCircle className="w-6 h-6" />
                        </div>
                        <div>
                          <h5 className="font-extrabold text-slate-900 text-sm">Geweldig! Inbreng Verwerkt</h5>
                          <p className="text-xs text-emerald-700 mt-1.5 leading-relaxed max-w-[280px] mx-auto">
                            Uw antwoorden zijn succesvol verwerkt. Het KPI-dashboard en de draagvlakindex zijn in real-time geactualiseerd!
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setSurveyFinished(false);
                            setSurveyStep(1);
                            setSurveyAnswers([]);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition mt-3"
                        >
                          Enquête herhalen
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4 flex-grow animate-in fade-in duration-300">
                        <form onSubmit={handleSurveySubmit} className="flex flex-col gap-4 flex-grow justify-between text-left">
                        {(() => {
                          const defaultQs = [
                            `Moet er meer budget naar groenvoorziening dan naar autoparkeerruimte in ${selectedProject?.name || "dit project"}?`,
                            "Maakt u zich zorgen over mogelijke geluidsoverlast van de nieuwe horecavoorzieningen?",
                            "Is een nieuwe veilige snelfietsverbinding gewenst voor de aansluiting met het stadscentrum?",
                            "Wilt u gebruik kunnen maken van gedeelde e-bakfietsen in de lokale mobiliteitshubs?"
                          ];
                          const currentQuestions = selectedProject?.surveyQuestions || defaultQs;
                          const totalQuestions = currentQuestions.length;
                          const currentQuestionIndex = surveyStep - 1;
                          const currentQuestionText = currentQuestions[currentQuestionIndex];
                          const currentAnswer = surveyAnswers[currentQuestionIndex] || null;

                          if (totalQuestions === 0) {
                            return (
                              <p className="text-xs text-stone-500 py-6 text-center">Er zijn geen stellingen geconfigureerd voor dit omgevingsonderzoek.</p>
                            );
                          }

                          return (
                            <div className="space-y-4 flex-grow animate-in fade-in duration-200">
                              <div>
                                <span className="text-[10px] uppercase font-bold text-stone-400">
                                  Vraag {surveyStep} van {totalQuestions}
                                </span>
                                <h5 className="font-extrabold text-stone-850 text-xs md:text-sm mt-1 leading-snug">
                                  {currentQuestionText}
                                </h5>
                                <div className="grid grid-cols-3 gap-2.5 mt-4">
                                  {[
                                    { value: "Ja", label: "Ja", color: "border-emerald-500 bg-emerald-50/45 text-emerald-800" },
                                    { value: "Nee", label: "Nee", color: "border-rose-500 bg-rose-50/45 text-rose-800" },
                                    { value: "Geen mening", label: "Geen mening", color: "border-stone-400 bg-stone-55 text-stone-700" }
                                  ].map((opt) => (
                                    <button
                                      key={opt.value}
                                      type="button"
                                      onClick={() => {
                                        const updatedAnswers = [...surveyAnswers];
                                        updatedAnswers[currentQuestionIndex] = opt.value as any;
                                        setSurveyAnswers(updatedAnswers);

                                        if (surveyStep < totalQuestions) {
                                          setTimeout(() => setSurveyStep(prev => prev + 1), 220);
                                        }
                                      }}
                                      className={`border p-3.5 rounded-xl flex flex-col items-center justify-center gap-1 transition text-xs font-bold ring-offset-1 shrink-0 ${
                                        currentAnswer === opt.value
                                          ? `${opt.color} ring-2 ring-emerald-600/50`
                                          : "border-stone-200 hover:bg-stone-50 text-stone-600 bg-white"
                                      }`}
                                    >
                                      <span>{opt.label}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="flex justify-between items-center pt-2">
                                {surveyStep > 1 ? (
                                  <button
                                    type="button"
                                    onClick={() => setSurveyStep(prev => prev - 1)}
                                    className="text-stone-500 font-semibold text-xs py-2 hover:underline cursor-pointer"
                                  >
                                    Terug
                                  </button>
                                ) : (
                                  <div />
                                )}

                                {surveyStep < totalQuestions ? (
                                  <button
                                    type="button"
                                    disabled={!currentAnswer}
                                    onClick={() => setSurveyStep(prev => prev + 1)}
                                    className={`font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1 shrink-0 ${
                                      currentAnswer
                                        ? "bg-emerald-800 hover:bg-emerald-950 text-white cursor-pointer shadow-sm"
                                        : "bg-stone-100 text-stone-400 cursor-not-allowed"
                                    }`}
                                  >
                                    <span>Volgende</span>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <button
                                    type="submit"
                                    disabled={submittingSurvey || !currentAnswer}
                                    className={`font-extrabold text-xs px-4.5 py-2.5 rounded-xl transition shadow-md flex items-center gap-1 shrink-0 ${
                                      currentAnswer
                                        ? "bg-emerald-800 hover:bg-emerald-950 text-white cursor-pointer"
                                        : "bg-stone-100 text-stone-400 cursor-not-allowed"
                                    }`}
                                  >
                                    {submittingSurvey ? (
                                      <>
                                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                        <span>Verwerken...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Sparkles className="w-3.5 h-3.5" />
                                        <span>Enquête Insturen</span>
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </form>
                      </div>
                    )}
                  </div>

                  {/* RECHTERKOLOM: Uitgebreid Gebiedsatelier */}
                  <div className="w-full bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-md flex flex-col justify-between text-left relative overflow-hidden h-full" id="gebiet-survey-card">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-emerald-100 rounded-full blur-3xl opacity-40 pointer-events-none"></div>
                    
                    <div className="flex-1 flex flex-col justify-between gap-5">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                            <Sparkles className="w-4 h-4 animate-pulse" />
                            <span>Beeldbank-enquête</span>
                          </div>
                          {role === "Admin" && (
                            <span className="text-[9px] bg-amber-100 text-amber-800 font-extrabold px-2 py-0.5 rounded border border-amber-200">
                              Beheerderspaneel
                            </span>
                          )}
                        </div>

                        <h4 className="font-extrabold text-slate-900 text-base mb-2">
                          Uitgebreid Gebiedsatelier
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed mb-6">
                          Ontdek en geef uw mening over de visuele sfeerkaarten van dit project. Geef direct feedback op verschillende thema&apos;s zoals landschap, architectuurstijl, groen-waterverhouding en parkeerconcepten.
                        </p>

                        <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl space-y-3.5 mb-6">
                          <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">
                            Inbegrepen thema&apos;s:
                          </span>
                          <div className="grid grid-cols-2 gap-3 text-[11px] font-bold text-slate-700">
                            <div className="flex items-center gap-1.5">
                              <span className="text-emerald-600">🌳</span> Groen &amp; Water
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-emerald-600">🏡</span> Bebouwingsstijl
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-emerald-600">✨</span> Omgevingssfeer
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-emerald-600">🚗</span> Mobiliteit &amp; Parkeren
                            </div>
                          </div>
                        </div>

                        {role === "Admin" && (
                          <div className="bg-amber-50/40 border border-amber-200/60 p-4 rounded-2xl mb-6">
                            <div className="flex items-center justify-between">
                              <div className="flex flex-col text-left">
                                <span className="text-xs font-black text-slate-900">Status voor bewoners:</span>
                                <span className="text-[10px] font-bold text-amber-800/80 mt-0.5">
                                  {isGebiedsatelierEnabled ? "🟢 Actief & Zichtbaar" : "🔴 Gedeactiveerd"}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={async () => {
                                  await handleUpdateProject(selectedProjectId, {
                                    isGebiedsatelierEnabled: !isGebiedsatelierEnabled
                                  });
                                }}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                  isGebiedsatelierEnabled ? "bg-emerald-600" : "bg-stone-300"
                                }`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                    isGebiedsatelierEnabled ? "translate-x-5" : "translate-x-0"
                                  }`}
                                />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-2">
                        {(isGebiedsatelierEnabled || role === "Admin") ? (
                          <button
                            type="button"
                            onClick={() => setIsGebiedsatelierOpen(true)}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm py-3.5 px-4 rounded-2xl transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-99 cursor-pointer pointer-events-auto"
                          >
                            <Sparkles className="w-4 h-4 animate-pulse" />
                            <span>
                              {isGebiedsatelierEnabled 
                                ? "Start Gebiedsatelier Enquête" 
                                : "Test Enquête (Admin Preview)"}
                            </span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        ) : (
                          <div className="bg-stone-50 border border-stone-200 p-4 rounded-2xl text-center text-xs text-stone-500 font-bold">
                            ⚠️ Deze beeldbank-enquête is momenteel gedeactiveerd door de beheerder.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* VIEWPORT 2: AI Participatiecoach Chat */}
            {activeTab === "coach" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
                
                {/* AI Chat workspace on left */}
                <div className="lg:col-span-2">
                  <AICoach onTaskLogged={handleTaskLoggedByCoach} selectedRole={role} />
                </div>

                {/* Live Planner task logs triggered n.a.v. citizen inquiries */}
                <div className="bg-white rounded-3xl border border-stone-200/80 p-5 shadow-sm flex flex-col justify-between" id="planner-board-sidebar">
                  <div>
                    <h4 className="font-bold text-stone-900 text-sm md:text-base flex items-center gap-2 pb-3 border-b border-stone-100">
                      <Bookmark className="w-4.5 h-4.5 text-stone-600" />
                      <span>Plannings-taak register</span>
                    </h4>
                    <p className="text-[11px] text-stone-500 mt-2">
                      Automatisch gegenereerde openstaande opvolgpunten wanneer de AI-Coach burger-vragen over detailbehoeften detecteert die nog niet in het beleid staan.
                    </p>

                    {/* Task cards rows */}
                    <div className="space-y-3 mt-4 max-h-[360px] overflow-y-auto no-scrollbar pr-1">
                      {tasks.map((task) => (
                        <div key={task.id} className="bg-stone-50 border border-stone-200 p-3.5 rounded-xl flex flex-col gap-2">
                          <div className="flex justify-between items-center text-[9px] font-bold">
                            <span className="text-emerald-800 uppercase tracking-wider bg-emerald-50 px-1.5 py-0.5 rounded">
                              Bron: {task.source}
                            </span>
                            <span className="text-stone-400">{task.date}</span>
                          </div>

                          <h5 className="font-extrabold text-[11px] text-stone-850 leading-snug">
                            {task.title}
                          </h5>

                          <div className="flex justify-between items-center text-[10px] pt-1 border-t border-stone-150 text-stone-500">
                            <span>Toegewezen: <strong>{task.assignedTo}</strong></span>
                            <span className="text-amber-800 font-extrabold uppercase tracking-wide bg-amber-100/65 px-1.5 py-0.5 rounded">
                              {task.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 text-[10px] text-stone-450 leading-relaxed font-semibold">
                    📍 De taken worden gesynchroniseerd met de wekelijkse stedenbouwkundige planning B&W Utrecht West.
                  </div>
                </div>

              </div>
            )}

            {/* VIEWPORT 3: Buurt-Ideeën */}
            {activeTab === "ideas" && (
              <div className="animate-in fade-in duration-300">
                <IdeaBoard
                  ideas={filteredIdeas.map((i) => ({ ...i, userVoted: userVotes[i.id] || null }))}
                  onAddIdea={handleAddIdea}
                  onVoteIdea={handleVoteIdea}
                  onDeleteIdea={handleDeleteIdea}
                  selectedRole={role}
                  userName={userName}
                />
              </div>
            )}

            {/* VIEWPORT 4: Participatiemonitor */}
            {activeTab === "monitor" && (
              <div className="flex flex-col gap-8 animate-in fade-in duration-300">
                
                {/* Visual splits stats row at top */}
                <div>
                  <DashboardStats 
                    stats={stats} 
                    markers={filteredMarkers} 
                    ideas={filteredIdeas} 
                    city={currentProject.city || "Utrecht"} 
                    projectName={currentProject.name} 
                    projectId={selectedProjectId}
                    role={role}
                    surveyResponses={surveyResponses.filter(r => r.projectId === selectedProjectId)}
                    surveyQuestions={selectedProject?.surveyQuestions || [
                      `Moet er meer budget naar groenvoorziening dan naar autoparkeerruimte in ${selectedProject?.name || "dit project"}?`,
                      "Maakt u zich zorgen over mogelijke geluidsoverlast van de nieuwe horecavoorzieningen?",
                      "Is een nieuwe veilige snelfietsverbinding gewenst voor de aansluiting met het stadscentrum?",
                      "Wilt u gebruik kunnen maken van gedeelde e-bakfietsen in de lokale mobiliteitshubs?"
                    ]}
                  />
                </div>

                {/* Stakeholder Matrix overview */}
                {role === "Admin" && (
                  <div>
                    <StakeholderMatrix 
                      projectName={currentProject.name} 
                      city={currentProject.city || "Utrecht"} 
                      markers={filteredMarkers} 
                      ideas={filteredIdeas} 
                      selectedRole={role}
                    />
                  </div>
                )}
              </div>
            )}

            {/* VIEWPORT 5: AI Publicatie Lab */}
            {activeTab === "lab" && (
              <div className="flex flex-col gap-8 animate-in fade-in duration-300">
                
                {/* One click report generator */}
                <div>
                  <ReportGenerator 
                    selectedRole={role}
                    onPublishPublication={handleCreateNewsArticle}
                    projectId={selectedProjectId}
                    projectName={selectedProject?.name || "dit project"}
                    surveyResponses={surveyResponses.filter(r => r.projectId === selectedProjectId)}
                    ideas={filteredIdeas}
                    markers={filteredMarkers}
                  />
                </div>

                {/* zoning decision audits list */}
                <div>
                  <DecisionRegister decisions={decisions} />
                </div>
              </div>
            )}

            {/* VIEWPORT 6: Nieuwscentrum */}
            {activeTab === "news" && (
              <div className="animate-in fade-in duration-300">
                <NieuwsCentrum 
                  news={news} 
                  selectedRole={role}
                  onCreateNewsArticle={handleCreateNewsArticle}
                  onDeleteNewsArticle={handleDeleteNewsArticle}
                />
              </div>
            )}

            {/* INTERACTIVE TIMELINE BLOCK AT THE BOTTOM */}
            {activeTab !== "monitor" && activeTab !== "ideas" && (
              <section className="mt-8">
                <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/40 p-4 rounded-3xl border border-stone-200/50">
                  <h4 className="font-bold text-stone-850 text-sm md:text-base flex items-center gap-2">
                    <Bookmark className="w-4.5 h-4.5 text-emerald-800" />
                    <span>Stappenplan Gebiedsontwikkeling {selectedProject?.name}</span>
                  </h4>
                  
                  {role === "Admin" && (
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200/80 rounded-2xl px-3.5 py-2 shrink-0 shadow-xs" id="admin-phase-control-container">
                      <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider">
                        🛡️ Beheerder: Wijzig Actieve Projectfase
                      </span>
                      <select
                        value={selectedProject?.phaseNumber || 3}
                        onChange={(e) => {
                          const num = Number(e.target.value);
                          handleUpdateProjectPhase(selectedProjectId, num);
                        }}
                        className="bg-white border border-amber-300 rounded-xl px-3 py-1 text-xs font-bold text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer pointer-events-auto shadow-xs"
                        id="admin-stappenplan-phase-select"
                      >
                        {INITIAL_PHASES.map(p => (
                          <option key={p.id} value={p.id}>
                            Fase {p.id}: {p.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <TimelineView
                  phases={INITIAL_PHASES.map(p => {
                    const pNum = Number(p.id);
                    const activeNum = Number(selectedProject?.phaseNumber || 3);
                    return {
                      ...p,
                      active: pNum === activeNum,
                      completed: pNum < activeNum
                    };
                  })}
                  decisions={decisions}
                  activePhaseId={activePhaseId}
                  onPhaseSelect={(id) => setActivePhaseId(id)}
                  role={role}
                  projectId={selectedProjectId}
                  publications={publications}
                  onAddPublication={(pub) => handleCreatePublication(pub)}
                  onDeletePublication={(id) => handleDeletePublication(id)}
                  onAddDecision={(dec) => handleCreateDecision(dec)}
                  onUpdateDecision={(id, fields) => handleUpdateDecision(id, fields)}
                  onDeleteDecision={(id) => handleDeleteDecision(id)}
                />
              </section>
            )}

          </div>
        )}

          </>
        )}

      </main>

      {/* Polish footer bar */}
      <footer className="bg-white border-t border-stone-200 mt-12 py-6 px-4 md:px-8 text-center text-xs text-stone-500 z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© 2026 Samen360  | © VOVON development B.V.</p>
          <div className="flex gap-4 font-bold text-emerald-850">
            <a href="#privacy" className="hover:underline">Privacy & Cookies</a>
            <a href="#omgevingswet-dashboard-info" className="hover:underline">Omgevingswet Toelichting</a>
            <a href="#contact" className="hover:underline">Gemeenteloket</a>
          </div>
        </div>
      </footer>

      {isGebiedsatelierOpen && (
        <GebiedsatelierSurvey
          isOpen={isGebiedsatelierOpen}
          onClose={() => setIsGebiedsatelierOpen(false)}
          projectId={selectedProjectId}
          projectName={selectedProject?.name || "dit project"}
          userName={userName}
          selectedRole={role}
          onSaveResponse={handleSaveGebiedsatelierResponse}
        />
      )}

    </div>
  );
}
