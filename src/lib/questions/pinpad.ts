import type {QuestionCommon, QuestionHandler, ContextFn} from './../questions';
import type {ButtonsList} from './../buttons';
import type {I18nFn} from './../i18n';

/** Simple text request */
export interface QuestionPinpad extends QuestionCommon<number>{
  type: "pinpad";
  /** Masked input, where every * signs will be replaced by a number */
  mask?: string|ContextFn<string>;
  /** Hide users input. Shows only X signs instead entered value. */
  hide?: boolean|ContextFn<boolean>;
}

const digitRg = /^[0-9]$/;

export default {

  async message(data){
    data.setStore('');
    const mask = await data.question.param("mask");
    const hide = await data.question.param("hide");

    return {
      message: await data.question.param('message'),
      buttons: makePinpad('',data.i18n,mask,hide)
    };
  },

  async callback(button,data){
    const mask = await data.question.param("mask");
    const hide = await data.question.param("hide");

    let value = data.store as string;
    const {isDonable,isFinished} = getConstrains(value,mask);

    if(button.value === 'done' && isDonable){
      let answer = value;
      if(hide) answer = hideNumbers(answer);
      if(mask) answer = applyMask(answer,mask);

      return {
        answer: '✅ '+answer,
        value
      };
    } else {
      if(data.buttons){

        if(digitRg.test(button.value)){
          if(!isFinished){
            value += button.value;
            data.setStore(value);
          }
        } else if(button.value === 'backspace' && value.length > 0){
          value = value.substring(0,value.length-1);
          data.setStore(value);
        } else if(button.value === 'clear'){
          value = '';
          data.setStore(value);
        }

        data.buttons.replace(makePinpad(value,data.i18n,mask,hide));
      }
    }
  },

  async format(value){
    return Number(value);
  },

} as QuestionHandler<number>;


function makePinpad(value:string, i18n:I18nFn, mask?:string, hide?:boolean):ButtonsList{
  const {isDonable} = getConstrains(value,mask);

  if(hide) value = hideNumbers(value);
  if(mask) value = applyMask(value,mask);

  const buttons:ButtonsList = [
    [{void:value}],
    ["1","2","3"],
    ["4","5","6"],
    ["7","8","9"],
    [{backspace:"⬅️"},"0", {clear:"🆑"}]
  ];

  if(isDonable) buttons.push([{done:"✅ "+i18n("done")}]);

  return buttons;
}

function getMaskLength(mask:string){
  return mask.split('*').length-1;
}

function applyMask(value:string,mask:string){
  const chars = value.split('');
  return mask.replace(/\*/g,() => chars.shift()||'*');
}

function hideNumbers(value:string){
  return 'X'.repeat(value.length);
}

function getConstrains(value:string,mask?:string){
  const maxLength = mask ? getMaskLength(mask) : null;
  const isFinished = maxLength !== null && value.length === maxLength;
  const isDonable = maxLength === null ? value.length > 0 : isFinished;
  return {
    maxLength,isFinished,isDonable
  };
}