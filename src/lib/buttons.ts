import type TelegramBot from 'node-telegram-bot-api';
import {recursiveMap} from './utils';

type Button = {
  [key:string]:string
}
| string

export type ButtonsList = (Button | Button[])[];

type RawButton = {
  text: string;
  value: string;
}

type ButtonId = `$btn:${number}`;

interface RawButtons {
  structure: (ButtonId | ButtonId[])[],
  buttons: {
    [id:ButtonId]:RawButton
  }
}

export class Buttons {
  private buttons: RawButtons;

  constructor(buttons:ButtonsList){
    this.buttons = makeRawButtons(buttons);
  }

  getInlineKeyboard(){
    return makeInlineKeyboard(this.buttons);
  }

  get(btnId:ButtonId){
    return this.buttons.buttons[btnId];
  }
}

function makeRawButtons(buttons:ButtonsList){
  let id = 0;

  const result:RawButtons = {
    structure:[],
    buttons:{}
  };

  const handler = function(button: Button){
    const btnId:ButtonId = `$btn:${id++}`;
    const rawButton:RawButton = {
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
    result.buttons[btnId] = rawButton;
    return btnId;
  };

  result.structure = recursiveMap(buttons,handler);

  return result;
}


function makeInlineKeyboard(rawButtons:RawButtons){
  return recursiveMap(rawButtons.structure, btnId => {
    return {
      text: rawButtons.buttons[btnId].text,
      callback_data: btnId
    };
  }) as TelegramBot.InlineKeyboardButton[][];
}