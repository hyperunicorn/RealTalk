(() => {
    
    if (window.hasRun) {
        return;
    }
    
    window.hasRun = true;
    function stripTags(st){
        inTag = 0;
        out = '';
        ix = 0;
        while (ix < st.length){
            if (st[ix] == '<'){
                inTag += 1;
            }
            else if(st[ix] == '>'){
                inTag -= 1;
            }
            else {
                if (inTag == 0){
                    out += st[ix]
                }
            }
            ix += 1;
        }
        return out;
    }
                
    var commentRecord = {};
    var globalPointer = 0;
    var lastMsg = {};
    function msgEq(msg1, msg2){
        if (msg1["author"] != msg2["author"]){
            return false;
        }
        if (stripTags(msg1["content"]) != stripTags(msg2["content"])){
            return false;
        }
        if (msg1["time"] != msg2["time"]){
            return false;
        }
        return true;
    }
    function getTitle(){
        return document.getElementsByTagName("title")[0].innerText;
    } 
    
       
    function getChatMessages(){
        iframes = document.getElementsByTagName("iframe");
        chatFrame = iframes[0];
        if (chatFrame.contentDocument == null){
            console.log("KEK: Switching to second");
            chatFrame = iframes[1];
        }
        return chatFrame.contentDocument.getElementsByTagName("yt-live-chat-text-message-renderer");
    }
    
    function processMessage(msg, pntr) {
        author = msg.children[1].children[1].children[1].innerText;
        content = msg.children[1].children[2].innerHTML;
        tm = msg.children[1].children[0].innerText;
        return {"author" : author, "content" : content, "time" : tm, "order":pntr};
    }
    
    
    function getComments() {
        messages = getChatMessages();
        ix = 0
        while (ix < messages.length){
            msg = processMessage(messages[ix], globalPointer);
            commentRecord[msg.author + msg.content + msg.time] = msg;
            ix += 1;
            globalPointer += 1;
        }
        return msg;
    }
    
    function getAnalysisURL(videoName){
        return browser.runtime.getURL("analysis/analyse.html?video="+videoName);
    }
        
    function extractParams(url, key){
        query = '?' + url.split('?')[1];
        urlParams = new URLSearchParams(query);
        return urlParams.get(key);
    }


    function getID(){
        return extractParams(window.location.href, "v");
    }
        
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async function wait(){
        while (getComments() == null){
            sleep(500);
        }
    }
    function chatScrape(lChat, vidID){
        startCycle = Date.now();
        newLastMsg = getComments();
        title = lChat["title"];
        const IDString = "ID->" + vidID;
        if (msgEq(lastMsg, newLastMsg) == false){
            lChat = {IDString : {"title" : title, "chat": commentRecord}};
            console.log(commentRecord);
            //browser.storage.local.set(lChat);
            
        }
        
        return new Promise((resolve) => {lastMsg = newLastMsg});
    }
    
    function log(msg){
        console.log(msg);
    }
    
    function record() {
        let liveChat = {IDString : {"title" : getTitle(), "chat" : []}};
        log(liveChat);
        log("starting");
        vidID = getID();
        startTime = Date.now();
        
        chatScrape(lastMsg, liveChat, vidID).then((lmg) => {lastMsg = lmg});
    }
    
    async function startPage(){
        console.log(window.location.href);
    } 
    
/*    var msgs = [];
    var prev = {};
        
    function newMsg(){
        ch = getChatMessages();
        newList = []
        ix = len(ch) - 1;
        while (ix >= 0){
            newm = processMessage(ch[ix]);
            if (msgEq(prev, newm)){
                break;
            }
            else{
                newList.push(newm);
            }
            ix -= 1;
        }
        if (newList.length > 0){
            prev = newList[0];
        }
        newList.reverse();
        for (const nl in newList){
            msgs.push(nl);
        }
        log(newList);
    }*/
    var nm = "youtube:" + getID();    
    console.log("KEK: "+nm);
    var port = browser.runtime.connect({name: "youtube:" + getID()});
    port.postMessage({src:"test"});
    var analysing = false;
    function messageListener(message){
        if (message.command == "realwork"){
            if (!analysing){
               
                analysing = true;
                ID = extractParams(window.location.href, 'v');
                console.log("KEK: running on " + JSON.stringify(port));
                wait();
                setInterval(record, 2000);
                port.postMessage({src: "youtube:" + getID(), payload : JSON.stringify({title: getTitle(), chat : Object.values(commentRecord)})});
                globalPointer = 0;
            }
        }
        else {
            console.log(getTitle());
            port.postMessage({src: "youtube:" + getID(), payload : JSON.stringify({title: getTitle(), chat : Object.values(commentRecord)})});
            console.log(Object.values(commentRecord));
            
            globalPointer = 0;
        }
        
    }
    
    port.onMessage.addListener(messageListener);
    

    browser.runtime.onMessage.addListener((message, sender, senderResponse) => {
    
        if (message.command === "realwork"){
            
        }
        else {
            console.log("KEK: Received message");
            senderResponse({"src" : "youtube:" + getID(), "payload" : {"title": getTitle(), "chat" : commentRecord}});
        }   
   });
   console.log("KEK: Running"); 
   console.log("KEK:" + JSON.stringify(port));
})();
