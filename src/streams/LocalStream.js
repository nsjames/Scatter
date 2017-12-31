

export class LocalStream {

    static send(msg){
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(msg, (response) => resolve(response))});
    }

    static watch(callback){
        chrome.runtime.onMessage.addListener(
            function(request, sender, sendResponse) {
                if(sender.id !== chrome.runtime.id) return;
                callback(request, sendResponse);
                return true;
            }
        );
    }

}