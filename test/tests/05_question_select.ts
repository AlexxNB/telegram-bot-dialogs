import {test} from 'uvu';
import * as assert from 'uvu/assert';
import type {TestContext} from './index';

test('Question select',async ctx => {
  const {dialogs,on,client} = ctx as TestContext;

  let result:Record<string,unknown> = {};

  const dialog = dialogs.create([
    {
      type:"select",
      message:"Test select question.",
      name: 'test_1',
      buttons: [[{a:"A"},{b:"B"},{c:"C"}]],
      multiple: false
    }
  ]);

  on('test_question_select', async id => {
    result = await dialog.start(id);
  });

  client.sendMessage('/test_question_select');
  let q = await client.waitForBotMessage();
  assert.is(q.keyboard.getButtonText(0,1),'B','Second button is B');
  client.sendCallback(q.keyboard.getButtonCallbackData(0,1) as string, q.messageId);

  q = await client.waitForEdited(q);
  assert.is(q.keyboard.getButtonText(0,0),undefined,'Buttons should be wanished');

  let a = await client.waitForBotMessage();
  assert.is(a.message?.text,'✅ B','Got correct answer');

  assert.is(result.test_1, 'b', "Got right result");
});