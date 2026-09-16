/* eslint-disable no-undef */
(function () {
  'use strict';

  var nonce = '';
  if (document.currentScript) {
    nonce = document.currentScript.getAttribute('data-nonce') || '';
  }

  var parentOrigin = '*';
  try {
    if (document.referrer) {
      parentOrigin = new URL(document.referrer).origin;
    }
  } catch (_error) {
    parentOrigin = '*';
  }

  function applyHostDocumentStyles() {
    document.documentElement.style.setProperty(
      'background',
      'transparent',
      'important'
    );
    document.body.style.setProperty('margin', '0', 'important');
    document.body.style.setProperty('background', 'transparent', 'important');
  }

  applyHostDocumentStyles();

  window.addEventListener('message', function (event) {
    if (event.source !== window.parent) {
      return;
    }

    if (parentOrigin !== '*' && event.origin !== parentOrigin) {
      return;
    }

    var message = event.data;
    if (
      !message ||
      typeof message !== 'object' ||
      message.method !== 'ui/notifications/sandbox-resource-ready'
    ) {
      return;
    }

    var html = message.params && message.params.html;
    if (typeof html !== 'string') {
      return;
    }

    if (nonce) {
      html = html.replace(
        /<script(?![^>]*\bnonce\b)/gi,
        '<script nonce="' + nonce + '"'
      );
    }

    document.open();
    document.write(html);
    document.close();
    applyHostDocumentStyles();
  });

  window.parent.postMessage(
    { method: 'ui/notifications/sandbox-proxy-ready', params: {} },
    parentOrigin
  );
})();