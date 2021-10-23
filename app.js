var express = require('express');
var app = express();
var fs = require('fs');
var open = require('open');
var options = {
  key: fs.readFileSync('./fake-keys/privatekey.pem'),
  cert: fs.readFileSync('./fake-keys/certificate.pem')
};
var serverPort = (process.env.PORT  || 4443);
var https = require('https');
var http = require('http');
var server;
if (process.env.LOCAL) {
 server = http.createServer(app);
} else {
  server = http.createServer(app);
}
var io = require('socket.io')(server);

var roomList = {};

app.get('/', function(req, res){
  console.log('get /');
  res.sendFile(__dirname + '/index.html');
});
server.listen(serverPort, function(){
  console.log('server up and running at %s port', serverPort);
  if (process.env.LOCAL) {
    open('https://localhost:' + serverPort)
  }
});

function socketIdsInRoom(name) {
  if(io.sockets.adapter.rooms.get(name)){
    var socketIds = Array.from(io.sockets.adapter.rooms.get(name))

    if (socketIds) {
      var collection = [];
      socketIds.forEach((item)=> {
          console.log(item)
          collection.push(item);
        }
      )
      return collection;
    } else {
      return [];
    }
  }
}

io.on('connection', function(socket){
  console.log('connection');
  socket.on('disconnect', function(){
    console.log('disconnect');
    if (socket.room) {
      var room = socket.room;
      io.to(room).emit('leave', socket.id);
      socket.leave(room);
    }
  });

  socket.on('leave', function(){
    console.log('leave');
    if (socket.room) {
      var room = socket.room;
      io.to(room).emit('leave', socket.id);
      socket.leave(room);
    }
  });

  socket.on('join', function(name, callback){
    console.log('join', name);
    var socketIds = socketIdsInRoom(name);
    callback(socketIds);
    socket.join(name);
    socket.room = name;
  });

  socket.on('quantityInRoom', function(name, callback){
    console.log("Room name:",name)
    var socketIds = socketIdsInRoom(name);
    console.log("socketIds",socketIds)
    callback(socketIds);
  });

  socket.on('exchange', function(data){
    console.log('exchange', data);
    data.from = socket.id;
    io.to(data.to).emit('exchange',data);
  });
});
