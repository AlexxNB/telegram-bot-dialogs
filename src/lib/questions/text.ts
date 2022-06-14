import type {QuestionCommon, QuestionHandler} from './../questions';

/** Simple text request */
export interface QuestionText extends QuestionCommon<string>{
  type: "text"
}

export default {

  async message(data){
    return {
      message: await data.question.param('message')
    };
  },

  async validate(){
    return true;
  },

  async format(rawMessage){
    return rawMessage;
  }

} as QuestionHandler<string>;