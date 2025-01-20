class PopUpViewModel {
    constructor() {

    }

    _port;

    getExtSetting(callback) {
        if (typeof (chrome) !== "undefined" && chrome.storage && chrome.storage.local) {
            chrome.storage.local.get(null, function (settings) {
                callback(settings);
            }.bind(this));
        } else {
            let settings = {};
            for (let i = 0; i < window.localStorage.length; ++i) {
                let settingKey = window.localStorage.key(i);
                let settingValue = window.localStorage.getItem(settingKey);
                settings[settingKey] = settingValue;
            }
            callback(settings);
        }
    }

    setExtSetting(settings) {
        if (typeof (chrome) !== "undefined" && chrome.storage && chrome.storage.local) {
            chrome.storage.local.clear(function () {
                chrome.storage.local.set(settings, null);
            }.bind(this));
        } else {
            let keys = Object.keys(settings);
            for (let i = 0; i < keys.length; ++i) {
                let key = keys[i];
                window.localStorage.setItem(key, settings[key])
            }
        }
    }

    highlightText(mode, type) {
        mode = mode || "js"; // cdp or js
        type = type || "words"; // texts, lines, words, elems
        this._getLastActiveBrowserRtid(function (browserRtid) {
            if (browserRtid == null) {
                return;
            }
            let reqMsgData = { "AN_METHOD_NAME": "GET_TEXT_ITEMS" };
            let reqMsg = { _msgType: "SRVC_INVOKE_METHOD", _to: browserRtid, _data: reqMsgData };
            this._sendMessage(reqMsg, function(resMsg) {
                let text_results = [];
                let rects = [];
                let attrNames = [];
                let attrValues = [];
                if (!this._isNullOrUndefined(resMsg._data && resMsg._data.name)) {
                    attrNames = resMsg._data.name;
                    attrNames = Array.isArray(attrNames) ? attrNames[0] : [attrNames];
                }
                if (!this._isNullOrUndefined(resMsg._data && resMsg._data.value)) {
                    attrValues = resMsg._data.value;
                    attrValues = Array.isArray(attrValues) ? attrValues[0] : [attrValues];
                }
                for (let i = 0; i < attrNames.length; i++) {
                    if (attrNames[i] === "text_results") {
                        text_results = JSON.parse(attrValues[i]);
                    }
                }
                if (!Array.isArray(text_results) || text_results.length <= 0) {
                    return;
                }
                let devicePixelRatio = 1;
                let displayZoomFactor = 1;
                let pageZoomFactor = 1;
                if (mode === "cdp") {
                    text_results.forEach(function (text_result) {
                        if (!this._isNullOrUndefined(text_result.devicePixelRatio)) {
                            devicePixelRatio = text_result.devicePixelRatio;
                        }
                        if (!this._isNullOrUndefined(text_result.displayZoomFactor)) {
                            displayZoomFactor = text_result.displayZoomFactor;
                        }
                        if (!this._isNullOrUndefined(text_result.pageZoomFactor)) {
                            pageZoomFactor = text_result.pageZoomFactor;
                        }
                    }.bind(this));
                }
                text_results.forEach(function (text_result) {
                    if(type === "texts" && Array.isArray(text_result.texts)) {
                        text_result.texts.forEach(function(item) {
                            let rect = {};
                            rect.outlineColor = {r:255, g:210, b:88, a:0};
                            rect.color = {r:255, g:210, b:88, a:0.4};
                            rect.x = Math.floor(item.rectangle.x / devicePixelRatio / displayZoomFactor * pageZoomFactor);
                            rect.y = Math.floor(item.rectangle.y / devicePixelRatio / displayZoomFactor * pageZoomFactor);
                            rect.width = Math.round(item.rectangle.width / devicePixelRatio / displayZoomFactor * pageZoomFactor);
                            rect.height = Math.round(item.rectangle.height / devicePixelRatio / displayZoomFactor * pageZoomFactor);
                            rect.tooltip = item.text;
                            rects.push(rect);
                        }.bind(this));
                    }
                    if(type === "lines" && Array.isArray(text_result.lines)) {
                        text_result.lines.forEach(function(item) {
                            let rect = {};
                            rect.outlineColor = {r:108, g:170, b:78, a:0};
                            rect.color = {r:108, g:170, b:78, a:0.4};
                            rect.x = Math.floor(item.rectangle.x / devicePixelRatio / displayZoomFactor * pageZoomFactor);
                            rect.y = Math.floor(item.rectangle.y / devicePixelRatio / displayZoomFactor * pageZoomFactor);
                            rect.width = Math.round(item.rectangle.width / devicePixelRatio / displayZoomFactor * pageZoomFactor);
                            rect.height = Math.round(item.rectangle.height / devicePixelRatio / displayZoomFactor * pageZoomFactor);
                            rect.tooltip = item.text;
                            rects.push(rect);
                        }.bind(this));
                    }
                    if(type === "words" && Array.isArray(text_result.words)) {
                        text_result.words.forEach(function(item) {
                            let rect = {};
                            rect.outlineColor = {r:18, g:110, b:198, a: 0};
                            rect.color = {r:18, g:110, b:198, a: 0.4};
                            rect.x = Math.floor(item.rectangle.x / devicePixelRatio / displayZoomFactor * pageZoomFactor);
                            rect.y = Math.floor(item.rectangle.y / devicePixelRatio / displayZoomFactor * pageZoomFactor);
                            rect.width = Math.round(item.rectangle.width / devicePixelRatio / displayZoomFactor * pageZoomFactor);
                            rect.height = Math.round(item.rectangle.height / devicePixelRatio / displayZoomFactor * pageZoomFactor);
                            rect.tooltip = item.text;
                            rects.push(rect);
                        }.bind(this));
                    }
                    if(type === "elems" && Array.isArray(text_result.elems)) {
                        text_result.elems.forEach(function(item) {
                            let rect = {};
                            rect.outlineColor = {r:240, g:125, b:10, a:0};
                            rect.color = {r:240, g:125, b:10, a:0.4};
                            rect.x = Math.floor(item.rectangle.x / devicePixelRatio / displayZoomFactor * pageZoomFactor);
                            rect.y = Math.floor(item.rectangle.y / devicePixelRatio / displayZoomFactor * pageZoomFactor);
                            rect.width = Math.round(item.rectangle.width / devicePixelRatio / displayZoomFactor * pageZoomFactor);
                            rect.height = Math.round(item.rectangle.height / devicePixelRatio / displayZoomFactor * pageZoomFactor);
                            rect.tooltip = item.text;
                            rects.push(rect);
                        }.bind(this));
                    }
                }.bind(this));
                if (!Array.isArray(rects) || rects.length <= 0) {
                    return;
                }
                reqMsgData = { "AN_METHOD_NAME": "HIGHLIGHT_RECTANGLES", "rects": rects, "mode": mode };
                reqMsg = { _msgType: "SRVC_INVOKE_METHOD", _to: browserRtid, _data: reqMsgData };
                this._sendMessage(reqMsg);
            }.bind(this));
        }.bind(this));
    }

    hideHighlight(mode) {
        mode = mode || "js"; // cdp or js
        this._getLastActiveBrowserRtid(function (browserRtid) {
            if (browserRtid == null) {
                return;
            }
            let reqData = {
                "AN_METHOD_NAME": "HIDE_HIGHLIGHT",
                "mode": mode
            };
            let msg = {_msgType: "SRVC_INVOKE_METHOD", _to: browserRtid, _data: reqData};
            this._sendMessage(msg);
        }.bind(this));
    }


    _getLastActiveBrowserRtid(resultCallback) {
        chrome.windows.getLastFocused({populate: true}, (lastWindow) => {
            let lastError = chrome.runtime.lastError;
            if (lastError) {
                console.error("_getLastActiveBrowserRtid: chrome.windows.getLastFocused get error: ", lastError);
                resultCallback(null);
                return;
            }
            let windowId = lastWindow && lastWindow.id;
            let queryInfo = {active: true, lastFocusedWindow: true};
            // we prefer to use windowId rather than lastFocusedWindow or currentWindow filter 
            // because when debugging in DevTool separate window, 
            //   the chrome.tabs.query will get empty results, maybe the current and last focused window is the devTool?
            //   chrome.windows.getLastFocused/chrome.windows.getCurrent will ignore the DevlTool Window and return the last focused user window
            if(windowId) {
                queryInfo = {active: true, windowId: lastWindow.id};
            }
            chrome.tabs.query(queryInfo, (tabs) => {
                let lastError = chrome.runtime.lastError;
                if (lastError) {
                    console.error("_getLastActiveBrowserRtid: chrome.tabs.query with {" + queryInfo + "}, get error: ", lastError);
                    resultCallback(null);
                    return;
                }
                if (tabs.length !== 1) {
                    console.error("_getLastActiveBrowserRtid: chrome.tabs.query with {" + queryInfo + "}, returned multiple tabs: ", tabs.length);
                    resultCallback(null);
                    return;
                }
                let browserRtid = { browser: tabs[0].id, page: -1, frame: -1, object: null };
                resultCallback(browserRtid);
            });
        });
    }

    _sendMessage(msg, resultCallback) {
        if (!(chrome && chrome.runtime && chrome.runtime.connect)) {
            console.error("_sendMessage: chrome.runtime.connect is not available.");
            return;
        }
        if(this._port) {
            console.log("_sendMessage: the previous port is still alive. skip the current action.");
            return;
        }
        let msgToSend = {
            type: "event",
            data: msg
        };
        if(resultCallback) {
            msgToSend.type = "request";
        }
        this._port = chrome.runtime.connect();
        this._port.postMessage(msgToSend);
        this._port.onMessage.addListener(function(res) {
            // console.log("onMessage", port, res);
            if (resultCallback && res.type === "response") {
                this._port.disconnect();
                this._port = null;
                resultCallback(res.data);
            } else if (!resultCallback && res.type === "connectResponse") {
                this._port.disconnect();
                this._port = null;
            }
        }.bind(this));
    }

    _isUndefined(x) {
        return typeof (x) === 'undefined';
    }

    _isNullOrUndefined(x) {
        return this._isUndefined(x) || x === null;
    }
}

function init() {
    let proxy = new PopUpViewModel();
    let btnHightlightTexts = document.getElementById("btnHightlightTexts");
    let btnHightlightLines = document.getElementById("btnHightlightLines");
    let btnHightlightWords = document.getElementById("btnHightlightWords");
    let btnHightlightElements = document.getElementById("btnHightlightElements");
    let btnHideHightlight = document.getElementById("btnHideHightlight");
    let btnChangeHightlightMode = document.getElementById("btnChangeHightlightMode");
    let highlightMode = "js";

    if (btnHightlightTexts) {
        btnHightlightTexts.addEventListener("click", () => {
            proxy.highlightText(highlightMode, "texts");
        });
    }
    if (btnHightlightLines) {
        btnHightlightLines.addEventListener("click", () => {
            proxy.highlightText(highlightMode, "lines");
        });
    }
    if (btnHightlightWords) {
        btnHightlightWords.addEventListener("click", () => {
            proxy.highlightText(highlightMode, "words");
        });
    }
    if (btnHightlightElements) {
        btnHightlightElements.addEventListener("click", () => {
            proxy.highlightText(highlightMode, "elems");
        });
    }

    if (btnHideHightlight) {
        btnHideHightlight.addEventListener("click", () => {
            proxy.hideHighlight(highlightMode);
        });
    }

    if (btnChangeHightlightMode) {
        btnChangeHightlightMode.addEventListener("click", () => {
            if(highlightMode === "js") {
                highlightMode = "cdp";
            }
            else {
                highlightMode = "js";
            }
        });
    }
}

init();