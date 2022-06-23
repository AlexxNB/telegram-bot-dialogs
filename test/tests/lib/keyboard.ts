import type {HistoryItem} from './client';
import type {InlineKeyboardButton,Message} from "typegram";


export class Keyboard{
  private keyboard:InlineKeyboardButton[][] = [];

  constructor(historyItem:HistoryItem){
    const keyboard = (historyItem.message as Message.CommonMessage).reply_markup?.inline_keyboard;
    if(keyboard) this.keyboard = keyboard;
  }

  getButtonText(row:number,col:number){
    const button = this.getButton(row,col);
    return button && button.text;
  }

  getButtonCallbackData(row:number,col:number){
    const button = this.getButton(row,col);
    return button && (button as InlineKeyboardButton.CallbackButton).callback_data;
  }

  private getButton(row:number,col:number):InlineKeyboardButton|undefined{
    return this.keyboard[row] && this.keyboard[row][col];
  }
}