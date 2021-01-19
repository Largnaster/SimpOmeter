const fs = require('fs');
const Hapi = require('hapi');
const path = require('path');
const Boom = require('boom');
const color = require('color');
const ext = require('commander');
const jsonwebtoken = require('jsonwebtoken');

// Developer rig uses self-signed certifications. Node doesen't accept them
// by default. Do not use this in production
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// Use verbose loggin during development. Set this to false in production
const verboseLogging = true;
const verboseLog = verboseLogging ? console.log.bind(console) : () => {};

// Service state variables
const initialColor = color("#6441A4");
const bearerPrefix = "Bearer ";
const colorWheelRotation = 30;
const channelColors = {};

const STRINGS = {
  secretEnv: usingValue("secret"),
  clientIdEnv: usingValue("client-id"),
  serverStarted: "Server running at %s",
  secretMissing: missingValue("secret", "EXT_SECRET"),
  clientIdMissing: missingValue("client ID", "EXT_CLIENT_ID"),
  cyclingColor: "Cycling color for c:%s on behalf of u:%s",
  sendColor: "Sending color %s to c:%s",
  invalidAuthHeader: "Invalid authorization header",
  invalidJwt: "Invalid JWT",
};

ext
  .version(require("../package.json").version)
  .option("-s, --secret <secret>", "Extension secret")
  .option("-c, --client-id <client_id>", "Extension client ID")
  .parse(process.argv);
const secret = Buffer.from(getOption("secret", "ENV_SECRET"), "base64");
const clientId = getOption("clientId", "ENV_CLIENT_ID");

const serverOptions = {
  host: "localhost",
  port: 8081,
  routes: {
    cors: {
      origin: ["*"],
    },
  },
};
const serverPathRoot = path.resolve(__dirname, "..", "conf", "server");
if (
  fs.existsSync(serverPathRoot + ".crt") &&
  fs.existsSync(serverPathRoot + ".key")
) {
  serverOptions.tls = {
    cert: fs.readFileSync(serverPathRoot + ".crt"),
    key: fs.readFileSync(serverPathRoot + ".key"),
  };
}
const server = new Hapi.Server(serverOptions);

(async () => {
  // Handle a viewer request to cycle the color
  server.route({
    method: "POST",
    path: "/color/cycle",
    handler: colorCycleHandler,
  });

  // Handle a new viewer requesting the color
  server.route({
    method: "GET",
    path: "color/query",
    handler: colorQueryHandler,
  });

  // Start server
  await server.start();
  console.log(STRINGS.serverStarted, server.info.uri);
})();

function usingValue(name) {
  return `Using enviroment variable for ${name}`;
}

function missingValue(name, variable) {
  const option = name.charAt(0);
  return `Extension ${name} required.\nUse argument "-${option} <${name}>" or enviroment variable "${variable}"`;
}

// Get options of the command line or the enviroment
function getOption(optionName, enviromentName) {
  const option = (() => {
    if (ext[optionName]) {
      return ext[optionName];
    } else if (process.env[enviromentName]) {
      console.log(STRINGS[optionName + "Env"]);
      return process.env[enviromentName];
    }
    console.log(STRINGS[optionName + "Missing"]);
    process.exit(1);
  })();
  console.log(`Using "${option}" for ${optionName}`);
  return option;
}

// Verify the header and the enclosed JWT
function verifyAndDecode(header) {
  if (header.startsWith(bearerPrefix)) {
    try {
      const token = header.substring(bearerPrefix.length);
      return jwt.verify(token, secret, { algorithms: ["HS256"] });
    } catch (ex) {
      throw Boom.unauthorized(STRINGS.invalidJwt);
    }
  }
  throw Boom.unauthorized(STRINGS.invalidAuthHeader);
}

function colorCycleHandler(req) {
  // Verify all requests
  const payload = verifyAndDecode(req.headers.authorization);
  const { channel_id: channelId, opaque_user_id: opaqueUserId } = payload;

  // Store the color for the channel
  let currentColor = channelColors[channelId] || initialColor;

  // Rotate the color as if on a color wheel
  verboseLog(STRINGS.cyclingColor, channelId, opaqueUserId);
  currentColor = color(currentColor).rotate(colorWheelRotation).hex();

  // Save the new color for the channel
  channelColors[channelId] = currentColor;

  return currentColor;
}

function colorQueryHandler(req) {
  // Verify all requests
  const payload = verifyAndDecode(req.headers.authorization);

  // Get the color for the channel from the payload and return it
  const { channel_id: channelId, opaque_user_id: opaqueUserId } = payload;
  const currentColor = color(channelColors[channelId] || initialColor).hex();
  verboseLog(STRINGS.sendColor, currentColor, opaqueUserId);
  return currentColor;
}
