"use strict";

let PublioToKindle = require('./publio_to_kindle'),
    Settings = require('./settings'),
    Jade = require('jade'),
    Qs = require('querystring');

function _promiseError(res) {
    return function (error) {
        res.writeHead(500, {'Content-Type': 'text/plain'});
        res.end("Error! " + error);
        console.log("Promise error!", error);
    };
}

let Controller = {
    index: function (req, res) {
        PublioToKindle
            .getPublicationName()
            .then(function (name) {
                let html = Jade.renderFile('index.jade', {name: name});

                res.writeHead(200, {'Content-Type': 'text/html'});
                res.end(html);
            })
            .catch(_promiseError(res));
    },

    download: function (req, res) {

        if (req.method !== "POST") {
            Controller.notFound(req, res);
            return;
        }

        let body = "";
        req.on("data", function (data) {
            body += data;

            // Too much POST data
            if (body.length > 1e6) {
                req.connection.destroy();
            }
        });

        req.on("end", function () {
            let post = Qs.parse(body);

            if (post.pin === undefined || post.pin.trim() !== "" + Settings.PIN) {
                res.writeHead(301,{Location: '/'});
                res.end();
                return;
            }

            PublioToKindle
                .download()
                .then(function (result) {
                    res.writeHead(200, result.response.headers);
                    res.end(result.body);
                })
                .catch(_promiseError(res));

        });
    },

    notFound: function (req, res) {
        res.writeHead(404, {'Content-Type': 'text/plain'});
        res.end("404 Not Found");
    }
};

module.exports = Controller;