import type {QuestionCommon, QuestionHandler} from './../questions';

/** Simple text request */
export interface QuestionConfirm extends QuestionCommon<boolean>{
  type: "confirm";
}


export default {

  async message(data){
    return {
      message: await data.question.param('message'),
      buttons: [
        [{yes:data.i18n("yes")},{no:data.i18n("no")}]
      ]
    };
  },

  async callback(button){
    return {
      value: button.value,
      answer: '✅ '+button.text
    };
  },

  async format(value){
    return value === 'yes';
  },

} as QuestionHandler<boolean>;