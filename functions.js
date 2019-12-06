const google = require('googleapis').google;

module.exports = {
  getRandomColor() {
    var letters = "0123456789ABCDEF";
    var color = "#";
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  },

  getVideoID(name, url) {
    if (url.includes("youtu.be")) {
      let index = 0;
      //Mobile Link
      let firstCheck = url.split("/")[url.split("/").length - 1];
      if (firstCheck.length > 0) {
        index = url.split("/").length - 1;
      } else {
        index = url.split("/").length - 2;
      }
      let videoID = url.split("/")[index];
      return videoID;
    }
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return "";
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  },

  getVideoInfo(ID) {
    var service = google.youtube("v3");
    let response = service.videos.list({
      auth: process.env.API_FLOOB_YOUTUBEAPI,
      part: "snippet",
      id: ID
    });
    return response;
  },

  videoSearch(payload) {
    var service = google.youtube("v3");
    let response = service.search.list({
      auth: process.env.API_FLOOB_YOUTUBEAPI,
      part: "snippet",
      maxResults: "10",
      type: "video",
      q: payload.search
    });
    return response;
  },

  playlistVideos(playerlistID) {
    var service = google.youtube("v3");
    let response = service.playlistItems.list({
      auth: process.env.API_FLOOB_YOUTUBEAPI,
      part: "contentDetails",
      maxResults: "50",
      playlistId: playerlistID
    });
    return response;
  },

  catchError(error) {
    throw error;
  },

  guid() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
      s4() + '-' + s4() + s4() + s4();
  }
};