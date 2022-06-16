import {Locale} from './i18n';
import type {LocalizationSet} from './../i18n/localizationSet';

// Default options
const defaultOptions:Options = {
  locale: "en",
  strings: {},
  timeout: 300,
};

export interface Options {
  /** Language of bot's messages
   * @default "en"
  */
  locale?: Locale;
  /** Redefining strings of current locale */
  strings?: LocalizationSet
  /** Answer awaiting timeout in seconds
   * @default 300 (5 minutes)
  */
  timeout?: number|false
}

export class Config {
  options:Options = {};

  constructor(options?:Options){
    this.update(defaultOptions);
    this.update(options);
  }

  /** Get option value */
  get<T extends keyof Options>(name:T):Options[T]{
    return this.options[name];
  }

  /** Update options set with new values */
  update(options?:Options){
    this.options = updateOptions(this.options,options);
  }

  /** Create nested config */
  makeNested(options?:Options){
    return options ? new Config(updateOptions(this.options,options)) : this;
  }
}


function updateOptions(current:Options,updated?:Options):Options{
  if(updated){
    return Object.entries(updated).reduce( (obj,[key,value]) => {
      if(typeof obj[key as keyof Options] === 'object' && typeof value === 'object'){
        obj[key as keyof Options] = {...obj[key as keyof Options] as object,...value};
      } else {
        obj[key as keyof Options] = value;
      }
      return obj;
    } ,current);
  } else
    return current;
}