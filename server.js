//
// # MAPS
//
//server using Socket.IO, Express, and Async.
//
var http = require('http');
var path = require('path');
var fs = require('fs');
var async = require('async');
var socketio = require('socket.io');
var express = require('express');
var ssl_server_key = 'server_key.pem';
var ssl_server_crt = 'server_crt.pem';

var options = {
        key: fs.readFileSync(ssl_server_key),
        cert: fs.readFileSync(ssl_server_crt)
};
//
// ## SimpleServer `SimpleServer(obj)`
//
// Creates a new instance of SimpleServer with the following options:
//  * `port` - The HTTP port to listen on. If `process.env.PORT` is set, _it overrides this value_.
//
var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

router.use(express.static(path.resolve(__dirname, 'client')));

var users = {};

io.on('connection', function (socket) {
  //Identify
  console.log("ID: "+socket.id.substring(2)+" has connected");
  
  //Add new user to Client map
  socket.on('newuserCtoS',function(data){
    if(data.id === undefined){
      console.log("User Requestd has not ID");
      return;
    }
    console.log("New user added from : "+data.id);
    users[data.id] = data.center;
    io.sockets.emit('newuserStoC',data);
    console.log(users);
  });
  
  //Update user to Client
  socket.on('updateUserCtoS',function(data){
    users[data.id] = data.center;
    io.sockets.emit('updateUserStoC',data);
  });
  
  
  //Disconncting action
  socket.on('disconnect',function(){
    var id = socket.id.substring(2);
    delete users[id];
    //Send socket "ID" which was disconnected for Clients
    io.sockets.emit('removeuserStoC',socket.id.substring(2));
    console.log("ID: "+id+" has disconnected");
    console.log(users);
  });
  
});


server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("MAPS server listening at", addr.address + ":" + addr.port);
});