const separator = "@#$%"; //Gotta use something that's unlikely to actually show up in usernames

document.getElementsByTagName("body")[0].style.overflow = "hidden";

function extractParams(url, key){
    query = '?' + url.split('?')[1];
    urlParams = new URLSearchParams(query);
    return urlParams.get(key);
}
    
function getID(){
    return extractParams(window.location.href, "video");
}

function msgEq(msg1, msg2){
    if (msg1["author"] != msg2["author"]){
        return false;
    }
    if (msg1["content"] != msg2["content"]){
        return false;
    }
    if (msg1["time"] != msg2["time"]){
        return false;
    }
    return true;
}

var backport = browser.runtime.connect({name: "analysis:" + getID()});

function get(id){
    return document.getElementById(id);
}

function make(tag, id="", cls=""){
    out = document.createElement(tag);
    out.id = id;
    out.cls = cls;
    return out;
}

function makeWindow(){
    win = make('div', id="chatWindow", cls="chatWindow");
    win.style.yOverflow = "scroll";
    win.style.xOverflow = "scroll";
    win.style.border = "1px red";
    return win;
}


function despace(txt){
    return txt.replaceAll(' ', separator);
}

function respace(txt){
    return txt.replaceAll(separator, ' ');
}

var filtered;
var allowedUsr;

function makeEntry(usr, time, text){
    entryDiv = make("div", cls="chatEntry " + despace(usr));
    entryDiv.style.display = "flex";
    entryDiv.style.alignItems = "center";
    entryDiv.style.justifyContent = "center";
    entryDiv.style.height = "auto";
    usrDiv = make("div", cls="username");
    timeDiv = make("div", cls="time");
    textDiv = make("div", cls="text");
    //usrDiv.style.margin = "3%";
    //timeDiv.style.margin = "1%";
    usrDiv.style.height = entryDiv.style.height;
    usrDiv.style.maxWidth = "10vw";
    usrDiv.style.minWidth = "10vw";
    usrDiv.style.border = "1px solid #99dbf1";
    timeDiv.style.height = entryDiv.style.height;
    timeDiv.style.maxWidth = "7vw";
    timeDiv.style.minWidth = "7vw";
    timeDiv.style.border = "1px solid #99dbf1";
    textDiv.style.height = entryDiv.style.height;
    textDiv.style.maxWidth = "40vw";
    textDiv.style.minWidth = "40vw";
    //textDiv.style.margin = "1%";
    textDiv.style.border = "1px solid #99dbf1";
    usrDiv.innerText = usr;
    timeDiv.innerText = time;
    textDiv.innerHTML = text;
    entryDiv.style.borderBottom = "5px solid #99aff1";
    entryDiv.style.backgroundColor = "#99dbf1"; 
    entryDiv.appendChild(usrDiv);
    entryDiv.appendChild(timeDiv);
    entryDiv.appendChild(textDiv);
    entryDiv.appendChild(make('br'));
    return entryDiv;
}
var jsonText = {}
var title;
var messages = [];

function sortCmp(a1, a2){
    return a1["order"] - a2["order"];
}

function mergeArray(oldArray, newArray){
    if (oldArray.length == 0){
        return newArray;
    }

    newArray.sort(sortCmp);
    lstEl = oldArray[oldArray.length-1];
    console.log(lstEl);
    ix = newArray.length - 1;
    join = -1;
    while (ix >= 0){
        console.log(newArray[ix]);
        if (msgEq(newArray[ix], lstEl)){
            join = ix;
            break;
        }
        ix -= 1;
    }
    console.log("KEK: " + join);
    join += 1
    return oldArray.concat(newArray.slice(join));
}
        
    


function handleMessage(message){

    obj = JSON.parse(message.payload);
    jsonText = {"chat" : obj};
    title = obj.title;

    messages = mergeArray(messages, obj.chat);
    console.log(messages);
    get("title").innerText = title;
    get("titleHeader").innerText = title;
    load = get("loading");
    if (load != null){
        load.remove();
    }
    else{
        chatWin = get("chatWindow");
        chatWin.remove();
    }    
    chatWin = makeWindow();
    chatWin.style.maxHeight = "80%";
    ix = 0;
    while (ix < messages.length){
        ch = messages[ix];
        chatWin.appendChild(makeEntry(ch.author, ch.time, ch.content));
        if (filtered){
            if (despace(ch.author) != allowedUsr){
                chatWin.children[ix].style.display = "none";
            }
        }
        ix += 1;
    }
    hgt = chatWin.children[0].height
    get("chat").appendChild(chatWin);
    emoji = document.getElementsByClassName("emoji");
    ix = 0;
    while (ix < emoji.length){
        emoji[ix].height = 24;
        ix += 1;
    }
}

backport.onMessage.addListener(handleMessage);

function requestData(){
    console.log("Firing");
    backport.postMessage({src:"analysis:" + getID(), message: "gib"});
}



    
browser.runtime.onMessage.addListener(handleMessage);
requestData();
get("load").addEventListener("click", requestData);   

var jFile = null;

function getJSONFile(){
    data = new Blob([JSON.stringify(jsonText)], {type : "application/json"});
    if (jFile != null){
        window.URL.revokeObjectURL(jFile);
    }
    jFile = window.URL.createObjectURL(data);
    anchor = document.createElement('a');
    anchor.href = jFile;
    anchor.download = title + ".json";
    anchor.click();
}
    
get("download").addEventListener("click", getJSONFile);

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


function filter(){
    usr = despace(get("filterText").value);
    filtered = true;
    allowedUsr = usr;
    ch = get("chatWindow").children;
    ix = 0;
    while (ix < ch.length){
        if (despace(ch[ix].children[0].innerText) != usr){
            ch[ix].style.display = "none";
        }
        ix += 1;
    }
}
get("filterButton").addEventListener("click", filter);
function remove(){
    filtered = false;
    allowedUsr = null;
    get("filterText").value = "";
    ch = get("chatWindow").children;
    ix = 0;
    while (ix < ch.length){
        ch[ix].style.display = "flex";
        ix += 1;
    }
}

get("removeFilters").addEventListener("click", remove);
