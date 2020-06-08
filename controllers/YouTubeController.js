const google = require("googleapis").google;
const service = google.youtube("v3");
const { validURL } = require("../functions");
const { videos } = require("../models");

async function getYoutubeVideo(video) {
  let isURL = validURL(video);
  let videoID = null;
  //If video is full url, parse out the ID
  if (isURL) {
    videoID = getVideoID("v", video);
  } else {
    videoID = video;
  }

  try {
    let response = await service.videos.list({
      auth: process.env.API_FLOOB_YOUTUBEAPI,
      part: "snippet",
      id: videoID,
    });
    return response;
  } catch (error) {
    console.error(error);
  }
}
async function getYouTubeSearch(query) {
  let response = await service.search.list({
    auth: process.env.API_FLOOB_YOUTUBEAPI,
    part: "snippet",
    maxResults: "10",
    type: "video",
    q: query,
  });
  return response;
}

function getVideoID(name, url) {
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
}

module.exports = {
  addYouTubeVideo(video, provider, roomID, userID) {
    return new Promise((resolve, reject) => {
      getYoutubeVideo(video)
        .then((result) => {
          let videoInfo = result.data.items[0].snippet;
          let videoID = result.data.items[0].id;

          let newVideo = {
            src: videoID,
            provider: provider,
            room: roomID,
            title: videoInfo.title,
            channel: videoInfo.channelTitle,
            image: videoInfo.thumbnails.high.url,
            user: userID,
          };
          videos
            .create(newVideo)
            .then((result) => {
              resolve(result);
            })
            .catch((error) => {
              reject(error);
            });
        })
        .catch((error) => {
          reject(error);
        });
    });
  },
  searchYoutubeVideo(query) {
    return new Promise((resolve, reject) => {
      getYouTubeSearch(query)
        .then((result) => {
          console.log(result);
          if (result) {
            resolve(result.data.items);
          } else {
            reject("error");
          }
        })
        .catch((error) => {
          reject(error);
        });
    });
  },
};
