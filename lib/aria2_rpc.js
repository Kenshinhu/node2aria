var client = require('./client');
var uuid = require('./uuid').uuid
var events = require('events');

var __client = new client();
var __task = {}


var methodMapping = [
    'aria2.onDownloadComplete',
    'aria2.onDownloadStart',
    'aria2.onDownloadError',
    'aria2.onDownloadPause',
    'aria2.onBtDownloadComplete'
];

var eventMapping = [
    'downloadComplete',
    'downloadStart',
    'downloadError',
    'downloadPause',
    'downloadComplete'
];



function aria2EventMapping(method){
    console.log("aria2EventMapping");
    var index = methodMapping.indexOf(method);
    var eventName = eventMapping[index];
    console.log(eventName);
    return eventName;
}

var aria2Rpc = function(url){
    this.connection = null;
    this._eventEmitter = new events.EventEmitter();
   
    var _ = this;

    this.onMessage = function(message){
        console.log("message : "+JSON.stringify(message));
        var data = message.utf8Data;
        var response = JSON.parse(data);
        var taskId = response.id;
        if(typeof taskId != "undefined"){
            // 
            console.log("onMessage : taskID= "+taskId);
            var result = response.result;
            var gid = response.result;
            var callbackFn = __task[taskId];
            callbackFn(result);

            delete __task[taskId]; //destoryTask
        }else{
            // response Event
            var method = response.method;
            var params = response.params;
            var gid = params[0].gid;
            var eventName = aria2EventMapping(method);
            _._eventEmitter.emit(eventName,response);
        }
    }

    __client.open(url,function(conn){
        _.connection = conn;
        _.connection.on('message',_.onMessage);
        _._eventEmitter.emit("open");
    });

    // Send command by rpc
    this.send = function(method,params,callbackFn){

        if(typeof params === "function"){
            callbackFn = params;
            params = null;
        }

        var taskId = uuid();
        taskId = taskId+"_"+method;
        var command = {};
        command.method=method;
        command.jsonrpc = "2.0";
        command.id=taskId

        if(params)
            command.params=params;

        
        __task[taskId] = callbackFn;
        _.connection.sendUTF(JSON.stringify(command));
    }
 }


aria2Rpc.prototype.getVersion=function(callback){
    this.send("aria2.getVersion",callback);
}


aria2Rpc.prototype.addUri = function(url,header,path,callback){
    var taskId = uuid();
    var opt = {}
    var _header =[]
    for(var key in header)
        _header.push(key+":"+header[key]);
    if(_header.length>0) opt.header = _header;
    if(path) opt.dir = path;
    var sources = [url];
    var params = [sources,opt];
    this.send("aria2.addUri",params,callback)
}

aria2Rpc.prototype.tellActive = function(callback){
    this.send("aria2.tellActive",callback);
}

aria2Rpc.prototype.tellWaiting = function(offset,limit,keys,callback){
    if(typeof offset === "function"){
        callback = offset;
        offset = null;
        limit = null;
        keys = null;
    }
    this.send("aria2.tellWaiting",callback);
}

aria2Rpc.prototype.tellStopped = function(gid,keys,callback){
    if(typeof offset === "function"){
        callback = offset;
        offset = null;
        limit = null;
        keys = null;
    }
    this.send('aria2.tellStopped',[gid],callback);
}




aria2Rpc.prototype.remove = function(gid,callback){
    this.send('aria2.remove',[gid],callback);
}

aria2Rpc.prototype.unpause = function(gid,callback){
    this.send('aria2.unpause',[gid],callback);
}

aria2Rpc.prototype.pause = function(gid,callback){
    this.send('aria2.pause',[gid],callback);
}

aria2Rpc.prototype.getFiles = function(gid,callback){
    this.send('aria2.getFiles',[gid],callback);
}

aria2Rpc.prototype.getServers = function(gid,callback){
    this.send('aria2.getServers',[gid],callback);
}

aria2Rpc.prototype.getUris = function(gid,callback){
    this.send('aria2.getUris',[gid],callback);
}

aria2Rpc.prototype.shutdown = function(callback){
    this.send('aria2.shutdown',callback);
}

aria2Rpc.prototype.listMethods = function(callback){
    this.send('system.listMethods',callback);
}

aria2Rpc.prototype.getOption = function(gid,callback){
    this.send('aria2.getOption',[gid],callback);
}

aria2Rpc.prototype.removeDownloadResult=function(gid,callback){
    this.send('aria2.removeDownloadResult',[gid],callback);
}

aria2Rpc.prototype.purgeDownloadResult = function(callback){
    this.send('aria2.purgeDownloadResult',callback);
}


aria2Rpc.prototype.on = function(eventName,callback){
    this._eventEmitter.on(eventName,callback);
 }

module.exports=aria2Rpc;