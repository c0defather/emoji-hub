import type { Locale } from '@/lib/emoji'

export const LOCALE_LABELS: Record<Locale, { short: string; native: string }> =
  {
    en: { short: 'EN', native: 'English' },
    ru: { short: 'RU', native: 'Русский' },
    kz: { short: 'KZ', native: 'Қазақша' },
  }

/** `kz` is our storage key for Kazakh; Intl and `lang` attributes want `kk`. */
export const BCP47: Record<Locale, string> = {
  en: 'en',
  ru: 'ru',
  kz: 'kk',
}

export interface Dictionary {
  tagline: string
  browse: string
  favorites: string
  language: string
  searchPlaceholder: string
  clearSearch: string
  category: string
  group: string
  sortBy: string
  allCategories: string
  allGroups: string
  sortName: string
  sortCategory: string
  sortGroup: string
  ascending: string
  descending: string
  reset: string
  showing: (shown: number, total: number) => string
  loadMore: string
  noResults: string
  noResultsHint: string
  loading: string
  loadFailed: string
  retry: string
  favoritesEmpty: string
  favoritesEmptyHint: string
  browseAll: string
  addToFavorites: string
  removeFromFavorites: string
  back: string
  description: string
  millennialMeaning: string
  zoomerMeaning: string
  details: string
  otherLanguages: string
  notTranslated: string
  originalName: string
  identifier: string
  unicode: string
  htmlCode: string
  updated: string
  copy: string
  copied: string
  copyEmoji: string
  notFoundTitle: string
  notFoundHint: string
  writtenBy: string
}

const en: Dictionary = {
  tagline: 'Every emoji, explained in three languages',
  browse: 'Browse',
  favorites: 'Favorites',
  language: 'Language',
  searchPlaceholder: 'Search by name, meaning, unicode…',
  clearSearch: 'Clear search',
  category: 'Category',
  group: 'Group',
  sortBy: 'Sort by',
  allCategories: 'All categories',
  allGroups: 'All groups',
  sortName: 'Name',
  sortCategory: 'Category',
  sortGroup: 'Group',
  ascending: 'Ascending',
  descending: 'Descending',
  reset: 'Reset',
  showing: (shown, total) =>
    shown === total
      ? `${total} ${total === 1 ? 'emoji' : 'emojis'}`
      : `${shown} of ${total} emojis`,
  loadMore: 'Load more',
  noResults: 'Nothing matched',
  noResultsHint: 'Try another search or reset the filters.',
  loading: 'Loading emojis…',
  loadFailed: "Couldn't load the emoji catalogue.",
  retry: 'Try again',
  favoritesEmpty: 'No favorites yet',
  favoritesEmptyHint: 'Tap the heart on any emoji to keep it here.',
  browseAll: 'Browse all emojis',
  addToFavorites: 'Add to favorites',
  removeFromFavorites: 'Remove from favorites',
  back: 'All emojis',
  description: 'Description',
  millennialMeaning: 'Millennial meaning',
  zoomerMeaning: 'Zoomer meaning',
  details: 'Details',
  otherLanguages: 'Other languages',
  notTranslated: 'This emoji has not been translated into this language yet.',
  originalName: 'Original name',
  identifier: 'ID',
  unicode: 'Unicode',
  htmlCode: 'HTML code',
  updated: 'Updated',
  copy: 'Copy',
  copied: 'Copied',
  copyEmoji: 'Copy emoji',
  notFoundTitle: 'Emoji not found',
  notFoundHint: 'This emoji is not in the catalogue.',
  writtenBy: 'Written by',
}

const ru: Dictionary = {
  tagline: 'Каждое эмодзи с объяснением на трёх языках',
  browse: 'Каталог',
  favorites: 'Избранное',
  language: 'Язык',
  searchPlaceholder: 'Поиск по названию, значению, юникоду…',
  clearSearch: 'Очистить поиск',
  category: 'Категория',
  group: 'Группа',
  sortBy: 'Сортировка',
  allCategories: 'Все категории',
  allGroups: 'Все группы',
  sortName: 'По названию',
  sortCategory: 'По категории',
  sortGroup: 'По группе',
  ascending: 'По возрастанию',
  descending: 'По убыванию',
  reset: 'Сбросить',
  showing: (shown, total) =>
    shown === total ? `${total} эмодзи` : `${shown} из ${total} эмодзи`,
  loadMore: 'Показать ещё',
  noResults: 'Ничего не найдено',
  noResultsHint: 'Измените запрос или сбросьте фильтры.',
  loading: 'Загружаем эмодзи…',
  loadFailed: 'Не удалось загрузить каталог эмодзи.',
  retry: 'Повторить',
  favoritesEmpty: 'Пока ничего нет',
  favoritesEmptyHint: 'Нажмите на сердечко у эмодзи, чтобы сохранить его здесь.',
  browseAll: 'Смотреть все эмодзи',
  addToFavorites: 'В избранное',
  removeFromFavorites: 'Убрать из избранного',
  back: 'Все эмодзи',
  description: 'Описание',
  millennialMeaning: 'Значение для миллениалов',
  zoomerMeaning: 'Значение для зумеров',
  details: 'Детали',
  otherLanguages: 'Другие языки',
  notTranslated: 'Это эмодзи ещё не переведено на этот язык.',
  originalName: 'Оригинальное название',
  identifier: 'ID',
  unicode: 'Юникод',
  htmlCode: 'HTML-код',
  updated: 'Обновлено',
  copy: 'Копировать',
  copied: 'Скопировано',
  copyEmoji: 'Копировать эмодзи',
  notFoundTitle: 'Эмодзи не найдено',
  notFoundHint: 'Такого эмодзи нет в каталоге.',
  writtenBy: 'Автор текста',
}

const kz: Dictionary = {
  tagline: 'Әр эмодзи үш тілде түсіндірілген',
  browse: 'Каталог',
  favorites: 'Таңдаулылар',
  language: 'Тіл',
  searchPlaceholder: 'Атауы, мағынасы, юникод бойынша іздеу…',
  clearSearch: 'Іздеуді тазалау',
  category: 'Санат',
  group: 'Топ',
  sortBy: 'Сұрыптау',
  allCategories: 'Барлық санаттар',
  allGroups: 'Барлық топтар',
  sortName: 'Атауы бойынша',
  sortCategory: 'Санаты бойынша',
  sortGroup: 'Тобы бойынша',
  ascending: 'Өсу ретімен',
  descending: 'Кему ретімен',
  reset: 'Тазалау',
  showing: (shown, total) =>
    shown === total ? `${total} эмодзи` : `${total} эмодзидің ${shown}-і`,
  loadMore: 'Тағы көрсету',
  noResults: 'Ештеңе табылмады',
  noResultsHint: 'Сұранымды өзгертіңіз немесе сүзгілерді тазалаңыз.',
  loading: 'Эмодзи жүктелуде…',
  loadFailed: 'Эмодзи каталогын жүктеу мүмкін болмады.',
  retry: 'Қайталау',
  favoritesEmpty: 'Әзірге бос',
  favoritesEmptyHint:
    'Кез келген эмодзидегі жүрекшені басып, осында сақтап қойыңыз.',
  browseAll: 'Барлық эмодзиді қарау',
  addToFavorites: 'Таңдаулыға қосу',
  removeFromFavorites: 'Таңдаулылардан алу',
  back: 'Барлық эмодзи',
  description: 'Сипаттама',
  millennialMeaning: 'Миллениалдар үшін мағынасы',
  zoomerMeaning: 'Зумерлер үшін мағынасы',
  details: 'Мәліметтер',
  otherLanguages: 'Басқа тілдер',
  notTranslated: 'Бұл эмодзи әлі бұл тілге аударылмаған.',
  originalName: 'Түпнұсқа атауы',
  identifier: 'ID',
  unicode: 'Юникод',
  htmlCode: 'HTML коды',
  updated: 'Жаңартылған',
  copy: 'Көшіру',
  copied: 'Көшірілді',
  copyEmoji: 'Эмодзиді көшіру',
  notFoundTitle: 'Эмодзи табылмады',
  notFoundHint: 'Мұндай эмодзи каталогта жоқ.',
  writtenBy: 'Мәтін авторы',
}

export const DICTIONARIES: Record<Locale, Dictionary> = { en, ru, kz }

/**
 * Categories and groups come from upstream in English only, so their labels
 * live here. Anything the upstream feed adds later falls back to title case.
 */
const CATEGORY_LABELS: Record<Locale, Record<string, string>> = {
  en: {},
  ru: {
    'smileys and people': 'Смайлы и люди',
    'animals and nature': 'Животные и природа',
    'food and drink': 'Еда и напитки',
    'travel and places': 'Путешествия и места',
    activities: 'Активности',
    objects: 'Предметы',
    symbols: 'Символы',
    flags: 'Флаги',
  },
  kz: {
    'smileys and people': 'Смайликтер мен адамдар',
    'animals and nature': 'Жануарлар мен табиғат',
    'food and drink': 'Тағам мен сусын',
    'travel and places': 'Саяхат және орындар',
    activities: 'Іс-әрекеттер',
    objects: 'Заттар',
    symbols: 'Таңбалар',
    flags: 'Жалаулар',
  },
}

const GROUP_LABELS: Record<Locale, Record<string, string>> = {
  en: {},
  ru: {
    activities: 'Активности',
    'animal amphibian': 'Земноводные',
    'animal bird': 'Птицы',
    'animal bug': 'Насекомые',
    'animal mammal': 'Млекопитающие',
    'animal marine': 'Морские животные',
    'animal reptile': 'Рептилии',
    'plant flower': 'Цветы',
    'plant other': 'Другие растения',
    flags: 'Флаги',
    dishware: 'Посуда',
    drink: 'Напитки',
    'food asian': 'Азиатская кухня',
    'food fruit': 'Фрукты',
    'food prepared': 'Готовые блюда',
    'food sweet': 'Сладости',
    'food vegetable': 'Овощи',
    objects: 'Предметы',
    body: 'Части тела',
    'cat face': 'Кошачьи мордочки',
    clothing: 'Одежда',
    'creature face': 'Мордочки существ',
    emotion: 'Эмоции',
    'face negative': 'Негативные лица',
    'face neutral': 'Нейтральные лица',
    'face positive': 'Позитивные лица',
    'face role': 'Лица в ролях',
    'face sick': 'Больные лица',
    family: 'Семья',
    'monkey face': 'Обезьяньи мордочки',
    person: 'Люди',
    'person activity': 'Занятия людей',
    'person gesture': 'Жесты',
    'person role': 'Роли и профессии',
    'skin tone': 'Оттенки кожи',
    symbols: 'Символы',
    'travel and places': 'Путешествия и места',
  },
  kz: {
    activities: 'Іс-әрекеттер',
    'animal amphibian': 'Қосмекенділер',
    'animal bird': 'Құстар',
    'animal bug': 'Жәндіктер',
    'animal mammal': 'Сүтқоректілер',
    'animal marine': 'Теңіз жануарлары',
    'animal reptile': 'Бауырымен жорғалаушылар',
    'plant flower': 'Гүлдер',
    'plant other': 'Басқа өсімдіктер',
    flags: 'Жалаулар',
    dishware: 'Ыдыс-аяқ',
    drink: 'Сусындар',
    'food asian': 'Азия тағамдары',
    'food fruit': 'Жемістер',
    'food prepared': 'Дайын тағамдар',
    'food sweet': 'Тәттілер',
    'food vegetable': 'Көкөністер',
    objects: 'Заттар',
    body: 'Дене мүшелері',
    'cat face': 'Мысық бейнелері',
    clothing: 'Киім',
    'creature face': 'Мақұлық бейнелері',
    emotion: 'Эмоциялар',
    'face negative': 'Теріс эмоциялы беттер',
    'face neutral': 'Бейтарап беттер',
    'face positive': 'Оң эмоциялы беттер',
    'face role': 'Рөлдегі беттер',
    'face sick': 'Науқас беттер',
    family: 'Отбасы',
    'monkey face': 'Маймыл бейнелері',
    person: 'Адамдар',
    'person activity': 'Адам әрекеттері',
    'person gesture': 'Ым-ишаралар',
    'person role': 'Рөлдер мен кәсіптер',
    'skin tone': 'Тері реңктері',
    symbols: 'Таңбалар',
    'travel and places': 'Саяхат және орындар',
  },
}

function titleCase(value: string) {
  return value.replace(/\b\p{Ll}/gu, (letter) => letter.toUpperCase())
}

export function categoryLabel(value: string, locale: Locale) {
  return CATEGORY_LABELS[locale][value] ?? titleCase(value)
}

export function groupLabel(value: string, locale: Locale) {
  return GROUP_LABELS[locale][value] ?? titleCase(value)
}

export function formatDate(iso: string, locale: Locale) {
  return new Intl.DateTimeFormat(BCP47[locale], {
    dateStyle: 'medium',
  }).format(new Date(iso))
}
