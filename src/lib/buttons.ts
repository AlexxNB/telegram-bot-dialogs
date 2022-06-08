import type TelegramBot from 'node-telegram-bot-api';
import {recursiveMap,hashObject} from './utils';

export type Button = Record<string,string|undefined> | string
export type ButtonsList = (Button|Button[])[];
export type ButtonId = `$btn:${number}`;

export type RawButton = {
  id: ButtonId
  text: string;
  value: string;
}

interface RawButtons {
  structure: (ButtonId|ButtonId[])[],
  list: RawButton[]
}

export class Buttons {
  private source: ButtonsList;
  private footer: ButtonsList;
  private buttons: RawButtons;
  private hash = '';
  private marked: ButtonId[] = [];

  constructor(buttons:ButtonsList){
    this.source = buttons;
    this.footer = [];
    this.buttons = this.updateKeyboard();
  }

  updateKeyboard(){
    return this.buttons = makeRawButtons([...this.source,...this.footer]);
  }

  getInlineKeyboard(){
    this.hash = hashObject(this.buttons,this.marked);
    return makeInlineKeyboard(this.buttons,this.marked);
  }

  get(btnId:ButtonId){
    return this.buttons.list.find(b => b.id === btnId);
  }

  isChanged(){
    return this.hash !== hashObject(this.buttons,this.marked);
  }

  replace(buttons:ButtonsList){
    this.source = buttons;
    this.marked = [];
    this.updateKeyboard();
  }

  clear(){
    this.replace([]);
    this.deleteFooter();
  }

  mark(id:ButtonId){
    this.marked.push(id);
  }

  unmark(id:ButtonId){
    this.marked = this.marked.filter( btnId => btnId !== id);
  }

  toggleMark(id:ButtonId){
    if(this.marked.includes(id))
      this.unmark(id);
    else
      this.mark(id);
  }

  getMarked(){
    return this.marked.map( id => this.get(id) );
  }

  hasMarked(){
    return this.marked.length > 0;
  }

  addFooter(buttons:Button[]){
    this.footer = [buttons];
    this.updateKeyboard();
  }

  deleteFooter(){
    this.footer = [];
    this.updateKeyboard();
  }
}

function makeRawButtons(buttons:ButtonsList){
  let id = 0;

  const result:RawButtons = {
    structure:[],
    list:[]
  };

  const handler = function(button: Button){
    const btnId:ButtonId = `$btn:${id++}`;
    const rawButton:RawButton = {
      id: btnId,
      text: 'Nameless',
      value: String(id)
    };

    if(typeof button === 'string')
      rawButton.text = rawButton.value = button;
    else {
      const butObj = Object.entries(button)[0] as [string,string];
      if(butObj){
        rawButton.value = butObj[0];
        rawButton.text = butObj[1];
      }
    }
    result.list.push(rawButton);
    return btnId;
  };

  result.structure = recursiveMap(buttons,handler);

  return result;
}


function makeInlineKeyboard(rawButtons:RawButtons,marked:ButtonId[]){
  return recursiveMap(rawButtons.structure, btnId => {
    const button = rawButtons.list.find(b => b.id === btnId);
    if(button){
      const text = button.text;
      const mark = marked.includes(button.id) ? '✅ ' : '';
      return {
        text: `${mark}${text}`,
        callback_data: btnId
      };
    }
  }) as TelegramBot.InlineKeyboardButton[][];
}

