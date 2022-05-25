import type {QuestionCommon, MessageHandler} from './../questions';

/** Simple text request */
export interface QuestionNumber extends QuestionCommon<number>{
  type: "number"
}

export default {

  async message(data){
    return {
      message: data.question('message')
    };
  },

  async handler(rawMessage,data){
    const num = Number(rawMessage);
    if(isNaN(num)) return 'You should enter only digits!';
    data.setContext(data.name,num);
    return true;
  }

} as MessageHandler;