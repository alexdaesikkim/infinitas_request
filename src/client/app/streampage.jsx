import React from 'react';
import {render} from 'react-dom';
import song_list from './sinobuz.json';
import socketIOClient from 'socket.io-client';
const socket = socketIOClient();

class StreamPage extends React.Component {
  constructor(props){
    super(props);
    var songs = []
    song_list.map(function(obj){
      var version = Object.keys(obj)[0];
      var version_songs = obj[version];
      version_songs.map(function(song){
        var object = song;
        object["version"] = version;
        songs.push(object);
      })
    })
    this.state = {
      raw_songs: songs,
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
        var difficulty = "[" + id.charAt(0).toUpperCase() + "]";
        var id = id.slice(1);
        var queue_song = this.state.raw_songs[id];
        var diff = (difficulty === 'b' ? 0 : (difficulty === 'n' ? 1 : (difficulty === 'h' ? 2 : 3)));
        return (queue_song.title + " " + difficulty + " " + queue_song.difficulty[diff])
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
