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
                                    
    var query = connection.query('SELECT * FROM vicidial_live_agents WHERE 1 AND status = "QUEUE"');
    
    query
    .on('error', function(err) {                                                 
        console.log( err ); 
    })
    .on('result', function( user ) {                                   
        //parse result here        
        
        var socket = io.sockets.sockets[user.socket_id]; 
                            
        if(socket != null) {
        	console.log(user.socket_id + " - " + io.sockets.sockets[user.socket_id]);
       		io.sockets.sockets[user.socket_id].emit('incall', { lead_id: user.lead_id });				
        }                                                                                	 
    })
    .on('end',function() {
        lock = 0;                     
        setTimeout(pollingLoop, POLLING_INTERVAL);        
    });

};

var setSocketId = function(user, socketId) {
    var querySetSocket = connection.query('UPDATE vicidial_live_agents SET socket_id = "' + socketId + '" WHERE user = "' + user + '"');
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
	
	socket.on('set nickname', function(user, cb) {    
		
		if(user.nickname == "") {    
		  return cb(false);	
		}
		
		setSocketId(user.nickname, socket.id);     
		return cb(true);
	});
	
});



