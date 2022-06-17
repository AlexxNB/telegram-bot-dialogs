import {State, StateData} from './state';
import type TelegramBot from 'node-telegram-bot-api';

import {getQuestionHandler, type Question} from './questions';
import {type ButtonId} from './buttons';
import {ChatId} from 'node-telegram-bot-api';
import {Context,OnFinishFn} from './state';
import {Config,type Options} from './config';

interface Dialog {
  /** Start dialog session with user
   * @param chatId ID of chat with target user
   * @param callback The callback which will be called when dialog session will be completed
   * @returns Promise which will be resolved as an object with named user's answers
  */
  start(chatId:TelegramBot.ChatId, callback?:OnFinishFn,options?:Options): Promise<Context>,
  /** Break dialog session for user
   * @param chatId ID of chat of connected user
   * @param message Optional message which will be shown in a chat
   */
  break(chatId:TelegramBot.ChatId,message?:string): Promise<void>
}

/** Class to make dialogs in Telegram bots*/
export class Dialogs{
  private bot: TelegramBot;
  private state = new State();
  private config:Config;

  constructor(bot:TelegramBot,options?:Options){
    this.bot = bot;
    this.config = new Config(options);

    bot.on('message',msg => this.messageHandler(msg));
    bot.on('callback_query',cb => this.callbackHandler(cb));
  }

  /** Create dialog
   * @param questions A list of questions
   */
  create(questions:Question[],options?:Options):Dialog{
    const dialogConfig = this.config.makeNested(options);
    return {
      start: (chatId,callback,options) => {
        return new Promise((resolve) => {
          this.state.add(
            chatId,
            questions,
            // On finish function
            (result) => {
              resolve(result);
              if(callback && typeof callback === 'function') callback(result);
            },
            dialogConfig.makeNested(options)
          );
          this.pickNextQuestion(chatId);
        });
      },
      break: async(chatId,message) => {
        const stateData = this.state.get(chatId);
        if(stateData){
          stateData.destroy();
          await this.bot.sendMessage(chatId,'⚠️ ' + (message || stateData.i18n("msg_break")));
        }
      }
    };
  }

  /** Subscribe on messages to bot */
  private async messageHandler(message: TelegramBot.Message){
    const chatId = message.chat.id;
    if(message.text) this.handleAnswer(chatId,message.text);
  }

  /** Subscribe on callbacks */
  private async callbackHandler(callback: TelegramBot.CallbackQuery){
    const chatId = callback.message?.chat.id;
    const messageId = callback.message?.message_id;
    if(chatId && messageId && callback.data) this.handleCallback(chatId,messageId,callback.id,callback.data);
  }

  /** handle user's answer */
  private async handleAnswer(id:ChatId,answer:string){
    const stateData = this.state.get(id);
    if(stateData){
      const messageHandler = getQuestionHandler(stateData);
      if(messageHandler){
        // Disable dialog interruption by timeout
        stateData.stopTimeout();

        // Validate by handler
        if(messageHandler.validate){
          const rawValidated = await messageHandler.validate(answer,stateData);
          if(rawValidated !== true) return this.resendQuestion(id,rawValidated);
        }

        // Format by handler
        let value:unknown = await messageHandler.format(answer,stateData);

        // Validate by user's function
        const userValidated = await stateData.validate(value);
        if(userValidated !== true) return this.resendQuestion(id,userValidated);

        // Format by user's function
        value = await stateData.format(value);

        // Put result in context
        stateData.setContext(stateData.question.name,value);
      }

      return this.pickNextQuestion(id);
    }
  }

  /** handle callback */
  private async handleCallback(id:ChatId, msgId:number, cbId:string, data:string){
    const stateData = this.state.get(id);
    if(stateData && stateData.buttons){
      const messageHandler = getQuestionHandler(stateData);
      const button = stateData.buttons.get(data as ButtonId);
      if(
        messageHandler && messageHandler.callback && button
        && stateData.meta
        && stateData.meta.chatId === id
        && stateData.meta.msgId === msgId
      ){
        const responce = (await messageHandler.callback(button,stateData)) || {};
        stateData.restartTimeout();
        if(responce.message){
          this.bot.answerCallbackQuery(cbId,{
            text: responce.message,
            show_alert:false
          });
        } else if(responce.alert){
          this.bot.answerCallbackQuery(cbId,{
            text: responce.alert,
            show_alert:true
          });
        } else {
          this.bot.answerCallbackQuery(cbId);
        }

        if(responce.answer && stateData.buttons) stateData.buttons.clear();

        if(stateData.buttons.isChanged()){
          await this.bot.editMessageReplyMarkup({
            inline_keyboard: stateData.buttons.getInlineKeyboard()
          },{
            chat_id: stateData.meta.chatId,
            message_id: stateData.meta.msgId
          });
        }

        if(responce.answer) await this.bot.sendMessage(id,responce.answer,{parse_mode:'Markdown'});

        if(responce.value){
          this.handleAnswer(id,responce.value);
        }
      }
    }
  }

  /** pick next question and send it */
  private async pickNextQuestion(id:ChatId){
    let stateData: StateData|null;
    while( (stateData = this.state.next(id)) ){
      if(!(await stateData.question.param('skip'))){
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

      stateData.startTimeout(async() => {
        if(stateData.buttons && stateData.meta){
          await this.bot.editMessageReplyMarkup({
            inline_keyboard: []
          },{
            chat_id: stateData.meta.chatId,
            message_id: stateData.meta.msgId
          });
        }
        await this.bot.sendMessage(id,'⚠️ ' + stateData.i18n("msg_timeout"));
      });

      stateData.setMeta({
        msgId: sentMessage.message_id,
        chatId: sentMessage.chat.id,
      });
    }
  }
}