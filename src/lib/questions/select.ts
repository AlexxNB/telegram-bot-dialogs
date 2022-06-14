import type {QuestionCommon, QuestionHandler,ContextFn} from './../questions';
import type {ButtonsList,ButtonId,Button} from './../buttons';
import {recursiveMap} from './../utils';

/** Simple text request */
export interface QuestionSelect extends QuestionCommon<string[]>{
  type: "select";
  /** Buttons layout */
  buttons: ButtonsList | ContextFn<ButtonsList>;
  /** Allow select multiple buttons */
  multiple?: boolean | ContextFn<boolean>;
}


export default {

  async message(data){
    data.setStore([]);
    const buttons = (await data.question.param("buttons"));

    return {
      message: await data.question.param('message'),
      buttons
    };
  },

  async callback(button,data){
    const multiple = (await data.question.param("multiple"));

    if(multiple && data.buttons){
      let marked = data.store as ButtonId[];
      let buttons = (await data.question.param("buttons"));

      if(button.value === 'done'){
        const markRg = /^🔸/;
        const markedButtons = marked.map( id => data.buttons?.get(id));
        return {
          value: markedButtons.map( b => b && b.value.replace(markRg,'')).join('\n'),
          answer: markedButtons.map( b => b && '✅ '+b.text.replace(markRg,'')).join('\n')
        };
      } else {

        if(marked.includes(button.id))
          marked = marked.filter( id => id !== button.id);
        else
          marked.push(button.id);

        data.setStore(marked);

        buttons = makeMarkedButtons(buttons,marked);
        if(marked.length > 0) buttons.push([{done:"✅ "+data.i18n("done")}]);

        data.buttons.replace(buttons);
      }
    } else return {
      value: button.value,
      answer: '✅ '+button.text
    };
  },

  async format(value,data){
    const multiple = (await data.question.param("multiple"));
    if(multiple){
      return value.split('\n');
    } else return value;
  },

} as QuestionHandler<string|string[]>;

function makeMarkedButtons(buttons:ButtonsList, marked:ButtonId[] ):ButtonsList{
  let id = 0;

  const handler = (button:Button):Button => {
    const btnId:ButtonId = `$btn:${id++}`;

    if(typeof button === 'string'){
      return makeLabel(button,btnId,marked);
    } else {
      const butObj = Object.entries(button)[0] as [string,string];
      return [butObj].reduce((obj,but) => {
        obj[but[0]] = makeLabel(but[1],btnId,marked);
        return obj;
      },{} as Record<string,string>);
    }
  };

  return recursiveMap(buttons,handler);
}

function makeLabel(label:string, id:ButtonId,marked:ButtonId[]){
  return marked.includes(id) ? '🔸'+label : label;
}