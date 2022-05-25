import type {ChatId,Message} from "node-telegram-bot-api";
import type {Question, ContextFn} from './questions';
import {Buttons,ButtonsList} from './buttons';

interface StateItem {
  questions: Question[];
  current: number;
  context: Context;
  finish: OnFinishFn;
  meta?: Meta;
  buttons?: Buttons
}

interface Meta{
  msgId: Message['message_id'];
  chatId: ChatId;
}

type Options = Exclude<keyof Question,'type'|'name'|'format'|'validate'>
type OptionReturn<T> = T extends ContextFn<infer R> ? R : T

export interface StateData {
  name: string;
  type: string;
  context: Context;
  meta?: Meta;
  buttons?: Buttons
  question: <
    T extends Options,
    U extends Question[T],
  >(name: T)=>OptionReturn<U>;
  setMeta: (meta:Meta) => void;
  setButtons: (buttons:ButtonsList) => void;
  setContext: <T>(name:string, value:T) => void;
  validate: ()=>Promise<boolean|string>;
  format: ()=>Promise<void>;
}

export type Context = Record<string, unknown>;

export type OnFinishFn = (context:Context)=>void|Promise<void>;

export class State{
  private state: Map<ChatId,StateItem> = new Map();

  /** Add new item in state */
  add(id:ChatId, questions:Question[], fn:OnFinishFn){
    if(this.has(id)) this.delete(id);
    this.state.set(id,{
      questions,
      current: -1,
      context: {},
      finish: ctx => fn(ctx)
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
      name: question['name'],
      type: question['type'],
      context: stateItem.context,
      meta: stateItem.meta,
      question(name){
        const value = question[name] as ContextFn<unknown>|unknown;
        return ( typeof value === 'function' ) ? value(clone(this.context, this.name)) : value;
      },
      setButtons(buttons){
        stateItem.buttons = this.buttons = new Buttons(buttons);
      },
      setMeta(meta){
        stateItem.meta = this.meta = meta;
      },
      setContext(name,value){
        stateItem.context[name] = value;
      },
      async validate(){
        if(question.validate && typeof question.validate === 'function'){
          const valid = await question.validate(this.context[this.name] as never, clone(this.context, this.name));
          if(valid !== true){
            this.context[this.name] = undefined;
            return valid;
          }
        }
        return true;
      },
      async format(){
        if(question.format && typeof question.format === 'function'){
          this.context[this.name] = await question.format(this.context[this.name] as never, clone(this.context, this.name));
        }
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
      stateItem.finish(clone(stateItem.context));
      this.delete(id);
    }
  }
}


function clone<T>(obj:T, ...exclude:string[]):T{
  const result = {} as T;

  for(let key in obj){
    if(!(key in exclude)) result[key] = obj[key];
  }

  return result;
}