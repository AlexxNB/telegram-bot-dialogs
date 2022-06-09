import type {QuestionCommon, QuestionHandler,ContextFn} from './../questions';
import type {ButtonsList} from './../buttons';

/** Simple text request */
export interface QuestionSelect extends QuestionCommon<string[]>{
  type: "select";
  /** Buttons layout */
  buttons:ButtonsList;
  /** Allow select multiple buttons */
  multiple?: boolean | ContextFn<boolean>;
}


export default {

  async message(data){
    let buttons = (await data.question("buttons"));

    return {
      message: await data.question('message'),
      buttons
    };
  },

  async callback(button,data){
    const multiple = (await data.question("multiple"));
    if(multiple && data.buttons){
      if(button.value === 'complete'){
        const buttons = data.buttons.getMarked();
        return {
          value: buttons.map( b => b && b.value).join('\n'),
          answer: buttons.map( b => b && '✅ '+b.text).join('\n')
        };

      } else {
        data.buttons.toggleMark(button.id);
        if(data.buttons.hasMarked()){
          data.buttons.addFooter([{complete:'✅ Done'}]);
        } else {
          data.buttons.deleteFooter();
        }
      }
    } else return {
      value: button.value,
      answer: '✅ '+button.text
    };
  },

  async format(value,data){
    const multiple = (await data.question("multiple"));
    if(multiple){
      return value.split('\n');
    } else return value;
  },

} as QuestionHandler<string|string[]>;