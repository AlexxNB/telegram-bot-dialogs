import {test} from 'uvu';
import * as assert from 'uvu/assert';
import type {TestContext} from './index';

test('Question select',async ctx => {
  const {dialogs,on,client} = ctx as TestContext;

  let result:Record<string,unknown> = {};

  const dialog = dialogs.create([
    {
      type:"select",
      message:"Test select question",
      name: 'test',
      buttons: [[{a:"A"},{b:"B"},{c:"C"}]]
    }
  ]);

  // Run dialog on command
  on('start', async id => {
    result = await dialog.start(id);
  });

  // Send start command
  client.sendMessage('/start');
  let q = await client.waitForBotMessage();
  assert.is(q.message?.text,'Test select question','Question message is correct');
  assert.is(q.keyboard.getButtonText(0,0),'A','First button is A');
  assert.is(q.keyboard.getButtonText(0,1),'B','Second button is B');
  assert.is(q.keyboard.getButtonText(0,2),'C','Third button is C');
  assert.is(q.keyboard.getButtonText(1,0),undefined,'No Done button');

  // Pick second button
  client.sendCallback(q.keyboard.getButtonCallbackData(0,1) as string, q.messageId);

  q = await client.waitForEdited(q);
  assert.is(q.keyboard.getButtonText(0,0),undefined,'Buttons should be wanished');

  // Get result
  let a = await client.waitForBotMessage();
  assert.is(a.message?.text,'✅ B','Answer is correct');
  assert.is(result.test, 'b', 'Result is correct');
});

test('Question select multiple',async ctx => {
  const {dialogs,on,client} = ctx as TestContext;

  let result:Record<string,unknown> = {};

  const dialog = dialogs.create([
    {
      type:"select",
      message:"Test multiple select question",
      name: 'test',
      buttons: [[{a:"A"},{b:"B"},{c:"C"}]],
      multiple: true
    }
  ]);

  // Run dialog on command
  on('start', async id => {
    result = await dialog.start(id);
  });

  // Send start command
  client.sendMessage('/start');
  let q = await client.waitForBotMessage();
  assert.is(q.message?.text,'Test multiple select question','Question message is correct');
  assert.is(q.keyboard.getButtonText(0,0),'A','First button is A');
  assert.is(q.keyboard.getButtonText(0,1),'B','Second button is B');
  assert.is(q.keyboard.getButtonText(0,2),'C','Third button is C');
  assert.is(q.keyboard.getButtonText(1,0),undefined,'No Done button');

  // Pick second button
  client.sendCallback(q.keyboard.getButtonCallbackData(0,1) as string, q.messageId);

  q = await client.waitForEdited(q);
  assert.is(q.keyboard.getButtonText(0,0),'A','First button is not marked');
  assert.is(q.keyboard.getButtonText(0,1),'🔸B','Second button is marked');
  assert.is(q.keyboard.getButtonText(0,2),'C','Third button is not marked');
  assert.is(q.keyboard.getButtonText(1,0),'✅ Done','Done button is appeared');

  // Pick third button
  client.sendCallback(q.keyboard.getButtonCallbackData(0,2) as string, q.messageId);
  q = await client.waitForEdited(q);
  assert.is(q.keyboard.getButtonText(0,0),'A','First button is not marked');
  assert.is(q.keyboard.getButtonText(0,1),'🔸B','Second button is marked');
  assert.is(q.keyboard.getButtonText(0,2),'🔸C','Third button is marked');

  // Pick Done button
  client.sendCallback(q.keyboard.getButtonCallbackData(1,0) as string, q.messageId);
  q = await client.waitForEdited(q);
  assert.is(q.keyboard.getButtonText(0,0),undefined,'Buttons should be wanished');

  // Get result
  let a = await client.waitForBotMessage();
  assert.is(a.message?.text,'✅ B\n✅ C','Answer is correct');
  assert.equal(result.test, ['b','c'], 'Result is correct');
});