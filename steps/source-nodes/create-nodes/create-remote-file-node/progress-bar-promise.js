"use strict";

exports.__esModule = true;
exports.remoteFileDownloaderBarPromise = exports.allowFileDownloaderProgressBarToClear = void 0;
let resolveFileDownloaderProgressBarPromise;

const allowFileDownloaderProgressBarToClear = () => {
  resolveFileDownloaderProgressBarPromise();
};

exports.allowFileDownloaderProgressBarToClear = allowFileDownloaderProgressBarToClear;
const remoteFileDownloaderBarPromise = new Promise(resolve => {
  resolveFileDownloaderProgressBarPromise = resolve;
});
exports.remoteFileDownloaderBarPromise = remoteFileDownloaderBarPromise;