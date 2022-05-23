import type {StateData} from './state';
import type {ButtonsList} from './buttons';

import textMessageHandler,{type QuestionText} from './questions/text';

export type Question = QuestionText;

export interface QuestionCommon {
  /** Type of question
  */
  type: string;
  /** Name for result in context */
  name: string;
  /** Question message */
  message: string;
  /** Skip this question? */
  skip?: boolean;
  /** Format answer before saving in result
   * @param answer User's answer for the question
  */
  format?: (answer:string)=>string;
  /** Validate answer
   * @param answer User's answer for the question
   * @returns true - to pass answer
   * @returns false - default error message and repeat question
   * @returns string - custom error message and repeat question
   */
  validate?: (answer:string)=>boolean | string;
}

interface Messsage {
  message: string;
  buttons?: ButtonsList;
}

/** Methods to prepare message for user and handle the answer */
export interface MessageHandler {
  /** Prepared question message
   * @param data Cureent state data
  */
  message(data:StateData): Promise<Messsage>;
  /** Handle user's answer
   * @param rawMessage raw answer(message or button value) from user
   * @param data Cureent state data
  */
  handler(rawMessage:string,data:StateData): Promise<boolean|string>;
}

export default {
  async message(data){
    const senderHandler = getSenderHandler(data);
    return senderHandler && senderHandler.message(data);
  },

  async handler(rawMessage,data){
    const senderHandler = getSenderHandler(data);
    return senderHandler && senderHandler.handler(rawMessage,data);
  }
} as MessageHandler;


function getSenderHandler(data:StateData){
  switch (data.question.type) {
    case 'text': return textMessageHandler;
    default: return undefined;
  }
}
