const data = JSON.stringify(require('./data-3-10000-mix-result.json'));
const https = require('https');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var post_options_send = {
  host: 'localhost',
  path: '/api/v3.1/projects/28/tosca/import/test-event',
  port: '443',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer 61e2a3a0-a7b0-41b7-ac73-4c90afdd8dc8'
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

req.write(data);
req.end();

function checkAndGetResult(jobId) {
  var post_options_check = {
    host: 'localhost',
    path: '/api/v3/projects/queue-processing/' + jobId,
    port: '443',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer 61e2a3a0-a7b0-41b7-ac73-4c90afdd8dc8'
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