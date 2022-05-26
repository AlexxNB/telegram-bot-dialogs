import {State, StateData} from './state';
import type TelegramBot from 'node-telegram-bot-api';

import {getQuestionHandler, type Question} from './questions';
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

/** Class to make dialogs in Telegram bots*/
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
              resolve(result);
              if(callback && typeof callback === 'function') callback(result);
            }
          );
          this.pickNextQuestion(chatId);
        });
      }
    };
  }

  /** Subscribe on messages to bot */
  private async messageHandler(message: TelegramBot.Message){
    const chatId = message.chat.id;
    if(message.text) this.handleAnswer(chatId,message.text);
  }

  /** handle user's answer */
  private async handleAnswer(id:ChatId,answer:string){
    const stateData = this.state.get(id);
    if(stateData){
      const messageHandler = getQuestionHandler(stateData);
      if(messageHandler){

        // Validate by handler
        const rawValidated = await messageHandler.validate(answer,stateData);
        if(rawValidated !== true) return this.resendQuestion(id,rawValidated);

        // Format by handler
        let value:unknown = await messageHandler.format(answer,stateData);

        // Validate by user's function
        const userValidated = await stateData.validate(value);
        if(userValidated !== true) return this.resendQuestion(id,userValidated);

        // Format by user's function
        value = await stateData.format(value);

        // Put result in context
        stateData.setContext(stateData.name,value);
      }

      return this.pickNextQuestion(id);
    }
  }

  /** pick next question and send it */
  private async pickNextQuestion(id:ChatId){
    let stateData: StateData|null;
    while( (stateData = this.state.next(id)) ){
      if(!stateData.question('skip')){
        return this.sendQuestion(id);
      }
    }
    this.state.finish(id);
  }

  /** Resend question once again */
  private async resendQuestion(id:ChatId, message:string|false){
    if(typeof message === 'string') await this.bot.sendMessage(id,message);
    this.sendQuestion(id);
  }

  /** Send current question to user */
  private async sendQuestion(id:ChatId){
    const stateData = this.state.get(id);
    const messageHandler = stateData && getQuestionHandler(stateData);

    if(messageHandler){
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
