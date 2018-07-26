import React from 'react';
import {render} from 'react-dom';
import song_list from './infinitas.json';
import socketIOClient from 'socket.io-client';
const socket = socketIOClient();

class UnlockPanel extends React.Component {
  constructor(props){
    super(props);
    var song_count = 0;
    var packs = ["PK1", "PK2"]
    var pack_bool = [false, false]
    var songs = song_list["songs"].map(function(obj){
      var version = obj["version"];
      var orig_songs = obj["songs"];
      var version_id = obj["version_id"];
      var version_list = [];

      //this part is poorly designed because it has NOTHING to do with non-pack songs
      //for now, it works. refactor later
      //end section. exit hamlet
      var version_songs = orig_songs.map(function(song){
        var object = song;
        object["b_locked"] = !song.default;
        object["n_locked"] = !song.default;
        object["h_locked"] = !song.default;
        object["a_locked"] = !song.default;
        object["version"] = version;
        object["version_id"] = version_id;
        object["raw_id"] = song_count;
        song_count++;
        version_list.push(object);
        return object
      })
      var return_obj = {
        version: version,
        version_id: version_id,
        songs: version_songs
      }
      return return_obj
    })
    var pack_song_ids = []
    for(var i = 0; i < packs.length; i++){
      pack_song_ids.push([])
    }
    var bit_songs = songs.map(function(v){
      var non_pack_songs = v["songs"].filter(function(song){
        if(song.pack !== "") return false;
        return true;
      })
      var pack_songs = v["songs"].filter(function(song){
        if(song.pack !== "") return true;
        return false;
      })
      for(var x = 0; x < packs.length; x++){
        var pack_name = packs[x];
        var ids = pack_song_ids[x];
        for(var y = 0; y < pack_songs.length; y++){
          if(pack_songs[y].pack === pack_name){
              var id_string = pack_songs[y].version_id.toString() + "_" + pack_songs[y].id.toString();
              if(pack_songs[y].difficulty[0] !== -1) ids.push("b"+id_string)
              if(pack_songs[y].difficulty[1] !== -1) ids.push("n"+id_string)
              if(pack_songs[y].difficulty[2] !== -1) ids.push("h"+id_string)
              if(pack_songs[y].difficulty[3] !== -1) ids.push("a"+id_string)
          }
        }
      }
      var object = v;
      object["songs"] = non_pack_songs;
      return object;
    })

    this.state = {
      packs: packs,
      pack_bool: pack_bool,
      pack_songs: pack_song_ids,
      version_songs: bit_songs,
      orig_song_list: bit_songs,
      search_term: '',
      level_field: '',
      filtered_songs: songs,
      diff_constraints: [false, false, false, false],
      level_constraints: [false, false, false, false, false, false, false, false, false, false, false, false],
      message: false
    }

    this.titleFilter = this.titleFilter.bind(this);
    this.levelFilter = this.levelFilter.bind(this)
  }

  componentDidMount(){
    socket.on("update_pack_status", data => {
      var packs = data["pack_list"];
      var pack_boolean = this.state.pack_bool;
      for(var x = 0; x < pack_boolean.length; x++){
        pack_boolean[x] = false;
        //why do this?
        //whats the point???
        //THIS SEEMS SO STUPID ARGH
      }
      for(var y = 0; y < packs.length; y++){
        var index = this.state.packs.indexOf(packs[y]);
        pack_boolean[index] = true;
      }
      this.setState({
        pack_bool: pack_boolean
      })
    })

    socket.on("update_unlock_status", data => {
      var unlock_ids = data["unlock_list"];
      var updated_list = this.state.version_songs.map(function(obj){
        var version_songs = obj["songs"].map(function(song){
          var object = song;
          var beginner = "b"+song.version_id.toString()+"_"+song.id.toString()
          var normal = "n"+song.version_id.toString()+"_"+song.id.toString()
          var hyper = "h"+song.version_id.toString()+"_"+song.id.toString()
          var another =  "a"+song.version_id.toString()+"_"+song.id.toString()
          object.b_locked = (unlock_ids.includes(beginner) ? false : !song.default)
          object.n_locked = (unlock_ids.includes(normal) ? false : !song.default)
          object.h_locked = (unlock_ids.includes(hyper) ? false : !song.default)
          object.a_locked = (unlock_ids.includes(another) ? false : !song.default)
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

  songsFilter(search_term, level_field){
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
          songs: obj["songs"]
        }
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
    var orig_song_list = (this.state.search_term === '' && this.state.level_field === '') ? this.state.version_songs : this.state.filtered_songs;
    var orig_songs_rendered = orig_song_list.map(function(obj){
      var version_songs = obj["songs"]
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
      else return null
    })
    var that = this;
    var packs = this.state.packs.map(function(pack){
      var index = that.state.packs.indexOf(pack);
      var pack_songs = that.state.pack_songs[index]
      return(
        <PackList pack={pack} songs={pack_songs} packbool={that.state.pack_bool} index={index} key={pack} />
      )
    })

    return(
      <div className="container">
          <div className="col-12">
            <div className="row">
              <div className="col-12">
                Add Packs
              </div>
            </div>
            <div className="row">
              {packs}
            </div>
            <br/>
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

class PackList extends React.Component{
  constructor(props){
    super(props);
    this.songPackRequest = this.songPackRequest.bind(this);
  }

  songPackRequest(pack_name){
    var index = this.props.index;
    var songs = this.props.songs;
    if(this.props.packbool[index]){
      socket.emit("remove_pack", pack_name)
      for(var x = 0; x < songs.length; x++){
        socket.emit("remove_from_unlocked", songs[x])
      }
    }
    else{
      socket.emit("add_pack", pack_name)
      for(var x = 0; x < songs.length; x++){
        socket.emit("add_to_unlocked", songs[x])
      }
    }
  }

  render(){
    var songs = this.props.songs;
    var pack_name = this.props.pack;
    var button_style = {
      float: "right"
    }
    var pack_bool = this.props.packbool;
    var index = this.props.index;
    return(
      <div className="col-2">
        Add {pack_name}
        <button style={button_style} type="button" onClick={() => this.songPackRequest(pack_name)}>
          {pack_bool[index] ? "-" : "+"}
        </button>
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
        <td className={"col-1" + (this.props.song.b_locked ? "" : " green")}>
          {this.props.song.difficulty[0] === -1 || this.props.song.default ? "" : (
            <div className="bt-active">
              {this.props.song.difficulty[0]}&nbsp;
              {this.props.song.b_locked ? (
                <button style={button_style} type="button" onClick={() => this.UnlockSongRequest("b")}>
                  +
                </button>
              ):(
                <button style={button_style} type="button" onClick={() => this.LockSongRequest("b")}>
                  -
                </button>
              )}
            </div>
          )}
        </td>
        <td className={"col-1" + (this.props.song.n_locked ? "" : " blue")}>
          {this.props.song.difficulty[1] === -1 || this.props.song.default ? "" : (
            <div className="bt-active">
              {this.props.song.difficulty[1]}&nbsp;
              {this.props.song.n_locked ? (
                <button style={button_style} type="button" onClick={() => this.UnlockSongRequest("n")}>
                  +
                </button>
              ):(
                <button style={button_style} type="button" onClick={() => this.LockSongRequest("n")}>
                  -
                </button>
              )}
            </div>
          )}
        </td>
        <td className={"col-1" + (this.props.song.h_locked ? "" : " yellow")}>
          {this.props.song.difficulty[2] === -1 || this.props.song.default ? "" : (
            <div className="bt-active">
              {this.props.song.difficulty[2]}&nbsp;
              {this.props.song.h_locked ? (
                <button style={button_style} type="button" onClick={() => this.UnlockSongRequest("h")}>
                  +
                </button>
              ):(
                <button style={button_style} type="button" onClick={() => this.LockSongRequest("h")}>
                  -
                </button>
              )}
            </div>
          )}
        </td>
        <td className={"col-1" + (this.props.song.a_locked ? "" : " red")}>
          {this.props.song.difficulty[3] === -1 || this.props.song.default ? "" : (
            <div className="bt-active">
              {this.props.song.difficulty[3]}&nbsp;
              {this.props.song.a_locked ? (
                <button style={button_style} type="button" onClick={() => this.UnlockSongRequest("a")}>
                  +
                </button>
              ):(
                <button style={button_style} type="button" onClick={() => this.LockSongRequest("a")}>
                  -
                </button>
              )}
            </div>
          )}
        </td>
      </tr>
    )
  }
}

export default UnlockPanel
