import {State} from './state';
import type TelegramBot from 'node-telegram-bot-api';

import messageHandler,{type Question} from './questions';
import {ChatId} from 'node-telegram-bot-api';
import {Context,OnFinishFn} from './state';

interface Dialog {
  /** Start dialog session with user
   * @param chatId ID of chat with target user
   * @param callback The callback which will be called when dialog session will be completed
   * @returns Promise which will be resolved as an object with named user's answers
  */
  start(chatId:TelegramBot.ChatId, callback?:OnFinishFn): Promise<Context>
}


export class Dialogs{
  private bot: TelegramBot;
  private state = new State();

  constructor(bot:TelegramBot){
    this.bot = bot;

    bot.on('message',msg => this.messageHandler(msg));
  }

  /** Create dialog
   * @param questions A list of questions
   */
  create(questions:Question[]):Dialog{
    return {
      start: (chatId,callback) => {
        return new Promise((resolve) => {
          this.state.add(chatId,questions,
            // On finish function
            (result) => {
              this.state.delete(chatId);
              resolve(result);
              if(callback && typeof callback === 'function') callback(result);
            }
          );
          this.sendQuestion(chatId);
        });
      }
    };
  }

  /** Subscribe on messages to bot */
  private async messageHandler(message: TelegramBot.Message){
    const chatId = message.chat.id;
    const stateData = this.state.get(chatId);
    if(stateData && message.text){
      const handeled = await messageHandler.handler(message.text,stateData);
      const validated = handeled === true && await stateData.validate();
      if(handeled === true && validated === true){
        await stateData.format();
        if(stateData.isLast)
          return stateData.finish(stateData.context);
        else
          this.state.next(chatId);
      }
      else {
        if(typeof handeled === 'string') await this.bot.sendMessage(chatId,handeled);
        if(typeof validated === 'string') await this.bot.sendMessage(chatId,validated);
      }
      this.sendQuestion(chatId);
    }
  }

  /** Send current question to user */
  private async sendQuestion(id:ChatId){
    const stateData = this.state.get(id);
    if(stateData){
      const options:TelegramBot.SendMessageOptions = {};
      const question = await messageHandler.message(stateData);

      if(question.buttons){
        stateData.setButtons(question.buttons);
        if(stateData.buttons) options.reply_markup = {
          inline_keyboard: stateData.buttons.getInlineKeyboard()
        };
      }

      const sentMessage = await this.bot.sendMessage(id,question.message,options);
      stateData.setMeta({
        msgId: sentMessage.message_id,
        chatId: sentMessage.chat.id,
      });
    }
  }
}
