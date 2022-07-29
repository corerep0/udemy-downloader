/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
/*!*****************************!*\
  !*** ./src/createWindow.js ***!
  \*****************************/
var windowNotOpenTitle = 'Open popup window';
var windowIsOpenTitle = 'Popup window is already open. Click to focus popup.';
var popupWindowId = false; //popupWindowId can be true, false, or the popup's window Id.

chrome.action.onClicked.addListener(function () {
    let width= 1092;
    let height= 700;
    if(popupWindowId === false){
        popupWindowId = true; //Prevent user pressing pressing the button multiple times.
        chrome.action.setTitle({title:windowIsOpenTitle});
        chrome.windows.create({
            'url': 'popup.html',
            'type': 'popup',
            'width': width,
            'height': height,
            //'left': (Screen.width/2) - (width/2),
            //'top': (Screen.height/2) - (height/2),
            'focused': true
        },
        function(win){
            popupWindowId = win.id;
        });
        return;
    }else if(typeof popupWindowId === 'number'){
        //The window is open, and the user clicked the button.
        //  Focus the window.
        chrome.windows.update(popupWindowId,{focused:true});
    }
});
chrome.windows.onRemoved.addListener(function (winId){
    if(popupWindowId === winId){
        //chrome.browserAction.enable();
        chrome.action.setTitle({title:windowNotOpenTitle});
        popupWindowId = false;
    }
});

chrome.runtime.onInstalled.addListener((reason) => {
  if (reason === chrome.runtime.OnInstalledReason.INSTALL) {
    chrome.tabs.create({
      url: 'https://wooglet.com/udemy-downloader.html'
    });
  }
});

/******/ })()
;
//# sourceMappingURL=popup.js.map