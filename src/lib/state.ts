import type {ChatId,Message} from "node-telegram-bot-api";
import type {Question} from './questions';
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

export interface StateData {
  question: Question;
  context: Context;
  isLast: boolean;
  finish: OnFinishFn;
  meta?: Meta;
  buttons?: Buttons
  setMeta: (meta:Meta) => void;
  setButtons: (buttons:ButtonsList) => void;
  setContext: <T>(name:string, value:T) => void;
  validate: ()=>Promise<boolean|string>
}

export type Context = {
  [name:string]:any;
};

export type OnFinishFn = (context:Context)=>void|Promise<void>;

export class State{
  private state: Map<ChatId,StateItem> = new Map();

  /** Add new item in state */
  add(id:ChatId, questions:Question[], fn:OnFinishFn){
    if(this.has(id)) this.delete(id);
    this.state.set(id,{
      questions,
      current: 0,
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
    if(!stateItem) return null;

    return {
      question: stateItem.questions[stateItem.current],
      context: stateItem.context,
      finish: stateItem.finish,
      isLast: this.isLast(id),
      meta: stateItem.meta,
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
        if(this.question.validate && typeof this.question.validate === 'function'){
          const valid = await this.question.validate(this.context[this.question.name]);
          if(valid !== true){
            this.context[this.question.name] = undefined;
            return valid;
          }
        }
        return true;
      }
    };
  }

  /** Move to the next question*/
  next(id:ChatId): StateData | null {
    const stateItem = this.state.get(id);
    if(!stateItem || this.isLast(id)) return null;
    stateItem.current++;
    return this.get(id);
  }

  /** Is current question last? */
  private isLast(id:ChatId){
    const stateItem = this.state.get(id);
    return !!stateItem && stateItem.current === stateItem.questions.length-1;
  }

}