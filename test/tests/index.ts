import {test} from 'uvu';
import TelegramServer from 'telegram-test-api';
import {TelegramClient} from './lib/client';
import TelegramBot from 'node-telegram-bot-api';
import {Dialogs} from 'telegram-bot-dialogs';
import type {Context,uvu} from 'uvu';
import type {ChatId} from 'node-telegram-bot-api';

const token = 'no_need_token_there';

export type TestContext = Ctx & uvu.Crumbs;

interface Ctx extends Context{
  /** Local telegram server */
  server: TelegramServer,
  /** Telegram client instance */
  client:TelegramClient,
  /** Bot instance */
  bot: TelegramBot,
  /** Dialogs instance */
  dialogs: Dialogs,
  /** Bot's command handler */
  on: (command:string,handler:(chatId:ChatId)=>void|Promise<void>)=>void
}

test.before( async ctx => {
  const testCtx = ctx as TestContext;

  // Starting local telegram server
  testCtx.server = new TelegramServer({port:9000});
  await testCtx.server.start();

  //Initiate client
  testCtx.client = new TelegramClient(testCtx.server.config.apiURL);

  // Starting bot
  testCtx.bot = new TelegramBot(token,{polling:true, baseApiUrl: testCtx.server.config.apiURL});

  // Inititate Dialogs
  testCtx.dialogs = new Dialogs(testCtx.bot,{
    timeout: 5
  });

  // Add command handler
  testCtx.on = function(command,handler){
    testCtx.bot.onText(new RegExp(`^/${command}$`),(msg) => handler(msg.chat.id));
  };
});

test.after( async ctx => {
  const {bot,server} = ctx as TestContext;
  // Stop the bot
  await bot.stopPolling();
  // Stop server
  await server.stop();

  // Fix: stopPolling don't kill connection
  setTimeout(() => {
    process.exit();
  },0);
});

/*Bundler will write tests imports here*/

test.run();