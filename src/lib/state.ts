import type {ChatId,Message} from "node-telegram-bot-api";
import type {Question, ContextFn} from './questions';
import {Buttons,ButtonsList} from './buttons';
import type {Options} from './dialogs';
import {I18n, type Label} from './i18n';

interface StateItem {
  questions: Question[];
  current: number;
  context: Context;
  finish: OnFinishFn;
  meta?: Meta;
  buttons?: Buttons;
  store?:unknown;
  i18n:I18n
}

interface Meta{
  msgId: Message['message_id'];
  chatId: ChatId;
}
type KeysOfUnion<T> = T extends T ? keyof T: never;
type Params = Exclude<KeysOfUnion<Question>,'type'|'name'|'format'|'validate'>
type ParamType<T extends Params,U> = U extends U ? T extends keyof U ? U[T] : never : never;
type ParamReturn<T> = T extends ContextFn<infer R> ? R : T;

export interface StateData {
  question: {
    name: Question['name'];
    type: Question['type'];
    param: <T extends Params>(name: T)=>Promise< ParamReturn< ParamType< T, Question > > >;
  },
  context: Context;
  meta?: Meta;
  buttons?: Buttons
  store?: unknown;
  setMeta: (meta:Meta) => void;
  setButtons: (buttons:ButtonsList) => void;
  setContext: <T>(name:string, value:T) => void;
  setStore: <T>(value:T) => void;
  validate: (value:unknown)=>Promise<boolean|string>;
  format: (value:unknown)=>Promise<unknown>;
  i18n: (label:Label)=>string;
}

export type Context = Record<string, unknown>;

export type OnFinishFn = (context:Context)=>void|Promise<void>;

export class State{
  private state: Map<ChatId,StateItem> = new Map();

  /** Add new item in state */
  add(id:ChatId, questions:Question[], fn:OnFinishFn, options:Options){
    if(this.has(id)) this.delete(id);
    this.state.set(id,{
      questions,
      current: -1,
      context: {},
      finish: ctx => fn(ctx),
      i18n: new I18n(options.locale)
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
        return stateItem.i18n.getString(label);
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