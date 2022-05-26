import type {QuestionCommon, QuestionHandler} from './../questions';

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

  async validate(rawMessage){
    if(isNaN(Number(rawMessage))) return 'Please, send only digits.';
    return true;
  },

  async format(rawMessage){
    return Number(rawMessage);
  }

} as QuestionHandler<number>;