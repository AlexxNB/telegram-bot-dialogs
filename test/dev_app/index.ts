import dotenv from "dotenv";
import path from 'path';
import TelegramBot from 'node-telegram-bot-api';
import {Dialogs} from 'telegram-bot-dialogs';

// Load .dotenv file
dotenv.config({path: path.join(__dirname,".env")});

if(!process.env.TELEGRAM_BOT_TOKEN)
  throw new Error("You must set TELEGRAM_BOT_TOKEN environment variable. See .env.example file.");

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN,{polling:true});
const dialogs = new Dialogs(bot,{
  locale: "en"
});

const testDialog = dialogs.create([
  {
    type:"text",
    message:"What is your name?",
    name: 'name'
  },
  {
    type:"datepicker",
    message:"When you born?",
    name: 'birthday'
  },
  {
    type:"confirm",
    message:"Are you shure?",
    name: 'shure'
  },
  {
    type:"pinpad",
    message:"What is your phone number?",
    name: 'phone',
    mask: "+7 (***) ***-**-**"
  },
  {
    type:"select",
    name: "sport",
    message: "What are your favourite sports?",
    buttons:[
      ["Soccer"],
      ["Hockey"],
      ["Tennis","Squash"],
    ],
    multiple: true
  },
  {
    type: "picker",
    name: "color",
    message: "Choose yours most loved color.",
    list:["Pink","Orange","Red","Blue","Green"]
  }
]);

bot.onText(/^\/start$/,async(msg) => {
  testDialog.start(msg.chat.id, result => {
    console.log(result);
  });
});