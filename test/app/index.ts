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
  locale: "ru"
});

const testDialog = dialogs.create([
  {
    type: "pinpad",
    message: "Enter number?",
    name: 'select_test',
  }
]);

bot.onText(/^\/start$/,async(msg) => {
  testDialog.start(msg.chat.id, result => {
    console.log(result);
  });
});