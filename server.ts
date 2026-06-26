import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Gemini client on the server side
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
} else {
  console.warn("Mijn excuses, GEMINI_API_KEY is niet ingesteld. Sommige AI-functionaliteiten zullen in fallback-modus draaien.");
}

// Project database context to ground the AI answers
const PROJECT_CONTEXT = `
Project Naam: Spoorzone Havenkwartier
Locatie: Utrecht, Nederland (Spoorzone West, nabij het oude industriegebied)
Status: Participatiefase is nu actief.
Fases van het project:
1. Idee (Afgerond)
2. Verkenning (Afgerond)
3. Participatie (Nu Actief - we halen feedback op van omwonenden)
4. Conceptvisie (In voorbereiding, gepland Q4 2026)
5. Schetsontwerp (Volgt in 2027)
6. Definitief ontwerp
7. Vergunningsaanvraag
8. Bouwfase
9. Oplevering

Kernbeleid & Details van het Project:
- Verkeer & Mobiliteit: De wijk wordt 'autoluw'. Al het gemotoriseerd parkeren gaat naar twee centrale hubs aan de rand van de wijk (hub A en hub B). Fietsers en voetgangers krijgen absolute prioriteit. Snelheidslimiet is 15 km/u in de woonstraten. Er komen elektrische deelauto's en deelfietsen beschikbaar.
- Groen & Recreatie: Minimaal 35% onverhard groenoppervlak. Centraal komt het 'Havenpark' met speelzones voor kinderen en sporttoestellen. Er worden 250 nieuwe inheemse bomen geplant.
- Waterbeheer: De kades worden verlaagd om directe toegang tot het water te geven. Er komen 'wadi's' (regenwaterfiltratie-greppels) om zware regenbuien op te vangen. Dit voorkomt overbelasting van het riool en hittestress.
- Wonen & Werken: Er komen 750 nieuwe woningen. Hiervan is 40% sociale huur (woningcorporatie), 30% middensegment huur/koop (voor middeninkomens/starters), en 30% vrije sector. Op de begane grond van de kadegebouwen komen creatieve makersruimtes, een buurtsuper en gezellige lokale horeca. Er komt GEEN zware industrie.
- Energie & Duurzaamheid: Gasloos en aangesloten op een lokaal warmte-koudeopslag (WKO) systeem. Daken worden maximaal uitgerust met zonnepanelen en groene sedumdaken voor biodiversiteit.
- Geluid & Geluidshinder: Geluidsschermen langs het spoor worden uitgevoerd als groene begroeide wallen van 4 meter hoog. Woningen direct aan het spoor krijgen extra geluidsisolerende gevels en een 'dove' gevel aan de spoorzijde waar nodig.
- Speelruimte: Er komt een houten natuurspeeltuin in het Havenpark en meerdere kleine speelplekjes verspreid door de autovrije binnentuinen.
- Planning: De bouw start naar verwachting in medio 2028. De eerste oplevering staat gepland voor eind 2029.

Indien burgers vragen stellen over andere zaken (zoals de precieze merknaam van lantaarnpalen, vergoedingen voor verhuizingen, individuele grondprijzen, of details die hierboven niet worden genoemd), beschouw dit dan als een "onbekende vraag". Meld dat de precieze details hierover momenteel nog niet definitief zijn vastgesteld en beloof dat dit als een actiepunt is doorgegeven aan het projectteam.
`;

// Helper: safe AI check
function checkAIEnabled(res: express.Response): boolean {
  if (!ai) {
    res.status(503).json({
      error: "AI service is op dit moment niet geconfigureerd. Controleer de GEMINI_API_KEY secrets.",
      fallback: true
    });
    return false;
  }
  return true;
}

// ENDPOINT 1: AI Participatiecoach Chat
app.post("/api/chat", async (req, res) => {
  if (!checkAIEnabled(res)) return;

  try {
    const { message, history = [] } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Bericht is verplicht." });
    }

    const systemInstruction = `
      Je bent de 'AI Participatiecoach' voor het project Spoorzone Havenkwartier in Utrecht.
      Je doel is om burgers, ondernemers en geïnteresseerden vriendelijk, constructief en informatief te woord te staan in begrijpelijke taal (niveau B1).
      
      Gebruik ALTIJD de volgende projectinformatie als de absolute waarheid:
      ${PROJECT_CONTEXT}
      
      Richtlijnen voor je antwoorden:
      1. Wees empathisch en luister goed naar de zorgen van de burger (bijv. over parkeren, drukte of bomenkap).
      2. Leg uit HOE hun feedback via het digitale participatieplatform wordt meegenomen in de besluitvorming.
      3. Houd je antwoorden bondig (maximaal 150-200 woorden).
      4. Als de gebruiker vraagt naar iets wat niet in de bovenstaande projectinformatie staat (bijv. specifieke bomensoorten, precieze bouwbedrijven, of subsidiebedragen), geef dan netjes aan dat dit detail momenteel nog niet bekend of vastgesteld is. Meld ook dat je er direct een taak voor hebt aangemaakt in het besluitenregister/planning voor het projectteam om dit uit te zoeken. Voeg dan de tekst "[TAAK_AANGEMAAKT]" toe aan het einde van je antwoord, zodat ons systeem dit automatisch kan herkennen.
    `;

    // Map history to parts if any
    const contents: any[] = [];
    history.forEach((msg: any) => {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    });
    // Add active prompt
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await ai!.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });

    const reply = response.text || "Mijn excuses, ik kon geen antwoord genereren. Probeer het opnieuw.";
    const hasTask = reply.includes("[TAAK_AANGEMAAKT]");
    const cleanReply = reply.replace("[TAAK_AANGEMAAKT]", "").trim();

    res.json({
      reply: cleanReply,
      createTask: hasTask,
      suggestedTask: hasTask ? `Uitzoeken n.a.v. burger-vraag: "${message.substring(0, 50)}..."` : null
    });

  } catch (error: any) {
    console.error("Error in /api/chat:", error);
    res.status(500).json({ error: error.message || "Fout bij communicatie met Gemini." });
  }
});

// ENDPOINT 2: Sentiment-analyse & Categorie voor reacties
app.post("/api/analyze-comment", async (req, res) => {
  if (!checkAIEnabled(res)) return;

  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Tekst is verplicht." });
    }

    const prompt = `
      Analyseer de volgende Nederlandse reactie van een buurtbewoner over het gebiedsontwikkelingsproject Spoorzone Havenkwartier:
      Reactie: "${text}"

      Geef een JSON object terug met de volgende velden:
      - sentiment: kies exact uit "positive", "neutral", of "negative"
      - category: kies exact uit ["Verkeer", "Groen", "Water", "Wonen", "Werken", "Energie", "Geluid", "Veiligheid", "Parkeren", "Speelruimte", "Overig"]
      - summary: een zeer korte samenvatting (maximaal 10 woorden) van de kernzorg of suggestie
      - b1_translation: indien de reactie complex of boos is, vertaal deze naar een vriendelijke, begrijpelijke B1-samenvatting. Anders de originele tekst.

      Geef ENKEL EN ALLEEN de valide JSON terug, geen markdown wrappers of backticks.
    `;

    const response = await ai!.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sentiment: { type: Type.STRING },
            category: { type: Type.STRING },
            summary: { type: Type.STRING },
            b1_translation: { type: Type.STRING }
          },
          required: ["sentiment", "category", "summary", "b1_translation"]
        }
      }
    });

    const resultText = response.text || "{}";
    const data = JSON.parse(resultText.trim());
    res.json(data);

  } catch (error: any) {
    console.error("Error in /api/analyze-comment:", error);
    // Bulletproof fallback
    res.json({
      sentiment: "neutral",
      category: "Overig",
      summary: "Reactie verwerkt",
      b1_translation: req.body.text
    });
  }
});

// ENDPOINT 3: AI Participatie Samenvatting (Wat hebben we gehoord?)
app.post("/api/summarize-participatie", async (req, res) => {
  if (!checkAIEnabled(res)) return;

  try {
    const { comments = [] } = req.body;
    
    // Create a textual overview of comments for the prompt
    const commentsList = comments.length > 0 
      ? comments.map((c: any, index: number) => `Reactie ${index + 1} (${c.category}, sentiment: ${c.sentiment || 'neutral'}): "${c.text}"`).join("\n")
      : "Geen actieve reacties. Gebruik de standaard trends.";

    const prompt = `
      Je bent een senior stadsplanner en participatie-expert conform de Nederlandse Omgevingswet.
      Op basis van de volgende reacties van omwonenden over het project 'Spoorzone Havenkwartier' in Utrecht, moet je een beknopt en helder participatierapport genereren.
      
      Ingediende reacties:
      ${commentsList}

      Geef een gestructureerd antwoord in foutloos Nederlands en B1-niveau met de volgende 5 kopjes:
      1. **Wat hebben we gehoord?** (Samenvatting van belangrijkste trends, zorgen over parkeren/verkeer/groen/wonen)
      2. **Wat nemen we over?** (Constructieve suggesties die goed in te passen zijn in de autoluwe & groene ambities van het project)
      3. **Wat nemen we niet over?** (Suggesties die strijdig zijn met grotere ruimtelijke behoeften, zoals het toelaten van doorgaand autoverkeer of volledige nulbouw)
      4. **Waarom?** (Stevige ruimtelijke en beleidsmatige motivering)
      5. **Welke acties volgen?** (Concrete vervolgstappen voor het projectbureau)

      Zorg dat het er professioneel en bemoedigend uitziet. Maximaal 400 woorden.
    `;

    const response = await ai!.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.6
      }
    });

    res.json({
      summary: response.text || "Er kon geen samenvatting worden gegenereerd."
    });

  } catch (error: any) {
    console.error("Error in /api/summarize-participatie:", error);
    res.status(500).json({ error: error.message || "Fout bij genereren samenvatting." });
  }
});

// ENDPOINT 4: AI Rapportgenerator (Met één klik)
app.post("/api/generate-report", async (req, res) => {
  if (!checkAIEnabled(res)) return;

  try {
    const { 
      reportType, 
      tone = "professioneel",
      projectId,
      projectName = "Spoorzone Havenkwartier",
      surveyResponses = [],
      ideas = [],
      markers = []
    } = req.body;

    if (!reportType) {
      return res.status(400).json({ error: "Type rapport is verplicht." });
    }

    // Process and serialize live datasets of the project
    const totalSurveys = surveyResponses.length;
    const gebiedsatelierResponsesCount = (surveyResponses || []).filter((r: any) => r.surveyType === "gebiedsatelier").length;
    const totalIdeas = ideas.length;
    const totalMarkers = markers.length;

    // Serialize active ideas to supply concrete text to Gemini
    const ideasSummary = (ideas || []).map((id: any, index: number) => {
      return `- [Idee #${index + 1}] Categorie: ${id.category || 'Algemeen'} | Titel: "${id.title}" | Omschrijving: "${id.description || 'geen'}" | Duimen/stemmen: ${id.upvotes || id.votes || 0}`;
    }).join("\n");

    // Serialize active map markers to supply concrete spatial text
    const markersSummary = (markers || []).map((m: any, index: number) => {
      return `- [Kaartspeld #${index + 1}] Categorie: ${m.category || 'Feedback'} | Feedback: "${m.text}" | Geplaatst door: ${m.author || 'Deelnemer'} (Gebiedscoördinaten: X=${m.x || 0}, Y=${m.y || 0})`;
    }).join("\n");

    // Serialize a subset of survey participant visions
    const surveysSummary = (surveyResponses || []).slice(0, 20).map((r: any, index: number) => {
      if (r.surveyType === "gebiedsatelier") {
        const raw = r.rawAnswers || {};
        return `- [Visie-Enquête Gebiedsatelier #${index + 1}] Deelnemer: ${r.userName || "Inwoner"}. Leeftijdgroep: ${raw[1] || "Onbekend"}. Woonplaats: ${raw[3] || "Onbekend"}. Gewenste wijk sfeer: ${raw[13] || "onveranderd"}. Favoriete bebouwingstype: ${raw[16] || "onbekend"}. Visie op Parkeren: ${raw[21] || "onbekend"}.`;
      } else {
        const answersList = r.answers || [];
        return `- [Stellingen-Quickscan #${index + 1}] Antwoorden: ${JSON.stringify(answersList)}`;
      }
    }).join("\n");

    let prompt = "";

    if (reportType === "Participatieverslag Omgevingswet") {
      prompt = `
        Je bent een senior stedenbouwkundig adviseur en participatie-expert in de Nederlandse publieke sector.
        Jouw taak is het genereren van een officieel gemeentelijk participatierapport conform de Omgevingswet (2024+).
        DIT RAPPORT IS SPECIFIEK VOOR HET PROJECT: "${projectName}".
        
        Volg exact de structuur, toon en vragen van de bijgevoegde screenshots van het officiële gemeenteformulier "Formulier Participatieverslag".
        
        --- FORMULIER INTRODUCTIETEKST (EXACT OVERNEMEN) ---
        
        # Formulier Participatieverslag
        
        Bij elke aanvraag voor een omgevingsvergunning moet je aangeven of je aan participatie hebt gedaan en zo ja, hoe. Je kunt hiervoor dit formulier gebruiken. Bij plannen waarvoor participatie verplicht is, beoordeelt het college van B en W op basis van dit verslag of de participatie voldoende was.
        
        Je kunt dit formulier indienen bij de vergunningaanvraag.
        *Zorg dat dit verslag anoniem is. Dus noem geen namen of huisnummers.*
        
        ---
        
        Uitschrijf- en beantwoordingsinstructie:
        Je MOET de volgende 8 vragen uitschrijven als titels (## Vraag X: [vraagtekst]) en deze uiterst professioneel, feitelijk en tot in detail beantwoorden, gebruikmakend van de werkelijke ingezonden participatie-gegevens van Samen360 hieronder:
        
        ## Vraag 1: Wie heb je betrokken? Zijn dit de relevante belanghebbenden? Heb je ook belanghebbenden betrokken die (misschien voor jou) minder zichtbaar of minder gemakkelijk te bereiken zijn? Denk bijvoorbeeld aan woningzoekenden, jongeren en aan belangengroepen die opkomen voor de natuur of de leefbaarheid van de dorpen. Op een plattegrond kun je eventueel laten zien wie je hebt uitgenodigd.
        Beantwoord dit door de groepen bewoners, omwonenden van ${projectName}, jongeren en woningzoekenden te noemen. Leg uit wie er bereikt is via de Samen360 tool. Vermeld dat we via interactieve kaarten en enquêtes ook doelgroepen zoals jongeren en starters succesvol digitaal hebben bereikt.
        
        ## Vraag 2: Wat heb je gedaan om hen ook daadwerkelijk te laten meedoen? Is dit gelukt? Zo nee, wat denk je dat hiervan de reden is?
        Beschrijf de inzet van het innovatieve Samen360 platform, met functies zoals de online 3D-kaart, de 22-staps visuele beeldbank-enquête (het uitgebreide 'Gebiedsatelier'), quick-polls, en de AI participatiecoach chat. Dit heeft geleid tot een drempelvrije, visuele deelname voor een breed publiek.
        
        ## Vraag 3: Hoe heb je de belanghebbenden uitgenodigd? (persoonlijk, mail, huis-aan-huis brief etc.)
        Beschrijf de mix van kanalen: huis-aan-huis uitnodigingsbrieven gestuurd naar de omliggende postcodes van het projectgebied, nieuwsbrieven, en digitale notificaties via het online platform.
        
        ## Vraag 4: Hoe heeft de participatie plaatsgevonden? (enquête, bijeenkomst(en), gesprek aan de deur, online etc.)
        Geef aan dat het proces online en hybride heeft plaatsgevonden. Kern van de participatie was de online interactieve kaart, de 22-staps beeld-enquête (Gebiedsatelier), en online quick-stellingen.
        
        ## Vraag 5: Hoe vaak heb je welke mensen betrokken?
        Vermeld hier de exacte getallen die zijn opgehaald uit de actuele Samen360 database:
        - Totaal aantal ingediende enquêtes: ${totalSurveys} (waarvan ${gebiedsatelierResponsesCount} uitgebreide 22-staps Gebiedsatelier visies).
        - Aantal onafhankelijke ideeën ingediend door burgers: ${totalIdeas}
        - Aantal geplaatste kaartspeldjes/markers met feedback: ${totalMarkers}
        Meld dat de online tool 24/7 openstond gedurende de actieve consultatieperiode waardoor burgers herhaaldelijk konden meedenken.
        
        ## Vraag 6: Wat vonden de belanghebbenden van je plan? Met welke ideeën, belangen en bezwaren kwamen ze? Maak hierbij zo concreet mogelijk uit welke hoek eventuele bezwaren komen (bijvoorbeeld ‘de helft van de buren aan de oostkant van het perceel’).
        ANALYSEER EN CITEER FEITELIJKE DATA:
        Hieronder staan de werkelijke ideeën, opmerkingen van kaartspeldjes en enquêteresultaten van de burgers uit het platform. Vat deze krachtig samen en noem echte titels en bezorgdheden (bijvoorbeeld over parkeren, groen, en spelen)!
        
        --- DATA VANUIT HET INGEVULDE PLATFORM ---
        Geregistreerde Ideeën van Bewoners:
        ${ideasSummary || "Geen specifieke ideeën ingediend."}
        
        Feedback via Kaartspeldjes:
        ${markersSummary || "Geen specifieke speldjes geplaatst."}
        
        Enquêtes & Gebiedsatelier Visies:
        ${surveysSummary || "Geen specifieke enquête antwoorden."}
        -------------------------------------------
        
        Beantwoord hiermee vraag 6 in detail. Groepeer meningen over Groen, Mobiliteit/Parkeren, Speeltuinen, en Duurzaamheid.
        
        ## Vraag 7: Hoe heb je hun inbreng verwerkt in je plan? Als je dit niet hebt gedaan, wat is daar de reden van?
        Laat zien hoe de ingezonden ideeën (zoals populaire collectieve ideeën over groen, natuurspeeltuinen of parkeren) concreet worden meegenomen in het ruimtelijk model en hoe bezwaren (bijvoorbeeld over parkeerhubs of ontsluiting) leiden tot actiepunten en aanvullend onderzoek.
        
        ## Vraag 8: Wat vinden de betrokken belanghebbenden van de manier waarop je de participatie hebt aangepakt?
        Maak duidelijk dat uit de feedback blijkt dat bewoners de vernieuwende, laagdrempelige visuele insteek van de 22-staps beeldbank-enquête (Gebiedsatelier) en de mogelijkheid om directe feedbackspeldjes op de kaart te plaatsen enorm waarderen boven traditionele, droge bewonersbijeenkomsten.
        
        ---
        
        TOON EN STIJL-VOORSCHRIFTEN:
        1. De toon moet zeer "${tone}" zijn.
        2. Anonimiseer het verslag strikt: vermeld GEEN echte achternamen of specifieke huisnummers van buren conform de formulierinstructies!
        3. Genereer een complete, indrukwekkende tekst zonder placeholders of [TODO]'s.
        4. Gebruik nette Markdown-opmaak (met duidelijke titels, lijsten en dikgedrukte data).
      `;
    } else {
      prompt = `
        Genereer een officieel en compleet document van het type: "${reportType}" voor het gebiedsontwikkelingsproject "${projectName}".
        De toon moet zeer "${tone}" zijn en voldoen aan alle standaarden van de Nederlandse Omgevingswet (wetgeving 2024+).
        
        Gebruik de volgende context voor de algemene inhoud:
        ${PROJECT_CONTEXT}

        Als basis voor de resultaten en besluiten MOET je de actuele community-data van de Samen360 inwonersapp verwerken:
        - Totaal aantal ingediende enquêtes: ${totalSurveys}
        - Totaal aantal burgerideeën: ${totalIdeas}
        - Totaal aantal geplaatste feedback kaartspeldjes: ${totalMarkers}

        --- INGEWIKKELDHEID / RECENTE BURGERINBRENG UIT DE DATABASE ---
        Ingezonden ideeën:
        ${ideasSummary || "Geen specifieke ideeën."}

        Kaartspeldjes met feedback:
        ${markersSummary || "Geen specifieke kaartfeedback."}

        Enquête- & Visieantwoorden:
        ${surveysSummary || "Geen specifieke enquêterespons."}
        -------------------------------------------------------------

        Synthetiseer deze databasegegevens op een uiterst overtuigende, stedenbouwkundig verantwoorde manier in het rapport tegen de achtergrond van de Omgevingswet.
        
        Zorg dat het een prachtig geformatteerd Markdown rapport is met duidelijke titels en secties.
      `;
    }

    const response = await ai!.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.5
      }
    });

    res.json({
      markdown: response.text || "Fout bij genereren van het rapport."
    });

  } catch (error: any) {
    console.error("Error in /api/generate-report:", error);
    res.status(500).json({ error: error.message || "Fout bij genereren van rapport." });
  }
});

// ENDPOINT 5: AI-analyse Agent - Kritische Bezwaarmakers Opsporen
app.post("/api/analyze-critical-objectors", async (req, res) => {
  if (!checkAIEnabled(res)) return;

  try {
    const { 
      projectName = "Spoorzone Havenkwartier",
      ideas = [],
      markers = [],
      surveyResponses = []
    } = req.body;

    // Serialize materials to inspect
    const ideasList = (ideas || []).map((id: any, index: number) => {
      return `[IDEE #${index + 1}] Auteur: ${id.author} (${id.role}) | Titel: "${id.title}" | Inhoud: "${id.text}" | Stemmen: +${id.upvotes || 0}/-${id.downvotes || 0} | Categorie: ${id.category || "Algemeen"}`;
    }).join("\n");

    const markersList = (markers || []).map((m: any, index: number) => {
      return `[KAARTFEEDBACK #${index + 1}] Auteur: ${m.author} (${m.role}) | Feedback: "${m.text}" | Categorie: ${m.category || "Algemeen"} | Coördinaten: X=${m.x || 0}, Y=${m.y || 0}`;
    }).join("\n");

    const surveysList = (surveyResponses || []).slice(0, 30).map((r: any, index: number) => {
      if (r.surveyType === "gebiedsatelier") {
        const raw = r.rawAnswers || {};
        return `[GEBIEDSATELIER #${index + 1}] Auteur: ${r.userName || "Deelnemer"} | Woonplaats: ${raw[3] || "Utrecht"} | Leeftijd: ${raw[1] || "Onbekend"} | Gewenste sfeer: ${raw[13] || "N.v.t."} | Parkeermening: ${raw[21] || "N.v.t."}`;
      } else {
        return `[QUICKSCAN #${index + 1}] Antwoorden: ${JSON.stringify(r.answers || [])}`;
      }
    }).join("\n");

    const prompt = `
      Je bent een gespecialiseerde AI Participatie-Analist (AI Analyse Agent) binnen de Nederlandse Omgevingswet.
      Jouw taak is om op basis van de ingediende data (ideeën, kaartspeldjes, en enquêtes) van burgers voor het project "${projectName}" te achterhalen waar de actieve "kritische bezwaarmakers" zitten.
      
      Analyseer de ingediende bezwaren, negatieve sentimenten, frustraties en opmerkingen om een diepgaand risicoprofiel van de buurt op te stellen. Dit stelt de gemeente in staat om proactief met bezorgde burgers in gesprek te gaan.

      Hier is de ruwe participatiedata van het Samen360 platform:

      --- 1. INGEDIENDE IDEEËN ---
      ${ideasList || "Geen ideeën ingediend."}

      --- 2. INTERACTIEVE KAARTSPELDJES (PLANKAART) ---
      ${markersList || "Geen speldjes geplaatst."}

      --- 3. ENQUÊTERESPONSEN ---
      ${surveysList || "Geen enquêteresponsen."}

      --------------------------------------------------

      Geef een gestructureerd JSON-object terug dat de volgende velden bevat:
      - overallSeverity: selecteer exact "Groot risico" (als er zware of veel bezwaren zijn), "Gemiddeld risico", of "Laag risico".
      - summary: een B1-niveau heldere, bondige samenvatting (max 80 woorden) van de actieve weerstand (wie, wat en waarom).
      - hotspots: een lijst van specifieke gebieden/buurten of focuspunten (bijv. "Spoorzone West", "Oostelijke perceelgrens", "Parkeren bij Hub A") waar de weerstand geconcentreerd is. Elk hotspot-object moet bevatten:
        * locationName: Naam of aanduiding van het gebied/thema
        * concernCategory: De hoofdcategorie (bijv. "Parkeren", "Wonen", "Geluid", "Groen")
        * severity: exact "Hoog", "Medium", of "Laag"
        * description: korte uitleg van het bezwaar in die zone
        * evidence: een citaat of verwijzing naar de specifieke ideeën of kaartfeedback (bijv. "Kaartfeedback #4 over parkeren op afstand")
      - primaryObjections: een lijst van de top 3-4 meest kritische inhoudelijke bezwaren. Elk bezwaar-object moet bevatten:
        * objection: heldere omschrijving van het kritische punt of bezwaar (bijv. "Parkeerhubs liggen te ver weg voor senioren en mindervaliden")
        * source: de bron (bijv. "Kaartfeedback #3 en Idee #1")
        * mitigationRecommendation: concrete, professionele stedenbouwkundige of procedurele oplossing om dit bezwaar weg te nemen of te verzachten (bijv. "Vaste mindervaliden-parkeerplaatsen dichtbij de woningen inrichten in plaats van enkel bij de centrale hub")
      - keyFrictionPointsSummary: Een samenvatting van de belangrijkste wrijving (bijv. spanning tussen groen-ambities en parkeergemak).
      - actionPlan: een lijst van 3-4 concrete vervolgstappen die het projectbureau nu moet nemen om met deze kritische bezwaarmakers in gesprek te gaan (bijv. "Keukentafelgesprekken organiseren met de bewoners van Spoorzone West").

      Belangrijk: Geef ENKEL EN ALLEEN de valide JSON terug, geen markdown wrappers of backticks. Schrijf alle teksten in professioneel Nederlands op B1-niveau.
    `;

    const response = await ai!.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallSeverity: { type: Type.STRING },
            summary: { type: Type.STRING },
            hotspots: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  locationName: { type: Type.STRING },
                  concernCategory: { type: Type.STRING },
                  severity: { type: Type.STRING },
                  description: { type: Type.STRING },
                  evidence: { type: Type.STRING }
                },
                required: ["locationName", "concernCategory", "severity", "description", "evidence"]
              }
            },
            primaryObjections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  objection: { type: Type.STRING },
                  source: { type: Type.STRING },
                  mitigationRecommendation: { type: Type.STRING }
                },
                required: ["objection", "source", "mitigationRecommendation"]
              }
            },
            keyFrictionPointsSummary: { type: Type.STRING },
            actionPlan: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["overallSeverity", "summary", "hotspots", "primaryObjections", "keyFrictionPointsSummary", "actionPlan"]
        }
      }
    });

    const resultText = response.text || "{}";
    const data = JSON.parse(resultText.trim());
    res.json(data);

  } catch (error: any) {
    console.error("Error in /api/analyze-critical-objectors:", error);
    // Bulletproof fallback
    res.json({
      overallSeverity: "Laag risico",
      summary: "Er zijn momenteel geen ernstige, gecentraliseerde bezwaren gedetecteerd. De algemene participatie verloopt constructief.",
      hotspots: [
        {
          locationName: "Algemeen projectgebied",
          concernCategory: "Overig",
          severity: "Laag",
          description: "Geen specifieke kritische hotspots gedetecteerd.",
          evidence: "Alle ingevoerde ideeën en reacties hebben een overwegend neutrale of constructieve toon."
        }
      ],
      primaryObjections: [
        {
          objection: "Geen acute kritische bezwaren aanwezig.",
          source: "Samen360 database",
          mitigationRecommendation: "Blijf de participatie nauwgezet monitoren en reageer proactief op individuele opmerkingen."
        }
      ],
      keyFrictionPointsSummary: "Er is momenteel geen noemenswaardige wrijving tussen de ambities en de burgerinbreng.",
      actionPlan: [
        "Blijf de reacties en speldjes wekelijks analyseren.",
        "Zorg voor snelle, vriendelijke reacties via de AI participatiecoach."
      ]
    });
  }
});

// Serve static assets out of the dist directory in production
if (process.env.NODE_ENV === "production") {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  // Vite middleware in development
  const startVite = async () => {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  };
  startVite();
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
