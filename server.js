"use strict";

let Http = require('http'),
    Url = require('url'),
    Controller = require('./controller'),
    Settings = require('./settings'),

    actions = {
        '/' : Controller.index,
        '/download' : Controller.download
    };

Http.createServer(function (req, res) {
    let path = Url.parse(req.url).pathname;

    if (actions[path] !== undefined) {
        actions[path](req, res);
    } else {
        Controller.notFound(req, res);
    }
}).listen(Settings.SERVER_PORT);

console.log("Listeninig on port " + Settings.SERVER_PORT + "...");
