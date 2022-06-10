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
  private buttons: RawButtons;
  private hash = '';

  constructor(buttons:ButtonsList){
    this.source = buttons;
    this.buttons = this.updateKeyboard();
  }

  updateKeyboard(){
    return this.buttons = makeRawButtons(this.source);
  }

  getInlineKeyboard(){
    this.hash = hashObject(this.buttons);
    return makeInlineKeyboard(this.buttons);
  }

  get(btnId:ButtonId){
    return this.buttons.list.find(b => b.id === btnId);
  }

  isChanged(){
    return this.hash !== hashObject(this.buttons);
  }

  replace(buttons:ButtonsList){
    this.source = buttons;
    this.updateKeyboard();
  }

  clear(){
    this.replace([]);
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
      text: '',
      value: String(id)
    };

    if(typeof button === 'string'){
      rawButton.text = button;
      if(button) rawButton.value = button;
    } else {
      const butObj = Object.entries(button)[0] as [string,string];
      if(butObj){
        rawButton.value = butObj[0];
        rawButton.text = butObj[1];
      }
    }
    if(rawButton.text === '') rawButton.text = ' ';
    result.list.push(rawButton);
    return btnId;
  };

  result.structure = recursiveMap(buttons,handler);
  return result;
}

function makeInlineKeyboard(rawButtons:RawButtons){
  return recursiveMap(rawButtons.structure, btnId => {
    const button = rawButtons.list.find(b => b.id === btnId);
    if(button){
      return {
        text: button.text,
        callback_data: btnId
      };
    }
  }) as TelegramBot.InlineKeyboardButton[][];
}