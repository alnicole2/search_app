var client = ZAFClient.init();

client.on('app.registered', function(appData) {
  let location = appData.context.location;
  let App = require(`./locations/${location}.js`).default;  
  new App(client, appData);
});
