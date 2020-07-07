const google = require("googleapis").google;
const service = google.youtube("v3");
const { validURL } = require("../functions");
const { videos } = require("../models");

async function getYoutubeVideoInfo(video) {
  videoID = getVideoID("v", video.src);
  try {
    let response = await service.videos.list({
      auth: process.env.API_FLOOB_YOUTUBEAPI,
      part: "snippet",
      id: videoID,
    });
    const apiResponse = response.data.items[0].snippet;

    video.src = videoID;
    video.channel = apiResponse.channelTitle;
    video.channelLink = formatChannelLink(apiResponse.channelId);
    video.title = apiResponse.title;
    video.image = parseImage(apiResponse.thumbnails);
    return video;
  } catch (error) {
    console.error(error);
  }
}
async function getYouTubeSearch(query) {
  let response = await service.search.list({
    auth: process.env.API_FLOOB_YOUTUBEAPI,
    part: 'snippet',
    maxResults: "5",
    type: "video",
    videoEmbeddable: true,
    q: query,
  });
  return response;
}

function parseImage(imageObject) {
  let objectToArray = Object.values(imageObject);
  return objectToArray[objectToArray.length - 1].url;
}
function formatChannelLink(channelID) {
  return "https://www.youtube.com/channel/" + channelID;
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
  async addYouTubeVideo(video) {
    //If youtube link is passed, get info from API first
    if (validURL(video.src)) {
      video = await getYoutubeVideoInfo(video);
    }
    return new Promise((resolve, reject) => {
      videos
        .create(video)
        .then((result) => {
          resolve(result);
        })
        .catch((error) => {
          reject(error);
        });
    });
  },
  searchYoutubeVideo(query, provider) {
    return new Promise((resolve, reject) => {
      getYouTubeSearch(query)
        .then((result) => {
          if (result) {
            let searchResults = [];
            result.data.items.forEach((element) => {
              searchResults.push({
                src: element.id.videoId,
                title: element.snippet.title,
                channel: element.snippet.channelTitle,
                channelLink: formatChannelLink(element.snippet.channelId),
                image: parseImage(element.snippet.thumbnails),
                provider: provider,
                publishTime: element.snippet.publishTime,
              });
            });
            resolve(searchResults);
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
