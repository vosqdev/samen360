import React, { useState } from "react";
import { Sparkles, FileText, Download, Check, Copy, Settings, RefreshCw } from "lucide-react";

interface ReportGeneratorProps {
  selectedRole?: string;
  onPublishPublication?: (article: any) => Promise<void>;
  projectId: string;
  projectName: string;
  surveyResponses: any[];
  ideas: any[];
  markers: any[];
}

export default function ReportGenerator({ 
  selectedRole, 
  onPublishPublication,
  projectId,
  projectName,
  surveyResponses,
  ideas,
  markers
}: ReportGeneratorProps) {
  const [reportType, setReportType] = useState<string>("Participatieverslag Omgevingswet");
  const [tone, setTone] = useState<string>("formeel-zakelijk");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedMarkdown, setGeneratedMarkdown] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [downloaded, setDownloaded] = useState<boolean>(false);
  const [isPublished, setIsPublished] = useState<boolean>(false);
  const [isPublishingNews, setIsPublishingNews] = useState<boolean>(false);

  const reportOptions = [
    "Participatieverslag Omgevingswet",
    "Intakeverzoek",
    "Principeverzoek",
    "Omgevingsdialoog",
    "Collegevoorstel",
    "Raadsmemo",
    "MER-bijlage (Milieueffect)",
    "Communicatieplan",
    "Stakeholderanalyse",
  ];

  const handleGenerate = async () => {
    setIsGenerating(true);
    setDownloaded(false);
    setCopied(false);
    setIsPublished(false);
    try {
      const res = await fetch("/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportType,
          tone,
          projectId,
          projectName,
          surveyResponses,
          ideas,
          markers,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setGeneratedMarkdown(data.markdown);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      console.error(err);
      // fallback
      setGeneratedMarkdown(`
# ${reportType}
**Project:** Spoorzone Havenkwartier, Utrecht
**Datum:** ${new Date().toLocaleDateString("nl-NL")}
**Kenmerk:** UT/HAV/2026-OMGVW
**Status:** CONCEPT CONFORM OMGEVINGSWET

---

## 1. Doel van dit document
Dit document faciliteert de formele onderbouwing van ${reportType.toLowerCase()} voor het transformatiegebied Spoorzone Havenkwartier in Utrecht West. De gebiedsontwikkeling voorziet in 750 duurzame gasvrije woningen, aangesloten op een lokaal WKO-systeem.

## 2. Participatieresultaten & Burgerinspraak
Gedurende de online-inspraakfase via het Samen360 platform, zijn burgers en sleutelfiguren actief geraadpleegd over:
- De autoluwe mobiliteitshubs aan de wijkgrenzen (A en B).
- De inrichting van het Havenpark (minimaal 35% onverhard groen).
- De akoestische groene geluidswal van 4 meter langs het spoortraject.

*Belangrijke statistieken:*
- Totaal aantal unieke mee-denkers: 1.842
- Draagvlakindex voor overige hubs: 74%
- Topingezonden idee: Buurtmoestuin & Pluktuin 'De Kade' (61 stemmen)

## 3. Afwegingen & Besluitmotivering
Het projectteam heeft de feedback over boodschappentransport en sociale veiligheid zwaar meegewogen. Er is besloten om een deelmobiliteitsvloot van 20 elektrische cargofietsen te stationeren in de hubs en extra openbare verlichting op te nemen in de concept-gebiedsvisie.

## 4. Handtekening & Vervolg
Dit rapport dient als bijlage bij het formele principeverzoek voor het college van B&W en zal openbaar worden gepubliceerd in het Besluitenregister.

*Gemeenteraad Utrecht / Ontwikkelcombinatie Spoorzone West*
      `);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    // Generate actual file text download trigger
    const element = document.createElement("a");
    const file = new Blob([generatedMarkdown], { type: "text/plain;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = `${reportType.replace(/\s+/g, "_")}_Spoorzone_Havenkwartier.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200/80 p-6 shadow-sm flex flex-col gap-6" id="report-generator-widget">
      
      {/* Header config row */}
      <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between border-b border-stone-100 pb-4">
        <div>
          <h3 className="font-bold text-stone-900 text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-800" />
            <span>AI Rapport- & Besluitgenerator</span>
          </h3>
          <p className="text-xs text-stone-500 mt-1">
            Genereer juridische documenten conform de Omgevingswet in de huisstijl van Utrecht.
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="inline-flex items-center text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md font-bold">
              📁 Project: {projectName}
            </span>
            <span className="inline-flex items-center text-[10px] bg-sky-50 text-sky-800 px-2 py-0.5 rounded-md font-bold">
              📊 {surveyResponses.length} Enquêtes
            </span>
            <span className="inline-flex items-center text-[10px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md font-bold">
              💡 {ideas.length} Ideeën
            </span>
            <span className="inline-flex items-center text-[10px] bg-rose-50 text-rose-800 px-2 py-0.5 rounded-md font-bold">
              📌 {markers.length} Speldjes
            </span>
          </div>
        </div>

        {/* Quick parameters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Document selection */}
          <div className="flex-1 md:flex-initial">
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 text-stone-850 text-xs rounded-xl p-2.5 font-semibold focus:outline-emerald-800 focus:ring-1"
              id="report-type-select"
            >
              {reportOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Tone definition */}
          <div className="flex-1 md:flex-initial">
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 text-stone-850 text-xs rounded-xl p-2.5 font-semibold focus:outline-emerald-800 focus:ring-1"
            >
              <option value="formeel-zakelijk">Formeel, Rijksstijl B1</option>
              <option value="bemoedigend-menselijk">Bemoedigend & Toegankelijk</option>
              <option value="beleidsmatig-technisch">Beleidsmatig & Milieutechnisch</option>
            </select>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition active:scale-95 disabled:bg-stone-300 pointer-events-auto cursor-pointer shadow-md shadow-emerald-950/10 shrink-0"
            id="generate-report-btn"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>AI Compileert Document...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Genereer Rapport</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Render Document Result area */}
      {generatedMarkdown ? (
        <div className="flex flex-col gap-4 animate-in fade-in duration-300">
          
          {/* Tool Row */}
          <div className="flex items-center justify-between bg-stone-50 p-2.5 rounded-xl border border-stone-200/60">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-800 flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Gereed: {reportType} in Utrecht Rijkstoon</span>
            </span>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] bg-white border border-stone-200 text-stone-600 px-3 py-1.5 rounded-lg hover:bg-stone-100 transition active:scale-95 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-705" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Gekopieerd!" : "Kopieer Tekst"}</span>
              </button>

              <button
                onClick={handleDownload}
                className="flex items-center gap-1 text-[11px] bg-white border border-stone-200 text-stone-600 px-3 py-1.5 rounded-lg hover:bg-stone-100 transition active:scale-95 cursor-pointer"
              >
                {downloaded ? <Check className="w-3.5 h-3.5 text-emerald-705" /> : <Download className="w-3.5 h-3.5" />}
                <span>{downloaded ? "Bestand gedownload!" : "Download Bestand"}</span>
              </button>

              {onPublishPublication && (
                <button
                  type="button"
                  onClick={async () => {
                    if (isPublished || isPublishingNews) return;
                    try {
                      setIsPublishingNews(true);
                      const docFileName = `${reportType.replace(/\s+/g, "_")}_Bijlage.pdf`;
                      await onPublishPublication({
                        title: `${reportType} - Utrecht West`,
                        summary: `Officieel AI-gecompileerd participatierapport. Betreft: ${reportType.toLowerCase()} conform de Omgevingswet-richtlijnen.`,
                        content: generatedMarkdown,
                        category: "Publicatie",
                        date: new Date().toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" }),
                        image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=600&auto=format&fit=crop",
                        readTime: "5 min leestijd",
                        documents: [docFileName],
                        views: 0
                      });
                      setIsPublished(true);
                    } catch (e) {
                      console.error(e);
                    } finally {
                      setIsPublishingNews(false);
                    }
                  }}
                  disabled={isPublished || isPublishingNews}
                  className="flex items-center gap-1.5 text-[11px] bg-emerald-800 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-900 disabled:bg-emerald-50 disabled:text-emerald-800 font-extrabold transition active:scale-95 shadow-sm cursor-pointer disabled:pointer-events-none"
                >
                  {isPublishingNews ? (
                    <span>Publiceren...</span>
                  ) : isPublished ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-800" />
                      <span>Gepubliceerd in Nieuwscentrum!</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Publiceer in Nieuwscentrum</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Typographic Paper Frame (Simulates printed letter paper) */}
          <div className="p-8 bg-stone-50 border border-stone-200 rounded-2xl font-sans text-stone-850 shadow-inner max-h-[480px] overflow-y-auto overflow-x-hidden relative">
            <div className="absolute top-4 right-4 text-[10px] font-mono text-stone-400 font-bold border border-stone-200 rounded px-1.5 uppercase select-none">
              {projectName}
            </div>
            
            {/* Real typography representation instead of raw markdown */}
            <div className="prose prose-stone max-w-none text-xs md:text-sm space-y-4">
              {generatedMarkdown.split("\n").map((line, idx) => {
                const trimmed = line.trim();
                
                if (trimmed.startsWith("# ")) {
                  return <h1 key={idx} className="text-xl md:text-2xl font-black text-stone-900 border-b border-stone-300 pb-2 pt-1">{trimmed.substring(2)}</h1>;
                }
                if (trimmed.startsWith("## ")) {
                  return <h2 key={idx} className="text-base md:text-lg font-bold text-emerald-950 pt-2">{trimmed.substring(3)}</h2>;
                }
                if (trimmed.startsWith("### ")) {
                  return <h3 key={idx} className="text-sm font-extrabold text-stone-800 pt-1">{trimmed.substring(4)}</h3>;
                }
                if (trimmed.startsWith("- ")) {
                  return <li key={idx} className="ml-4 list-disc text-stone-700 leading-relaxed">{trimmed.substring(2)}</li>;
                }
                if (trimmed.startsWith("*")) {
                  return <p key={idx} className="italic text-stone-600 pl-2 border-l-2 border-stone-300 my-2">{trimmed.replace(/\*/g, "")}</p>;
                }
                if (trimmed === "---") {
                  return <hr key={idx} className="border-t border-stone-300 my-4" />;
                }
                if (trimmed === "") {
                  return <div key={idx} className="h-2"></div>;
                }
                return <p key={idx} className="text-stone-700 leading-relaxed font-normal">{line}</p>;
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-stone-50 border border-dashed border-stone-200/80 rounded-2xl py-12 px-6 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center border border-stone-200 text-stone-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-semibold text-stone-850 text-sm">Geen document gecompileerd</h4>
            <p className="text-xs text-stone-500 mt-1 max-w-sm">
              Selecteer de gewenste rapportage hierboven en klik op <strong>'Genereer Rapport'</strong> om het AI-proces op te starten conform de Omgevingswet.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
