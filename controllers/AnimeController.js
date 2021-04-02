const { videos } = require("../models");
const axios = require("axios");

function parseTitle(url) {
  const splitURL = url.split("/");
  //Last 2 from end of string
  return splitURL[splitURL.length - 1].replace(/-/g, " ");
}

function parseChannel(url) {
  const splitURL = url.split("/");
  return splitURL[splitURL.length - 2].replace(/-/g, " ");
}

function parseChannelLink(url) {
  const lastIndex = url.lastIndexOf("/");
  return url.substring(0, lastIndex);
}

module.exports = {
  async addCrunchyRollVideo(video) {
    return new Promise((resolve, reject) => {
      const originalURL = video.src;
      axios
        .post("https://zoomers-stream.herokuapp.com/stream", {
          quality: "best",
          url: originalURL,
        })
        .then((result) => {
          const videoURL = result.data.best;
          video.channelLink = parseChannelLink(originalURL);
          video.src = videoURL;
          video.channel = parseChannel(originalURL);
          video.title = parseTitle(originalURL);
          videos
            .create(video)
            .then((result) => {
              resolve(result);
            })
            .catch((error) => {
              reject(error);
            });
        })
        .catch((error) => {
          console.error(error);
        });
    });
  },
};
