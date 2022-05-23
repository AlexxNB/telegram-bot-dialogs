import type {QuestionCommon, MessageHandler} from './../questions';

/** Simple text request */
export interface QuestionText extends QuestionCommon<string>{
  type: "text"
}

export default {

  async message(data){
    return {
      message: data.question.message
    };
  },

  async handler(rawMessage,data){
    data.setContext(data.question.name,rawMessage);
    return true;
  }

} as MessageHandler;