// =====================================================
// AksharaChitra — Type Definitions (FINAL)
// =====================================================

export type Language =
  | "eng"
  | "tel"
  | "hin"
  | "tam"
  | "kan"
  | "mal"
  | "ori"
  | "san";

export type ImagePosition =
  | "center"
  | "left"
  | "right"
  | "top"
  | "bottom";

export type TextAlign =
  | "center"
  | "left"
  | "right"
  | "justify";

export type SortOrder =
  | "newest"
  | "oldest"
  | "name-asc"
  | "name-desc";

export interface PosterState {
  title: string;
  subtitle: string;
  message: string;

  titleSize: number;
  subtitleSize: number;
  messageSize: number;

  titleAlign: TextAlign;
  subtitleAlign: TextAlign;
  contentAlign: TextAlign;

  titleColor: string;
  subtitleColor: string;
  messageColor: string;

  titleBg: string;
  subtitleBg: string;
  messageBg: string;

  // legacy font field
  fontFamily: string;

  // NEW — used by FontPicker
  posterFont?: string;

  imagePosition: ImagePosition;

  posterBgColor: string;

  qrText: string;
  qrAlign: TextAlign;

  language: Language;

  uploadedMainData: string;
  uploadedLogoData: string;
}

export interface SavedPoster {
  id?: number;
  title: string;
  dataUrl: string;
  ts: number;
}

export interface Template {
  title: string;
  subtitle: string;
  message: string;
}

export interface TemplatePack {
  [lang: string]: {
    [key: string]: Template;
  };
}

// ----------------------------------------------------
// Default Poster State
// ----------------------------------------------------

export const DEFAULT_POSTER_STATE: PosterState = {
  title: "",
  subtitle: "",
  message: "",

  titleSize: 32,
  subtitleSize: 26,
  messageSize: 20,

  titleAlign: "center",
  subtitleAlign: "center",
  contentAlign: "center",

  titleColor: "#111111",
  subtitleColor: "#111111",
  messageColor: "#111111",

  titleBg: "#ffffff",
  subtitleBg: "#ffffff",
  messageBg: "#ffffff",

  fontFamily: "Montserrat, sans-serif",
  posterFont: "Montserrat, sans-serif",

  imagePosition: "center",

  posterBgColor: "#FFFFFF",

  qrText: "",
  qrAlign: "left",

  language: "eng",

  uploadedMainData: "",
  uploadedLogoData: "",
};

// ----------------------------------------------------
// Templates
// ----------------------------------------------------

export const TEMPLATE_PACK: TemplatePack = {
  eng: {
    newYearWishes: {
      title: "🎆 New Year Wishes",
      subtitle: "",
      message:
        "Wishing you a joyful New Year filled with success and happiness ✨",
    },

    birthdayGreeting: {
      title: "🎂 Happy Birthday",
      subtitle: "",
      message:
        "May your day be filled with joy, laughter, and wonderful memories.",
    },

    motivationQuote: {
      title: "💡 Motivation",
      subtitle: "",
      message:
        "Success is built on consistency and the courage to start.",
    },
  },

  tel: {
    newYearWishes: {
      title: "🎆 కొత్త సంవత్సర శుభాకాంక్షలు",
      subtitle: "",
      message:
        "కొత్త సంవత్సరం మీ జీవితంలో ఆనందం మరియు విజయాన్ని తీసుకురావాలి ✨",
    },

    birthdayGreeting: {
      title: "🎂 జన్మదిన శుభాకాంక్షలు",
      subtitle: "",
      message:
        "మీ రోజు ఆనందంతో, నవ్వులతో నిండిపోవాలి.",
    },

    motivationQuote: {
      title: "💡 ప్రేరణ",
      subtitle: "",
      message:
        "విజయం నిరంతర ప్రయత్నంతో మరియు ధైర్యంతో వస్తుంది.",
    },
  },

  hin: {
    newYearWishes: {
      title: "🎆 नव वर्ष की शुभकामनाएँ",
      subtitle: "",
      message:
        "नया साल आपके जीवन में खुशी और सफलता लाए ✨",
    },

    birthdayGreeting: {
      title: "🎂 जन्मदिन की शुभकामनाएँ",
      subtitle: "",
      message:
        "आपका दिन खुशियों और मुस्कान से भरा हो।",
    },

    motivationQuote: {
      title: "💡 प्रेरणा",
      subtitle: "",
      message:
        "सफलता निरंतर प्रयास और साहस से बनती है।",
    },
  },

  san: {
    newYearWishes: {
      title: "🎆 नववर्ष शुभाशयाः",
      subtitle: "",
      message:
        "नववर्षे सुखसमृद्धयः भवन्तु ✨",
    },

    birthdayGreeting: {
      title: "🎂 जन्मदिन शुभाशयाः",
      subtitle: "",
      message:
        "भवतः दिनः आनन्देन परिपूर्णः अस्तु।",
    },

    motivationQuote: {
      title: "💡 प्रेरणा",
      subtitle: "",
      message:
        "सफलता धैर्येन निरन्तरप्रयत्नेन च लभ्यते।",
    },
  },
};