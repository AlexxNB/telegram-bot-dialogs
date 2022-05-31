import type {StateData,Context} from './state';
import type {ButtonsList,RawButton} from './buttons';

import textMessageHandler,{type QuestionText} from './questions/text';
import numberMessageHandler,{type QuestionNumber} from './questions/number';
import confirmMessageHandler,{type QuestionConfirm} from './questions/confirm';

export type Question = QuestionText|QuestionNumber|QuestionConfirm;
/**
 * Function which returns option value based on current context values
 * @param context Current context values
 */
export type ContextFn<T> = (context:Context)=>T|Promise<T>

export interface QuestionCommon<T> {
  /** Type of question
  */
  type: string;
  /** Name for result in context */
  name: string;
  /** Question message */
  message: string | ContextFn<string>;
  /** Skip this question? */
  skip?: boolean | ContextFn<boolean>;
  /** Format user's answer
   * @param answer User's answer for the question
   * @param context Object with collected data on previous steps
  */
  format?: (answer:T, context?:Context)=>unknown;
  /** Validate answer
   * @param answer Handeled user's answer for the question
   * @param context Object with collected data on previous steps
   * @returns true - to pass answer
   * @returns false - default error message and repeat question
   * @returns string - custom error message and repeat question
   */
  validate?: (answer:T, context?:Context)=>boolean | string;
}

interface Message {
  message: string;
  buttons: ButtonsList;
}

interface CallbackResponce {
  value?: string;
  answer?:string;
  message?: string;
  alert?: string;
}


/** Methods to prepare message for user and handle the answer */
export interface QuestionHandler<T> {
  /** Prepared question message
   * @param data Current state data
  */
  message(data:StateData): Promise<Message>;

  /** Handle callback_data from user
   * @param rawMessage callback_data from user
   * @param data Current state data
  */
  callback?(button:RawButton,data:StateData): Promise<CallbackResponce>;

  /** Validate raw user's answer
   * @param rawMessage raw answer(message or keyboard button value) from user
   * @param data Current state data
  */
  validate?(rawMessage:string,data:StateData): Promise<boolean|string>;

  /** Format raw user's answer to value, whichh will be stored in result
   * @param rawMessage raw answer(message or button value) from user
   * @param data Current state data
  */
  format(rawMessage:string,data:StateData): Promise<T>;
}

export function getQuestionHandler(data:StateData){
  switch (data.type) {
    case 'text': return textMessageHandler;
    case 'number': return numberMessageHandler;
    case 'confirm': return confirmMessageHandler;
    default: return undefined;
  }
}
