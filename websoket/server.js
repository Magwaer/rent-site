var config 				= require('./config');    
var io 					= require('socket.io').listen(config.port);
var _					= require('underscore');
var mysql				= require('mysql');     
var POLLING_INTERVAL 	= config.pollingInterval;
var users 				= {};
var lock				= 0;
var pollingIsRunning 	= 0;

var connection  = mysql.createConnection(config.db);            
                                   
var pollingTimer;

var db_config = config.db;
var connection;  

var pollingLoop = function () {
	pollingIsRunning = 1;
	
	var now = new Date();
	
	console.log("poll running " + now);
	
	
	if(lock == 1) {
		setTimeout(pollingLoop, POLLING_INTERVAL);
		return false;	
	}
	
	lock == 1;
                                    
    var query = connection.query('SELECT msg.msg, msg.id, users.socket_id FROM msg left join users on msg.user_id = users.id WHERE msg.read = 0 ',function(err,rows){
		if(err) throw err;

		console.log('Data received from Db:\n');
		console.log(rows);
		for (var i = 0; i < rows.length; i++) {
			var row = rows[i]
			var socket = io.sockets.sockets[row.socket_id]; 
                            
			if(socket != null) {
				console.log(row.socket_id + " - " + io.sockets.sockets[row.socket_id]);
				io.sockets.sockets[row.socket_id].emit('in_msg', { msg: row.msg , id: row.id });				
			}   
		};
		
		lock = 0;                     
        setTimeout(pollingLoop, POLLING_INTERVAL);    
	})

};

var setSocketId = function(user, socketId) {
    var querySetSocket = connection.query('UPDATE users SET socket_id = "' + socketId + '" WHERE id = "' + user + '"');
}

var readMsg = function(msg_id, socketId) {
    var querReadMsg = connection.query('UPDATE msg SET `read` = "1" WHERE id = "' + msg_id + '"');
}

function handleDisconnect() {
	connection = mysql.createConnection(db_config); 
	                
	connection.connect(function(err) {     
		
		if(err) {                                   
			console.log('error when connecting to db:', err);
		  	setTimeout(handleDisconnect, 2000); 
		} else {
			console.log('mysql is alive! Phew!!');
			pollingLoop(); 
		}                                     
	});                                    
	                                   
	connection.on('error', function(err) {
		console.log('db error', err);
		
		if(err.code === 'PROTOCOL_CONNECTION_LOST') { 
			handleDisconnect();                         
		} else {                                      
			throw err;                                  
		}
	});
}
 
handleDisconnect();       

io.sockets.on('connection', function (socket) {  
	console.log("connect: " + socket.id);                      
	
	socket.once('disconnect', function() {    
		socket.disconnect();  
	});
	
	socket.on('set_id', function(user, cb) {    
		
		if(user.id == "") {    
		  return cb(false);	
		}
		
		setSocketId(user.id, socket.id);     
		return cb(true);
	});
	
	socket.on('read_msg', function(msg, cb) {    
		
		if(msg.id == "") {    
		  return cb(false);	
		}
		
		readMsg(msg.id, socket.id);     
	});
	
});

