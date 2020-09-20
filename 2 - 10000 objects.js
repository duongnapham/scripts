const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const content = [];
let lastObject = {};
for (let i = 1; i <= 10000; i++) {
  const uuid = uuidv4();
  content.push({
    "toscaUniqueId": uuid,
    "name": "Test Cycle " + i,
    "description": "Test Cycle TestEvent1 " + uuid,
    "toscaNodePath": uuid,
    "toscaObjectType": "TestEvent",
    "toscaURL": "https://tosca1.com/",
    "qTestUniqueId": 0,
  })
}

fs.writeFile('data-1-10000.json', JSON.stringify(content), function (err) {
  if (err) throw err;
  console.log('Saved!');
});