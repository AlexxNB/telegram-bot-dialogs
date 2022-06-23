import request from 'axios';
import type {Message, User} from 'typegram';
import {waitPromise} from './utils';
import {Keyboard} from './keyboard';

type CommonMessage = Pick<Message.ServiceMessage, 'chat'> & Partial<Message>

interface MessageMeta {
  date: number;
  botToken: string;
}

export type MessageRequest = CommonMessage & MessageMeta & {
  text: string;
}

interface CallbackQueryRequest extends MessageMeta {
  message: CommonMessage;
  from?: User;
  data: string;
}

export interface HistoryItem {
  time: number;
  botToken: string;
  message?: MessageRequest;
  callbackQuery?: CallbackQueryRequest;
  callbackId?: number;
  updateId: number;
  messageId: number,
  isRead: boolean
}

interface ClientOptions {
  /** @default 1 */
  userId: number;
  /** `Message.chat.id` option @default 1 */
  chatId: number;
  /** `Message.chat.first_name` option @default 'Test Name' */
  firstName: string;
  /** `Message.chat.user_name` option @default TestName */
  userName: string;
  /** @default 'Test Name' */
  chatTitle: string;
  /** Token */
  token: string;
  /** Interval for polling updates @default 50 */
  interval:number
  /** Timeout to throw error if no updates @default 1000 */
  timeout:number;
}

export class TelegramClient{
  options: ClientOptions;
  URL: string;

  constructor(URL:string, options?:Partial<ClientOptions>){
    this.URL = URL;
    this.options = {
      userId: 1,
      chatId: 1,
      firstName: 'Test Name',
      userName: 'TestName',
      chatTitle: 'Test Name',
      token: 'no_need_token_here',
      interval: 50,
      timeout: 1000,
      ...options
    };
  }

  async sendMessage(messageText:string){
    const messageObj:MessageRequest = {
      ...this.makeCommonMessage(),
      ...this.getMessageMeta(),
      text: messageText,
    };
    const res = await request({
      url: `${this.URL}/sendMessage`,
      method: 'POST',
      data: messageObj,
    });
    return res && res.data;
  }

  async sendCallback(callbackData:string,messageId?:number){
    const message = this.makeCommonMessage();
    if(messageId) message.message_id = messageId;

    const callbackObj:CallbackQueryRequest = {
      ...this.getMessageMeta(),
      from: message.from,
      message,
      data: callbackData,
    };

    const res = await request({
      url: `${this.URL}/sendCallback`,
      method: 'POST',
      data: callbackObj,
    });
    return res && res.data;
  }

  async getUpdatesHistory(): Promise<HistoryItem[]> {
    const data = {token: this.options.token};
    const res = await request({
      url: `${this.URL}/getUpdatesHistory`,
      method: 'POST',
      data,
    });
    return res.data && res.data.result;
  }

  async getHistoryItem(updateId:number){
    return await waitPromise(
      async() => {
        const history = await this.getUpdatesHistory();
        const item = history.find( i => i.updateId === updateId);
        if(item) return modHistoryItem(item);
      },
      this.options.interval,
      this.options.timeout,
      "Timeout reached while waiting for history item #"+updateId
    );
  }

  async waitForEdited(historyItem:HistoryItem){
    const snapshot = makeSnapshot(historyItem);
    return await waitPromise(
      async() => {
        const history = await this.getUpdatesHistory();
        const item = history.find( i => i && i.updateId === historyItem.updateId);
        if(item) {
          const currentSnapshot = makeSnapshot(item);
          if(snapshot !== currentSnapshot) return modHistoryItem(item);
        }
      },
      this.options.interval,
      this.options.timeout,
      "Timeout reached while waiting when history item #"+historyItem.updateId+" will be edited"
    );
  }

  async waitForBotMessage(){
    return await waitPromise(
      async() => {
        const history = await this.getUpdatesHistory();
        const item = history[history.length-1];
        const isBot = item.message?.from?.is_bot;
        if(isBot === true || isBot === undefined) return modHistoryItem(item);
      },
      this.options.interval,
      this.options.timeout,
      "Timeout reached while waiting message from the bot"
    );
  }

  private makeCommonMessage():CommonMessage {
    return {
      from: {
        id: this.options.userId,
        first_name: this.options.firstName,
        username: this.options.userName,
        is_bot: false,
      },
      chat: {
        id: this.options.chatId,
        first_name: this.options.firstName,
        username: this.options.userName,
        type: 'private',
      },
    };
  }

  private getMessageMeta():MessageMeta {
    return {
      botToken: this.options.token,
      date: Math.floor(Date.now() / 1000)
    };
  }
}

function modHistoryItem(historyItem:HistoryItem){
  (historyItem as HistoryItem & {keyboard:Keyboard}).keyboard = new Keyboard(historyItem);
  return historyItem as HistoryItem & {keyboard:Keyboard};
}

function makeSnapshot(historyItem:HistoryItem){
  return JSON.stringify({
    text: historyItem.message?.text,
    markup: (historyItem.message as Message.CommonMessage).reply_markup
  });
}