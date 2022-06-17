import type {ChatId,Message} from "node-telegram-bot-api";
import type {Question, ContextFn} from './questions';
import {Buttons,ButtonsList} from './buttons';
import {Config} from './config';
import {I18n, type I18nFn} from './i18n';

interface StateItem {
  questions: Question[];
  current: number;
  context: Context;
  finish: OnFinishFn;
  meta?: Meta;
  buttons?: Buttons;
  store?:unknown;
  options:Config;
  timer:null|[ReturnType<typeof setTimeout>,(()=>void)|undefined];
}

interface Meta{
  msgId: Message['message_id'];
  chatId: ChatId;
}
type KeysOfUnion<T> = T extends T ? keyof T: never;
type Params = Exclude<KeysOfUnion<Question>,'type'|'name'|'format'|'validate'>
type ParamType<T extends Params,U> = U extends U ? T extends keyof U ? U[T] : never : never;
type ParamReturn<T> = T extends ContextFn<infer R> ? R : T;
type ParamFn = <T extends Params>(name: T)=>Promise< ParamReturn< ParamType< T, Question > > >;

export interface StateData {
  question: {
    name: Question['name'];
    type: Question['type'];
    param: ParamFn;
  },
  context: Context;
  meta?: Meta;
  buttons?: Buttons
  store?: unknown;
  setMeta: (meta:Meta) => void;
  setButtons: (buttons:ButtonsList) => void;
  setContext: <T>(name:string, value:T) => void;
  setStore: <T>(value:T) => void;
  startTimeout: (fn?:()=>void)=>void;
  restartTimeout: (fn?:()=>void)=>void;
  stopTimeout: ()=>void;
  validate: (value:unknown)=>Promise<boolean|string>;
  format: (value:unknown)=>Promise<unknown>;
  i18n: I18nFn;
  options:Config;
  destroy:()=>void;
}

export type Context = Record<string, unknown>;

export type OnFinishFn = (context:Context)=>void|Promise<void>;

export class State{
  private state: Map<ChatId,StateItem> = new Map();

  /** Add new item in state */
  add(id:ChatId, questions:Question[], fn:OnFinishFn, options:Config){
    if(this.has(id)) this.delete(id);
    this.state.set(id,{
      questions,
      current: -1,
      context: {},
      finish: ctx => fn(ctx),
      options,
      timer: null
    });
  }

  /** Delete item from state */
  delete(id: ChatId){
    this.state.delete(id);
  }

  /** Does item in list */
  has(id: ChatId){
    return this.state.has(id);
  }

  /** Get current question */
  get(id:ChatId): StateData | null {
    const stateItem = this.state.get(id);
    const question = stateItem && stateItem.questions[stateItem.current];

    if(!question) return null;

    const options = stateItem && stateItem.options.makeNested(question.options);
    const questionI18n = new I18n(options.get("locale"),options.get("strings"));

    return {
      question: {
        name: question['name'],
        type: question['type'],
        async param(name){
          if(name in question){
            const value = question[name as keyof Question] as ContextFn<Promise<unknown>>|unknown;
            return ( typeof value === 'function' ) ? await value(stateItem.context) : value;
          }
        },
      },
      context: stateItem.context,
      meta: stateItem.meta,
      buttons: stateItem.buttons,
      store: stateItem.store,
      options: stateItem.options,
      setButtons(buttons){
        stateItem.buttons = this.buttons = new Buttons(buttons);
      },
      setMeta(meta){
        stateItem.meta = this.meta = meta;
      },
      setContext(name,value){
        stateItem.context[name] = value;
      },
      setStore(value){
        stateItem.store = this.store = value;
      },
      startTimeout(fn){
        const timeout = this.options.get("timeout");
        if(timeout) {
          stateItem.timer = [
            setTimeout(() => {
              this.destroy();
              fn && fn();
            },timeout*1000),
            fn
          ];
        }
      },
      restartTimeout(){
        if(stateItem.timer){
          const fn = stateItem.timer[1];
          this.stopTimeout();
          this.startTimeout(fn);
        }
      },
      stopTimeout(){
        if(stateItem.timer){
          clearTimeout(stateItem.timer[0]);
          stateItem.timer = null;
        }
      },
      async validate(value){
        if(question.validate && typeof question.validate === 'function'){
          return await question.validate(value as never, this.context);
        }
        return true;
      },
      async format(value){
        if(question.format && typeof question.format === 'function'){
          value = await question.format(value as never, this.context);
        }
        return value;
      },
      i18n(label){
        return questionI18n.getString(label);
      },
      destroy: () => {
        this.delete(id);
      }
    };
  }

  /** Move to the next question*/
  next(id:ChatId): StateData | null {
    const stateItem = this.state.get(id);
    if(stateItem){
      stateItem.current++;
      return this.get(id);
    }
    return null;
  }

  /** finish a session */
  async finish(id:ChatId){
    const stateItem = this.state.get(id);
    if(stateItem){
      stateItem.finish(stateItem.context);
      this.delete(id);
    }
  }
}