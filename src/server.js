const http = require('http');
const fs = require('fs');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

// Load the html and css fles
const indexHTML = fs.readFileSync(`${__dirname}/../client/client.html`);
const indexCSS = fs.readFileSync(`${__dirname}/../client/style.css`);

// Response data
const successObj = {
  message: 'This is a successful response',
};
const badReqValidObj = {
  message: 'This request has the required parameters',
};
const unauthorizedValidObj = {
  message: 'You have successfully viewed the content.',
};
const badReqObj = {
  message: 'Missing valid query parameter set to true',
  id: 'badRequest',
};
const unauthorizedObj = {
  message: 'Missing loggedIn query parameter set to yes',
  id: 'unauthorized',
};
const forbiddenObj = {
  message: 'You do not have access to this content.',
  id: 'forbidden',
};
const internalObj = {
  message: 'Internal Server Error. Something went wrong.',
  id: 'internalError',
};
const notImplementedObj = {
  message: 'A get request for this page has not been implemented yet. Check again later for updated content.',
  id: 'notImplemented',
};
const otherObj = {
  message: 'The page you are looking for was not found.',
  id: 'notFound',
};

// Encodes the data into basic XML
function encodeXML(data) {
  let xml = `<response>\n  <message>\n    ${data.message}\n  </message>\n`;
  if (data.id) {
    xml += `  <id>${data.id}</id>\n`;
  }
  xml += '</response>';

  return xml;
}

// Compressed helper function for sending responses
function sendResponse(request, response, statusCode, contentType, data) {
  response.writeHead(statusCode, { 'Content-Type': contentType });
  response.write(data);
  response.end();
}

function onRequest(request, response) {
  const acceptType = request.headers.accept === 'text/xml' ? 'text/xml' : 'application/json';
  const dataFunc = acceptType === 'text/xml' ? encodeXML : JSON.stringify;

  const requestSplit = request.url.split('?');
  const reqURL = requestSplit[0];
  const reqParams = {};

  // Extract query params
  if (requestSplit.length > 1) {
    const params = requestSplit[1].split('&');

    for (let i = 0; i < params.length; ++i) {
      const paramSplit = params[i].split('=');
      if (paramSplit.length === 2) {
        // Somehow this is considered preferable to doing it inline by airbnb
        const p0 = paramSplit[0];
        const p1 = paramSplit[1];
        reqParams[p0] = p1;
      }
    }
  }

  // Inline the functionality into the switch (sendResponse does all the heavy lifting)
  switch (reqURL) {
    case '/':
      sendResponse(request, response, 200, 'text/html', indexHTML);
      break;
    case '/style.css':
      sendResponse(request, response, 200, 'text/css', indexCSS);
      break;
    case '/success':
      sendResponse(request, response, 200, acceptType, dataFunc(successObj));
      break;
    case '/badRequest':
      if (reqParams.valid && reqParams.valid === 'true') {
        sendResponse(request, response, 200, acceptType, dataFunc(badReqValidObj));
      } else {
        sendResponse(request, response, 400, acceptType, dataFunc(badReqObj));
      }
      break;
    case '/unauthorized':
      if (reqParams.loggedIn && reqParams.loggedIn === 'yes') {
        sendResponse(request, response, 200, acceptType, dataFunc(unauthorizedValidObj));
      } else {
        sendResponse(request, response, 401, acceptType, dataFunc(unauthorizedObj));
      }
      break;
    case '/forbidden':
      sendResponse(request, response, 403, acceptType, dataFunc(forbiddenObj));
      break;
    case '/internal':
      sendResponse(request, response, 500, acceptType, dataFunc(internalObj));
      break;
    case '/notImplemented':
      sendResponse(request, response, 501, acceptType, dataFunc(notImplementedObj));
      break;
    default:
      sendResponse(request, response, 404, acceptType, dataFunc(otherObj));
      break;
  }
}

http.createServer(onRequest).listen(port);

console.log(`Listening on 127.0.0.1:${port}`);
