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
  sourceCode: string
  favorites: string
  language: string
  searchPlaceholder: string
  clearSearch: string
  category: string
  sortBy: string
  allCategories: string
  sortName: string
  sortCategory: string
  ascending: string
  descending: string
  reset: string
  showing: (shown: number, total: number) => string
  noResults: string
  noResultsHint: string
  loadFailed: string
  retry: string
  favoritesEmpty: string
  favoritesEmptyHint: string
  browseAll: string
  exportFavorites: string
  exportTitle: string
  importFavorites: string
  importTitle: string
  importAdded: (count: number) => string
  importFailed: string
  addToFavorites: string
  removeFromFavorites: string
  back: string
  millennialMeaning: string
  zoomerMeaning: string
  exampleLabel: string
  details: string
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
  sourceCode: 'Source code on GitHub',
  favorites: 'Favorites',
  language: 'Language',
  searchPlaceholder: 'Search by name, meaning, unicode…',
  clearSearch: 'Clear search',
  category: 'Category',
  sortBy: 'Sort by',
  allCategories: 'All categories',
  sortName: 'Name',
  sortCategory: 'Category',
  ascending: 'Ascending',
  descending: 'Descending',
  reset: 'Reset',
  showing: (shown, total) =>
    shown === total
      ? `${total} ${total === 1 ? 'emoji' : 'emojis'}`
      : `${shown} of ${total} emojis`,
  noResults: 'Nothing matched',
  noResultsHint: 'Try another search or reset the filters.',
  loadFailed: "Couldn't load the emoji catalogue.",
  retry: 'Try again',
  favoritesEmpty: 'No favorites yet',
  favoritesEmptyHint: 'Tap the heart on any emoji to keep it here.',
  browseAll: 'Browse all emojis',
  exportFavorites: 'Export',
  exportTitle: 'Download your favorites as a file',
  importFavorites: 'Import',
  importTitle: 'Add favorites from a file you exported earlier',
  importAdded: (count) =>
    count === 0
      ? 'Nothing new to add'
      : `Added ${count} ${count === 1 ? 'emoji' : 'emojis'}`,
  importFailed: "That file doesn't look like an Emoji Hub export",
  addToFavorites: 'Add to favorites',
  removeFromFavorites: 'Remove from favorites',
  back: 'All emojis',
  millennialMeaning: 'Millennial meaning',
  zoomerMeaning: 'Zoomer meaning',
  exampleLabel: 'For example',
  details: 'Details',
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
  sourceCode: 'Исходный код на GitHub',
  favorites: 'Избранное',
  language: 'Язык',
  searchPlaceholder: 'Поиск по названию, значению, юникоду…',
  clearSearch: 'Очистить поиск',
  category: 'Категория',
  sortBy: 'Сортировка',
  allCategories: 'Все категории',
  sortName: 'По названию',
  sortCategory: 'По категории',
  ascending: 'По возрастанию',
  descending: 'По убыванию',
  reset: 'Сбросить',
  showing: (shown, total) =>
    shown === total ? `${total} эмодзи` : `${shown} из ${total} эмодзи`,
  noResults: 'Ничего не найдено',
  noResultsHint: 'Измените запрос или сбросьте фильтры.',
  loadFailed: 'Не удалось загрузить каталог эмодзи.',
  retry: 'Повторить',
  favoritesEmpty: 'Пока ничего нет',
  favoritesEmptyHint: 'Нажмите на сердечко у эмодзи, чтобы сохранить его здесь.',
  browseAll: 'Смотреть все эмодзи',
  exportFavorites: 'Экспорт',
  exportTitle: 'Скачать избранное файлом',
  importFavorites: 'Импорт',
  importTitle: 'Добавить избранное из ранее сохранённого файла',
  importAdded: (count) =>
    count === 0 ? 'Новых эмодзи нет' : `Добавлено эмодзи: ${count}`,
  importFailed: 'Этот файл не похож на экспорт Emoji Hub',
  addToFavorites: 'В избранное',
  removeFromFavorites: 'Убрать из избранного',
  back: 'Все эмодзи',
  millennialMeaning: 'Значение для миллениалов',
  zoomerMeaning: 'Значение для зумеров',
  exampleLabel: 'Например',
  details: 'Детали',
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
  sourceCode: 'GitHub-тағы бастапқы код',
  favorites: 'Таңдаулылар',
  language: 'Тіл',
  searchPlaceholder: 'Атауы, мағынасы, юникод бойынша іздеу…',
  clearSearch: 'Іздеуді тазалау',
  category: 'Санат',
  sortBy: 'Сұрыптау',
  allCategories: 'Барлық санаттар',
  sortName: 'Атауы бойынша',
  sortCategory: 'Санаты бойынша',
  ascending: 'Өсу ретімен',
  descending: 'Кему ретімен',
  reset: 'Тазалау',
  showing: (shown, total) =>
    shown === total ? `${total} эмодзи` : `${total} эмодзидің ${shown}-і`,
  noResults: 'Ештеңе табылмады',
  noResultsHint: 'Сұранымды өзгертіңіз немесе сүзгілерді тазалаңыз.',
  loadFailed: 'Эмодзи каталогын жүктеу мүмкін болмады.',
  retry: 'Қайталау',
  favoritesEmpty: 'Әзірге бос',
  favoritesEmptyHint:
    'Кез келген эмодзидегі жүрекшені басып, осында сақтап қойыңыз.',
  browseAll: 'Барлық эмодзиді қарау',
  exportFavorites: 'Экспорт',
  exportTitle: 'Таңдаулыларды файл ретінде жүктеп алу',
  importFavorites: 'Импорт',
  importTitle: 'Бұрын сақталған файлдан таңдаулыларды қосу',
  importAdded: (count) =>
    count === 0 ? 'Жаңа эмодзи жоқ' : `${count} эмодзи қосылды`,
  importFailed: 'Бұл файл Emoji Hub экспортына ұқсамайды',
  addToFavorites: 'Таңдаулыға қосу',
  removeFromFavorites: 'Таңдаулылардан алу',
  back: 'Барлық эмодзи',
  millennialMeaning: 'Миллениалдар үшін мағынасы',
  zoomerMeaning: 'Зумерлер үшін мағынасы',
  exampleLabel: 'Мысалы',
  details: 'Мәліметтер',
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
 * Categories come from upstream in English only, so their labels live here.
 * Anything the upstream feed adds later falls back to title case.
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

function titleCase(value: string) {
  return value.replace(/\b\p{Ll}/gu, (letter) => letter.toUpperCase())
}

export function categoryLabel(value: string, locale: Locale) {
  return CATEGORY_LABELS[locale][value] ?? titleCase(value)
}

export function formatDate(iso: string, locale: Locale) {
  return new Intl.DateTimeFormat(BCP47[locale], {
    dateStyle: 'medium',
  }).format(new Date(iso))
}
