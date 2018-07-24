import React from 'react';
import {render} from 'react-dom';
import song_list from './infinitas.json';
import socketIOClient from 'socket.io-client';
const socket = socketIOClient();

class UnlockPanel extends React.Component {
  constructor(props){
    super(props);
    var raw_songs = []
    var songs = song_list["songs"].map(function(obj){
      var version = obj["version"];
      var orig_songs = obj["songs"];
      var version_id = obj["version_id"];
      var version_list = [];

      var version_songs = orig_songs.map(function(song){
        var object = song;
        object["b_locked"] = !song.default;
        object["n_locked"] = !song.default;
        object["h_locked"] = !song.default;
        object["a_locked"] = !song.default;
        object["version"] = version;
        object["version_id"] = version_id;
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

    this.state = {
      raw_songs: raw_songs,
      version_songs: songs,
      orig_song_list: songs,
      search_term: '',
      level_field: '',
      raw_queue: [],
      version_lengths: version_lengths,
      filtered_songs: songs,
      message: false,
      requests: []
    }

    this.titleFilter = this.titleFilter.bind(this);
    this.levelFilter = this.levelFilter.bind(this);
  }

  componentDidMount(){
    socket.on("update_unlock_status", data => {
      var unlock_ids = data;
      var updated_list = this.state.version_songs.map(function(obj){
        var version_songs = obj.map(function(song){
          var object = song;
          var beginner = "b"+song.version_id.toString+"_"+song.id.toString()
          var normal = "n"+song.version_id.toString+"_"+song.id.toString()
          var hyper = "h"+song.version_id.toString+"_"+song.id.toString()
          var another =  "a"+song.version_id.toString+"_"+song.id.toString()
          if(unlock_ids.includes(beginner)){
            song.b_locked = false;
          }
          if(unlock_ids.includes(normal)){
            song.n_locked = false;
          }
          if(unlock_ids.includes(hyper)){
            song.h_locked = false;
          }
          if(unlock_ids.includes(another)){
            song.a_locked = false;
          }
          return object;
        })
        var version_obj = version_songs;
        return version_obj
      })
      this.setState({
        version_songs: updated_list
      }, this.songsFilter(this.state.search_term, this.state.level_field))
    })
  }

  songsFilter(search_term, level_field){
    var filter_songs = this.state.version_songs.map(function(obj){
      var version_songs = obj.filter(function(song){
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
        var return_obj = {}
        return_obj = version_songs
        return return_obj
      }
      else return null;
    })
    var filtered_songs = filter_songs.filter(function(obj){
      return obj !== null;
    })

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

  render (){
    var x = 0;
    console.log(this.state.filtered_songs)
    var orig_song_list = (this.state.search_term === '' && this.state.level_field === '') ? this.state.version_songs : this.state.filtered_songs;
    var orig_songs_rendered = orig_song_list.map(function(obj){
      var version_songs = obj["songs"]
      console.log(obj)
      if(obj.songs.length > 0){
        var version = obj["version"]
        var version_songs_rendered = version_songs.map(function(song){
          return(
            <FullSongList song={song} key={"original_"+song["id"]+"_"+version} />
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
      else return(
        <tbody>
          <tr className="d-flex">
            <th scope="col" className="col-12">{version} HA</th>
          </tr>
        </tbody>
      )
    })
    return(
      <div className="container">
          <div className="col-12">
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
    )
  }
}

class FullSongList extends React.Component{
  constructor(props){
    super(props);
    this.UnlockSongRequest = this.UnlockSongRequest.bind(this);
    this.LockSongRequest = this.LockSongRequest.bind(this);
  }

  UnlockSongRequest(diff){
    var request_string = diff + this.props.song.version_id.toString() + "_" + this.props.song.id.toString();
    socket.emit("add_to_unlocked", request_string)
  }

  LockSongRequest(diff){
    var request_string = diff + this.props.song.version_id.toString() + "_" + this.props.song.id.toString();
    socket.emit("remove_from_unlocked", request_string)
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
        <td className="col-1">
          {this.props.song.difficulty[0] === -1 ? "" : (
            <div className="bt-active">
              this.props.song.difficulty[0]}&nbsp;
              {this.props.b_locked ? (
                <button style={button_style} type="button" onClick={() => this.UnlockSongRequest("b")}>
                  +
                </button>
              ):(
                <button style={button_style} type="button" onClick={() => this.UnlockSongRequest("b")}>
                  +
                </button>
              )}
            </div>
          )}
        </td>

        <td className={"col-1" + (this.props.song.n_disabled ? " disabled" : " blue")}>
          {this.props.song.difficulty[1] === -1 ? "" : (
            this.props.song.n_queue || this.props.song.n_disabled ?  this.props.song.difficulty[1] : (
              <div className="bt-active">
                {this.props.song.difficulty[1]}&nbsp;
                <button style={button_style} type="button" onClick={() => this.sendSongRequest("n")}>
                  +
                </button>
              </div>
            )
          )}
        </td>
        <td className={"col-1" + (this.props.song.h_disabled ? " disabled" : " yellow")}>
          {this.props.song.difficulty[2] === -1 ? "" : (
            this.props.song.h_queue || this.props.song.h_disabled ? this.props.song.difficulty[2] : (
              <div className="bt-active">
                {this.props.song.difficulty[2]}&nbsp;
                <button style={button_style} type="button" onClick={() => this.sendSongRequest("h")}>
                  +
                </button>
              </div>
            )
          )}
        </td>
        <td className={"col-1" + (this.props.song.a_disabled ? " disabled" : " red")}>
          {this.props.song.difficulty[3] === -1 ? "" : (
            this.props.song.a_queue || this.props.song.a_disabled ? this.props.song.difficulty[3] : (
              <div className="bt-active">
                {this.props.song.difficulty[3]}&nbsp;
                <button style={button_style} type="button" onClick={() => this.sendSongRequest("a")}>
                  +
                </button>
              </div>
            )
          )}
        </td>
      </tr>
    )
  }
}

export default UnlockPanel
