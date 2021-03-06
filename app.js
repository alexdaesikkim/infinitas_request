const express = require('express');
const path = require('path');
const app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

const redis_url = process.env.REDIS_URL;

console.log(redis_url)
console.log("trying to connect?")

var client = require('redis').createClient(redis_url);

const port = process.env.PORT || 8080;
server.listen(port);

console.log("socket.io connection started on port " + port)

io.on('connection', function(socket){ //this is when new user connects
  client.lrange('queue', 0, -1, function(err, reply){
    var init_queue = reply;
    console.log(reply);
    var initial_object = {
      "queue": init_queue,
      "success": true,
      "message": ""
    }
    console.log("Connection made")
    socket.emit('request_update', initial_object);
  })

  client.get('power', function(err, reply){
    var power_obj = {
      active: reply
    }
    if(typeof reply === 'undefined'){
      power_obj.active = 'true'
    }
    socket.emit('update_stream_status', power_obj)
    console.log(power_obj.active)
  })

  client.lrange('unlocks', 0, -1, function(err, reply){
    var init_unlocks = reply;
    console.log("unlocked songs");
    var lock_object = {
      "unlock_list": init_unlocks,
      "success": true,
      "message": ""
    }
    console.log("Locks loaded")
    socket.emit('update_unlock_status', lock_object)
  })

  client.lrange('packs', 0, -1, function(err, reply){
    var init_pack_arr = reply;
    console.log("received packs");
    var pack_object= {
      "pack_list": init_pack_arr,
      "success": true,
      "message": ""
    }
    console.log("packs loaded")
    socket.emit('update_pack_status', pack_object)
  })

  client.lrange('constraints', 0, -1, function(err, reply){
    var constraint_obj = {}
    if(reply.length === 0){
      for(var p = 0; p < 16; p++){
        client.lpush('constraints', false, function(err, reply){})
        reply.push(false)
      }
      constraint_obj = {
        diff_constraints: reply.slice(0, 4),
        level_constraints: reply.slice(4)
      }
    }
    else{
      var diff_constraints = reply.slice(0,4).map(function(obj){
        return obj == 'true'
      })
      var level_constraints = reply.slice(4).map(function(obj){
        return obj == 'true'
      })
      constraint_obj = {
        diff_constraints: diff_constraints,
        level_constraints: level_constraints
      }
    }
    socket.emit('constraint_update', constraint_obj)
  })

  socket.on('add_pack', function(pack_name){
    client.rpush('packs', pack_name, function(err, reply){
      client.lrange('packs', 0, -1, function(err, reply){
        var obj = {
          "pack_list": reply,
          "success": true,
          "message": ""
        }
        console.log("added_pack"),
        io.sockets.emit('update_pack_status', obj);
      })
    })
  })

  socket.on('remove_pack', function(pack_name){
    client.lrem('packs', 1, pack_name, function(err, reply){
      client.lrange('packs', 0, -1, function(err, reply){
        var obj = {
          "pack_list": reply,
          "success": true,
          "message": ""
        }
        console.log("removed pack");
        io.sockets.emit('update_pack_status', obj)
      })
    })
  })

  socket.on('add_to_unlocked', function(id){
    client.rpush('unlocks', id, function(err, reply){
      client.lrange('unlocks', 0, -1, function(err, reply){
        var obj = {
          "unlock_list": reply,
          "success": true,
          "message": ""
        }
        console.log(reply);
        io.sockets.emit('update_unlock_status', obj);
      })
    })
  })

  socket.on('remove_from_unlocked', function(id){
    client.lrem('unlocks', 1, id, function(err, reply){
      client.lrange('unlocks', 0, -1, function(err, reply){
        console.log(reply);
        console.log("updating");
        var obj = {
          "unlock_list": reply,
          "success": true,
          "message": ""
        }
        console.log(reply)
        io.sockets.emit('update_unlock_status', obj);
      })
    })
  })

  socket.on('turnon', function(){
    client.set('power', 'true')
    console.log('turnon')
    client.get('power', function(err, reply){
      var reply_obj={
        active: reply
      }
      console.log(reply_obj)
      io.sockets.emit('update_stream_status', reply_obj)
    })
  })

  socket.on('turnoff', function(){
    client.set('power', 'false')
    console.log('turnoff')
    client.get('power', function(err, reply){
      var reply_obj={
        active: reply
      }
      console.log(reply_obj)
      io.sockets.emit('update_stream_status', reply_obj)
    })
  })

  socket.on('clear', function(){
    client.del('queue', function(err, reply){
      client.del('constraints', function(err, reply){
        var obj = {
          "queue": [],
          "success": true,
          "message": "removed everything"
        }
        console.log("removed queue")
        io.sockets.emit('request_update', obj);
        var blank_arr = [];
        for(var p = 0; p < 16; p++){
          client.lpush('constraints', false, function(err, reply){})
          blank_arr.push(false)
        }
        var constraint_obj = {
          diff_constraints: blank_arr.slice(0, 4),
          level_constraints: blank_arr.slice(4)
        }
        console.log("removed constraints")
        io.sockets.emit('constraint_update', constraint_obj);
      })
    })
  })

  socket.on('constraints', function(obj){
    //receives index to flip, and the value
    console.log(obj)
    client.lset('constraints', obj.index, obj.value, function(err, reply){
      client.lrange('constraints', 0, -1, function(err, reply){
        var diff_constraints = reply.slice(0,4).map(function(obj){
          return obj == 'true'
        })
        var level_constraints = reply.slice(4).map(function(obj){
          return obj == 'true'
        })
        var constraint_obj = {
          diff_constraints: diff_constraints,
          level_constraints: level_constraints
        }
        io.sockets.emit('constraint_update', constraint_obj);
      })
    })
  })

  socket.on('request_remove', function(obj){
    console.log(obj)
    client.lrem('queue', 1, obj, function(err, reply){
      client.lrange('queue', 0, -1, function(err, reply){
        console.log(reply);
        console.log("updating");
        var obj = {
          "queue": reply,
          "success": true,
          "message": ""
        }
        console.log(reply)
        io.sockets.emit('request_update', obj);
      })
    })
  })

  socket.on('song_request', function(id){
    client.rpush('queue', id, function(err, reply){
      client.lrange('queue', 0, -1, function(err, reply){
        var obj = {
          "queue": reply,
          "success": true,
          "message": ""
        }
        console.log(reply);
        io.sockets.emit('request_update', obj);
      })
    })
  })

  socket.on('disconnect', function(){
    console.log("User disconnected");
  })

});

app.use(express.static(path.join(__dirname, 'src/client/public')));

app.get('/', function(req, res){
  res.sendFile(path.resolve(__dirname, 'src/client/public', 'index.html'))
})

app.get('*', function(req,res){
  res.status(404);
  res.send();
})

console.log("server started on port " + port)
