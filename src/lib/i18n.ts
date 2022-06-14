import {LocalizationSet} from './../i18n/localizationSet';

import en from './../i18n/en.json';
import ru from './../i18n/ru.json';

export type Locale =
  "en"|
  "ru";

export type Label = keyof LocalizationSet;


type Localizations = {
  [locale in Locale]:LocalizationSet
}

export class I18n {
  private locales:Localizations = {en,ru};
  private fallbackStrings:LocalizationSet = en;
  private strings:LocalizationSet = en;

  constructor(locale?:Locale|LocalizationSet){
    if(locale){
      this.strings = typeof locale === 'string'
        ? this.locales[locale] || this.fallbackStrings
        : locale;
    }
  }

  // Get string in current locale
  getString(label:Label){
    return this.strings[label] || this.fallbackStrings[label] || (label as string);
  }
}