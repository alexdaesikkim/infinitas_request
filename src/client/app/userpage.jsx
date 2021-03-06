import React from 'react';
import {render} from 'react-dom';
import song_list from './infinitas.json';
import socketIOClient from 'socket.io-client';
const socket = socketIOClient();

class UserPage extends React.Component {
  constructor(props){
    super(props);
    var raw_songs = [];
    var random_songs = [[],[],[],[],[],[],[],[],[],[],[],[]];
    var song_count = 0;
    var songs = song_list["songs"].map(function(obj){
      var version = obj["version"];
      var orig_songs = obj["songs"];
      var version_id = obj["version_id"];
      var version_list = [];

      var version_songs = orig_songs.map(function(song){
        var object = song;
        var song_id = "";
        object["b_queue"] = false;
        object["n_queue"] = false;
        object["h_queue"] = false;
        object["a_queue"] = false;
        object["b_disabled"] = false;
        object["n_disabled"] = false;
        object["h_disabled"] = false;
        object["a_disabled"] = false;
        object["b_locked"] = !song.default;
        object["n_locked"] = !song.default;
        object["h_locked"] = !song.default;
        object["a_locked"] = !song.default;
        object["locked"] = !song.default;
        object["version"] = version;
        object["version_id"] = version_id;
        object["raw_id"] = song_count;
        song_count++;
        if(song.difficulty[0] !== -1){
          song_id = "b" + version_id + "_" + song.id
          random_songs[song.difficulty[0]-1].push(song_id)
        }
        if(song.difficulty[1] !== -1){
          song_id = "n" + version_id + "_" + song.id
          random_songs[song.difficulty[1]-1].push(song_id)
        }
        if(song.difficulty[2] !== -1){
          song_id = "h" + version_id + "_" + song.id
          random_songs[song.difficulty[2]-1].push(song_id)
        }
        if(song.difficulty[3] !== -1){
          song_id = "a" + version_id + "_" + song.id
          random_songs[song.difficulty[3]-1].push(song_id)
        }
        version_list.push(object);
        return object
      })
      raw_songs.push(version_list);
      var return_obj = {
        version: version,
        version_id: version_id,
        songs: version_songs
      }
      return return_obj
    })
    var version_lengths = song_list["songs"].map(function(obj){
      return obj["count"]
    })
    //remember: filtered songs is SEARCH filter
    //with queue_id, need to update filtered songs AND regular list as well

    //todo:
    //1. make sure the songs is prepared like the old version
    //2. when queue updates in componentdidmount, update both RAW_SONGS and SONGS
    //3. limited_song_list is for when admin filters songs based on what they want to be requested (i.e. dont request normal/hyper, dont request anything below/above level)
    this.state = {
      raw_songs: raw_songs,
      version_songs: songs,
      orig_song_list: songs,
      random_songs: random_songs,
      search_term: '',
      level_field: '',
      version_lengths: version_lengths,
      filtered_songs: songs,
      diff_constraints: [false, false, false, false],
      level_constraints: [false, false, false, false, false, false, false, false, false, false, false, false],
      message: false,
      active: true,
      requests: []
    }
    //figure out a way to remove raw_songs as it creates technical debt
    //use version_lengths?
    this.removeAllSongs = this.removeAllSongs.bind(this);
    this.titleFilter = this.titleFilter.bind(this);
    this.levelFilter = this.levelFilter.bind(this);
    this.randomSong = this.randomSong.bind(this);
  }

  songsFilter(search_term, level_field){
    var diffs = ["b_disabled", "n_disabled", "h_disabled", "a_disabled"]
    var filter_songs = this.state.version_songs.map(function(obj){
      var version_songs = obj["songs"].filter(function(song){
        var object = song;
        if(!(object.title.toLowerCase().includes(search_term))){
          return false;
        }
        if(level_field !== ""){
          for(var x = 0; x < 4; x++){
            if(object.difficulty[x] === parseInt(level_field)) return true
          }
          return false
        }
        return true
      })
      if(version_songs.length > 0){
        var return_obj = {
          version: obj["version"],
          version_id: obj["version_id"],
          songs: version_songs
        }
        return return_obj
      }
      else return null;
    })
    var filtered_songs = filter_songs.filter(function(obj){
      return obj !== null;
    })
    //console.log(filtered_songs)

    this.setState({
      search_term: search_term,
      level_field: level_field,
      filtered_songs: filtered_songs
    })
  }


  levelFilter(event){
    var level_field = event.target.value;
    this.songsFilter(this.state.search_term, level_field)
  }

  titleFilter(event){
    var search_term = event.target.value;
    search_term = search_term.toLowerCase();
    this.songsFilter(search_term, this.state.level_field)
  }

  updated_list(queue){
    var updated_list = this.state.version_songs.map(function(obj){
      var version = obj["version"]
      var version_songs = obj["songs"].map(function(song){
        var object = song;
        var beginner = "b"+song.version_id.toString()+"_"+song.id.toString()
        var normal = "n"+song.version_id.toString()+"_"+song.id.toString()
        var hyper = "h"+song.version_id.toString()+"_"+song.id.toString()
        var another = "a"+song.version_id.toString()+"_"+song.id.toString()
        object.b_queue = (queue.includes(beginner) ? true : false);
        object.n_queue = (queue.includes(normal)? true : false);
        object.h_queue = (queue.includes(hyper)? true : false);
        object.a_queue = (queue.includes(another) ? true : false);
        return object;
      })
      var version_obj = {
          version: obj["version"],
          version_id: obj["version_id"],
          songs: version_songs
      }
      return version_obj
    })
    //console.log(updated_list)
    return updated_list
  }

  componentDidMount(){

    socket.on("update_stream_status", data => {
      var active_bool = data.active;
      console.log(data.active)
      this.setState({
        active: (active_bool === 'true')
      })
    })

    socket.on("request_update", data => {
      var queue = data.queue.map(id =>{
        var difficulty = id.charAt(0)
        var version_song = id.slice(1);

        var underscore_index = version_song.indexOf('_');

        var version_id = version_song.substring(0,underscore_index);
        var song_id = version_song.slice(underscore_index+1);
        //pending on where underscore is, splice there
        if(version_id === "100"){
          version_id = this.state.raw_songs.length-1;
        }
        var obj={
          id: song_id,
          version_id: version_id,
          difficulty: difficulty
        }
        return obj
      })
      var queue_list = queue.map(obj =>{
        var diff = (obj.difficulty === "b" ? 0 : (obj.difficulty === "n" ? 1 : (obj.difficulty === "h" ? 2 : 3)))
        var song_name = this.state.raw_songs[obj.version_id][obj.id]["title"]
        var level = this.state.raw_songs[obj.version_id][obj.id]["difficulty"][diff]
        var return_obj = {
          name: song_name,
          diff: "["+ obj.difficulty.toUpperCase() + "]",
          level: level
        }
        return (song_name + " [" + obj.difficulty.toUpperCase() + "] "+ level)
      })
      var updated_list = this.updated_list(data.queue)
      var that = this;
      /*var queued_songs = queue.map(function(obj){
        var x = 0;
        var version_id = 0;
        var id = obj.id
        while(id >= that.state.version_lengths[x]){
          id -= that.state.version_lengths[x++];
          version_id++;
        }
        var song = updated_list

      })*/
      this.setState({
        raw_queue: data.queue,
        version_songs: updated_list,
        requests: queue_list
      })
    })

    socket.on("constraint_update", data=>{
      var diff_constraints = data.diff_constraints;
      var level_constraints = data.level_constraints;
      var updated_list = this.state.version_songs.map(function(obj){
        var version_songs = obj["songs"].map(function(song){
          var object = song;
          var beginner = "b"+song.version_id.toString+"_"+song.id.toString()
          var normal = "n"+song.version_id.toString+"_"+song.id.toString()
          var hyper = "h"+song.version_id.toString+"_"+song.id.toString()
          var another = "a"+song.version_id.toString+"_"+song.id.toString()
          object.b_disabled = (diff_constraints[0] || level_constraints[object.difficulty[0]-1]);
          object.n_disabled = (diff_constraints[1] || level_constraints[object.difficulty[1]-1]);
          object.h_disabled = (diff_constraints[2] || level_constraints[object.difficulty[2]-1]);
          object.a_disabled = (diff_constraints[3] || level_constraints[object.difficulty[3]-1]);
          return object;
        })
        var version_obj = {
          version: obj["version"],
          version_id: obj["version_id"],
          songs: version_songs
        }
        return version_obj
      })
      this.setState({
        diff_constraints: diff_constraints,
        level_constraints: level_constraints,
        version_songs: updated_list
      }, this.songsFilter(this.state.search_term, this.state.level_field))
    })

    socket.on("update_unlock_status", data => {
      var unlock_ids = data["unlock_list"];
      var updated_list = this.state.version_songs.map(function(obj){
        var version_songs = obj["songs"].map(function(song){
          var object = song;
          var beginner = "b"+song.version_id.toString()+"_"+song.id.toString();
          var normal = "n"+song.version_id.toString()+"_"+song.id.toString();
          var hyper = "h"+song.version_id.toString()+"_"+song.id.toString();
          var another =  "a"+song.version_id.toString()+"_"+song.id.toString();
          object.b_locked = (unlock_ids.includes(beginner) ? false : !song.default)
          object.n_locked = (unlock_ids.includes(normal) ? false : !song.default)
          object.h_locked = (unlock_ids.includes(hyper) ? false : !song.default)
          object.a_locked = (unlock_ids.includes(another) ? false : !song.default)
          object.locked = object.b_locked && object.n_locked && object.n_locked && object.a_locked
          return object;
        })
        var version_obj = {
          version: obj["version"],
          version_id: obj["version_id"],
          songs: version_songs
        }
        return version_obj
      })
      this.setState({
        version_songs: updated_list
      }, this.songsFilter(this.state.search_term, this.state.level_field))
    })
  }

  removeAllSongs(){
    socket.emit("clear");
  }

  checkIfValid(id){
    var difficulty = id.charAt(0);
    var version_song = id.slice(1);
    var underscore_index = version_song.indexOf('_');
    var version_id = version_song.substring(0,underscore_index);
    var song_id = version_song.slice(underscore_index+1);
    if(version_id === "100"){
      version_id = this.state.raw_songs.length-1;
    }
    var song = (this.state.version_songs[version_id]["songs"][song_id]);
    var diff_id = (difficulty === "b" ? 0 : (difficulty === "n" ? 1 : (difficulty === "h" ? 2 : 3)))
    var request_string = song["title"] + " [" + difficulty.toUpperCase() + "] " + song["difficulty"][diff_id]
    console.log(this.state.requests)
    console.log(request_string)
    return !song[difficulty+"_locked"] && !this.state.requests.includes(request_string)
  }

  shuffle(array, size){
    for(var i = 0; i < size; i++){
      var j = Math.floor((Math.random() * (size-i)) + i);
      var temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
    return array;
  }

  randomSong(level){
    var songs = this.shuffle(this.state.random_songs[level-1], this.state.random_songs[level-1].length);
    var i = 0;
    var check = true;
    while(check && i < songs.length){
      if(this.checkIfValid(songs[i])){
        check = false;
      }
      else{
        i += 1
      }
    }
    if(i !== songs.length){
      socket.emit("song_request", songs[i])
    }
  }

  render (){
    //this.state.requests now holds fully parsed string. no need to do manual stuff here
    var current_song_requests = this.state.requests.length === 0 ? null : (
      this.state.requests.map(function(str){
        return(
          <div>
            {str}
            <br/>
          </div>
        )
      })
    )
    var x = 0;
    var orig_song_list = (this.state.search_term === '' && this.state.level_field === '') ? this.state.version_songs : this.state.filtered_songs;
    var orig_songs_rendered = orig_song_list.map(function(obj){
      if(obj.songs.length === 0) return null;
      else{
        var reduce_value = obj.songs.reduce(function(obj1, obj2){
          return obj1 && obj2.locked
        }, true)
        if(reduce_value) return null;
        else{
          var version_songs = obj["songs"]
          var version = obj["version"]
          var version_songs_rendered = version_songs.map(function(song){
            if(song.b_locked && song.n_locked && song.h_locked && song.a_locked) return null
            else return(
              <OrigSongList song={song} key={"original_"+song["id"]+"_"+version} />
            )
          })
          return(
            <tbody>
              <tr className="d-flex">
                <th scope="col" className="col-12">{version}</th>
              </tr>
              {version_songs_rendered}
            </tbody>
          )
        }
      }
    })

    var str_diffs = ["Beginner", "Normal", "Hyper", "Another"];
    for(var x = 0; x < 4; x++){
      if(this.state.diff_constraints[x]) str_diffs[x] = "";
    }
    var str_lvls = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]
    for(var y = 0; y < 12; y++){
      if(this.state.level_constraints[y]) str_lvls[y] = "";
    }
    var diffs = str_diffs.reduce(function(str1, str2){
      return str1 + " " + str2;
    })
    var lvls = str_lvls.reduce(function(str1, str2){
      return str1 + " " + str2;
    })
    if(!this.state.active) return(
      <div className="container">
        <div className="row">
          <div className="col-12">
            <h5>Requesting is currently disabled</h5>
          </div>
        </div>
      </div>
    )
    else return(
      <div className="container">
        <div className="row">
          <div className="col-3">
            <h5>Current Request Constraints:</h5>
            Difficulties:
            <br/>
            {diffs}
            <br/>
            <br/>
            Levels:
            <br/>
            {lvls}
            <br/>
            <br/>
            Random Song:
            <br/>
            <div className="btn-group" role="group" aria-label="Basic example">
              <button type="button" onClick={this.state.level_constraints[0] ? "" : () => this.randomSong(1)} className={"btn " + (this.state.level_constraints[0]? "btn-active" : "btn-inactive")}>1</button>
              <button type="button" onClick={this.state.level_constraints[1] ? "" : () => this.randomSong(2)} className={"btn " + (this.state.level_constraints[1]? "btn-active" : "btn-inactive")}>2</button>
              <button type="button" onClick={this.state.level_constraints[2] ? "" : () => this.randomSong(3)} className={"btn " + (this.state.level_constraints[2]? "btn-active" : "btn-inactive")}>3</button>
              <button type="button" onClick={this.state.level_constraints[3] ? "" : () => this.randomSong(4)} className={"btn " + (this.state.level_constraints[3]? "btn-active" : "btn-inactive")}>4</button>
            </div>
            <br/>
            <div className="btn-group" role="group" aria-label="Basic example">
              <button type="button" onClick={this.state.level_constraints[4] ? "" : () => this.randomSong(5)} className={"btn " + (this.state.level_constraints[4]? "btn-active" : "btn-inactive")}>5</button>
              <button type="button" onClick={this.state.level_constraints[5] ? "" : () => this.randomSong(6)} className={"btn " + (this.state.level_constraints[5]? "btn-active" : "btn-inactive")}>6</button>
              <button type="button" onClick={this.state.level_constraints[6] ? "" : () => this.randomSong(7)} className={"btn " + (this.state.level_constraints[6]? "btn-active" : "btn-inactive")}>7</button>
              <button type="button" onClick={this.state.level_constraints[7] ? "" : () => this.randomSong(8)} className={"btn " + (this.state.level_constraints[7]? "btn-active" : "btn-inactive")}>8</button>
            </div>
            <br/>
            <div className="btn-group" role="group" aria-label="Basic example">
              <button type="button" onClick={this.state.level_constraints[8] ? "" : () => this.randomSong(9)} className={"btn " + (this.state.level_constraints[8]? "btn-active" : "btn-inactive")}>9</button>
              <button type="button" onClick={this.state.level_constraints[9] ? "" : () => this.randomSong(10)} className={"btn " + (this.state.level_constraints[9]? "btn-active" : "btn-inactive")}>10</button>
              <button type="button" onClick={this.state.level_constraints[10] ? "" : () => this.randomSong(11)} className={"btn " + (this.state.level_constraints[10]? "btn-active" : "btn-inactive")}>11</button>
              <button type="button" onClick={this.state.level_constraints[11] ? "" : () => this.randomSong(12)} className={"btn " + (this.state.level_constraints[11]? "btn-active" : "btn-inactive")}>12</button>
            </div>
            <br/>
            <br/>
            <h5>Current Requests:</h5>
              {current_song_requests}
            <br/>
          </div>
          <div className="col-9">
            <div className="row">
              <div className="col-8">
                <input type="text" className="form-control" placeholder="Search for Songs" onChange={this.titleFilter}></input>
              </div>
              <div className="col-4">
                <input type="text" className="form-control" placeholder="Filter by Level" onChange={this.levelFilter}></input>
              </div>
            </div>
            <br/>
            <table className="table">
              <thead>
                <tr className="d-flex">
                  <th scope="col" className="col-3">Song Name</th>
                  <th scope="col" className="col-3">Artist</th>
                  <th scope="col" className="col-2">Genre</th>
                  <th scope="col" className="col-1">B</th>
                  <th scope="col" className="col-1">N</th>
                  <th scope="col" className="col-1">H</th>
                  <th scope="col" className="col-1">A</th>
                </tr>
              </thead>
              {orig_songs_rendered}
            </table>
          </div>
        </div>
      </div>
    )
  }
}

class OrigSongList extends React.Component{
  constructor(props){
    super(props);
    this.sendSongRequest = this.sendSongRequest.bind(this);
  }

  sendSongRequest(diff){
    var request_string = diff + this.props.song.version_id.toString() + "_" + this.props.song.id.toString();
    socket.emit("song_request", request_string)
  }

  render(){
    var button_style = {
      float: "right"
    }
    return(
      <tr className="enabled d-flex">
        <td className="col-3">{this.props.song.title}</td>
        <td className="col-3">{this.props.song.artist}</td>
        <td className="col-2">{this.props.song.genre}</td>
        {this.props.song.b_locked || this.props.song.difficulty[0] === -1 ? (
          <td className={"col-1"}>
          </td>
        ) : (
          <td className={"col-1" + (this.props.song.b_disabled ? " disabled" : " green")}>
          {
            this.props.song.b_queue || this.props.song.b_disabled ? this.props.song.difficulty[0] : (
              <div className="bt-active">
                {this.props.song.difficulty[0]}&nbsp;
                <button style={button_style} type="button" onClick={() => this.sendSongRequest("b")}>
                  +
                </button>
              </div>
            )
          }
          </td>
        )}
        {this.props.song.n_locked || this.props.song.difficulty[1] === -1 ? (
          <td className={"col-1"}>
          </td>
        ) : (
          <td className={"col-1" + (this.props.song.n_disabled ? " disabled" : " blue")}>
          {
            this.props.song.n_queue || this.props.song.n_disabled ?  this.props.song.difficulty[1] : (
              <div className="bt-active">
                {this.props.song.difficulty[1]}&nbsp;
                <button style={button_style} type="button" onClick={() => this.sendSongRequest("n")}>
                  +
                </button>
              </div>
            )
          }
          </td>
        )}
        {this.props.song.h_locked || this.props.song.difficulty[2] === -1 ? (
          <td className={"col-1"}>
          </td>
        ) : (
          <td className={"col-1" + (this.props.song.h_disabled ? " disabled" : " yellow")}>
          {
            this.props.song.h_queue || this.props.song.h_disabled ? this.props.song.difficulty[2] : (
              <div className="bt-active">
                {this.props.song.difficulty[2]}&nbsp;
                <button style={button_style} type="button" onClick={() => this.sendSongRequest("h")}>
                  +
                </button>
              </div>
            )
          }
          </td>
        )}
        {this.props.song.a_locked || this.props.song.difficulty[3] === -1 ? (
          <td className={"col-1"}>
          </td>
        ) : (
          <td className={"col-1" + (this.props.song.a_disabled ? " disabled" : " red")}>
          {
            this.props.song.a_queue || this.props.song.a_disabled ? this.props.song.difficulty[3] : (
              <div className="bt-active">
                {this.props.song.difficulty[3]}&nbsp;
                <button style={button_style} type="button" onClick={() => this.sendSongRequest("a")}>
                  +
                </button>
              </div>
            )
          }
          </td>
        )}
      </tr>
    )
  }
}

export default UserPage
