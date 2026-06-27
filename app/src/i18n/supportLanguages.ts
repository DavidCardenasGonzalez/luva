export type SupportLanguageOption = {
  code: string;
  englishName: string;
  nativeName: string;
  flag: string;
  searchTerms?: string[];
};

export const DEFAULT_SUPPORT_LANGUAGE = 'en';

// Curated from Google Translate supported language codes. Keep this list outside
// Settings so the picker UI stays small and the supported set is easy to update.
export const SUPPORT_LANGUAGE_OPTIONS: SupportLanguageOption[] = [
  { code: 'af', englishName: 'Afrikaans', nativeName: 'Afrikaans', flag: '🇿🇦' },
  { code: 'sq', englishName: 'Albanian', nativeName: 'Shqip', flag: '🇦🇱' },
  { code: 'am', englishName: 'Amharic', nativeName: 'አማርኛ', flag: '🇪🇹' },
  { code: 'ar', englishName: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'hy', englishName: 'Armenian', nativeName: 'Հայերեն', flag: '🇦🇲' },
  { code: 'as', englishName: 'Assamese', nativeName: 'অসমীয়া', flag: '🇮🇳' },
  { code: 'ay', englishName: 'Aymara', nativeName: 'Aymar aru', flag: '🇧🇴' },
  { code: 'az', englishName: 'Azerbaijani', nativeName: 'Azərbaycanca', flag: '🇦🇿' },
  { code: 'bm', englishName: 'Bambara', nativeName: 'Bamanankan', flag: '🇲🇱' },
  { code: 'eu', englishName: 'Basque', nativeName: 'Euskara', flag: '🇪🇸' },
  { code: 'be', englishName: 'Belarusian', nativeName: 'Беларуская', flag: '🇧🇾' },
  { code: 'bn', englishName: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩' },
  { code: 'bho', englishName: 'Bhojpuri', nativeName: 'भोजपुरी', flag: '🇮🇳' },
  { code: 'bs', englishName: 'Bosnian', nativeName: 'Bosanski', flag: '🇧🇦' },
  { code: 'bg', englishName: 'Bulgarian', nativeName: 'Български', flag: '🇧🇬' },
  { code: 'ca', englishName: 'Catalan', nativeName: 'Català', flag: '🇪🇸' },
  { code: 'ceb', englishName: 'Cebuano', nativeName: 'Cebuano', flag: '🇵🇭' },
  { code: 'ny', englishName: 'Chichewa', nativeName: 'Chichewa', flag: '🇲🇼', searchTerms: ['nyanja'] },
  { code: 'zh-CN', englishName: 'Chinese (Simplified)', nativeName: '简体中文', flag: '🇨🇳', searchTerms: ['mandarin', 'chinese simplified'] },
  { code: 'zh-TW', englishName: 'Chinese (Traditional)', nativeName: '繁體中文', flag: '🇹🇼', searchTerms: ['mandarin', 'chinese traditional'] },
  { code: 'co', englishName: 'Corsican', nativeName: 'Corsu', flag: '🇫🇷' },
  { code: 'hr', englishName: 'Croatian', nativeName: 'Hrvatski', flag: '🇭🇷' },
  { code: 'cs', englishName: 'Czech', nativeName: 'Čeština', flag: '🇨🇿' },
  { code: 'da', englishName: 'Danish', nativeName: 'Dansk', flag: '🇩🇰' },
  { code: 'dv', englishName: 'Divehi', nativeName: 'ދިވެހި', flag: '🇲🇻' },
  { code: 'doi', englishName: 'Dogri', nativeName: 'डोगरी', flag: '🇮🇳' },
  { code: 'nl', englishName: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'en', englishName: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'eo', englishName: 'Esperanto', nativeName: 'Esperanto', flag: '🌐' },
  { code: 'et', englishName: 'Estonian', nativeName: 'Eesti', flag: '🇪🇪' },
  { code: 'ee', englishName: 'Ewe', nativeName: 'Eʋegbe', flag: '🇬🇭' },
  { code: 'fil', englishName: 'Filipino', nativeName: 'Filipino', flag: '🇵🇭', searchTerms: ['tagalog', 'tl'] },
  { code: 'fi', englishName: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮' },
  { code: 'fr', englishName: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'fy', englishName: 'Frisian', nativeName: 'Frysk', flag: '🇳🇱' },
  { code: 'gl', englishName: 'Galician', nativeName: 'Galego', flag: '🇪🇸' },
  { code: 'ka', englishName: 'Georgian', nativeName: 'ქართული', flag: '🇬🇪' },
  { code: 'de', englishName: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'el', englishName: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'gn', englishName: 'Guarani', nativeName: 'Avañeʼẽ', flag: '🇵🇾' },
  { code: 'gu', englishName: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'ht', englishName: 'Haitian Creole', nativeName: 'Kreyòl ayisyen', flag: '🇭🇹' },
  { code: 'ha', englishName: 'Hausa', nativeName: 'Hausa', flag: '🇳🇬' },
  { code: 'haw', englishName: 'Hawaiian', nativeName: 'ʻŌlelo Hawaiʻi', flag: '🇺🇸' },
  { code: 'he', englishName: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱', searchTerms: ['iw'] },
  { code: 'hi', englishName: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'hmn', englishName: 'Hmong', nativeName: 'Hmoob', flag: '🇱🇦' },
  { code: 'hu', englishName: 'Hungarian', nativeName: 'Magyar', flag: '🇭🇺' },
  { code: 'is', englishName: 'Icelandic', nativeName: 'Íslenska', flag: '🇮🇸' },
  { code: 'ig', englishName: 'Igbo', nativeName: 'Igbo', flag: '🇳🇬' },
  { code: 'ilo', englishName: 'Ilocano', nativeName: 'Ilokano', flag: '🇵🇭' },
  { code: 'id', englishName: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'ga', englishName: 'Irish', nativeName: 'Gaeilge', flag: '🇮🇪' },
  { code: 'it', englishName: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'ja', englishName: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'jv', englishName: 'Javanese', nativeName: 'Basa Jawa', flag: '🇮🇩' },
  { code: 'kn', englishName: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'kk', englishName: 'Kazakh', nativeName: 'Қазақ тілі', flag: '🇰🇿' },
  { code: 'km', englishName: 'Khmer', nativeName: 'ខ្មែរ', flag: '🇰🇭' },
  { code: 'rw', englishName: 'Kinyarwanda', nativeName: 'Ikinyarwanda', flag: '🇷🇼' },
  { code: 'gom', englishName: 'Konkani', nativeName: 'कोंकणी', flag: '🇮🇳' },
  { code: 'ko', englishName: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'kri', englishName: 'Krio', nativeName: 'Krio', flag: '🇸🇱' },
  { code: 'ku', englishName: 'Kurdish (Kurmanji)', nativeName: 'Kurdî', flag: '🇹🇷' },
  { code: 'ckb', englishName: 'Kurdish (Sorani)', nativeName: 'کوردی', flag: '🇮🇶' },
  { code: 'ky', englishName: 'Kyrgyz', nativeName: 'Кыргызча', flag: '🇰🇬' },
  { code: 'lo', englishName: 'Lao', nativeName: 'ລາວ', flag: '🇱🇦' },
  { code: 'la', englishName: 'Latin', nativeName: 'Latina', flag: '🇻🇦' },
  { code: 'lv', englishName: 'Latvian', nativeName: 'Latviešu', flag: '🇱🇻' },
  { code: 'ln', englishName: 'Lingala', nativeName: 'Lingála', flag: '🇨🇩' },
  { code: 'lt', englishName: 'Lithuanian', nativeName: 'Lietuvių', flag: '🇱🇹' },
  { code: 'lg', englishName: 'Luganda', nativeName: 'Luganda', flag: '🇺🇬' },
  { code: 'lb', englishName: 'Luxembourgish', nativeName: 'Lëtzebuergesch', flag: '🇱🇺' },
  { code: 'mk', englishName: 'Macedonian', nativeName: 'Македонски', flag: '🇲🇰' },
  { code: 'mai', englishName: 'Maithili', nativeName: 'मैथिली', flag: '🇮🇳' },
  { code: 'mg', englishName: 'Malagasy', nativeName: 'Malagasy', flag: '🇲🇬' },
  { code: 'ms', englishName: 'Malay', nativeName: 'Bahasa Melayu', flag: '🇲🇾' },
  { code: 'ml', englishName: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
  { code: 'mt', englishName: 'Maltese', nativeName: 'Malti', flag: '🇲🇹' },
  { code: 'mi', englishName: 'Maori', nativeName: 'Māori', flag: '🇳🇿' },
  { code: 'mr', englishName: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  { code: 'mni-Mtei', englishName: 'Meiteilon', nativeName: 'ꯃꯤꯇꯩꯂꯣꯟ', flag: '🇮🇳', searchTerms: ['manipuri'] },
  { code: 'lus', englishName: 'Mizo', nativeName: 'Mizo ṭawng', flag: '🇮🇳' },
  { code: 'mn', englishName: 'Mongolian', nativeName: 'Монгол', flag: '🇲🇳' },
  { code: 'my', englishName: 'Myanmar (Burmese)', nativeName: 'မြန်မာ', flag: '🇲🇲', searchTerms: ['burmese'] },
  { code: 'ne', englishName: 'Nepali', nativeName: 'नेपाली', flag: '🇳🇵' },
  { code: 'no', englishName: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴', searchTerms: ['nb', 'bokmal'] },
  { code: 'or', englishName: 'Odia', nativeName: 'ଓଡ଼ିଆ', flag: '🇮🇳', searchTerms: ['oriya'] },
  { code: 'om', englishName: 'Oromo', nativeName: 'Afaan Oromoo', flag: '🇪🇹' },
  { code: 'ps', englishName: 'Pashto', nativeName: 'پښتو', flag: '🇦🇫' },
  { code: 'fa', englishName: 'Persian', nativeName: 'فارسی', flag: '🇮🇷', searchTerms: ['farsi'] },
  { code: 'pl', englishName: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  { code: 'pt', englishName: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
  { code: 'pa', englishName: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'qu', englishName: 'Quechua', nativeName: 'Runasimi', flag: '🇵🇪' },
  { code: 'ro', englishName: 'Romanian', nativeName: 'Română', flag: '🇷🇴' },
  { code: 'ru', englishName: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'sm', englishName: 'Samoan', nativeName: 'Gagana Samoa', flag: '🇼🇸' },
  { code: 'sa', englishName: 'Sanskrit', nativeName: 'संस्कृतम्', flag: '🇮🇳' },
  { code: 'gd', englishName: 'Scots Gaelic', nativeName: 'Gàidhlig', flag: '🇬🇧' },
  { code: 'nso', englishName: 'Sepedi', nativeName: 'Sepedi', flag: '🇿🇦' },
  { code: 'sr', englishName: 'Serbian', nativeName: 'Српски', flag: '🇷🇸' },
  { code: 'st', englishName: 'Sesotho', nativeName: 'Sesotho', flag: '🇱🇸' },
  { code: 'sn', englishName: 'Shona', nativeName: 'ChiShona', flag: '🇿🇼' },
  { code: 'sd', englishName: 'Sindhi', nativeName: 'سنڌي', flag: '🇵🇰' },
  { code: 'si', englishName: 'Sinhala', nativeName: 'සිංහල', flag: '🇱🇰' },
  { code: 'sk', englishName: 'Slovak', nativeName: 'Slovenčina', flag: '🇸🇰' },
  { code: 'sl', englishName: 'Slovenian', nativeName: 'Slovenščina', flag: '🇸🇮' },
  { code: 'so', englishName: 'Somali', nativeName: 'Soomaali', flag: '🇸🇴' },
  { code: 'es', englishName: 'Spanish', nativeName: 'Español', flag: '🇲🇽' },
  { code: 'su', englishName: 'Sundanese', nativeName: 'Basa Sunda', flag: '🇮🇩' },
  { code: 'sw', englishName: 'Swahili', nativeName: 'Kiswahili', flag: '🇹🇿' },
  { code: 'sv', englishName: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪' },
  { code: 'tg', englishName: 'Tajik', nativeName: 'Тоҷикӣ', flag: '🇹🇯' },
  { code: 'ta', englishName: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'tt', englishName: 'Tatar', nativeName: 'Татарча', flag: '🇷🇺' },
  { code: 'te', englishName: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'th', englishName: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
  { code: 'ti', englishName: 'Tigrinya', nativeName: 'ትግርኛ', flag: '🇪🇷' },
  { code: 'ts', englishName: 'Tsonga', nativeName: 'Tsonga', flag: '🇿🇦' },
  { code: 'tr', englishName: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'tk', englishName: 'Turkmen', nativeName: 'Türkmençe', flag: '🇹🇲' },
  { code: 'ak', englishName: 'Twi', nativeName: 'Twi', flag: '🇬🇭' },
  { code: 'uk', englishName: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦' },
  { code: 'ur', englishName: 'Urdu', nativeName: 'اردو', flag: '🇵🇰' },
  { code: 'ug', englishName: 'Uyghur', nativeName: 'ئۇيغۇرچە', flag: '🇨🇳' },
  { code: 'uz', englishName: 'Uzbek', nativeName: 'Oʻzbekcha', flag: '🇺🇿' },
  { code: 'vi', englishName: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'cy', englishName: 'Welsh', nativeName: 'Cymraeg', flag: '🏴' },
  { code: 'xh', englishName: 'Xhosa', nativeName: 'IsiXhosa', flag: '🇿🇦' },
  { code: 'yi', englishName: 'Yiddish', nativeName: 'ייִדיש', flag: '🇮🇱' },
  { code: 'yo', englishName: 'Yoruba', nativeName: 'Yorùbá', flag: '🇳🇬' },
  { code: 'zu', englishName: 'Zulu', nativeName: 'IsiZulu', flag: '🇿🇦' },
];

const CODE_ALIASES: Record<string, string> = {
  iw: 'he',
  tl: 'fil',
  nb: 'no',
  zh: 'zh-CN',
  'zh-hans': 'zh-CN',
  'zh-cn': 'zh-CN',
  'zh-sg': 'zh-CN',
  'zh-hant': 'zh-TW',
  'zh-tw': 'zh-TW',
  'zh-hk': 'zh-TW',
  'pt-br': 'pt',
  'pt-pt': 'pt',
};

const OPTION_BY_CODE = new Map(
  SUPPORT_LANGUAGE_OPTIONS.map((option) => [option.code.toLowerCase(), option]),
);

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function normalizeSupportLanguageCode(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const cleaned = value.trim().replace(/_/g, '-');
  if (!cleaned) return undefined;

  const lower = cleaned.toLowerCase();
  const alias = CODE_ALIASES[lower];
  if (alias && OPTION_BY_CODE.has(alias.toLowerCase())) return alias;

  const exact = OPTION_BY_CODE.get(lower);
  if (exact) return exact.code;

  const [languagePart] = lower.split('-');
  const languageAlias = CODE_ALIASES[languagePart];
  if (languageAlias && OPTION_BY_CODE.has(languageAlias.toLowerCase())) return languageAlias;

  const base = OPTION_BY_CODE.get(languagePart);
  return base?.code;
}

export function getSupportLanguageOption(code: string): SupportLanguageOption {
  return OPTION_BY_CODE.get(code.toLowerCase()) || SUPPORT_LANGUAGE_OPTIONS.find((option) => option.code === DEFAULT_SUPPORT_LANGUAGE)!;
}

export function getSupportLanguageDisplayName(code: string, uiLanguage: 'en' | 'es' = 'en'): string {
  const option = getSupportLanguageOption(code);
  if (uiLanguage === 'es') {
    return `${option.nativeName} (${option.englishName})`;
  }
  return `${option.englishName} (${option.nativeName})`;
}

export function searchSupportLanguages(query: string, limit = 12): SupportLanguageOption[] {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return SUPPORT_LANGUAGE_OPTIONS.slice(0, limit);

  return SUPPORT_LANGUAGE_OPTIONS
    .map((option) => {
      const fields = [
        option.code,
        option.englishName,
        option.nativeName,
        ...(option.searchTerms || []),
      ].map(normalizeSearchText);
      const startsWith = fields.some((field) => field.startsWith(normalizedQuery));
      const includes = fields.some((field) => field.includes(normalizedQuery));
      return {
        option,
        score: startsWith ? 2 : includes ? 1 : 0,
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.option.englishName.localeCompare(b.option.englishName))
    .slice(0, limit)
    .map((item) => item.option);
}
