import en from './../i18n/en.json';
import ru from './../i18n/ru.json';

export type Locale =
  "en"|
  "ru";

export type Label =
  "done"|
  "yes"|
  "no";

type LocalizationSet = {
  /** label: translated string */
  [label in Label]:string
}

type Localizations = {
  [locale in Locale]:LocalizationSet
}

export class I18n {
  private locales:Localizations = {en,ru};
  private fallbackStrings:LocalizationSet = en;
  private strings:LocalizationSet;

  constructor(locale?:Locale){
    this.strings = (locale && this.locales[locale]) || this.fallbackStrings;
  }

  // Get string in current locale
  getString(label:Label){
    return this.strings[label] || this.fallbackStrings[label] || (label as string);
  }
}