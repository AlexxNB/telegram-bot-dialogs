import type {QuestionCommon, QuestionHandler,ContextFn} from './../questions';

/** Simple text request */
export interface QuestionConfirm extends QuestionCommon<boolean>{
  type: "confirm";
  // Button label "Yes"
  yes?: string | ContextFn<string>;
  // Button label "No"
  no?: string | ContextFn<string>;
}


export default {

  async message(data){
    const yes = (await data.question("yes")) || "Yes";
    const no = (await data.question("no")) || "No";
    return {
      message: await data.question('message'),
      buttons: [
        [{yes},{no}]
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