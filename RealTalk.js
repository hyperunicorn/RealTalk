var times = 0;
var startApp = Date.now();
function order(){
    times += 1;
    console.log("TIMES: " + times);
}
function getAnalysisURL(videoName){
    return browser.runtime.getURL("/analysis/analyse.html?video="+videoName);
}
        
function extractParams(uri, key){
    query = '?' + uri.split('?')[1];
    urlParams = new URLSearchParams(query);
    return urlParams.get(key);
}

function analyse(){
    
    browser.tabs.query({active: true, currentWindow: true}).then(startAnalysis);
}   



browser.scripting.registerContentScripts([{
    "matches": ["https://*.youtube.com/*"],
    "js": ["/content_scripts/RealWork.js"],
    "id": "RealTalk"
}]).then(browser.scripting.registerContentScripts([{
    "matches": ["moz-extension://*analysis/*"],
    "js": ["/analysis/analyseThis.js"],
    "id": "Analyse"
}])).catch(() => {browser.tabs.create({url:"http:www.google.com"});});

var youtubeTabs = {};
var analysisTabs = {};
      
let youtubePorts = {};
let analysisPorts = {};

function youtubeMessageHandler(message){
    console.log(message);
    if (message.src != "test"){
        ID = message.src.split(":")[1];
        analysisPorts["analysis:"+ID].postMessage({payload:message.payload});
    }
}

function analysisMessageHandler(message){
    window.console.log("Received from analysis");
    if (message.message != "ignore"){ 
        ID = message.src.split(":")[1];
        youtubePorts["youtube:"+ID].postMessage({src:message.src});
    }
}

function pageClick(tab, oclkdata){
    ID = extractParams(tab.url, 'v');
    youtubePorts["youtube:" + ID].postMessage({command:"realwork"});
    startAnalysis(ID);
}

var pageClicked = {};

function connectPort(port){
    splitName = port.name.split(":");
    type = splitName[0];
    
    if (type == "youtube"){
        order();
        youtubePorts["youtube:" + splitName[1]] = port;
        youtubePorts["youtube:" + splitName[1]].onMessage.addListener(youtubeMessageHandler); 
        if (pageClicked[splitName[1]] == undefined){
            browser.pageAction.onClicked.addListener((tab) => {
                ID = extractParams(tab.url, 'v');
                window.console.log("KEK: In connectPort " + ID);
                youtubePorts["youtube:" + splitName[1]].postMessage({command:"realwork"});
                startAnalysis(ID);
            });
            pageClicked[splitName[1]] = true;
        }
        
     }
     else {
        analysisPorts["analysis:" + splitName[1]] = port;                         
        analysisPorts["analysis:" + splitName[1]].onMessage.addListener(analysisMessageHandler);
     }
}

browser.runtime.onConnect.addListener(connectPort);

function handleMessage(message, sender, sendFunction){
    splitName = message.src.split(":");
    type = splitName[0];
    ID = splitName[1];
    if (type == "youtube"){
        browser.tabs.sendMessage(analysisTabs["analysis:"+ID], message.payload);
    }
    else {
        browser.tabs.sendMessage(youtubeTabs["youtube:"+ID], message.payload);
    }
}

browser.runtime.onMessage.addListener(handleMessage);

function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
}
    
/*async function doSomething(){
    while (Date.now - startCycle < 24 * 60 * 60 * 1000){
        window.console.log("Still here");
        await sleep(500);
    }
}*/
    
function startAnalysis(ytID){
    //ytID = extractParams(tabs[0].url, 'v');
    window.console.log(youtubePorts["youtube:" + ytID]);
    //youtubeTabs["youtube:" + ytID] = tabs[0].id;
    youtubePorts["youtube:"+ytID].postMessage({command: "realwork"})
    analysisURL = getAnalysisURL(ytID);
    browser.tabs.create({url:analysisURL}).then((tab) => {
        anID = extractParams(tab.url, "video");
        analysisTabs["analysis:"+anID] = tab.id;
    });
}
        

//doSomething();
periodInMinutes = 0.01;
browser.alarms.create({periodInMinutes});

function doSomething(){
    console.log("Doing something");
}

browser.alarms.onAlarm.addListener(doSomething);


