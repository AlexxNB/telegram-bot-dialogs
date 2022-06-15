import {makeRawButton} from './../buttons';
import type {QuestionCommon, QuestionHandler, ContextFn} from './../questions';
import type {Button,ButtonsList} from './../buttons';
import type {StateData} from './../state';

/** Simple text request */
export interface QuestionPicker extends QuestionCommon<string>{
  type: "picker";
  /** List of possible values */
  list: Button[]|ContextFn<Button[]>
  /** Show vertical picker */
  vertical?: boolean|ContextFn<boolean>;
  /** Loop showing of list items */
  loop?: boolean|ContextFn<boolean>;
}

interface CurrentButton {
  index: number;
  total: number;
  button: Button;
}

export default {

  async message(data){
    const list = await data.question.param('list');

    data.setStore({
      index: 0,
      total: list.length,
      button: list[0]
    } as CurrentButton);

    return {
      message: await data.question.param('message'),
      buttons: await makePicker(data)
    };
  },

  async callback(button,data){
    const list = await data.question.param('list');
    const loop = await data.question.param('loop');
    const current = data.store as CurrentButton;
    const curButton = makeRawButton(current.button);

    if(button.value === 'pick_done'){
      return {
        value: curButton.value,
        answer: '✅ '+curButton.text
      };
    } else if(button.value === 'pick_prev' || button.value === 'pick_next'){

      if(button.value === 'pick_prev'){
        current.index--;
        if(current.index < 0) current.index = loop ? current.total-1 : 0;
      } else {
        current.index++;
        if(current.index >= current.total) current.index = loop ? 0 : current.total-1;
      }
      current.button = list[current.index];
      data.setStore(current);
      data.buttons && data.buttons.replace(await makePicker(data));
    } else if(button.text !== ' '){
      return {
        message: curButton.text
      };
    }
  },

  async format(value){
    return String(value);
  },

} as QuestionHandler<string>;

async function makePicker(data:StateData):Promise<ButtonsList>{
  const vertical = await data.question.param('vertical');
  const loop = await data.question.param('loop');
  const current = data.store as CurrentButton;
  const isFirst = current.index === 0;
  const isLast = current.index === current.total-1;
  if(vertical) {
    return [
      [{pick_prev: !loop && isFirst ? '' : "⬆️"}],
      [current.button],
      [{pick_next: !loop && isLast ? '' : "⬇️"}],
      [{done:'✅ '+data.i18n("done")}],
    ];
  } else {
    return [
      [{pick_prev: !loop && isFirst ? '' : "⬅️"}, current.button, {pick_next: !loop && isLast ? '' : "➡️"}],
      [{pick_done:'✅ '+data.i18n("done")}],
    ];
  }
}