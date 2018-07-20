import React from 'react';
import {render} from 'react-dom';
import song_list from './infinitas.json';
import socketIOClient from 'socket.io-client';
const socket = socketIOClient();

class AdminPanel extends React.Component {
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
    var diff_array = [false, false, false, false]
    var levels = [false, false, false, false, false, false, false, false, false, false, false, false]
    this.state = {
      raw_songs: songs,
      diff_constraints: diff_array,
      level_constraints: levels,
      message: false,
      requests: []
    }
    console.log(songs)
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
        var id = id.slice(1);
        var queue_song = this.state.raw_songs[id];
        var diff = (difficulty === 'b' ? 0 : (difficulty === 'n' ? 1 : (difficulty === 'h' ? 2 : 3)));
        var obj = {
          id: queue_song.id,
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
    console.log(diff);
    console.log(lvl);
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
    var item = this.props.song.difficulty + this.props.song.id
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
