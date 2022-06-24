import {LocalizationSet} from './../i18n/localizationSet';

import en from './../i18n/en.json';
import ru from './../i18n/ru.json';

export type Locale =
  "en"|
  "ru";

export type Label = keyof LocalizationSet;

export type I18nFn = <T extends Label>(label:T)=>Required<LocalizationSet>[T];

type Localizations = {
  [locale in Locale]:LocalizationSet
}

export class I18n {
  private locales:Localizations = {en,ru};
  private locale:Locale = 'en';
  private strings:LocalizationSet = {};
  private localeStrings:LocalizationSet = en;
  private fallbackStrings:LocalizationSet = en;

  constructor(locale?:Locale,strings?:LocalizationSet){
    if(locale) this.locale = locale;
    if(strings) this.strings = strings;
    this.localeStrings = {...(this.locales[this.locale] || this.fallbackStrings),...strings};
  }

  /** Get string in current locale */
  getString<T extends Label>(label:T):Required<LocalizationSet>[T]{
    const str = this.localeStrings[label] || this.fallbackStrings[label] || (label as string);
    return str as Required<LocalizationSet>[T];
  }

  /** Make nested I18n instance */
  makeNested(locale?:Locale,strings?:LocalizationSet){
    if(locale || strings){
      strings = {...this.strings,...strings};
      return new I18n(locale||this.locale,strings);
    } else return this;
  }
}