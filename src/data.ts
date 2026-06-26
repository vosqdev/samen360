import { ProjectPhase, MapMarker, Idea, Decision, NewsArticle, Task, Stakeholder } from "./types";

export const INITIAL_PHASES: ProjectPhase[] = [
  {
    id: "1",
    name: "idee",
    label: "Idee",
    active: false,
    completed: true,
    description: "Eerste initiële plannen voor het omvormen van het verouderde industrieterrein naar een bruisende, duurzame stadswijk.",
    date: "Januari 2024",
    decisionsCount: 2
  },
  {
    id: "2",
    name: "verkenning",
    label: "Verkenning",
    active: false,
    completed: true,
    description: "Ruimtelijke, financiële en milieutechnische haalbaarheidsonderzoeken. Afstemming met de Provincie Utrecht en het Waterschap.",
    date: "September 2024",
    decisionsCount: 3
  },
  {
    id: "3",
    name: "participatie",
    label: "Participatie",
    active: true,
    completed: false,
    description: "Samenwerking met buurtbewoners en ondernemers conform de Omgevingswet. Inbreng van ideeën en zorgen over inrichting.",
    date: "Nu Actief (Juni 2026)",
    decisionsCount: 1
  },
  {
    id: "4",
    name: "conceptvisie",
    label: "Conceptvisie",
    active: false,
    completed: false,
    description: "Het opstellen van de concept-gebiedsvisie op basis van alle participatierapporten en beleidsadviezen.",
    date: "Oktober 2026",
    decisionsCount: 0
  },
  {
    id: "5",
    name: "schetsontwerp",
    label: "Schetsontwerp",
    active: false,
    completed: false,
    description: "Eerste driedimensionale schetsontwerpen en indelingen van de openbare ruimte, binnentuinen en bebouwing.",
    date: "Medio 2027",
    decisionsCount: 0
  },
  {
    id: "6",
    name: "definitief-ontwerp",
    label: "Definitief Ontwerp",
    active: false,
    completed: false,
    description: "Gedetailleerd stedenbouwkundig plan, inclusief exacte stratenblokken, watergangen en parkeertekeningen.",
    date: "Eind 2027",
    decisionsCount: 0
  },
  {
    id: "7",
    name: "vergunning",
    label: "Vergunning",
    active: false,
    completed: false,
    description: "Publieke terinzagelegging en toetsing door de Omgevingsdienst Utrecht. Indienen formele omgevingsvergunning.",
    date: "Voorjaar 2028",
    decisionsCount: 0
  },
  {
    id: "8",
    name: "bouw",
    label: "Bouw",
    active: false,
    completed: false,
    description: "De transformatie naar een bouw-omgeving. Start herinrichting grond, bouw van de 750 woningen en parkeerhubs.",
    date: "Medio 2028",
    decisionsCount: 0
  },
  {
    id: "9",
    name: "oplevering",
    label: "Oplevering",
    active: false,
    completed: false,
    description: "Feestelijke opening van het Havenpark en oplevering van de eerste duurzame gasloze woningen.",
    date: "Eind 2029",
    decisionsCount: 0
  }
];

export const INITIAL_MARKERS: MapMarker[] = [
  {
    id: "m1",
    author: "Jan-Willem de Rover",
    role: "Bewoner",
    text: "Ik maak me grote zorgen over het verdwijnen van parkeerplaatsen in de direct woonomgeving. De hub is 300 meter lopen van mijn voordeur, hoe moet dat als ik zware boodschappen bij me heb?",
    date: "2026-06-08",
    category: "Parkeren",
    sentiment: "negative",
    x: 48,
    y: 65,
    likes: 14
  },
  {
    id: "m2",
    author: "Sabine van Elst",
    role: "Bewoner",
    text: "Geweldig initiatief om 35% onverhard groen te eisen! Kunnen er alstublieft inheemse Utrechtse fruitbomen worden geplaatst in het centrale Havenpark? Dat helpt de insecten enorm.",
    date: "2026-06-09",
    category: "Groen",
    sentiment: "positive",
    x: 62,
    y: 35,
    likes: 29
  },
  {
    id: "m3",
    author: "Horecabedrijf Kade 12",
    role: "Ondernemer",
    text: "Het verlagen van de kades en het toevoegen van horecapunten is een droom voor ons. Let wel op de bevoorrading van de terrassen: als de wijk autovrij is, moeten er elektrische bolderkarren of laadzones komen.",
    date: "2026-06-10",
    category: "Werken",
    sentiment: "neutral",
    x: 35,
    y: 42,
    likes: 8
  },
  {
    id: "m4",
    author: "FietserUtrecht",
    role: "Bezoeker",
    text: "De oversteek naar het spoor langs de kade voelt momenteel levensgevaarlijk voor fietsers door gaten in het asfalt. Zorg bij de nieuwe herinrichting voor een fietspad dat fysiek gescheiden is van voetgangers.",
    date: "2026-06-11",
    category: "Verkeer",
    sentiment: "negative",
    x: 25,
    y: 78,
    likes: 42
  },
  {
    id: "m5",
    author: "Annelies de Bruijn",
    role: "Bewoner",
    text: "Zorg alsjeblieft voor veilige openbare verlichting rondom de parkeerhubs en steegjes. Als het donker is, moet de wijk ook sociaal veilig aanvoelen, vooral voor vrouwen en ouderen.",
    date: "2026-06-11",
    category: "Veiligheid",
    sentiment: "neutral",
    x: 52,
    y: 50,
    likes: 19
  },
  {
    id: "m6",
    author: "Milieuwerkgroep Utrecht",
    role: "Adviseur",
    text: "De WKO-installatie met collectieve zonnepanelen is een prachtig voorbeeld van hernieuwbare energie. Laten we extra checken of de daken van de parkeerhubs ook volledig benut kunnen worden voor extra PV-panelen.",
    date: "2026-06-05",
    category: "Energie",
    sentiment: "positive",
    x: 75,
    y: 20,
    likes: 12
  }
];

export const INITIAL_IDEAS: Idea[] = [
  {
    id: "i1",
    author: "Daan de Jong",
    role: "Bewoner",
    title: "Buurtmoestuin & Pluktuin 'De Kade'",
    text: "Een collectieve buurtmoestuin in de binnentuinen van de nieuwe woningen. Dit stimuleert sociale cohesie en geeft kinderen feeling met voedselverbouw. Er kan gereedschap gedeeld worden in een kleine gemeenschappelijke houten schuur.",
    date: "2026-06-05",
    category: "Groen",
    upvotes: 45,
    downvotes: 2,
    loves: 32,
    lightbulbs: 18,
    clusteredId: "c_groen_sociaal",
    clusteredTitle: "Sociale Groenvoorzieningen & Stadslandbouw"
  },
  {
    id: "i2",
    author: "Sophie Mulder",
    role: "Bewoner",
    title: "Waterparcours & Waterspeeltuin in het Havenpark",
    text: "Gezien de verlaagde kades en de waterberging in wadi's, is het een fantastisch idee om een veilige houten waterspeeltuin te maken in het centrale Havenpark. Met fysieke handpompen, sluisjes en boomstammen kunnen kinderen kennismaken met waterbeheer.",
    date: "2026-06-07",
    category: "Speelruimte",
    upvotes: 56,
    downvotes: 1,
    loves: 41,
    lightbulbs: 12,
    clusteredId: "c_water_creactief",
    clusteredTitle: "Waterbeleving & Natuurlijke Speelruimte"
  },
  {
    id: "i3",
    author: "Arthur L.",
    role: "Ondernemer",
    title: "Kano- en Kajaksteiger met deelfaciliteit",
    text: "Laat bewoners en bezoekers gebruikmaken van de historische grachten en havenarmen. Een kleine drijvende houten steiger waar via een app dekkajaks en kano's ontgrendeld kunnen worden om de Utrechtse singels op te gaan.",
    date: "2026-06-09",
    category: "Water",
    upvotes: 38,
    downvotes: 4,
    loves: 22,
    lightbulbs: 15,
    clusteredId: "c_water_creactief",
    clusteredTitle: "Waterbeleving & Natuurlijke Speelruimte"
  },
  {
    id: "i4",
    author: "Marit Kroon",
    role: "Ondernemer",
    title: "Elektrische bakfietspool in de Parkeerhubs",
    text: "Omdat auto's niet in de straat mogen parkeren, is de overstap vanaf de parkeerhub cruciaal. Laten we zorgen dat er in de entree-hubs een vloot van 20 elektrische cargofietsen / bakfietsen staat. Bewoners kunnen deze 30 minuten gratis gebruiken voor transport.",
    date: "2026-06-11",
    category: "Parkeren",
    upvotes: 61,
    downvotes: 3,
    loves: 18,
    lightbulbs: 27,
    clusteredId: "c_mobiliteit_hubs",
    clusteredTitle: "Duurzame Deelmobiliteit & Hub-Inrichting"
  },
  {
    id: "i5",
    author: "Stichting Erfgoed Spoor",
    role: "Adviseur",
    title: "Behouden en herbestemmen van de historische Havenkraan",
    text: "De oude kraan op de kade herinnert aan de overslaggeschiedenis. We stellen voor deze mechanische kraan te restaureren tot klim- of uitkijkplek bij de kadehoreca, in plaats van hem te slopen.",
    date: "2026-06-03",
    category: "Wonen",
    upvotes: 52,
    downvotes: 0,
    loves: 30,
    lightbulbs: 22,
    clusteredId: "c_geschiedenis",
    clusteredTitle: "Behoud Industrieel Erfgoed"
  }
];

export const INITIAL_DECISIONS: Decision[] = [
  {
    id: "d1",
    title: "Omvormen Parkeren naar Randstedelijke Hubs",
    category: "Parkeren",
    decisionText: "Alle privaat parkeren voor de 750 nieuwe woningen wordt ondergebracht in twee overdekte, energie-coöperatieve hubs aan de wijkranden, in plaats van individuele parkeergarages of straatparkeren.",
    motivation: "Hiermee bewaren we een volledig autovrij binnengebied dat veilig is voor spelende kinderen en optimaal verharding tegengaat conform de klimaatdoelen Utrecht 2030.",
    underpinning: "Toetsing aan de Parkeernota Utrecht wees uit dat de parkeerdruk opgelost kan worden mits hoogwaardige deelmobiliteit aanwezig is. Dit bespaart tevens miljoenen aan ondergrondse infrastructurele graafkosten.",
    date: "2025-11-15",
    status: "Definitief",
    version: "v2.1",
    relatedParticipation: "67% van de omwonenden stond positief tegenover een autoluwe straat mits de hubs voorzien zijn van goede verlichting en elektrische bagagekarren.",
    documents: ["Parkeernota_HubDesign_Utrecht.pdf", "Milieueffect_Rapport_Emissies.pdf"]
  },
  {
    id: "d2",
    title: "Percentage Sociale Huurbouw vastgesteld op 40%",
    category: "Wonen",
    decisionText: "Aanpassing van het woningbouwprogramma. Van de 750 woningen worden er 300 (40%) gerealiseerd als sociale huurwoningen beheerd door woningcorporatie Bo-Ex.",
    motivation: "Gezien de dringende schaarste op de woningmarkt in Utrecht en de afspraken binnen het Convenant Betaalbaar Wonen.",
    underpinning: "Economische doorberekening toont aan dat door de hogere dichtheid langs de spoorlijn de exploitatiewaarde stabiel blijft ondanks het grotere aandeel gereguleerde huur.",
    date: "2026-02-10",
    status: "Definitief",
    version: "v1.4",
    relatedParticipation: "Reacties uit de buurt wezen op het belang van gemengde wijken; starters en gezinnen krijgen nu voorrang.",
    documents: ["BoEx_Samenwerkingsovereenkomst_Signed.pdf", "Woningbouwprogramma_Havenkwartier.pdf"]
  },
  {
    id: "d3",
    title: "Spoorweg-geluidsscherm ontworpen als Groene Begroeide Wal",
    category: "Geluid",
    decisionText: "Het geluidsscherm langs de spoorzone wordt een aarden geluidwal van 4 meter hoog, begroeid met inheemse struiken en klimop, in plaats van een harde glazen of betonnen wand.",
    motivation: "Dit absorbeert geluid in plaats van het te reflecteren, draagt bij aan vogelnestplaatsen, verbetert de luchtkwaliteit van de Spoorzone en voorkomt graffiti.",
    underpinning: "Toegelicht door geluidstechnisch adviesbureau Peutz. Absorptievermogen stijgt met 4dB ten opzichte van reflecterende glaselementen.",
    date: "2026-05-18",
    status: "Ontwerp",
    version: "v0.9 (Ter inzage)",
    relatedParticipation: "Grote bezorgdheid van omwonenden over het esthetisch aanzicht en de spoorvogelstand leidde tot dit groene alternatief.",
    documents: ["AkoestischOnderzoek_SpoorGeluid.pdf", "FloraFaunaScans_Spoorzone.pdf"]
  }
];

export const INITIAL_NEWS: NewsArticle[] = [
  {
    id: "n1",
    title: "Participatiefase Spoorzone Havenkwartier officieel van start!",
    summary: "Vanaf vandaag kunnen alle burgers hun stem laten horen. Denk mee over bomen, parkeerhubs, de natuurspeeltuinen en mobiliteit.",
    content: "De gemeente Utrecht nodigt alle belanghebbenden uit om deel te nemen aan de digitale co-creatie van de Spoorzone Havenkwartier. Met deze website willen we een open dialoog faciliteren. Of u nu bewoner, ondernemer of gewoon geïnteresseerd bent: via de digitale kaart kunt u markers plaatsen, suggesties indienen, of chatten met onze AI-participatiecoach om direct te horen hoe plannen met beleid samenhangen. Uw feedback wordt via de participatie-monitor samengevat voor het college van B&W.",
    date: "2026-06-01",
    category: "Algemeen",
    image: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=600&auto=format&fit=crop",
    readTime: "3 min leestijd",
    documents: ["Participatiegids_Omgevingswet2026.pdf", "Inspraakprocedure_Spoorzone.pdf"],
    views: 342
  },
  {
    id: "n2",
    title: "Flora en fauna onderzoek: Spoorzone is hotspot voor dwergvleermuis",
    summary: "Uitgebreide ecologische scans laten zien dat de oude spoorpanden een belangrijke foerageerroute vormen. Groenwal wordt aangepast.",
    content: "Uit de recent uitgevoerde ecologische scans ten behoeve van de Milieueffectrapportage (MER) is gebleken dat de gewone dwergvleermuis actief jaagt langs de spoorlijn. Het ontwerpteam heeft het verlichtingsplan hier direct op aangepast: er zal gewerkt worden met vleermuisvriendelijke Amberkleurige LED-verlichting die de vliegroutes niet verstoort. Daarnaast worden er vleermuiskasten geïntegreerd in de spoor-geluidswal.",
    date: "2026-06-06",
    category: "Duurzaamheid",
    image: "https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=600&auto=format&fit=crop",
    readTime: "5 min leestijd",
    documents: ["Ecologische_Rapportage_Vleermuizen.pdf"],
    views: 189
  },
  {
    id: "n3",
    title: "Informatiebijeenkomst op 25 juni in 'De Helling'",
    summary: "Kom persoonlijk praten met de stadsarchitecten en projectontwikkelaars. Onze AI coach is daar ook via de grote demo-schermen aanwezig.",
    content: "Wilt u liever fysiek de plannen bekijken? Op donderdagavond 25 juni bent u vanaf 19:30 van harte welkom in het historische kadegebouw 'De Helling'. Hier vallen de 3D-maquettes te bekijken. Ook leggen we de resultaten van de online verzamelde ideeën voor. Er is vrije inloop, koffie en thee staan klaar.",
    date: "2026-06-10",
    category: "Evenementen",
    image: "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=600&auto=format&fit=crop",
    readTime: "2 min leestijd",
    documents: ["Uitnodiging_Bijeenkomst_25Juni.pdf"],
    views: 254
  }
];

export const INITIAL_STAKEHOLDERS: Stakeholder[] = [
  {
    id: "st1",
    name: "Gemeente Utrecht",
    influence: 10,
    interest: 9,
    category: "Gemeente",
    strategy: "Sleutelfiguur - Nauw betrekken & besluitvormend partner",
    advice: "Houd de gemeentelijke stedenbouwkundigen dagelijks aangesloten. Zorg voor sluitende dossiers conform de Utrechtse parkeernormen en de Omgevingswet."
  },
  {
    id: "st2",
    name: "Omwonenden Spoorzone West",
    influence: 7,
    interest: 10,
    category: "Omwonenden",
    strategy: "Samenwerking - Actief consulteren, informeren & co-creëren",
    advice: "De grootste groep met directe hinderzorgen. Focus op communicatie over parkeerhubs en geluid. Geef snelle terugkoppeling op online geplaatste markers."
  },
  {
    id: "st3",
    name: "Horecaunie Haven-Ondernemers",
    influence: 6,
    interest: 8,
    category: "Ondernemers",
    strategy: "Tevreden houden - Facilitaire wensen inpassen",
    advice: "Belangrijk voor levendigheid overdag en 's avonds. Communiceer helder over laad- en loszones en bereikbaarheid tijdens de bouwfase."
  },
  {
    id: "st4",
    name: "Milieudefensie Utrecht-Oost",
    influence: 5,
    interest: 9,
    category: "Natuurorganisaties",
    strategy: "Betrekken - Dialoog houden over groenwal & hittestress",
    advice: "Cruciale bondgenoot voor klimaatadaptatie. Deel realtime de MER-rapportages en ecologische vleermuisscans."
  },
  {
    id: "st5",
    name: "Hoogheemraadschap Stichtse Rijnlanden",
    influence: 8,
    interest: 8,
    category: "Waterschap",
    strategy: "Sleutelfiguur - Technische medewerking over kadeverlaging",
    advice: "Essentieel voor de vergunbaarheid van kadeverlagingen en wadi-capaciteit. Plan tweewekelijkse technische expert-sessies."
  },
  {
    id: "st6",
    name: "Provincie Utrecht",
    influence: 8,
    interest: 6,
    category: "Provincie",
    strategy: "Monitoren & Tevreden houden - Toetsen aan de POV",
    advice: "De provincie let met name op de woningbouwaantallen en mobiliteitsafstemmingen rond het spoor netwerk."
  },
  {
    id: "st7",
    name: "Netbeheerder Stedin",
    influence: 9,
    interest: 7,
    category: "Netbeheerder",
    strategy: "Nauw betrekken - Garanderen netcapaciteit WKO",
    advice: "Van wezenlijk belang wegens de netcongestie in Utrecht. Bespreek vroegtijdig de stroomcapaciteit voor de collectieve warmtepompen."
  }
];

export const INITIAL_TASKS: Task[] = [
  {
    id: "t1",
    title: "Uitzoeken laadpalencapaciteit in Hub A voor zware e-bakfietsen",
    status: "In Behandeling",
    source: "AI Coach",
    date: "2026-06-11",
    assignedTo: "Stedin & Mobiliteitsteam",
    reporter: "Burger-vraag n.a.v. grootschalig deelmobiliteits-idee"
  },
  {
    id: "t2",
    title: "Ontwerp buurtoverleg pluktuinen & beheerovereenkomst Bo-Ex",
    status: "Open",
    source: "Moderator",
    date: "2026-06-10",
    assignedTo: "Sociale Regisseur",
    reporter: "Gekoppeld aan top-idee Buurtmoestuin De Kade"
  },
  {
    id: "t3",
    title: "Geluidsabsorptietest begroeide wal Peutz afronden",
    status: "Voltooid",
    source: "Wegwerk",
    date: "2026-06-02",
    assignedTo: "Akoestisch Deskundige",
    reporter: "Besluitenregister"
  }
];

export interface SurveyTemplate {
  id: string;
  title: string;
  questions: string[];
}

export const SURVEY_TEMPLATES: SurveyTemplate[] = [
  {
    id: "draagvlak",
    title: "Enquête 1 – Algemeen draagvlak initiatief",
    questions: [
      "Ik vind het positief dat deze locatie wordt ontwikkeld.",
      "Ik vind dat de ontwikkeling past bij de omgeving.",
      "Ik zie meer voordelen dan nadelen van dit plan.",
      "Ik vind dat de gemeente ruimte moet bieden aan dit initiatief.",
      "Ik vindt het goed dat er na gedacht over herontwikkelen van dit gebied.",
      "Ik verwacht dat dit plan de leefbaarheid kan verbeteren."
    ]
  },
  {
    id: "wonen",
    title: "Enquête 2 – Wonen en leefomgeving",
    questions: [
      "Er is behoefte aan extra woningen in deze omgeving.",
      "Ik vind groen belangrijker dan extra bebouwing.",
      "Het plan moet voldoende ruimte bieden voor natuur en water.",
      "Het toevoegen van speel- en ontmoetingsplekken is belangrijk.",
      "Er moeten ook voorzieningen komen zoals apotheek, BSO, huisarts."
    ]
  },
  {
    id: "mobiliteit",
    title: "Enquête 3 – Mobiliteit en energie",
    questions: [
      "Ik vind voldoende parkeergelegenheid belangrijk.",
      "Ik ondersteun het aanleggen van laadvoorzieningen voor elektrische auto’s.",
      "Ik vind dat duurzame energie onderdeel moet zijn van deze ontwikkeling.",
      "Ik verwacht dat de verkeersveiligheid voldoende gewaarborgd kan worden.",
      "Ik sta positief tegenover innovatieve energieoplossingen zoals buurtbatterijen of een lokaal energiesysteem."
    ]
  },
  {
    id: "participatie",
    title: "Enquête 4 – Participatie en communicatie",
    questions: [
      "Ik voel mij voldoende geïnformeerd over het project.",
      "Ik vind het belangrijk dat bewoners vroeg worden betrokken bij plannen.",
      "Ik heb vertrouwen dat mijn mening serieus wordt meegenomen.",
      "Ik vind digitale participatie (website of app) een goede manier om mee te denken.",
      "Ik zou bij een volgende participatieronde opnieuw willen deelnemen."
    ]
  },
  {
    id: "stedenbouw",
    title: "Enquête 5 – Stedenbouwkundig Plan (De inrichting van de wijk)",
    questions: [
      "Ik vind de opzet van het stedenbouwkundig plan overzichtelijk.",
      "Het plan biedt voldoende ruimte voor groen en natuur.",
      "De voorgestelde wegen en fietsroutes lijken veilig en logisch.",
      "Ik vind dat voldoende aandacht is besteed aan waterberging en klimaatadaptatie.",
      "De openbare ruimte nodigt uit om elkaar te ontmoeten.",
      "Ik vindt dat de wijk goed aansluit op de bestaande omgeving.",
      "Er is voldoende parkeergelegenheid aanwezig.",
      "Ik ondersteun een autoluwe inrichting van de wijk.",
      "Ik vind dat het plan voldoende ruimte biedt voor wandelen en fietsen.",
      "Op basis van het stedenbouwkundig plan ben ik positief over de toekomstige wijk."
    ]
  },
  {
    id: "woningen",
    title: "Enquête 6 – Ontwerp Woningen (Architectuur en uitstraling)",
    questions: [
      "Ik vind de architectuur van de woningen aantrekkelijk.",
      "De woningen passen qua uitstraling bij de omgeving.",
      "Ik vind de voorgestelde bouwhoogtes passend.",
      "Het gebruik van duurzame materialen spreekt mij aan.",
      "De variatie in woningtypen draagt bij aan een aantrekkelijke buurt.",
      "Ik vind dat voldoende aandacht is besteed aan privacy tussen woningen.",
      "De woningen zijn toekomstbestendig en energiezuinig ontworpen.",
      "De overgang tussen privéterrein en openbare ruimte is goed vormgegeven.",
      "Ik verwacht dat deze woningen een positieve bijdrage leveren aan de kwaliteit van de buurt.",
      "Ik zou dit woningontwerp ondersteunen als onderdeel van de gebiedsontwikkeling."
    ]
  }
];
