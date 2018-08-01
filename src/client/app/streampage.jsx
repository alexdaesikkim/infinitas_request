import React from 'react';
import {render} from 'react-dom';
import song_list from './infinitas.json';
import socketIOClient from 'socket.io-client';
const socket = socketIOClient();

class StreamPage extends React.Component {
  constructor(props){
    super(props);
    var raw_songs = []
    var songs = song_list["songs"].map(function(obj){
      var version = obj["version"]
      var version_id = obj["version_id"]
      var orig_songs = obj["songs"];
      var version_list = [];
      var version_songs = orig_songs.map(function(song){
        var object = song;
        object["version"] = version;
        object["version_id"] = version_id;
        version_list.push(object);
        return object;
      })
      raw_songs.push(version_list);
      var return_obj = {
        version: version,
        version_id: version_id,
        songs: version_songs
      }
      return return_obj
    })
    this.state = {
      raw_songs: raw_songs,
      message: false,
      requests: []
    }
    console.log(songs)
  }

  componentDidMount(){
    socket.on("request_update", data => {
      var queue = data.queue;
      console.log(queue);
      var queue_list = data.queue.map(id => {
        var difficulty = id.charAt(0);
        var version_song = id.slice(1);
        var underscore_index = version_song.indexOf('_');
        var version_id = version_song.substring(0,underscore_index);
        var song_id = version_song.slice(underscore_index+1);
        console.log(this.state.raw_songs)
        console.log(version_id)
        version_id = (version_id === "100") ? this.state.raw_songs.length-1 : version_id
        var queue_song = this.state.raw_songs[version_id][song_id];
        var diff = (difficulty === 'b' ? 0 : (difficulty === 'n' ? 1 : (difficulty === 'h' ? 2 : 3)));
        console.log(queue_song)
        return (queue_song.title + " [" + difficulty.toUpperCase() + "] " + queue_song.difficulty[diff])
      })
      this.setState({
        requests: queue_list
      })
    })
  }

  render () {
    var song_requests = ""
    var limit = this.state.requests.length > 5 ? 5 : this.state.requests.length;
    var flag = this.state.requests.length > 5 ? true : false;
    for(var x = 0; x < limit; x++){
      if(x === 0){
        song_requests += this.state.requests[0];
      }
      else song_requests += ", " + this.state.requests[x];
    }
    if(flag) song_requests += "..."
    return(
      <div className="queue_view">
        <h5>Current Queue ({this.state.requests.length} song(s)):</h5>
        <div>
          {song_requests}
        </div>
        <br/>
      </div>
    )
  }
}

export default StreamPage
