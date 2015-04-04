"use strict";

module.exports = {
	LOGIN: 'youremail@example.com',
    PASS: 'yourpassword',
	
    SERVER_PORT: process.env.PORT || 3000,
    PIN: 123456, // Your PIN

    BASE_URL: 'https://www.publio.pl',
    LOGIN_PATH: '/klient/logowanie.html',
    BOOKSHELF_PATH: '/klient/publikacje.html?pressTitle=91417',
    DOWNLOAD_LINKS_PATH: '/klient/pobieranie/ajax/download-product-headers.html',
    DOWNLOAD_PATH: '/klient/pobieranie/pobierz-zestaw.html',
    PREPARE_DOWNLOAD_PATH: '/klient/pobieranie/ajax/prepare.html',

    HTML: {
        LOGIN_FORM_SELECTOR: '#loginForm',
        CSRF_SELECTOR: 'input[name="_csrf"]',
        CSRF_META_SELECTOR: 'meta[name="csrfToken"]',
        DOWNLOAD_LINK_SELECTOR: ".downloadButtonsContainer",
        PUBLICATION_ITEM_SELECTOR: "#cartItems .item",
        PUBLICATION_TITLE_SELECTOR: "a.title",
        PUBLICATION_DESC_SELECTOR: ".descCol div"
    }
};