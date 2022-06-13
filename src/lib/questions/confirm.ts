import type {QuestionCommon, QuestionHandler,ContextFn} from './../questions';

/** Simple text request */
export interface QuestionConfirm extends QuestionCommon<boolean>{
  type: "confirm";
  // Button label "Yes"
  labelYes?: string | ContextFn<string>;
  // Button label "No"
  labelNo?: string | ContextFn<string>;
}


export default {

  async message(data){
    const labelYes = (await data.question("labelYes")) || data.i18n("yes");
    const labelNo = (await data.question("labelNo")) || data.i18n("no");
    return {
      message: await data.question('message'),
      buttons: [
        [{yes:labelYes},{no:labelNo}]
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