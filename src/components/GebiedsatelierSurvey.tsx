import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, Check, ChevronLeft, ChevronRight, Sparkles, HelpCircle, 
  MapPin, Clipboard, HeartCode, Landmark, Smile, User, CheckCircle
} from "lucide-react";

export interface GebiedsatelierSurveyProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  userName?: string;
  selectedRole?: string;
  onSaveResponse: (answers: Record<number, string | string[]>) => Promise<void>;
}

export interface SurveySlide {
  id: number;
  question: string;
  type: "image-select" | "feeling-select" | "text-tags" | "binary-pink-red";
  options?: {
    value: string;
    label: string;
    image?: string;
    emoji?: string;
  }[];
  examples?: string[];
  maxSelect?: number;
}

export const GEBIEDSATELIER_QUESTIONS: SurveySlide[] = [
  {
    id: 1,
    question: "Wat is uw leeftijd?",
    type: "image-select",
    options: [
      { 
        value: "< 25", 
        label: "< 25 jaar", 
        image: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        value: "25 - 45", 
        label: "25 - 45 jaar", 
        image: "https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        value: "45 - 65", 
        label: "45 - 65 jaar", 
        image: "https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        value: "65+", 
        label: "65+ jaar", 
        image: "https://images.unsplash.com/photo-1566616213894-2d4e1baee5d8?q=80&w=600&auto=format&fit=crop" 
      }
    ]
  },
  {
    id: 2,
    question: "Met welk gevoel bent u naar de bijeenkomst gekomen?",
    type: "feeling-select",
    options: [
      { 
        value: "Enthousiast & Positief", 
        label: "Enthousiast", 
        emoji: "😄"
      },
      { 
        value: "Nieuwsgierig & Betrokken", 
        label: "Nieuwsgierig", 
        emoji: "🤓"
      },
      { 
        value: "Bezorgd & Kritisch", 
        label: "Bezorgd", 
        emoji: "😟"
      }
    ]
  },
  {
    id: 3,
    question: "Waar woont u?",
    type: "image-select",
    options: [
      { 
        value: "Plangebied", 
        label: "1. Plangebied", 
        image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        value: "In de buurt", 
        label: "2. In de buurt", 
        image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        value: "In de wijk", 
        label: "3. In de wijk", 
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        value: "Omliggende omgeving", 
        label: "4. Omliggende omgeving", 
        image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=600&auto=format&fit=crop" 
      }
    ]
  },
  {
    id: 4,
    question: "Heeft u een eigen woning?",
    type: "binary-pink-red",
    options: [
      { value: "Ja", label: "1. Ja" },
      { value: "Nee", label: "2. Nee" }
    ]
  },
  {
    id: 5,
    question: "Heeft u plannen voor verhuizing/ of bent u huiszoekende?",
    type: "image-select",
    options: [
      { 
        value: "Ja, ik ben van plan te verhuizen", 
        label: "1. Ja, ik ben van plan te verhuizen", 
        image: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        value: "Ja, ik ben huiszoekende", 
        label: "2. Ja, ik ben huiszoekende", 
        image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        value: "Nee", 
        label: "3. Nee", 
        image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=600&auto=format&fit=crop" 
      }
    ]
  },
  {
    id: 6,
    question: "Wat komt het eerst in u op als u denkt aan het plangebied?",
    type: "text-tags",
    examples: ["Gemoedelijk", "Recreatief", "Historisch", "Goede voorzieningen", "Scholen", "Rust", "Natuur", "Veiligheid"]
  },
  {
    id: 7,
    question: "Wat waardeert u het meest aan de projectlocatie /buitengebied?",
    type: "text-tags",
    examples: ["Wandelnetwerk", "Klompempaden", "Beek", "Lanen", "Ruimte", "Openheid", "Rust", "Flora & Fauna"]
  },
  {
    id: 8,
    question: "Aan welke landschappelijke kwaliteit hecht u de meeste waarde?",
    type: "image-select",
    options: [
      { 
        value: "Zichtlijnen naar het landschap", 
        label: "1. Zichtlijnen naar het landschap", 
        image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        value: "Wandelroutes", 
        label: "2. Wandelroutes", 
        image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        value: "Beek", 
        label: "3. Beek", 
        image: "https://images.unsplash.com/photo-1527061011665-3652c757a4d4?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        value: "Boskamers", 
        label: "4. Boskamers", 
        image: "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        value: "Lanen", 
        label: "5. Lanen", 
        image: "https://images.unsplash.com/photo-1425913397330-cf8af2ff40a1?q=80&w=600&auto=format&fit=crop" 
      }
    ]
  },
  {
    id: 9,
    question: "Voor wie gaan we bij voorkeur woningen bouwen in de nieuwe wijk?",
    type: "image-select",
    options: [
      { 
        value: "Startend op de woningmarkt", 
        label: "1. Startend op de woningmarkt", 
        image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        value: "Alleenstaande", 
        label: "2. Alleenstaande", 
        image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        value: "Samenwonende", 
        label: "3. Samenwonende", 
        image: "https://images.unsplash.com/photo-1590608897129-79da98d15969?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        value: "Gezinnen", 
        label: "4. Gezinnen", 
        image: "https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        value: "Ouderen", 
        label: "5. Ouderen", 
        image: "https://images.unsplash.com/photo-1566616213894-2d4e1baee5d8?q=80&w=600&auto=format&fit=crop" 
      }
    ]
  },
  {
    id: 10,
    question: "Welke type wijk vindt u het meest passen?",
    type: "image-select",
    options: [
      { 
        value: "Autoluwe wijk", 
        label: "1. Autoluwe wijk", 
        image: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        value: "Ecologische wijk", 
        label: "2. Ecologische wijk", 
        image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        value: "Wijk met appartementen en grondgebonden woningen", 
        label: "3. Wijk met appartementen en grondgebonden woningen", 
        image: "https://images.unsplash.com/photo-1513584684374-8bab748fbf90?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        value: "Traditionele wijk", 
        label: "4. Traditionele wijk", 
        image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=600&auto=format&fit=crop" 
      }
    ]
  },
  {
    id: 11,
    question: "Aan welke woningtype is volgens u behoefte?",
    type: "image-select",
    options: [
      { 
        value: "Appartementen", 
        label: "1. Appartementen", 
        image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        value: "Rug-aan-rugwoningen", 
        label: "2. Rug-aan-rugwoningen", 
        image: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        value: "Patiowoningen", 
        label: "3. Patiowoningen", 
        image: "https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        value: "Rijwoningen", 
        label: "4. Rijwoningen", 
        image: "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        value: "Twee-onder-éénkapwoning", 
        label: "5. Twee-onder-éénkapwoning", 
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        value: "Vrijstaande woning", 
        label: "6. Vrijstaande woning", 
        image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=600&auto=format&fit=crop" 
      }
    ]
  },
  {
    id: 12,
    question: "Aan welk segment is volgens u behoefte?",
    type: "image-select",
    options: [
      { 
        value: "Sociale huur", 
        label: "1. Sociale huur", 
        image: "https://images.unsplash.com/photo-1513584684374-8bab748fbf90?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        value: "Vrije sector huur", 
        label: "2. Vrije sector huur", 
        image: "https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        value: "Betaalbare koop", 
        label: "3. Betaalbare koop", 
        image: "https://images.unsplash.com/photo-1513584684374-8bab748fbf90?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        value: "Middeldure & dure koop", 
        label: "4. Middeldure & dure koop", 
        image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=600&auto=format&fit=crop" 
      }
    ]
  },
  {
    id: 13,
    question: "Welke sfeer vindt u passend?",
    type: "image-select",
    options: [
      { 
        value: "Natuurlijk", 
        label: "1. Natuurlijk", 
        image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        value: "Traditioneel", 
        label: "2. Traditioneel", 
        image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        value: "Besloten", 
        label: "3. Besloten", 
        image: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        value: "Landelijk", 
        label: "4. Landelijk", 
        image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        value: "Eigentijds", 
        label: "5. Eigentijds", 
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        value: "Aan het water", 
        label: "6. Aan het water", 
        image: "https://images.unsplash.com/photo-1516257984-b1b4d707412e?q=80&w=600&auto=format&fit=crop" 
      }
    ]
  },
  {
    id: 14,
    question: "Welke verdeling van groen in de openbare ruimte waardeert u het meest?",
    type: "image-select",
    options: [
      { 
        value: "Groot park", 
        label: "1. Groot park", 
        image: "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        value: "Gemeenschappelijke tuin", 
        label: "2. Gemeenschappelijke tuin", 
        image: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        value: "Meerdere kleine plantsoenen", 
        label: "3. Meerdere kleine plantsoenen", 
        image: "https://images.unsplash.com/photo-1598902108854-10e335adac99?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        value: "Groen in alle straten", 
        label: "4. Groen in alle straten", 
        image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=600&auto=format&fit=crop" 
      }
    ]
  },
  {
    id: 15,
    question: "Groen in de wijk vind ik om…",
    type: "image-select",
    options: [
      { 
        value: "Naar te kijken", 
        label: "1. Naar te kijken", 
        image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        value: "Te verblijven", 
        label: "2. Te verblijven", 
        image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        value: "Te fietsen en wandelen", 
        label: "3. Te fietsen en wandelen", 
        image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        value: "Te spelen", 
        label: "4. Te spelen", 
        image: "https://images.unsplash.com/photo-1596464716127-f2a82984de30?q=80&w=600&auto=format&fit=crop" 
      }
    ]
  },
  {
    id: 16,
    question: "Wat voor speelplek denkt u dat de kinderen leuk vinden?",
    type: "image-select",
    options: [
      { 
        value: "Traditionele speelplek", 
        label: "1. Traditionele speelplek", 
        image: "https://images.unsplash.com/photo-1596464716127-f2a82984de30?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        value: "Natuurlijke speelplek", 
        label: "2. Natuurlijke speelplek", 
        image: "https://images.unsplash.com/photo-1519751138087-5bf79df62d5b?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        value: "De natuur", 
        label: "3. De natuur", 
        image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        value: "Speelveldje", 
        label: "4. Speelveldje", 
        image: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=600&auto=format&fit=crop" 
      }
    ]
  },
  {
    id: 17,
    question: "Heeft u liever een groene wijk met kleine tuinen of grotere tuinen bij ieder huis?",
    type: "image-select",
    options: [
      { 
        value: "Groene wijk met kleinere tuinen", 
        label: "1. Groene wijk met kleinere tuinen", 
        image: "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        value: "Grotere tuinen bij ieder huis", 
        label: "2. Grotere tuinen bij ieder huis", 
        image: "https://images.unsplash.com/photo-1558036117-15d82a90b9b1?q=80&w=600&auto=format&fit=crop" 
      }
    ]
  },
  {
    id: 18,
    question: "Heeft u liever een gezamenlijke tuin of een eigen tuin?",
    type: "image-select",
    options: [
      { 
        value: "Een gezamenlijke tuin", 
        label: "1. Een gezamenlijke tuin", 
        image: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        value: "Eigen tuin", 
        label: "2. Eigen tuin", 
        image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=600&auto=format&fit=crop" 
      }
    ]
  },
  {
    id: 19,
    question: "Welke erfafscheiding past hier?",
    type: "image-select",
    options: [
      { 
        value: "Stenen muurtjes", 
        label: "1. Stenen muurtjes", 
        image: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        value: "Schuttingen", 
        label: "2. Schuttingen", 
        image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        value: "Hagen", 
        label: "3. Hagen", 
        image: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        value: "Geen erfafscheiding", 
        label: "4. Geen erfafscheiding", 
        image: "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=600&auto=format&fit=crop" 
      }
    ]
  },
  {
    id: 20,
    question: "Hoe zou u water opvangen/bergen in de wijk?",
    type: "image-select",
    options: [
      { 
        value: "In open water", 
        label: "1. In open water", 
        image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        value: "In wadi's", 
        label: "2. In wadi's", 
        image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        value: "Gedeeltelijk op eigen terrein", 
        label: "3. (Gedeeltelijk) op eigen terrein", 
        image: "https://images.unsplash.com/photo-1558904541-efa8c1a68f6a?q=80&w=600&auto=format&fit=crop" 
      }
    ]
  },
  {
    id: 21,
    question: "Parkeren doet u het liefst…",
    type: "image-select",
    options: [
      { 
        value: "Voor de deur op straat", 
        label: "1. Voor de deur op straat", 
        image: "https://images.unsplash.com/photo-1506015391300-4802dc74de2e?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        value: "Op een openbare parkeerplaats", 
        label: "2. Op een openbare parkeerplaats", 
        image: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        value: "Achter het huis in een gemeenschappelijk parkeerhof", 
        label: "3. Achter het huis in een gemeenschappelijk parkeerhof", 
        image: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        value: "Op eigen terrein", 
        label: "4. Op eigen terrein", 
        image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=600&auto=format&fit=crop" 
      }
    ]
  },
  {
    id: 22,
    question: "Wat past er beter bij u?",
    type: "image-select",
    options: [
      { 
        value: "Liever op de fiets dan met de auto", 
        label: "1. Als er goede fietspaden zijn ga ik liever op de fiets dan met de auto", 
        image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=600&auto=format&fit=crop" 
      },
      { 
        value: "Ik doe alles met de auto", 
        label: "2. Ik doe alles met de auto", 
        image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=600&auto=format&fit=crop" 
      }
    ]
  }
];

export function GebiedsatelierSurvey({
  isOpen,
  onClose,
  projectId,
  projectName,
  userName = "Deelnemer",
  selectedRole = "User",
  onSaveResponse
}: GebiedsatelierSurveyProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string | string[]>>({});
  const [customTagInput, setCustomTagInput] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentSlide = GEBIEDSATELIER_QUESTIONS[currentStepIndex];
  const slideValue = answers[currentSlide.id];

  const handleSelectOption = (optionValue: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentSlide.id]: optionValue
    }));

    // Auto-advance for basic choice options to improve user experience
    if (currentSlide.type !== "text-tags" && currentStepIndex < GEBIEDSATELIER_QUESTIONS.length - 1) {
      setTimeout(() => {
        setCurrentStepIndex((prev) => prev + 1);
      }, 350);
    }
  };

  const handleToggleTag = (tag: string) => {
    const currentTags = Array.isArray(slideValue) ? [...slideValue] : [];
    if (currentTags.includes(tag)) {
      const filtered = currentTags.filter((t) => t !== tag);
      setAnswers((prev) => ({ ...prev, [currentSlide.id]: filtered }));
    } else {
      setAnswers((prev) => ({ ...prev, [currentSlide.id]: [...currentTags, tag] }));
    }
  };

  const handleAddCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTagInput.trim()) return;
    const cleanTag = customTagInput.trim();
    const currentTags = Array.isArray(slideValue) ? [...slideValue] : [];
    if (!currentTags.includes(cleanTag)) {
      setAnswers((prev) => ({ ...prev, [currentSlide.id]: [...currentTags, cleanTag] }));
    }
    setCustomTagInput("");
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentStepIndex < GEBIEDSATELIER_QUESTIONS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSaveResponse(answers);
      setIsSubmitted(true);
    } catch (e) {
      console.error("Fout bij indienen gebiedsenquête:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canGoNext = () => {
    const val = answers[currentSlide.id];
    if (currentSlide.type === "text-tags") {
      return Array.isArray(val) && val.length > 0;
    }
    return !!val;
  };

  const completionPercentage = Math.round(((currentStepIndex) / GEBIEDSATELIER_QUESTIONS.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 md:p-6 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-stone-50 rounded-3xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden max-h-[92vh]">
        
        {/* Banner with progress */}
        <div className="bg-slate-900 text-white p-5 pr-14 flex flex-col justify-between relative border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/25">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </span>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Interactief Gebiedsatelier</span>
              <h3 className="font-extrabold text-white text-base md:text-lg leading-tight mt-0.5">Visueel Ontwerp- &amp; Wensonderzoek</h3>
            </div>
          </div>
          
          <button 
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Real-time progression bar */}
          <div className="mt-5 w-full bg-slate-800 h-2 rounded-full overflow-hidden relative">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max(3, completionPercentage)}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold mt-1.5 uppercase tracking-wide">
            <span>Stap {currentStepIndex + 1} van {GEBIEDSATELIER_QUESTIONS.length}</span>
            <span>{completionPercentage}% voltooid</span>
          </div>
        </div>

        {/* Core dynamic body */}
        <div className="p-6 md:p-8 overflow-y-auto flex-grow" style={{ minHeight: "380px" }}>
          <AnimatePresence mode="wait">
            {!isSubmitted ? (
              <motion.div
                key={currentSlide.id}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                {/* Question Text */}
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 text-[10px] font-black uppercase rounded-full tracking-wider">
                    <Clipboard className="w-3.5 h-3.5" /> Vraag {currentSlide.id} / 22
                  </span>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-tight pt-1">
                    {currentSlide.question}
                  </h2>
                </div>

                {/* 1. Image selection slide style */}
                {currentSlide.type === "image-select" && currentSlide.options && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {currentSlide.options.map((opt) => {
                      const isSelected = slideValue === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleSelectOption(opt.value)}
                          className={`group border rounded-2xl overflow-hidden transition-all duration-300 flex flex-col text-left bg-white relative hover:scale-[1.01] hover:shadow-md ${
                            isSelected 
                              ? "border-emerald-600 ring-4 ring-emerald-500/15" 
                              : "border-stone-200 hover:border-slate-400"
                          }`}
                        >
                          {opt.image && (
                            <div className="h-28 md:h-36 w-full relative overflow-hidden bg-stone-100">
                              <img
                                src={opt.image}
                                alt={opt.label}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-910/20 to-transparent" />
                            </div>
                          )}
                          <div className="p-3 bg-white flex-grow flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800 tracking-tight leading-snug">
                              {opt.label}
                            </span>
                            <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center shrink-0 ml-2 ${
                              isSelected ? "bg-emerald-500 border-emerald-500 text-white" : "border-stone-300"
                            }`}>
                              {isSelected && <Check className="w-3 h-3 stroke-[3px]" />}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 2. Emoji feeling selection slide */}
                {currentSlide.type === "feeling-select" && currentSlide.options && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto pt-4">
                    {currentSlide.options.map((opt) => {
                      const isSelected = slideValue === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleSelectOption(opt.value)}
                          className={`border p-6 rounded-3xl flex flex-col items-center justify-center gap-4 transition-all duration-300 bg-white hover:scale-[1.02] hover:shadow-md ${
                            isSelected 
                              ? "border-emerald-600 ring-4 ring-emerald-500/15" 
                              : "border-stone-200 hover:border-slate-400"
                          }`}
                        >
                          <span className="text-6xl md:text-7xl animate-bounce duration-1000 select-none">
                            {opt.emoji}
                          </span>
                          <div className="text-center">
                            <h4 className="font-extrabold text-slate-900 text-sm">{opt.value}</h4>
                            <span className="text-[11px] text-stone-500 font-semibold uppercase tracking-wide mt-1 block">
                              {opt.label}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 3. Text tag entries with instant additions */}
                {currentSlide.type === "text-tags" && (
                  <div className="space-y-6">
                    <p className="text-xs text-stone-500 font-medium">
                      Selecteer een of meerdere suggesties hieronder of typ uw eigen kenwoorden om toe te voegen.
                    </p>

                    <div className="flex flex-wrap gap-2.5">
                      {currentSlide.examples?.map((ex) => {
                        const isSelected = Array.isArray(slideValue) && slideValue.includes(ex);
                        return (
                          <button
                            key={ex}
                            type="button"
                            onClick={() => handleToggleTag(ex)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                              isSelected 
                                ? "bg-emerald-50 border-emerald-500 text-emerald-800 font-extrabold shadow-xs" 
                                : "bg-white border-stone-200 text-stone-700 hover:bg-stone-100"
                            }`}
                          >
                            <span>{ex}</span>
                            {isSelected ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <span className="text-stone-400 text-[10px] font-bold">+</span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <form onSubmit={handleAddCustomTag} className="flex gap-2 max-w-lg">
                      <input
                        type="text"
                        value={customTagInput}
                        onChange={(e) => setCustomTagInput(e.target.value)}
                        placeholder="Voeg eigen trefwoord toe..."
                        className="flex-grow bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-slate-800"
                      />
                      <button
                        type="submit"
                        className="bg-slate-900 hover:bg-slate-850 text-white font-bold text-xs px-4 rounded-xl transition"
                      >
                        Toevoegen
                      </button>
                    </form>

                    {/* Selected Tags list readout */}
                    <div className="bg-stone-100 p-4 rounded-2xl border border-stone-200">
                      <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">Gekozen trefwoorden:</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {Array.isArray(slideValue) && slideValue.length > 0 ? (
                          slideValue.map((tag) => (
                            <span 
                              key={tag} 
                              className="inline-flex items-center gap-1 bg-emerald-600 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg shadow-2xs"
                            >
                              <span>{tag}</span>
                              <button 
                                type="button" 
                                onClick={() => handleToggleTag(tag)}
                                className="hover:bg-emerald-700 rounded-full p-0.5 ml-1 transition"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-stone-400 font-medium italic">Nog geen trefwoorden geselecteerd...</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Binary pink vs red question */}
                {currentSlide.type === "binary-pink-red" && currentSlide.options && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-xl mx-auto pt-4">
                    {currentSlide.options.map((opt, i) => {
                      const isSelected = slideValue === opt.value;
                      const visualBg = i === 0 
                        ? "bg-rose-100 border-rose-300 text-rose-800 hover:bg-rose-200/50" 
                        : "bg-red-100 border-red-300 text-red-800 hover:bg-red-200/50";
                      const visualRing = i === 0 
                        ? "border-rose-500 ring-rose-500/15" 
                        : "border-red-500 ring-red-500/15";

                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleSelectOption(opt.value)}
                          className={`border p-10 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:scale-[1.02] hover:shadow-md ${visualBg} ${
                            isSelected 
                              ? `border-2 ${visualRing} ring-4` 
                              : "border-stone-200"
                          }`}
                        >
                          <span className="text-4xl font-black block">
                            {opt.value}
                          </span>
                          <span className="text-xs font-bold uppercase tracking-wider block">
                            {opt.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

              </motion.div>
            ) : (
              /* Success screen state */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 flex flex-col items-center justify-center text-center gap-4 max-w-md mx-auto"
              >
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center border-4 border-emerald-250 animate-bounce duration-1000">
                  <CheckCircle className="w-8 h-8 stroke-[2.5]" />
                </div>
                
                <div>
                  <h3 className="text-xl font-black text-slate-900 leading-tight">Gebiedsatelier Succesvol!</h3>
                  <p className="text-xs md:text-sm text-stone-605 mt-2 leading-relaxed">
                    Hartelijk dank, <strong>{userName}</strong>! Uw 22 visuele inbrengen zijn succesvol opgeslagen in onze cloud database en direct gekoppeld aan het participatiedashboard.
                  </p>
                </div>

                <div className="w-full bg-stone-100 p-4 rounded-2xl border border-stone-200 text-left space-y-1 mt-2 text-[11px] text-stone-500 leading-normal">
                  <p className="font-extrabold text-slate-800 text-center border-b border-stone-200 pb-1.5 mb-1.5 text-xs">Uw Profielsynthese:</p>
                  <p>• <strong>Leeftijdscategorie:</strong> {answers[1] || "Onbekend"}</p>
                  <p>• <strong>Woonlocatie:</strong> {answers[3] || "Onbekend"}</p>
                  <p>• <strong>Huisvestingsvorm:</strong> {answers[4] === "Ja" ? "Eigen woningbesit" : "Huur/Geen eigen woning"}</p>
                  <p>• <strong>Voorkeursstreek:</strong> {answers[13] || "Onbekend"}</p>
                  <p>• <strong>Wateroplossing:</strong> {answers[20] || "Onbekend"}</p>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs py-3 rounded-xl transition mt-2 shadow-xs"
                >
                  Terug naar het Dashboard
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Static controls bar */}
        {!isSubmitted && (
          <div className="bg-stone-100 p-5 border-t border-stone-200 flex justify-between items-center z-10">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentStepIndex === 0}
              className="px-4 py-2 rounded-xl text-stone-500 hover:text-slate-900 hover:bg-white border border-transparent hover:border-stone-200 transition text-xs font-bold disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Vorige
            </button>

            {currentStepIndex === GEBIEDSATELIER_QUESTIONS.length - 1 ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !canGoNext()}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition shadow-xs disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1.5"
              >
                {isSubmitting ? "Verwerken..." : "Enquête indienen"} <Check className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                disabled={!canGoNext()}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs transition flex items-center gap-1 disabled:opacity-40 disabled:pointer-events-none shadow-xs"
              >
                Volgende <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
