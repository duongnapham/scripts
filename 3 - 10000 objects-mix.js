const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const https = require('https');
const env = JSON.parse(fs.readFileSync('./env.json'));

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

const host = env.host;
const job_path = env.job_path
const submit_job_path = env.submit_job_path;
const key = env.key;

function getRoot() {
  const content = [];
  let uuid = uuidv4();
  content.push({
    "toscaUniqueId": uuid,
    "name": "Test Cycle top",
    "description": "Test Cycle TestEvent1 " + uuid,
    "toscaNodePath": uuid,
    "toscaObjectType": "TestEvent",
    "toscaURL": "https://tosca1.com/",
    "qTestUniqueId": 0,
  });

  return content;
}

function generateTestCyclesAndTestRuns() {
  const testRuns = [];
  const testCycles = [];
  for (let i = 1; i <= 4000; i++) {
    let uuid = uuidv4();
    testCycles.push({
      "toscaUniqueId": uuid,
      "name": "Test Cycle " + i,
      "description": "Test Cycle TestEvent " + uuid,
      "toscaNodePath": uuid,
      "toscaObjectType": "TestEvent",
      "toscaURL": "https://tosca1.com/",
      "qTestUniqueId": 0
    })
  }

  for (let i = 1; i <= 6000; i++) {
    let uuid = uuidv4();
    testRuns.push({
      "toscaUniqueId": uuid,
      "name": "Test Run " + uuid,
      "toscaNodePath": uuid,
      "qTestUniqueId": 0,
      "associatedToscaTestCase": {
        "toscaUniqueId": "123-456-789-abc",
        "toscaNodePath": "123-456-789-abc"
      }
    })
  }

  return [testCycles, testRuns];
}

function generateData(root, testCycles, testRuns) {
  root[0].testCycles = [];
  root[0].testRuns = [];

  const newTestCycles = testCycles.concat();
  const newTestRuns = testRuns.concat();
  let lastObject = root[0];
  let index = 0;
  for (let i = 1; i <= 80; i++) {
    if (i % 2 != 0) {
      let currentTestRuns = lastObject.testRuns || [];
      for (let j = 1; j <= 150 && newTestRuns.length > 0; j++) {
        currentTestRuns.push(newTestRuns.shift())
      }
      lastObject.testRuns = currentTestRuns;
      let currentTestCycles = lastObject.testCycles || [];
      for (let j = 1; j <= 100; j++) {
        currentTestCycles.push(newTestCycles.shift())
        index = index + 100;
      }
      lastObject.testCycles = currentTestCycles;
    } else {
      lastObject = lastObject.testCycles[0];
    }
  }
  return root;
}


const root = getRoot();
const [testCycles, testRuns] = generateTestCyclesAndTestRuns();
const data = generateData(root, testCycles, testRuns);

fs.writeFile('data-3-10000-mix.json', JSON.stringify(data), function (err) {
  if (err) throw err;
  console.log('Saved!');
});

var post_options_send = {
  host: host,
  path: submit_job_path,
  port: '443',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': key
  }
};

let req = https.request(post_options_send, function (res) {
  res.on('data', function (chunk) {
    let jobId = JSON.parse(chunk).id;
    console.log(jobId);
    checkAndGetResult(jobId);
  });
});

req.on('error', (error) => {
  console.error(error);
})

req.write(JSON.stringify(data));
req.end();

function checkAndGetResult(jobId) {
  var post_options_check = {
    host: host,
    path: job_path + jobId,
    port: '443',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': key
    }
  };
  let interval = setInterval(() => {
    req = https.request(post_options_check, function (res) {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', function () {
        let data = JSON.parse(body);
        let state = data.state;

        console.log("Check result " + state);
        if (state === "SUCCESS") {
          clearInterval(interval);
          const newData = modifyContentWithResult(JSON.parse(data.content).success, root, testCycles, testRuns);
          fs.writeFile('data-3-10000-mix-result.json', JSON.stringify(newData), function (err) {
            if (err) throw err;
            console.log('Result saved!');
          });
        }
      });
    });
    req.end();
  }, 1000);
}

function modifyContentWithResult(data, root, testCycles, testRuns) {
  let map = {};
  data.forEach(item => map[item.toscaUniqueId] = item.qTestUniqueId);
  root[0].qTestUniqueId = map[root[0].toscaUniqueId];
  testCycles.forEach(item => {
    item.qTestUniqueId = map[item.toscaUniqueId];
    item.testCycles = [];
    item.testRuns = [];
  });
  testRuns.forEach(item => item.qTestUniqueId = map[item.toscaUniqueId]);

  const newData = generateData(root, testCycles, testRuns);
  return newData;
}