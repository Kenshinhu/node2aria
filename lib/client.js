var wsClient = require('websocket').client;
var events = require('events');

var log = console.log
 

var client = function(){
    
    var _client = new wsClient();
    var _eventEmitter = new events.EventEmitter();
    var _connection = null;
    var _status = "ready";
    this.connection = null;
    return {
        status:_status,
        connection:_connection,
        on:function(eventname,callback){
            _eventEmitter.on(eventname,callback);
        },
        open:function(url,callback){
            // Connect to the server
            var _ = this;
            _client.connect(url);
            _client.on('connect',function(conn){
                log("Client had connected!");
                _.status = "connect";
                _.connection = conn
                _eventEmitter.emit('connect',conn);
                if(callback)
                    callback(conn);
            });

            _client.on('connectFailed',function(error){
                log('client can not connect to server! message:'+error.toString());
                _eventEmitter.emit('connectFailed',error);
            })
        },

    }
}

module.exports = client