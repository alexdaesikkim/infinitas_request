import React from 'react';
import {render} from 'react-dom';
import song_list from './infinitas.json';
import socketIOClient from 'socket.io-client';
const socket = socketIOClient();

class AdminPanel extends React.Component {
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
    console.log(raw_songs)
    var diff_array = [false, false, false, false]
    var levels = [false, false, false, false, false, false, false, false, false, false, false, false]
    this.state = {
      raw_songs: raw_songs,
      diff_constraints: diff_array,
      level_constraints: levels,
      message: false,
      requests: []
    }
    this.removeAllSongs = this.removeAllSongs.bind(this);
    this.changeConstraint = this.changeConstraint.bind(this);
  }

  componentDidMount(){
    socket.on("constraint_update", data => {
      var difficulty = data.diff_constraints;
      var levels = data.level_constraints;
      this.setState({
        diff_constraints: difficulty,
        level_constraints: levels
      })
    })
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
        var queue_song = this.state.raw_songs[version_id][song_id];
        var diff = (difficulty === 'b' ? 0 : (difficulty === 'n' ? 1 : (difficulty === 'h' ? 2 : 3)));
        console.log(queue_song)
        var obj = {
          id: song_id,
          version_id: version_id,
          title: queue_song.title,
          artist: queue_song.artist,
          version: queue_song.version,
          level: queue_song.difficulty[diff],
          difficulty: difficulty
        }
        return obj;
      })
      this.setState({
        requests: queue_list
      })
    })
  }

  changeConstraint(index){
    var curr_bool;
    if(index < 4){
      curr_bool = !this.state.diff_constraints[index];
    }
    else curr_bool = !this.state.level_constraints[index-4];
    var obj={
      index: index,
      value: curr_bool
    }
    console.log(obj);
    socket.emit("constraints", obj)
  }

  removeAllSongs(){
    socket.emit("clear");
  }

  render () {
    var diff = this.state.diff_constraints;
    var lvl = this.state.level_constraints;
    var song_requests = this.state.requests.map(function(song){
      return(
        <AdminSongList song={song} key={"admin_"+song.id} />
      )
    })
    return(
      <div className="container">
        <div className="row">
          <div className="col-8">
            {song_requests}
          </div>
          <div className="col-4">
            Difficulties:
            <br/>
            <div className="btn-group" role="group" aria-label="Basic example">
              <button type="button" onClick={() => this.changeConstraint(0)} className={"btn " + (diff[0]? "btn-active" : "btn-inactive")}>B</button>
              <button type="button" onClick={() => this.changeConstraint(1)} className={"btn " + (diff[1]? "btn-active" : "btn-inactive")}>N</button>
              <button type="button" onClick={() => this.changeConstraint(2)} className={"btn " + (diff[2]? "btn-active" : "btn-inactive")}>H</button>
              <button type="button" onClick={() => this.changeConstraint(3)} className={"btn " + (diff[3]? "btn-active" : "btn-inactive")}>A</button>
            </div>
            <br/>
            <br/>
            Levels:
            <br/>
            <div className="btn-group" role="group" aria-label="Basic example">
              <button type="button" onClick={() => this.changeConstraint(4)} className={"btn " + (lvl[0]? "btn-active" : "btn-inactive")}>1</button>
              <button type="button" onClick={() => this.changeConstraint(5)} className={"btn " + (lvl[1]? "btn-active" : "btn-inactive")}>2</button>
              <button type="button" onClick={() => this.changeConstraint(6)} className={"btn " + (lvl[2]? "btn-active" : "btn-inactive")}>3</button>
              <button type="button" onClick={() => this.changeConstraint(7)} className={"btn " + (lvl[3]? "btn-active" : "btn-inactive")}>4</button>
            </div>
            <br/>
            <div className="btn-group" role="group" aria-label="Basic example">
              <button type="button" onClick={() => this.changeConstraint(8)} className={"btn " + (lvl[4]? "btn-active" : "btn-inactive")}>5</button>
              <button type="button" onClick={() => this.changeConstraint(9)} className={"btn " + (lvl[5]? "btn-active" : "btn-inactive")}>6</button>
              <button type="button" onClick={() => this.changeConstraint(10)} className={"btn " + (lvl[6]? "btn-active" : "btn-inactive")}>7</button>
              <button type="button" onClick={() => this.changeConstraint(11)} className={"btn " + (lvl[7]? "btn-active" : "btn-inactive")}>8</button>
            </div>
            <br/>
            <div className="btn-group" role="group" aria-label="Basic example">
              <button type="button" onClick={() => this.changeConstraint(12)} className={"btn " + (lvl[8]? "btn-active" : "btn-inactive")}>9</button>
              <button type="button" onClick={() => this.changeConstraint(13)} className={"btn " + (lvl[9]? "btn-active" : "btn-inactive")}>10</button>
              <button type="button" onClick={() => this.changeConstraint(14)} className={"btn " + (lvl[10]? "btn-active" : "btn-inactive")}>11</button>
              <button type="button" onClick={() => this.changeConstraint(15)} className={"btn " + (lvl[11]? "btn-active" : "btn-inactive")}>12</button>
            </div>
          </div>
        </div>
        <button className="btn btn-danger" onClick={this.removeAllSongs}>Reset All</button>
      </div>
    )
  }
}

class AdminSongList extends React.Component{
  constructor(props){
    super(props);
    this.removeSongFromList = this.removeSongFromList.bind(this);
  }

  removeSongFromList(){
    var item = this.props.song.difficulty + this.props.song.version_id.toString() + "_" + this.props.song.id.toString()
    socket.emit('request_remove', item)
  }

  render(){
    return(
      <div className="card">
        <div className="card-body">
          {this.props.song.title}
          <br/>
          {this.props.song.artist}
          <br/>
          {this.props.song.version}
          <br/>
          {"[" + this.props.song.difficulty.toUpperCase() + "] " + this.props.song.level}
          <br/>
          <button className="btn btn-secondary" onClick={this.removeSongFromList}>Song Played(Remove)</button>
        </div>
      </div>
    )
  }
}

export default AdminPanel
