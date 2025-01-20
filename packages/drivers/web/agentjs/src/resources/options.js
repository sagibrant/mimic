//holds
window.logException = {};
window.knownLogLevels = ["ALL", "TRACE", "DEBUG", "INFO", "WARN", "ERROR", "FATAL", "OFF"];
window.deletedCats = [];

window.defaultPort = 8824;
window.keyDefaultPort = "UFT_daemonPort";
window.enableAdvancedFeatures = false;
// Advanced Features
// display popup
window.keyActionPopupSettings = "UFT_Action_Popup_Settings";
window.defaultActionPopupSettings = {
	"enable": false,
	"title": "OpenText Functional Testing Agent",
	"popup": "Agent/Resources/action-popup.html"
};
// content policy
window.keyContentPolicy = "UFT_Content_Policy";
window.knownFrameCommunicationModes = ["postMessage", "extension"];
window.knownScriptEvaluationModes = {
	"inline script": {
		"type": "inline script",
		"options": {
			"autoDetectNonce": true,
			"nonce": "UftNonceMagicAllowInlineScript"
		}
	},
	"cdp": {
		"type": "cdp", // Runtime.evaluate
		"options": {
			"includeCommandLineAPI": false,
			"silent": true,
			"returnByValue": false,
			"userGesture": true,
			"allowUnsafeEvalBlockedByCSP": true
		}
	}
};
window.defaultContentPolicy = [{
	"matches": ["<all_urls>"],
	"frame": {
		"tags": ["iframe", "frame", "object" /*, "embed"*/ ],
		"cross_origin": true,
		"communication_mode": "postMessage", // "extension", "cdp"
		"script_evaluation_mode": {
			"type": "inline script",
			"options": {
				"autoDetectNonce": true,
				"nonce": "UftNonceMagicAllowInlineScript"
			}
		}
	}
}];

if(typeof(LoggerUtilSettings) === "undefined") {
	var LoggerUtilSettings = {
		DEFAULT_LOG_LEVEL: "WARN",
		setSettings: function(){}
	};
}

function createCombo(id, defaultValue, options) {
	var combo = document.createElement("select");
	combo.id = id;
	options.forEach(function (optionValue, i) {
		var opt = document.createElement("option");
		opt.value = optionValue;
		opt.innerText = optionValue;
		combo.appendChild(opt);
		if (defaultValue === optionValue)
			combo.selectedIndex = i;
	});
	return combo;
}

function createEditor(id, defaultValue) {
	var editor = document.createElement("input");
	editor.id = id;
	editor.style = "width:500px";
	editor.type = "text";
	editor.value = defaultValue;
	return editor;
}

function createLogCombo(id, logLevel) {
	var logLevelCombo = document.createElement("select");
	logLevelCombo.id = id;
	window.knownLogLevels.forEach(function (level, i) {
		var logOpt = document.createElement("option");
		logOpt.value = level;
		logOpt.innerText = level;
		logLevelCombo.appendChild(logOpt);
		if (level === logLevel)
			logLevelCombo.selectedIndex = i;
	});

	return logLevelCombo;
}

function deleteException(element) {
	var trElem = element.parentNode.parentNode;
	deletedCats.push(trElem.cells[1].innerText);
	trElem.parentNode.removeChild(trElem);
}

function createExceptionRow(catName, catLogLevel) {
	var exceptionRow = document.createElement("tr");
	var cell = document.createElement("td");
	var btn = document.createElement("input");
	btn.className="delBtn";
	btn.type="button";
	btn.value = "X";
	btn.addEventListener("click",function(){deleteException(btn);},false);
	cell.appendChild(btn);

	//cell.style["width"] = "7%";
	exceptionRow.appendChild(cell);
	
	cell = document.createElement("td");
	cell.innerText = catName;
	//cell.style["width"] = "60%";
	exceptionRow.appendChild(cell);
	cell = document.createElement("td");
	var logCombo = createLogCombo(catName + "_LogLevel", catLogLevel);
	cell.appendChild(logCombo);
	//cell.style["width"] = "33%";
	exceptionRow.appendChild(cell);
	return exceptionRow;
}

function loadExtensionSettings(callback) {
	if(typeof(chrome)!=="undefined" && chrome.storage && chrome.storage.local) {
		chrome.storage.local.get(null, function(settings) {
			callback(settings);
		}.bind(this));
	}
	else {
		var settings = {};
		for (var i = 0; i < window.localStorage.length; ++i) {
			var settingKey = window.localStorage.key(i);
			var settingValue = window.localStorage.getItem(settingKey);
			settings[settingKey] = settingValue;
		}
		callback(settings);
	}
}

function saveExtensionSettings(settings) {
	if(typeof(chrome)!=="undefined" && chrome.storage && chrome.storage.local) {
		chrome.storage.local.clear(function(){
			chrome.storage.local.set(settings, null);
		}.bind(this));		
	}
	else {
		var keys = Object.keys(settings);
		for (var i = 0; i < keys.length; ++i) {
			var key = keys[i];
			window.localStorage.setItem(key, settings[key])
		}
	}
}

function init(settings) {

    // init the default port
    var defaultPort = settings[window.keyDefaultPort];
    defaultPort = defaultPort || window.defaultPort;
    var defaultPortInput = document.getElementById("defaultPort");
    defaultPortInput.value = defaultPort;
    
	//init the default logging level
	var defaultLogLevel = settings["log:defaultLevel"];
	defaultLogLevel = defaultLogLevel || LoggerUtilSettings.DEFAULT_LOG_LEVEL;
	//default level
	var defaultContainer = document.getElementById("defaultLogLevelContainer");
	var defaultLevelCombo = createLogCombo("defaultLogLevel", defaultLogLevel);
	defaultContainer.appendChild(defaultLevelCombo);
	Array.prototype.forEach.call(defaultLevelCombo.options, function (o, i) {
		if (defaultLogLevel === o.value)
			defaultLevelCombo.selectedIndex = i;
	});

	// action popup
	var actionPopupSettings = settings[window.keyActionPopupSettings];
	if(actionPopupSettings) {
		window.enableAdvancedFeatures = true;
	}
	actionPopupSettings = (actionPopupSettings && JSON.parse(actionPopupSettings)) || window.defaultActionPopupSettings;
	var extensionPopup = document.getElementById("extensionPopup");
	extensionPopup.checked = actionPopupSettings.enable;

	// content policy
	var contentPolicy = settings[window.keyContentPolicy];
	if(contentPolicy) {
		window.enableAdvancedFeatures = true;
	}
	contentPolicy = (contentPolicy && JSON.parse(contentPolicy)) || window.defaultContentPolicy;

	// content policy - frame communication channel
	var frameCommunicationMode = (contentPolicy[0] && contentPolicy[0]["frame"] && contentPolicy[0]["frame"]["communication_mode"]) || "postMessage";
	var frameCommunicationModeCombo = createCombo("frameCommunicationMode", frameCommunicationMode, window.knownFrameCommunicationModes);
	var frameCommunicationModeContainer = document.getElementById("frameCommunicationModeContainer");
	frameCommunicationModeContainer.appendChild(frameCommunicationModeCombo);

	// script evaluation mode
	var scriptEvaluationMode = (contentPolicy[0] && contentPolicy[0]["frame"] && contentPolicy[0]["frame"]["script_evaluation_mode"] && contentPolicy[0]["frame"]["script_evaluation_mode"]["type"]) || "inline script";
	var scriptEvaluationModeCombo = createCombo("scriptEvaluationMode", scriptEvaluationMode, Object.keys(window.knownScriptEvaluationModes));
	var scriptEvaluationModeContainer = document.getElementById("scriptEvaluationModeContainer");
	scriptEvaluationModeContainer.appendChild(scriptEvaluationModeCombo);

	// script evaluation mode option
	var scriptEvaluationModeOption = (contentPolicy[0] && contentPolicy[0]["frame"] 
										&& contentPolicy[0]["frame"]["script_evaluation_mode"] 
										&& contentPolicy[0]["frame"]["script_evaluation_mode"]["options"]);
	var scriptEvaluationModeOptionText = scriptEvaluationModeOption && JSON.stringify(scriptEvaluationModeOption) || window.knownScriptEvaluationModes[scriptEvaluationMode] || "";
	var scriptEvaluationModeOptionEditor = createEditor("scriptEvaluationModeOption", scriptEvaluationModeOptionText);
	var scriptEvaluationModeOptionContainer = document.getElementById("scriptEvaluationModeOptionContainer");
	scriptEvaluationModeOptionContainer.appendChild(scriptEvaluationModeOptionEditor);
	
	scriptEvaluationModeCombo.addEventListener("change", function() {
		var newMode = document.getElementById("scriptEvaluationMode").value;
		var newModeOption = window.knownScriptEvaluationModes[newMode] && window.knownScriptEvaluationModes[newMode].options;
		var newModeOptionText = JSON.stringify(newModeOption) || "";
		scriptEvaluationModeOptionEditor.value = newModeOptionText;
	}.bind(this), false);

	//new exception table needs a combo box
	var newExceptionCombo = createLogCombo("newExceptionLogLevel", "ALL");
	var newExceptionTD = document.getElementById("newExceptionsSelect");
	newExceptionTD.appendChild(newExceptionCombo);

	//exception list
	var exceptionList = document.getElementById("exceptions").getElementsByTagName("tbody")[0];
	//iterates over the settings and gets all the category exceptions
	var settingKeys = Object.keys(settings);
	for (var i = 0; i < settingKeys.length; ++i) {
		var settingKey = settingKeys[i];
		if (settingKey.match(/^log:cat:/)) {
			var catName = settingKey.split(":")[2];
			var level = settings[settingKey];
			var exceptionRow = createExceptionRow(catName, level);
			exceptionList.appendChild(exceptionRow);
		}
	}

	document.getElementById("addCategorySetting").addEventListener("click", addException, false);
	document.getElementById("saveBtn").addEventListener("click", saveSettings.bind(this, settings), false);
	document.getElementById("option").addEventListener("dblclick", initAdvancedFeatures.bind(this, true), false);

	initAdvancedFeatures();
}

function initAdvancedFeatures(switchUI) {
	// content policy is the first advance feature. 
	// if it exists, we think the user enabled the advanced features.
	if (switchUI === true) {
		window.enableAdvancedFeatures = !window.enableAdvancedFeatures;
	}
	var displayValue = "none";
	if (window.enableAdvancedFeatures) {
		displayValue = "block";
	}
	var frameCommunicationModeContainer = document.getElementById("frameCommunicationModeContainer");
	frameCommunicationModeContainer.parentElement.style.display = displayValue;
	var scriptEvaluationModeContainer = document.getElementById("scriptEvaluationModeContainer");
	scriptEvaluationModeContainer.parentElement.style.display = displayValue;
	var scriptEvaluationModeOptionContainer = document.getElementById("scriptEvaluationModeOptionContainer");
	scriptEvaluationModeOptionContainer.parentElement.style.display = displayValue;
	var actionPopupContainer = document.getElementById("actionPopupContainer");
	actionPopupContainer.parentElement.style.display = displayValue;
}

function addException() {
	var exceptionT = document.getElementById("exceptions").getElementsByTagName("tbody")[0];
	var catNameTB = document.getElementById("newCatName");
	var logLevelCB = document.getElementById("newExceptionLogLevel");
	exceptionT.appendChild(createExceptionRow(catNameTB.value, newExceptionLogLevel.options[logLevelCB.selectedIndex].value));

	//clear
	catNameTB.value = "";
	logLevelCB.selectedIndex = 0;
}

function saveSettings(settings) {
    settings = settings || {};
    // port.
    var defaultPortInput = document.getElementById("defaultPort");
    var port = defaultPortInput.value || window.defaultPort;
	settings[window.keyDefaultPort] = port;

	var defaultLevel = document.getElementById("defaultLogLevel");
	settings["log:defaultLevel"] = defaultLevel.options[defaultLevel.selectedIndex].value;

	//removing the deleted categories
	deletedCats.forEach(function (cat) {
		var keyToRemove = "log:cat:" + cat;
		if(keyToRemove in settings) {
			delete settings[keyToRemove];
		}
	});
	deletedCats = [];

	if (window.enableAdvancedFeatures) {
		// set action popup settings
		var actionPopupSettings = settings[window.keyActionPopupSettings];
		actionPopupSettings = (actionPopupSettings && JSON.parse(actionPopupSettings)) || window.defaultActionPopupSettings;
		var extensionPopup = document.getElementById("extensionPopup");
		actionPopupSettings.enable = extensionPopup.checked;
		// action popup settings - save
		settings[window.keyActionPopupSettings] = JSON.stringify(actionPopupSettings);

		// set content policy
		var contentPolicy = settings[window.keyContentPolicy];
		contentPolicy = (contentPolicy && JSON.parse(contentPolicy)) || window.defaultContentPolicy;

		if (contentPolicy[0] === undefined || contentPolicy[0] === null) {
			contentPolicy = window.defaultContentPolicy;
		}
		if (contentPolicy[0]["frame"] === undefined || contentPolicy[0]["frame"] === null) {
			contentPolicy = window.defaultContentPolicy;
		}
		// content policy - frame communication channel
		var frameCommunicationMode = document.getElementById("frameCommunicationMode");
		frameCommunicationMode = frameCommunicationMode.options[frameCommunicationMode.selectedIndex].value;
		contentPolicy[0]["frame"]["communication_mode"] = frameCommunicationMode;

		// script evaluation mode
		var scriptEvaluationMode = document.getElementById("scriptEvaluationMode");
		scriptEvaluationMode = scriptEvaluationMode.options[scriptEvaluationMode.selectedIndex].value;
		contentPolicy[0]["frame"]["script_evaluation_mode"] = window.knownScriptEvaluationModes[scriptEvaluationMode];

		// script evaluation mode option
		var scriptEvaluationModeOption = document.getElementById("scriptEvaluationModeOption");
		scriptEvaluationModeOption = scriptEvaluationModeOption.value;
		if (scriptEvaluationModeOption) {
			contentPolicy[0]["frame"]["script_evaluation_mode"]["options"] = JSON.parse(scriptEvaluationModeOption);
		}

		// content policy - save
		settings[window.keyContentPolicy] = JSON.stringify(contentPolicy);
	} else {
		delete settings[window.keyActionPopupSettings];
		delete settings[window.keyContentPolicy];
	}

	//saving the exceptions
	var exceptionRows = document.getElementById("exceptions").getElementsByTagName("tbody")[0].rows;
	Array.prototype.forEach.call(exceptionRows, function (exception) {
		var catName = exception.cells[1].innerText;
		var logLevel = exception.cells[2].firstChild.options[exception.cells[2].firstChild.selectedIndex].value;
		settings["log:cat:" + catName] = logLevel;
	});

	saveExtensionSettings(settings);
	LoggerUtilSettings.setSettings(settings);
}

loadExtensionSettings(init.bind(this));

