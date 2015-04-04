"use strict";

let Cheerio = require('cheerio'),
    Request = require('request'),
    Settings = require('./settings');

let cookie_jar = Request.jar();
Request = Request.defaults({jar: cookie_jar});

let _publication,
    _package_id,
    _package_value,
    _csrf;

function _promiseSuccessOrError(resolve, reject, error_msg) {
    return function (err, response, body) {
        if(err && response !== undefined && response.statusCode !== 200) {
            if (error_msg === undefined) {
                error_msg = "Request error";
            }
            console.log(error_msg);
            reject(error_msg);
        } else {
            resolve({
                body: body,
                response: response
            });
        }
    };
}

function _downloadPackage() {
    let url = Settings.BASE_URL + Settings.DOWNLOAD_PATH + '?downloadInfoId=' + _package_id + "&downloadPackageId=" + _package_value;

    return new Promise(function (resolve, reject) {
        console.log("Downloading " + url + "...");
        Request.get(
            {
                url: url,
                headers: {
                    'X-Csrf-Token': _csrf
                }
            },
            _promiseSuccessOrError(resolve, reject)
        );
    });
}

function _checkIsPackageReady(result) {
    let body = result.body;
    let data = JSON.parse(body);

    return new Promise(function(resolve, reject) {
        if (data[_package_id] === undefined || data[_package_id] !== 'READY') {
            reject("Package is not ready. Please try again later.");
        }

        resolve(true);
    });
}

function _prepareDownload(result) {
    let body = result.body;
    let $ = Cheerio.load(body);
    let packageElements = $('.packageItem');
    let mobiElement = false;

    packageElements.each(function(i, elem) {
        if ($(this).find('a').text().indexOf('MOBI') !== -1) {
            mobiElement = this;
        }
    });

    // No MOBI block found, exit.
    if (mobiElement === false || packageElements.length <= 0) {
        throw Error('Couldn\'t find link to MOBI package.');
    }

    mobiElement = $(mobiElement).find('input[type="radio"]').first();
    _package_id = mobiElement.attr('name');
    _package_id = _package_id.substring(_package_id.indexOf("_") + 1);
    _package_value = mobiElement.val();

    let url = Settings.BASE_URL + Settings.PREPARE_DOWNLOAD_PATH + '?statusId=' + _package_id + "&startId=" + _package_id;

    return new Promise(function (resolve, reject) {
        console.log("Preparing download " + url + "...");
        Request.get(
            {
                url: url,
                headers: {
                    'X-Requested-With' : 'XMLHttpRequest',
                    'X-Csrf-Token': _csrf
                }
            },
            _promiseSuccessOrError(resolve, reject)
        );
    });
}

function _readDownloadLinks(result) {
    let body = result.body;
    let $ = Cheerio.load(body);
    let publication_id = $(Settings.HTML.DOWNLOAD_LINK_SELECTOR).first().attr('id');
    publication_id = publication_id.substring(publication_id.indexOf("_") + 1);

    let url = Settings.BASE_URL + Settings.DOWNLOAD_LINKS_PATH + '?id=' + publication_id;

    // Set CSRF value globally for further ajax requests
    _csrf = $(Settings.HTML.CSRF_META_SELECTOR).attr('content');

    return new Promise(function (resolve, reject) {
        console.log("Reading download links " + url + "...");
        Request.get(
            {
                url: url,
                headers: {
                    'X-Requested-With' : 'XMLHttpRequest'
                }
            },
            _promiseSuccessOrError(resolve, reject)
        );
    });
}

function _loadLoginForm() {
    return new Promise(function (resolve, reject) {
        console.log("Loading login form ...");
        Request.get(
            Settings.BASE_URL + Settings.LOGIN_PATH,
            _promiseSuccessOrError(resolve, reject)
        );
    });
}

function _getPublicationName(result) {
    return _publication;
}

function _readPublication(result) {
    let body = result.body;
    let $ = Cheerio.load(body);

    // Get publication Url
    let $item = $(Settings.HTML.PUBLICATION_ITEM_SELECTOR).first();
    let nameBlock = $item.find(Settings.HTML.PUBLICATION_TITLE_SELECTOR).first();
    let publication_path = nameBlock.attr('href').trim();

    // Get publication details
    _publication = nameBlock.text();
    let div_details = $item.find(Settings.HTML.PUBLICATION_DESC_SELECTOR);
    let date_pattern = /[0-9]{2}\.[0-9]{2}\.[0-9]{4}/;
    let i, date;

    for (i=0; i < div_details.length; i++) {
        date = date_pattern.exec($(div_details[i]).text());

        if (date) {
            _publication = _publication + " (" + date + ")";
            break;
        }
    }

    return new Promise(function (resolve, reject) {
        console.log("Reading publication" + publication_path + "...");
        Request.get(
            Settings.BASE_URL + publication_path,
            _promiseSuccessOrError(resolve, reject)
        );
    });
}

function _readBookshelf() {
    return new Promise(function (resolve, reject) {
        console.log("Reading bookshelf" + Settings.BOOKSHELF_PATH + "...");
        Request.get(
            Settings.BASE_URL + Settings.BOOKSHELF_PATH,
            _promiseSuccessOrError(resolve, reject)
        );
    });
}

function _handleLogin(result) {
    let body = result.body;
    let $ = Cheerio.load(body);
    let $loginForm = $(Settings.HTML.LOGIN_FORM_SELECTOR);

    let csrf = $loginForm.find(Settings.HTML.CSRF_SELECTOR).val();
    let action = $loginForm.attr('action');

    if (action.substr(0,4) !== 'http') {
        action = Settings.BASE_URL + action;
    }

    return new Promise(function (resolve, reject) {
        console.log("Siging in " + action + "...");
        Request.post({
            url: action,
            followAllRedirects: true,
            form: {
                j_username: Settings.LOGIN,
                j_password: Settings.PASS,
                _csrf: csrf
            }
        }, _promiseSuccessOrError(resolve, reject));
    });
}

module.exports =
{
    getPublicationName: function() {
        return _loadLoginForm()
            .then(_handleLogin)
            .then(_readBookshelf)
            .then(_readPublication)
            .then(_getPublicationName);
    },

    download: function() {
        return _loadLoginForm()
            .then(_handleLogin)
            .then(_readBookshelf)
            .then(_readPublication)
            .then(_readDownloadLinks)
            .then(_prepareDownload)
            .then(_checkIsPackageReady)
            .then(_downloadPackage);
    }
};