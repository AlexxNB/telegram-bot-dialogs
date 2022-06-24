# telegram-bot-dialogs

The framework for building dialogs where user answers on given questions. You can easy collect multiple data from user.

<p align="center">
  <img src="https://github.com/AlexxNB/telegram-bot-dialogs/raw/master/docs/media/dialogs.gif">
</p>

## Features
* Easy to run Qustion-Answer session with user
* Multiple types of questions
* Interactive values of next questions, based on answers before
* Intarnalization support with customizing on each level of tthe dialog

## Usage 

The `telegram-bot-dialogs` uses along with `node-telegram-bot-api`. See an example of usage:

```js
import TelegramBot from 'node-telegram-bot-api';
import {Dialogs} from 'telegram-bot-dialogs';

// Create bot instance
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN,{polling:true});
// Create dialogs instance, based on the bot
const dialogs = new Dialogs(bot);

// Create dialog instance with list of questions of various types
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
  // On commad '/start', run dialog session for given chat ID
  const result = await testDialog.start(msg.chat.id);

  // Get the result, when user will complete all questions.
  console.log(result);
  /*
    You will see something like this:
    {
      name: 'John',
      birthday: 1985-12-03T00:00:00.000Z,
      shure: true,
      phone: 9001234567,
      sport: [ 'Hockey', 'Squash' ],
      color: 'Orange'
    }
  */
});
```

## Documentation
Coming soon...