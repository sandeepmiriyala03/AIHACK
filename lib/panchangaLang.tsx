// lib/panchangaLang.ts
// Multilingual Panchanga data — te, hi, ta, kn, ml, mr, en

export type LangCode = "te" | "hi" | "ta" | "kn" | "ml" | "mr" | "en";

export interface PanchangaLang {
  // Calendar header
  title: string;
  todaySummary: string;
  fullDetails: string;
  inauspicious: string;
  greeting: string;
  samvatsara: string;
  changeLanguage: string;
  clickDate: string;
  aiNote: string;
  // Day names (short)
  varaShort: string[];
  varaFull: string[];
  varaLong: string[];
  // Tithi
  tithi: string[];
  // Nakshatra
  nak: string[];
  // Yoga
  yoga: string[];
  // Karana
  karana: string[];
  // Masa
  masa: string[];
  // Rashi
  rashi: string[];
  // Ritu
  ritu: string[];
  // Ayana
  ayana: string[];
  // Paksha
  shuklaPaksha: string;
  krishnaPaksha: string;
  shuklaSuffix: string;
  krishnaSuffix: string;
  // Month names (Gregorian, for PDF)
  month: string[];
  // Labels
  labels: {
    vara: string; samvatsaraLabel: string; ayanaritu: string; masapaksha: string;
    tithiLabel: string; nakLabel: string; yogaLabel: string; karanaLabel: string;
    sunRashi: string; moonRashi: string; sunrise: string; sunset: string;
    varjyam: string; amritakalam: string; durmuhurtam: string;
    rahuKaal: string; yamaGanda: string; guliKaal: string;
    next: string; upto: string;
    auspicious: string; pournami: string; amavasya: string; ekadashi: string;
    ugadi: string; today: string;
    whatsapp: string; poster: string; pdf: string;
    masaLabel: string; pakshaLabel: string; rituLabel: string; ayanaLabel: string;
    rashuluSunrise: string;
    ashubhaKaala: string; kaalamanam: string; panchangaAngalu: string;
  };
}

const TE: PanchangaLang = {
  title: "పంచాంగం కేలండర్",
  todaySummary: "ఈరోజు సంక్షిప్తం",
  fullDetails: "పూర్తి వివరాలు →",
  inauspicious: "అశుభ కాలాలు",
  greeting: "శ్రీ గురుభ్యో నమః",
  samvatsara: "నామ సంవత్సరం",
  changeLanguage: "భాష మార్చు ↩",
  clickDate: "తేదీ click చేయండి → పూర్తి పంచాంగం",
  aiNote: "* AI generated — DrikPanchang తో verify చేయండి",
  varaShort: ["ఆది","సోమ","మంగళ","బుధ","గురు","శుక్ర","శని"],
  varaFull:  ["ఆదివారం","సోమవారం","మంగళవారం","బుధవారం","గురువారం","శుక్రవారం","శనివారం"],
  varaLong:  ["భాను వాసరే","సోమ వాసరే","మంగళ వాసరే","బుధ వాసరే","గురు వాసరే","శుక్ర వాసరే","శని వాసరే"],
  tithi: ["పాడ్యమి","విదియ","తదియ","చవితి","పంచమి","షష్ఠి","సప్తమి","అష్టమి","నవమి","దశమి","ఏకాదశి","ద్వాదశి","త్రయోదశి","చతుర్దశి","పౌర్ణమి","పాడ్యమి","విదియ","తదియ","చవితి","పంచమి","షష్ఠి","సప్తమి","అష్టమి","నవమి","దశమి","ఏకాదశి","ద్వాదశి","త్రయోదశి","చతుర్దశి","అమావాస్య"],
  nak: ["అశ్వని","భరణి","కృత్తిక","రోహిణి","మృగశిర","ఆర్ద్ర","పునర్వసు","పుష్యమి","ఆశ్లేష","మఖ","పూర్వ ఫల్గుణి","ఉత్తర ఫల్గుణి","హస్త","చిత్త","స్వాతి","విశాఖ","అనూరాధ","జ్యేష్ఠ","మూల","పూర్వాషాఢ","ఉత్తరాషాఢ","శ్రవణ","ధనిష్ఠ","శతభిష","పూర్వాభాద్ర","ఉత్తరాభాద్ర","రేవతి"],
  yoga: ["విష్కంభ","ప్రీతి","ఆయుష్మాన్","సౌభాగ్య","శోభన","అతిగండ","సుకర్మ","ధృతి","శూల","గండ","వృద్ధి","ధ్రువ","వ్యాఘాత","హర్షణ","వజ్ర","సిద్ధి","వ్యతీపాత","వరీయాన్","పరిఘ","శివ","సిద్ధ","సాధ్య","శుభ","శుక్ల","బ్రహ్మ","ఇంద్ర","వైధృతి"],
  karana: ["బవ","బాలవ","కౌలవ","తైతిల","గర","వణిజ","విష్టి","శకుని","చతుష్పాద","నాగ","కింస్తుఘ్న"],
  masa: ["చైత్ర","వైశాఖ","జ్యేష్ఠ","ఆషాఢ","శ్రావణ","భాద్రపద","ఆశ్వయుజ","కార్తీక","మార్గశిర","పుష్య","మాఘ","ఫాల్గుణ"],
  rashi: ["మేషం","వృషభం","మిధునం","కర్కాటకం","సింహం","కన్య","తుల","వృశ్చికం","ధనుస్సు","మకరం","కుంభం","మీనం"],
  ritu: ["వసంత","వసంత","గ్రీష్మ","గ్రీష్మ","వర్ష","వర్ష","శరద్","శరద్","హేమంత","హేమంత","శిశిర","శిశిర"],
  ayana: ["ఉత్తరాయణం","ఉత్తరాయణం","ఉత్తరాయణం","దక్షిణాయనం","దక్షిణాయనం","దక్షిణాయనం","దక్షిణాయనం","దక్షిణాయనం","దక్షిణాయనం","ఉత్తరాయణం","ఉత్తరాయణం","ఉత్తరాయణం"],
  shuklaPaksha: "శుక్ల పక్షం", krishnaPaksha: "కృష్ణ పక్షం", shuklaSuffix: "శు", krishnaSuffix: "కృ",
  month: ["జనవరి","ఫిబ్రవరి","మార్చి","ఏప్రిల్","మే","జూన్","జులై","ఆగస్టు","సెప్టెంబర్","అక్టోబర్","నవంబర్","డిసెంబర్"],
  labels: {
    vara:"వారం", samvatsaraLabel:"సంవత్సరం", ayanaritu:"అయనం / ఋతువు", masapaksha:"మాసం / పక్షం",
    tithiLabel:"తిధి", nakLabel:"నక్షత్రం", yogaLabel:"యోగం", karanaLabel:"కరణం",
    sunRashi:"సూర్యరాశి", moonRashi:"చంద్రరాశి", sunrise:"సూర్యోదయం", sunset:"సూర్యాస్తమయం",
    varjyam:"వర్జ్యము", amritakalam:"అమృతకాలం", durmuhurtam:"దుర్ముహూర్తం",
    rahuKaal:"రాహుకాలము", yamaGanda:"యమగండము", guliKaal:"గుళికకాలము",
    next:"తదుపరి", upto:"వరకు",
    auspicious:"శుభ ముహూర్తాలు", pournami:"పౌర్ణమి", amavasya:"అమావాస్య",
    ekadashi:"ఏకాదశి", ugadi:"ఉగాది", today:"ఈరోజు",
    whatsapp:"💬 WhatsApp", poster:"🖼️ పోస్టర్", pdf:"⬇️ PDF",
    masaLabel:"మాసం", pakshaLabel:"పక్షం", rituLabel:"ఋతువు", ayanaLabel:"అయనం",
    rashuluSunrise:"రాశులు & సూర్యోదయం",
    ashubhaKaala:"అశుభ కాలాలు", kaalamanam:"కాలమానం", panchangaAngalu:"పంచాంగం అంగాలు",
  }
};

const HI: PanchangaLang = {
  title: "पञ्चांग कैलेंडर",
  todaySummary: "आज का सारांश",
  fullDetails: "पूर्ण विवरण →",
  inauspicious: "अशुभ काल",
  greeting: "श्री गुरुभ्यो नमः",
  samvatsara: "नाम संवत्सर",
  changeLanguage: "भाषा बदलें ↩",
  clickDate: "तारीख़ पर क्लिक करें → पूर्ण पंचांग",
  aiNote: "* AI generated — DrikPanchang से verify करें",
  varaShort: ["रवि","सोम","मंगल","बुध","गुरु","शुक्र","शनि"],
  varaFull:  ["रविवार","सोमवार","मंगलवार","बुधवार","गुरुवार","शुक्रवार","शनिवार"],
  varaLong:  ["भानु वासर","सोम वासर","मंगल वासर","बुध वासर","गुरु वासर","शुक्र वासर","शनि वासर"],
  tithi: ["प्रतिपदा","द्वितीया","तृतीया","चतुर्थी","पंचमी","षष्ठी","सप्तमी","अष्टमी","नवमी","दशमी","एकादशी","द्वादशी","त्रयोदशी","चतुर्दशी","पूर्णिमा","प्रतिपदा","द्वितीया","तृतीया","चतुर्थी","पंचमी","षष्ठी","सप्तमी","अष्टमी","नवमी","दशमी","एकादशी","द्वादशी","त्रयोदशी","चतुर्दशी","अमावस्या"],
  nak: ["अश्विनी","भरणी","कृत्तिका","रोहिणी","मृगशिरा","आर्द्रा","पुनर्वसु","पुष्य","आश्लेषा","मघा","पूर्व फाल्गुनी","उत्तर फाल्गुनी","हस्त","चित्रा","स्वाती","विशाखा","अनुराधा","ज्येष्ठा","मूल","पूर्वाषाढ़","उत्तराषाढ़","श्रवण","धनिष्ठा","शतभिषा","पूर्व भाद्रपद","उत्तर भाद्रपद","रेवती"],
  yoga: ["विष्कम्भ","प्रीति","आयुष्मान्","सौभाग्य","शोभन","अतिगण्ड","सुकर्मा","धृति","शूल","गण्ड","वृद्धि","ध्रुव","व्याघात","हर्षण","वज्र","सिद्धि","व्यतीपात","वरीयान्","परिघ","शिव","सिद्ध","साध्य","शुभ","शुक्ल","ब्रह्म","इन्द्र","वैधृति"],
  karana: ["बव","बालव","कौलव","तैतिल","गर","वणिज","विष्टि","शकुनि","चतुष्पाद","नाग","किंस्तुघ्न"],
  masa: ["चैत्र","वैशाख","ज्येष्ठ","आषाढ़","श्रावण","भाद्रपद","आश्विन","कार्तिक","मार्गशीर्ष","पौष","माघ","फाल्गुन"],
  rashi: ["मेष","वृषभ","मिथुन","कर्क","सिंह","कन्या","तुला","वृश्चिक","धनु","मकर","कुम्भ","मीन"],
  ritu: ["वसंत","वसंत","ग्रीष्म","ग्रीष्म","वर्षा","वर्षा","शरद","शरद","हेमंत","हेमंत","शिशिर","शिशिर"],
  ayana: ["उत्तरायण","उत्तरायण","उत्तरायण","दक्षिणायन","दक्षिणायन","दक्षिणायन","दक्षिणायन","दक्षिणायन","दक्षिणायन","उत्तरायण","उत्तरायण","उत्तरायण"],
  shuklaPaksha: "शुक्ल पक्ष", krishnaPaksha: "कृष्ण पक्ष", shuklaSuffix: "शु", krishnaSuffix: "कृ",
  month: ["जनवरी","फरवरी","मार्च","अप्रैल","मई","जून","जुलाई","अगस्त","सितम्बर","अक्तूबर","नवम्बर","दिसम्बर"],
  labels: {
    vara:"वार", samvatsaraLabel:"संवत्सर", ayanaritu:"अयन / ऋतु", masapaksha:"मास / पक्ष",
    tithiLabel:"तिथि", nakLabel:"नक्षत्र", yogaLabel:"योग", karanaLabel:"करण",
    sunRashi:"सूर्य राशि", moonRashi:"चंद्र राशि", sunrise:"सूर्योदय", sunset:"सूर्यास्त",
    varjyam:"वर्ज्य", amritakalam:"अमृत काल", durmuhurtam:"दुर्मुहूर्त",
    rahuKaal:"राहु काल", yamaGanda:"यमगण्ड", guliKaal:"गुलिक काल",
    next:"अगला", upto:"तक",
    auspicious:"शुभ मुहूर्त", pournami:"पूर्णिमा", amavasya:"अमावस्या",
    ekadashi:"एकादशी", ugadi:"उगादि", today:"आज",
    whatsapp:"💬 WhatsApp", poster:"🖼️ पोस्टर", pdf:"⬇️ PDF",
    masaLabel:"मास", pakshaLabel:"पक्ष", rituLabel:"ऋतु", ayanaLabel:"अयन",
    rashuluSunrise:"राशि & सूर्योदय",
    ashubhaKaala:"अशुभ काल", kaalamanam:"काल मान", panchangaAngalu:"पञ्चांग अंग",
  }
};

const TA: PanchangaLang = {
  title: "பஞ்சாங்கம் காலண்டர்",
  todaySummary: "இன்றைய சுருக்கம்",
  fullDetails: "முழு விவரங்கள் →",
  inauspicious: "அசுப காலங்கள்",
  greeting: "ஸ்ரீ குருப்யோ நமஃ",
  samvatsara: "நாம சம்வத்சரம்",
  changeLanguage: "மொழி மாற்று ↩",
  clickDate: "தேதியை கிளிக் செய்யுங்கள் → முழு பஞ்சாங்கம்",
  aiNote: "* AI generated — DrikPanchang-ல் verify செய்யுங்கள்",
  varaShort: ["ஞாயி","திங்","செவ்","புத","வியா","வெள்","சனி"],
  varaFull:  ["ஞாயிற்றுக்கிழமை","திங்கட்கிழமை","செவ்வாய்க்கிழமை","புதன்கிழமை","வியாழக்கிழமை","வெள்ளிக்கிழமை","சனிக்கிழமை"],
  varaLong:  ["ஆதித்ய வாசரம்","சோம வாசரம்","மங்கல வாசரம்","புத வாசரம்","குரு வாசரம்","சுக்ர வாசரம்","சனி வாசரம்"],
  tithi: ["பிரதமை","த்விதியை","த்ருதியை","சதுர்த்தி","பஞ்சமி","ஷஷ்டி","சப்தமி","அஷ்டமி","நவமி","தசமி","ஏகாதசி","துவாதசி","த்ரயோதசி","சதுர்தசி","பௌர்ணமி","பிரதமை","த்விதியை","த்ருதியை","சதுர்த்தி","பஞ்சமி","ஷஷ்டி","சப்தமி","அஷ்டமி","நவமி","தசமி","ஏகாதசி","துவாதசி","த்ரயோதசி","சதுர்தசி","அமாவாசை"],
  nak: ["அஸ்வினி","பரணி","கிருத்திகை","ரோகிணி","மிருகசீரிஷம்","திருவாதிரை","புனர்பூசம்","பூசம்","ஆயில்யம்","மகம்","பூரம்","உத்திரம்","அஸ்தம்","சித்திரை","சுவாதி","விசாகம்","அனுஷம்","கேட்டை","மூலம்","பூராடம்","உத்திராடம்","திருவோணம்","அவிட்டம்","சதயம்","பூரட்டாதி","உத்திரட்டாதி","ரேவதி"],
  yoga: ["விஷ்கம்பம்","பிரீதி","ஆயுஷ்மான்","சௌபாக்கியம்","சோபனம்","அதிகண்டம்","சுகர்மா","த்ருதி","சூலம்","கண்டம்","வ்ருத்தி","த்ருவம்","வ்யாகாதம்","ஹர்ஷணம்","வஜ்ரம்","சித்தி","வ்யதீபாதம்","வரீயான்","பரிகம்","சிவம்","சித்தம்","சாத்தியம்","சுபம்","சுக்லம்","பிரம்மம்","இந்த்ரம்","வைத்ருதி"],
  karana: ["பவம்","பாலவம்","கௌலவம்","தைதிலம்","கரம்","வணிஜம்","விஷ்டி","சகுனி","சதுஷ்பாதம்","நாகம்","கிம்ஸ்துக்னம்"],
  masa: ["சித்திரை","வைகாசி","ஆனி","ஆடி","ஆவணி","புரட்டாசி","ஐப்பசி","கார்த்திகை","மார்கழி","தை","மாசி","பங்குனி"],
  rashi: ["மேஷம்","ரிஷபம்","மிதுனம்","கர்கடகம்","சிம்மம்","கன்னி","துலாம்","விருச்சிகம்","தனுசு","மகரம்","கும்பம்","மீனம்"],
  ritu: ["வசந்தம்","வசந்தம்","கிரீஷ்மம்","கிரீஷ்மம்","வர்ஷம்","வர்ஷம்","சரத்","சரத்","ஹேமந்தம்","ஹேமந்தம்","சிசிரம்","சிசிரம்"],
  ayana: ["உத்தராயணம்","உத்தராயணம்","உத்தராயணம்","தக்ஷிணாயனம்","தக்ஷிணாயனம்","தக்ஷிணாயனம்","தக்ஷிணாயனம்","தக்ஷிணாயனம்","தக்ஷிணாயனம்","உத்தராயணம்","உத்தராயணம்","உத்தராயணம்"],
  shuklaPaksha: "சுக்ல பக்ஷம்", krishnaPaksha: "கிருஷ்ண பக்ஷம்", shuklaSuffix: "சு", krishnaSuffix: "கி",
  month: ["ஜனவரி","பிப்ரவரி","மார்ச்","ஏப்ரல்","மே","ஜூன்","ஜூலை","ஆகஸ்ட்","செப்டம்பர்","அக்டோபர்","நவம்பர்","டிசம்பர்"],
  labels: {
    vara:"வாரம்", samvatsaraLabel:"சம்வத்சரம்", ayanaritu:"அயனம் / ருது", masapaksha:"மாதம் / பக்ஷம்",
    tithiLabel:"திதி", nakLabel:"நட்சத்திரம்", yogaLabel:"யோகம்", karanaLabel:"கரணம்",
    sunRashi:"சூரிய ராசி", moonRashi:"சந்திர ராசி", sunrise:"சூர்யோதயம்", sunset:"சூர்யாஸ்தமனம்",
    varjyam:"வர்ஜ்யம்", amritakalam:"அம்ருத காலம்", durmuhurtam:"துர்முஹூர்தம்",
    rahuKaal:"ராகு காலம்", yamaGanda:"யமகண்டம்", guliKaal:"குளிக காலம்",
    next:"அடுத்தது", upto:"வரை",
    auspicious:"சுப முஹூர்தங்கள்", pournami:"பௌர்ணமி", amavasya:"அமாவாசை",
    ekadashi:"ஏகாதசி", ugadi:"உகாதி", today:"இன்று",
    whatsapp:"💬 WhatsApp", poster:"🖼️ போஸ்டர்", pdf:"⬇️ PDF",
    masaLabel:"மாதம்", pakshaLabel:"பக்ஷம்", rituLabel:"ருது", ayanaLabel:"அயனம்",
    rashuluSunrise:"ராசி & சூர்யோதயம்",
    ashubhaKaala:"அசுப காலங்கள்", kaalamanam:"கால மானம்", panchangaAngalu:"பஞ்சாங்க அங்கம்",
  }
};

const KN: PanchangaLang = {
  title: "ಪಂಚಾಂಗ ಕ್ಯಾಲೆಂಡರ್",
  todaySummary: "ಇಂದಿನ ಸಾರಾಂಶ",
  fullDetails: "ಸಂಪೂರ್ಣ ವಿವರ →",
  inauspicious: "ಅಶುಭ ಕಾಲಗಳು",
  greeting: "ಶ್ರೀ ಗುರುಭ್ಯೋ ನಮಃ",
  samvatsara: "ನಾಮ ಸಂವತ್ಸರ",
  changeLanguage: "ಭಾಷೆ ಬದಲಿಸಿ ↩",
  clickDate: "ದಿನಾಂಕ ಕ್ಲಿಕ್ ಮಾಡಿ → ಪೂರ್ಣ ಪಂಚಾಂಗ",
  aiNote: "* AI generated — DrikPanchang ನಲ್ಲಿ verify ಮಾಡಿ",
  varaShort: ["ಭಾನು","ಸೋಮ","ಮಂಗಳ","ಬುಧ","ಗುರು","ಶುಕ್ರ","ಶನಿ"],
  varaFull:  ["ಭಾನುವಾರ","ಸೋಮವಾರ","ಮಂಗಳವಾರ","ಬುಧವಾರ","ಗುರುವಾರ","ಶುಕ್ರವಾರ","ಶನಿವಾರ"],
  varaLong:  ["ಭಾನು ವಾಸರ","ಸೋಮ ವಾಸರ","ಮಂಗಳ ವಾಸರ","ಬುಧ ವಾಸರ","ಗುರು ವಾಸರ","ಶುಕ್ರ ವಾಸರ","ಶನಿ ವಾಸರ"],
  tithi: ["ಪಾಡ್ಯ","ಬಿದಿಗೆ","ತದಿಗೆ","ಚೌತಿ","ಪಂಚಮಿ","ಷಷ್ಠಿ","ಸಪ್ತಮಿ","ಅಷ್ಟಮಿ","ನವಮಿ","ದಶಮಿ","ಏಕಾದಶಿ","ದ್ವಾದಶಿ","ತ್ರಯೋದಶಿ","ಚತುರ್ದಶಿ","ಹುಣ್ಣಿಮೆ","ಪಾಡ್ಯ","ಬಿದಿಗೆ","ತದಿಗೆ","ಚೌತಿ","ಪಂಚಮಿ","ಷಷ್ಠಿ","ಸಪ್ತಮಿ","ಅಷ್ಟಮಿ","ನವಮಿ","ದಶಮಿ","ಏಕಾದಶಿ","ದ್ವಾದಶಿ","ತ್ರಯೋದಶಿ","ಚತುರ್ದಶಿ","ಅಮಾವಾಸ್ಯೆ"],
  nak: ["ಅಶ್ವಿನಿ","ಭರಣಿ","ಕೃತ್ತಿಕಾ","ರೋಹಿಣಿ","ಮೃಗಶಿರ","ಆರ್ದ್ರಾ","ಪುನರ್ವಸು","ಪುಷ್ಯ","ಆಶ್ಲೇಷಾ","ಮಖ","ಪೂರ್ವ ಫಲ್ಗುಣಿ","ಉತ್ತರ ಫಲ್ಗುಣಿ","ಹಸ್ತ","ಚಿತ್ರಾ","ಸ್ವಾತಿ","ವಿಶಾಖ","ಅನುರಾಧ","ಜ್ಯೇಷ್ಠ","ಮೂಲ","ಪೂರ್ವಾಷಾಢ","ಉತ್ತರಾಷಾಢ","ಶ್ರವಣ","ಧನಿಷ್ಠ","ಶತಭಿಷ","ಪೂರ್ವಾಭಾದ್ರ","ಉತ್ತರಾಭಾದ್ರ","ರೇವತಿ"],
  yoga: ["ವಿಷ್ಕಂಭ","ಪ್ರೀತಿ","ಆಯುಷ್ಮಾನ್","ಸೌಭಾಗ್ಯ","ಶೋಭನ","ಅತಿಗಂಡ","ಸುಕರ್ಮ","ಧೃತಿ","ಶೂಲ","ಗಂಡ","ವೃದ್ಧಿ","ಧ್ರುವ","ವ್ಯಾಘಾತ","ಹರ್ಷಣ","ವಜ್ರ","ಸಿದ್ಧಿ","ವ್ಯತೀಪಾತ","ವರೀಯಾನ್","ಪರಿಘ","ಶಿವ","ಸಿದ್ಧ","ಸಾಧ್ಯ","ಶುಭ","ಶುಕ್ಲ","ಬ್ರಹ್ಮ","ಇಂದ್ರ","ವೈಧೃತಿ"],
  karana: ["ಬವ","ಬಾಲವ","ಕೌಲವ","ತೈತಿಲ","ಗರ","ವಣಿಜ","ವಿಷ್ಟಿ","ಶಕುನಿ","ಚತುಷ್ಪಾದ","ನಾಗ","ಕಿಂಸ್ತುಘ್ನ"],
  masa: ["ಚೈತ್ರ","ವೈಶಾಖ","ಜ್ಯೇಷ್ಠ","ಆಷಾಢ","ಶ್ರಾವಣ","ಭಾದ್ರಪದ","ಆಶ್ವಯುಜ","ಕಾರ್ತೀಕ","ಮಾರ್ಗಶಿರ","ಪುಷ್ಯ","ಮಾಘ","ಫಾಲ್ಗುಣ"],
  rashi: ["ಮೇಷ","ವೃಷಭ","ಮಿಥುನ","ಕರ್ಕಾಟ","ಸಿಂಹ","ಕನ್ಯಾ","ತುಲಾ","ವೃಶ್ಚಿಕ","ಧನು","ಮಕರ","ಕುಂಭ","ಮೀನ"],
  ritu: ["ವಸಂತ","ವಸಂತ","ಗ್ರೀಷ್ಮ","ಗ್ರೀಷ್ಮ","ವರ್ಷ","ವರ್ಷ","ಶರದ್","ಶರದ್","ಹೇಮಂತ","ಹೇಮಂತ","ಶಿಶಿರ","ಶಿಶಿರ"],
  ayana: ["ಉತ್ತರಾಯಣ","ಉತ್ತರಾಯಣ","ಉತ್ತರಾಯಣ","ದಕ್ಷಿಣಾಯನ","ದಕ್ಷಿಣಾಯನ","ದಕ್ಷಿಣಾಯನ","ದಕ್ಷಿಣಾಯನ","ದಕ್ಷಿಣಾಯನ","ದಕ್ಷಿಣಾಯನ","ಉತ್ತರಾಯಣ","ಉತ್ತರಾಯಣ","ಉತ್ತರಾಯಣ"],
  shuklaPaksha: "ಶುಕ್ಲ ಪಕ್ಷ", krishnaPaksha: "ಕೃಷ್ಣ ಪಕ್ಷ", shuklaSuffix: "ಶು", krishnaSuffix: "ಕೃ",
  month: ["ಜನವರಿ","ಫೆಬ್ರವರಿ","ಮಾರ್ಚ್","ಏಪ್ರಿಲ್","ಮೇ","ಜೂನ್","ಜುಲೈ","ಆಗಸ್ಟ್","ಸೆಪ್ಟೆಂಬರ್","ಅಕ್ಟೋಬರ್","ನವೆಂಬರ್","ಡಿಸೆಂಬರ್"],
  labels: {
    vara:"ವಾರ", samvatsaraLabel:"ಸಂವತ್ಸರ", ayanaritu:"ಅಯನ / ಋತು", masapaksha:"ಮಾಸ / ಪಕ್ಷ",
    tithiLabel:"ತಿಥಿ", nakLabel:"ನಕ್ಷತ್ರ", yogaLabel:"ಯೋಗ", karanaLabel:"ಕರಣ",
    sunRashi:"ಸೂರ್ಯ ರಾಶಿ", moonRashi:"ಚಂದ್ರ ರಾಶಿ", sunrise:"ಸೂರ್ಯೋದಯ", sunset:"ಸೂರ್ಯಾಸ್ತ",
    varjyam:"ವರ್ಜ್ಯ", amritakalam:"ಅಮೃತ ಕಾಲ", durmuhurtam:"ದುರ್ಮುಹೂರ್ತ",
    rahuKaal:"ರಾಹು ಕಾಲ", yamaGanda:"ಯಮಗಂಡ", guliKaal:"ಗುಳಿಕ ಕಾಲ",
    next:"ಮುಂದಿನದು", upto:"ವರೆಗೆ",
    auspicious:"ಶುಭ ಮುಹೂರ್ತ", pournami:"ಹುಣ್ಣಿಮೆ", amavasya:"ಅಮಾವಾಸ್ಯೆ",
    ekadashi:"ಏಕಾದಶಿ", ugadi:"ಉಗಾದಿ", today:"ಇಂದು",
    whatsapp:"💬 WhatsApp", poster:"🖼️ ಪೋಸ್ಟರ್", pdf:"⬇️ PDF",
    masaLabel:"ಮಾಸ", pakshaLabel:"ಪಕ್ಷ", rituLabel:"ಋತು", ayanaLabel:"ಅಯನ",
    rashuluSunrise:"ರಾಶಿ & ಸೂರ್ಯೋದಯ",
    ashubhaKaala:"ಅಶುಭ ಕಾಲ", kaalamanam:"ಕಾಲ ಮಾನ", panchangaAngalu:"ಪಂಚಾಂಗ ಅಂಗಗಳು",
  }
};

const ML: PanchangaLang = {
  title: "പഞ്ചാംഗം കലണ്ടർ",
  todaySummary: "ഇന്നത്തെ സംഗ്രഹം",
  fullDetails: "പൂർണ്ണ വിവരങ്ങൾ →",
  inauspicious: "അശുഭ കാലങ്ങൾ",
  greeting: "ശ്രീ ഗുരുഭ്യോ നമഃ",
  samvatsara: "നാമ സംവത്സരം",
  changeLanguage: "ഭാഷ മാറ്റുക ↩",
  clickDate: "തീയതി ക്ലിക്ക് ചെയ്യുക → പൂർണ്ണ പഞ്ചാംഗം",
  aiNote: "* AI generated — DrikPanchang-ൽ verify ചെയ്യുക",
  varaShort: ["ഞായർ","തിങ്ക","ചൊവ്വ","ബുധ","വ്യാഴ","വെള്ളി","ശനി"],
  varaFull:  ["ഞായറാഴ്ച","തിങ്കളാഴ്ച","ചൊവ്വാഴ്ച","ബുധനാഴ്ച","വ്യാഴാഴ്ച","വെള്ളിയാഴ്ച","ശനിയാഴ്ച"],
  varaLong:  ["ഭാനു വാസരം","സോമ വാസരം","മംഗള വാസരം","ബുധ വാസരം","ഗുരു വാസരം","ശുക്ര വാസരം","ശനി വാസരം"],
  tithi: ["പ്രതിപദ","ദ്വിതീയ","തൃതീയ","ചതുർഥി","പഞ്ചമി","ഷഷ്ഠി","സപ്തമി","അഷ്ടമി","നവമി","ദശമി","ഏകാദശി","ദ്വാദശി","ത്രയോദശി","ചതുർദശി","പൗർണ്ണമി","പ്രതിപദ","ദ്വിതീയ","തൃതീയ","ചതുർഥി","പഞ്ചമി","ഷഷ്ഠി","സപ്തമി","അഷ്ടമി","നവമി","ദശമി","ഏകാദശി","ദ്വാദശി","ത്രയോദശി","ചതുർദശി","അമാവാസി"],
  nak: ["അശ്വതി","ഭരണി","കാർത്തിക","രോഹിണി","മകയിരം","തിരുവാതിര","പുനർതം","പൂയം","ആയില്യം","മകം","പൂരം","ഉത്രം","അത്തം","ചിത്തിര","ചോതി","വിശാഖം","അനിഴം","തൃക്കേട്ട","മൂലം","പൂരാടം","ഉത്രാടം","തിരുവോണം","അവിട്ടം","ചതയം","പൂരുരുട്ടാതി","ഉത്രട്ടാതി","രേവതി"],
  yoga: ["വിഷ്കംഭം","പ്രീതി","ആയുഷ്മാൻ","സൗഭാഗ്യ","ശോഭന","അതിഗണ്ഡ","സുകർമ","ധൃതി","ശൂല","ഗണ്ഡ","വൃദ്ധി","ധ്രുവ","വ്യാഘാത","ഹർഷണ","വജ്ര","സിദ്ധി","വ്യതീപാത","വരീയാൻ","പരിഘ","ശിവ","സിദ്ധ","സാധ്യ","ശുഭ","ശുക്ല","ബ്രഹ്മ","ഇന്ദ്ര","വൈധൃതി"],
  karana: ["ബവ","ബാലവ","കൗലവ","തൈതില","ഗര","വണിജ","വിഷ്ടി","ശകുനി","ചതുഷ്പാദ","നാഗ","കിംസ്തുഘ്ന"],
  masa: ["ചിങ്ങം","കന്നി","തുലാം","വൃശ്ചികം","ധനു","മകരം","കുംഭം","മീനം","മേടം","ഇടവം","മിഥുനം","കർക്കടകം"],
  rashi: ["മേടം","ഇടവം","മിഥുനം","കർക്കടകം","ചിങ്ങം","കന്നി","തുലാം","വൃശ്ചികം","ധനു","മകരം","കുംഭം","മീനം"],
  ritu: ["വസന്ത","വസന്ത","ഗ്രീഷ്മ","ഗ്രീഷ്മ","വർഷ","വർഷ","ശരദ്","ശരദ്","ഹേമന്ത","ഹേമന്ത","ശിശിര","ശിശിര"],
  ayana: ["ഉത്തരായണം","ഉത്തരായണം","ഉത്തരായണം","ദക്ഷിണായനം","ദക്ഷിണായനം","ദക്ഷിണായനം","ദക്ഷിണായനം","ദക്ഷിണായനം","ദക്ഷിണായനം","ഉത്തരായണം","ഉത്തരായണം","ഉത്തരായണം"],
  shuklaPaksha: "ശുക്ല പക്ഷം", krishnaPaksha: "കൃഷ്ണ പക്ഷം", shuklaSuffix: "ശു", krishnaSuffix: "കൃ",
  month: ["ജനുവരി","ഫെബ്രുവരി","മാർച്ച്","ഏപ്രിൽ","മേയ്","ജൂൺ","ജൂലൈ","ഓഗസ്റ്റ്","സെപ്റ്റംബർ","ഒക്ടോബർ","നവംബർ","ഡിസംബർ"],
  labels: {
    vara:"വാരം", samvatsaraLabel:"സംവത്സരം", ayanaritu:"അയനം / ഋതു", masapaksha:"മാസം / പക്ഷം",
    tithiLabel:"തിഥി", nakLabel:"നക്ഷത്രം", yogaLabel:"യോഗം", karanaLabel:"കരണം",
    sunRashi:"സൂര്യ രാശി", moonRashi:"ചന്ദ്ര രാശി", sunrise:"സൂര്യോദയം", sunset:"സൂര്യാസ്തമയം",
    varjyam:"വർജ്യം", amritakalam:"അമൃത കാലം", durmuhurtam:"ദുർമുഹൂർത്തം",
    rahuKaal:"രാഹുകാലം", yamaGanda:"യമഗണ്ഡം", guliKaal:"ഗുളിക കാലം",
    next:"അടുത്തത്", upto:"വരെ",
    auspicious:"ശുഭ മുഹൂർത്തം", pournami:"പൗർണ്ണമി", amavasya:"അമാവാസി",
    ekadashi:"ഏകാദശി", ugadi:"ഉഗാദി", today:"ഇന്ന്",
    whatsapp:"💬 WhatsApp", poster:"🖼️ പോസ്റ്റർ", pdf:"⬇️ PDF",
    masaLabel:"മാസം", pakshaLabel:"പക്ഷം", rituLabel:"ഋതു", ayanaLabel:"അയനം",
    rashuluSunrise:"രാശി & സൂര്യോദയം",
    ashubhaKaala:"അശുഭ കാലങ്ങൾ", kaalamanam:"കാല മാനം", panchangaAngalu:"പഞ്ചാംഗ അംഗങ്ങൾ",
  }
};

const MR: PanchangaLang = {
  title: "पंचांग दिनदर्शिका",
  todaySummary: "आजचा सारांश",
  fullDetails: "संपूर्ण माहिती →",
  inauspicious: "अशुभ काल",
  greeting: "श्री गुरुभ्यो नमः",
  samvatsara: "नाम संवत्सर",
  changeLanguage: "भाषा बदला ↩",
  clickDate: "तारखेवर क्लिक करा → पूर्ण पंचांग",
  aiNote: "* AI generated — DrikPanchang वर verify करा",
  varaShort: ["रवि","सोम","मंगळ","बुध","गुरु","शुक्र","शनि"],
  varaFull:  ["रविवार","सोमवार","मंगळवार","बुधवार","गुरुवार","शुक्रवार","शनिवार"],
  varaLong:  ["भानु वासर","सोम वासर","मंगळ वासर","बुध वासर","गुरु वासर","शुक्र वासर","शनि वासर"],
  tithi: ["प्रतिपदा","द्वितीया","तृतीया","चतुर्थी","पंचमी","षष्ठी","सप्तमी","अष्टमी","नवमी","दशमी","एकादशी","द्वादशी","त्रयोदशी","चतुर्दशी","पौर्णिमा","प्रतिपदा","द्वितीया","तृतीया","चतुर्थी","पंचमी","षष्ठी","सप्तमी","अष्टमी","नवमी","दशमी","एकादशी","द्वादशी","त्रयोदशी","चतुर्दशी","अमावस्या"],
  nak: ["अश्विनी","भरणी","कृत्तिका","रोहिणी","मृगशीर्ष","आर्द्रा","पुनर्वसु","पुष्य","आश्लेषा","मघा","पूर्व फाल्गुनी","उत्तर फाल्गुनी","हस्त","चित्रा","स्वाती","विशाखा","अनुराधा","ज्येष्ठा","मूळ","पूर्वाषाढा","उत्तराषाढा","श्रवण","धनिष्ठा","शतभिषा","पूर्व भाद्रपदा","उत्तर भाद्रपदा","रेवती"],
  yoga: ["विष्कंभ","प्रीति","आयुष्मान्","सौभाग्य","शोभन","अतिगंड","सुकर्मा","धृति","शूल","गंड","वृद्धि","ध्रुव","व्याघात","हर्षण","वज्र","सिद्धि","व्यतीपात","वरीयान्","परिघ","शिव","सिद्ध","साध्य","शुभ","शुक्ल","ब्रह्म","इंद्र","वैधृती"],
  karana: ["बव","बालव","कौलव","तैतिल","गर","वणिज","विष्टि","शकुनि","चतुष्पाद","नाग","किंस्तुघ्न"],
  masa: ["चैत्र","वैशाख","ज्येष्ठ","आषाढ","श्रावण","भाद्रपद","आश्विन","कार्तिक","मार्गशीर्ष","पौष","माघ","फाल्गुन"],
  rashi: ["मेष","वृषभ","मिथुन","कर्क","सिंह","कन्या","तुला","वृश्चिक","धनु","मकर","कुंभ","मीन"],
  ritu: ["वसंत","वसंत","ग्रीष्म","ग्रीष्म","वर्षा","वर्षा","शरद","शरद","हेमंत","हेमंत","शिशिर","शिशिर"],
  ayana: ["उत्तरायण","उत्तरायण","उत्तरायण","दक्षिणायन","दक्षिणायन","दक्षिणायन","दक्षिणायन","दक्षिणायन","दक्षिणायन","उत्तरायण","उत्तरायण","उत्तरायण"],
  shuklaPaksha: "शुक्ल पक्ष", krishnaPaksha: "कृष्ण पक्ष", shuklaSuffix: "शु", krishnaSuffix: "कृ",
  month: ["जानेवारी","फेब्रुवारी","मार्च","एप्रिल","मे","जून","जुलै","ऑगस्ट","सप्टेंबर","ऑक्टोबर","नोव्हेंबर","डिसेंबर"],
  labels: {
    vara:"वार", samvatsaraLabel:"संवत्सर", ayanaritu:"अयन / ऋतु", masapaksha:"मास / पक्ष",
    tithiLabel:"तिथि", nakLabel:"नक्षत्र", yogaLabel:"योग", karanaLabel:"करण",
    sunRashi:"सूर्य राशी", moonRashi:"चंद्र राशी", sunrise:"सूर्योदय", sunset:"सूर्यास्त",
    varjyam:"वर्ज्य", amritakalam:"अमृत काल", durmuhurtam:"दुर्मुहूर्त",
    rahuKaal:"राहु काल", yamaGanda:"यमगंड", guliKaal:"गुलिक काल",
    next:"पुढचे", upto:"पर्यंत",
    auspicious:"शुभ मुहूर्त", pournami:"पौर्णिमा", amavasya:"अमावस्या",
    ekadashi:"एकादशी", ugadi:"उगादी", today:"आज",
    whatsapp:"💬 WhatsApp", poster:"🖼️ पोस्टर", pdf:"⬇️ PDF",
    masaLabel:"मास", pakshaLabel:"पक्ष", rituLabel:"ऋतु", ayanaLabel:"अयन",
    rashuluSunrise:"राशी & सूर्योदय",
    ashubhaKaala:"अशुभ काल", kaalamanam:"काल मान", panchangaAngalu:"पंचांग अंग",
  }
};

const EN: PanchangaLang = {
  title: "Panchanga Calendar",
  todaySummary: "Today's Summary",
  fullDetails: "Full Details →",
  inauspicious: "Inauspicious Times",
  greeting: "Sri Gurubhyo Namah",
  samvatsara: "Nama Samvatsara",
  changeLanguage: "Change Language ↩",
  clickDate: "Click a date → Full Panchanga",
  aiNote: "* AI generated — verify with DrikPanchang",
  varaShort: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],
  varaFull:  ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
  varaLong:  ["Bhanu Vasara","Soma Vasara","Mangala Vasara","Budha Vasara","Guru Vasara","Shukra Vasara","Shani Vasara"],
  tithi: ["Pratipadā","Dvitīyā","Tṛtīyā","Chaturthi","Pañcami","Ṣaṣṭhī","Saptami","Aṣṭami","Navami","Daśami","Ekādaśi","Dvādaśi","Trayodaśi","Chaturdaśi","Pūrṇimā","Pratipadā","Dvitīyā","Tṛtīyā","Chaturthi","Pañcami","Ṣaṣṭhī","Saptami","Aṣṭami","Navami","Daśami","Ekādaśi","Dvādaśi","Trayodaśi","Chaturdaśi","Amāvāsyā"],
  nak: ["Ashwini","Bharani","Krittika","Rohini","Mrigashira","Ardra","Punarvasu","Pushya","Ashlesha","Magha","Purva Phalguni","Uttara Phalguni","Hasta","Chitra","Swati","Vishakha","Anuradha","Jyeshtha","Moola","Purvashadha","Uttarashadha","Shravana","Dhanishtha","Shatabhisha","Purva Bhadrapada","Uttara Bhadrapada","Revati"],
  yoga: ["Vishkambha","Preeti","Ayushman","Saubhagya","Shobhana","Atiganda","Sukarma","Dhriti","Shula","Ganda","Vriddhi","Dhruva","Vyaghata","Harshana","Vajra","Siddhi","Vyatipata","Variyan","Parigha","Shiva","Siddha","Sadhya","Shubha","Shukla","Brahma","Indra","Vaidhriti"],
  karana: ["Bava","Balava","Kaulava","Taitila","Gara","Vanija","Vishti","Shakuni","Chatushpada","Naga","Kimstughna"],
  masa: ["Chaitra","Vaishakha","Jyeshtha","Ashadha","Shravana","Bhadrapada","Ashwayuja","Kartika","Margashira","Pushya","Magha","Phalguna"],
  rashi: ["Mesha","Vrishabha","Mithuna","Karkataka","Simha","Kanya","Tula","Vrischika","Dhanu","Makara","Kumbha","Meena"],
  ritu: ["Vasanta","Vasanta","Grishma","Grishma","Varsha","Varsha","Sharad","Sharad","Hemanta","Hemanta","Shishira","Shishira"],
  ayana: ["Uttarayana","Uttarayana","Uttarayana","Dakshinayana","Dakshinayana","Dakshinayana","Dakshinayana","Dakshinayana","Dakshinayana","Uttarayana","Uttarayana","Uttarayana"],
  shuklaPaksha: "Shukla Paksha", krishnaPaksha: "Krishna Paksha", shuklaSuffix: "Sh", krishnaSuffix: "Kr",
  month: ["January","February","March","April","May","June","July","August","September","October","November","December"],
  labels: {
    vara:"Vara", samvatsaraLabel:"Samvatsara", ayanaritu:"Ayana / Ritu", masapaksha:"Masa / Paksha",
    tithiLabel:"Tithi", nakLabel:"Nakshatra", yogaLabel:"Yoga", karanaLabel:"Karana",
    sunRashi:"Sun Rashi", moonRashi:"Moon Rashi", sunrise:"Sunrise", sunset:"Sunset",
    varjyam:"Varjyam", amritakalam:"Amritakalam", durmuhurtam:"Durmuhurtam",
    rahuKaal:"Rahu Kaal", yamaGanda:"Yama Ganda", guliKaal:"Gulika Kaal",
    next:"Next", upto:"upto",
    auspicious:"Auspicious Times", pournami:"Pournami", amavasya:"Amavasya",
    ekadashi:"Ekadashi", ugadi:"Ugadi", today:"Today",
    whatsapp:"💬 WhatsApp", poster:"🖼️ Poster", pdf:"⬇️ PDF",
    masaLabel:"Masa", pakshaLabel:"Paksha", rituLabel:"Ritu", ayanaLabel:"Ayana",
    rashuluSunrise:"Rashi & Sunrise",
    ashubhaKaala:"Inauspicious", kaalamanam:"Kaala Manam", panchangaAngalu:"Panchanga Angalu",
  }
};

export const LANG_DATA: Record<LangCode, PanchangaLang> = { te: TE, hi: HI, ta: TA, kn: KN, ml: ML, mr: MR, en: EN };
export const getLang = (code: string): PanchangaLang => LANG_DATA[(code as LangCode)] ?? TE;