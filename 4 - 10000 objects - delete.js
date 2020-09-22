const content = require('./data-3-10000-mix-result.json');
const https = require('https');
const env = JSON.parse(fs.readFileSync('./env.json'));

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

const host = env.host;
const job_path = env.job_path
const submit_job_path = env.submit_job_path;
const key = env.key;

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

/*let lastObject = content[0];
for (let i = 1; i <= 9; i++) {
  lastObject = lastObject.testCycles[0];
}

lastObject.testCycles.shift();
lastObject.testCycles.shift();
lastObject.testCycles.shift();

lastObject.testRuns.shift();
lastObject.testRuns.shift();
lastObject.testRuns.shift();*/

content[0].testCycles = [];
content[0].testRuns = [];

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

req.write(JSON.stringify(content));
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
          console.log("DONE!!!")
        }
      });
    });
    req.end();
  }, 1000);
}