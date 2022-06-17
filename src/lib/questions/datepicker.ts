import type {QuestionCommon, QuestionHandler, ContextFn} from './../questions';
import type {ButtonsList,Button} from './../buttons';
import type {StateData} from './../state';
import {recursiveMap} from './../utils';

/** Simple text request */
export interface QuestionDatepicker extends QuestionCommon<Date>{
  type: "datepicker";
  /** Initial date */
  initial?:Date|ContextFn<Date>;
}

type States = "start"|"pick_day"|"pick_year"|"pick_month";

type DateStore = {
  date: {
    d: null|number;
    m: null|number;
    y: null|number;
  };
  startYear: number;
  state: States;
}

export default {

  async message(data){
    const initial = await data.question.param('initial');

    data.setStore({
      date: dateToTripple(initial),
      startYear: new Date().getFullYear(),
      state: "start",
    } as DateStore);

    return {
      message: await data.question.param('message'),
      buttons: makeDatepicker(data)
    };
  },

  async callback(button,data){
    const store = data.store as DateStore;

    if(button.value === 'done'){
      if(validDate(data)) return {
        value: new Date(store.date.y as number,store.date.m as number,store.date.d as number,0,(new Date()).getTimezoneOffset()*-1,0,0),
        answer: `✅ ${store.date.d} ${data.i18n("monthes")[store.date.m as number]} ${store.date.y}`
      };
    } else {
      if(data.buttons){
        if(button.value === 'pick_day'){
          store.state = 'pick_day';
        } else if(button.value.startsWith('picked_day:')){
          store.date.d = pickedValue(button.value);
          store.state = 'start';
        } else if(button.value === 'pick_month'){
          store.state = 'pick_month';
        } else if(button.value.startsWith('picked_month:')){
          store.date.m = pickedValue(button.value);
          store.state = 'start';
        } else if(button.value === 'pick_year'){
          store.state = 'pick_year';
        } else if(button.value.startsWith('picked_year:')){
          store.date.y = store.startYear =pickedValue(button.value);
          store.state = 'start';
        } else if(button.value === 'pick_next_years'){
          store.startYear += 12;
        } else if(button.value === 'pick_prev_years'){
          store.startYear -= 12;
        }

        data.setStore(store);
        data.buttons && data.buttons.replace(makeDatepicker(data));
      }
    }
  },

  async format(value){
    return new Date(value);
  },

} as QuestionHandler<Date>;

function makeDatepicker(data:StateData):ButtonsList{
  const {date,state} = data.store as DateStore;
  let buttons:ButtonsList = [];

  if(state === 'start'){
    buttons = [
      [
        {pick_day: data.i18n("day")},
        {pick_month: data.i18n("month")},
        {pick_year: data.i18n("year")},
      ],
      [
        {pick_day: date.d === null ? "-" : String(date.d)},
        {pick_month: date.m === null ? "-" : data.i18n("monthes")[date.m]},
        {pick_year: date.y === null ? "-" : String(date.y)},
      ],
    ];
  } else if(state === 'pick_day'){
    buttons = makeDayPicker(data);
  } else if(state === 'pick_month'){
    buttons = makeMonthPicker(data);
  } else if(state === 'pick_year'){
    buttons = makeYearPicker(data);
  }

  if(date.d !== null && date.m !== null && date.y !== null){
    if(validDate(data))
      buttons.push([{done:"✅ "+data.i18n("done")}]);
    else
      buttons.push(["🚫 "+data.i18n("wrong_date")]);
  }

  return buttons;
}

function makeDayPicker(data:StateData):ButtonsList{
  const days = [
    [1,2,3,4,5,6,7],
    [8,9,10,11,12,13,14],
    [15,16,17,18,19,20,21],
    [22,23,24,25,26,27,28],
    [29,30,31,0,0,0,0]
  ];
  const buttons = recursiveMap(days,(day) => {
    let b:Button;
    if(!day)
      b = '';
    else {
      b = {};
      b["picked_day:"+day] = String(day);
    }
    return b;
  });

  buttons.unshift([data.i18n("pick_day")]);

  return buttons;
}

function makeMonthPicker(data:StateData):ButtonsList{
  const monthes = [
    [0,1,2],
    [3,4,5],
    [6,7,8],
    [9,10,11]
  ];

  const buttons = recursiveMap(monthes,(month) => {
    let b:Button = {};
    b["picked_month:"+month] = data.i18n('monthes')[month];
    return b;
  }) as ButtonsList;

  buttons.unshift([data.i18n("pick_month")]);

  return buttons;
}

function makeYearPicker(data:StateData):ButtonsList{
  const buttons:ButtonsList = [];
  const store = data.store as DateStore;
  let yearDiff = 0;
  for(let row = 0; row < 4; row++){
    const buttonsRow:Button[] = [];
    for(let col = 0; col < 3; col++){
      const b:Button = {};
      const year = String(store.startYear-yearDiff++);
      b["picked_year:"+year] = year;
      buttonsRow.push(b);
    }
    buttons.push(buttonsRow);
  }

  buttons.push([{pick_next_years:"<"},{pick_prev_years:">"}]);
  buttons.unshift([data.i18n("pick_year")]);

  return buttons;
}

function dateToTripple(date?:Date){
  const result:DateStore["date"] = {
    d: null,
    m: null,
    y: null
  };
  if(!date || !(date instanceof Date)) return result;
  result.d = date.getDate();
  result.m = date.getMonth();
  result.y = date.getFullYear();
  return result;
}

function pickedValue(value:string){
  return Number(value.split(':')[1]);
}

function validDate(data:StateData){
  const {d,m,y} = (data.store as DateStore).date;
  if(
    (d === null || m === null || y === null) ||
    (d === 31 && [1,3,5,8,10].includes(m)) ||
    (d === 30 && m === 1) ||
    (d === 29 && m === 1 && (y % 4) !== 0)
  )
    return false;
  else
    return true;
}