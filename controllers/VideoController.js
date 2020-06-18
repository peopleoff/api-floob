const { videos, vote_to_skip, rooms, users } = require("../models");
const { addYouTubeVideo, searchYoutubeVideo } = require("./YouTubeController");
const { searchVimeoVideo, addVimeoVideo } = require("./VimeoController");

videos.hasOne(users, {
  foreignKey: "id",
  sourceKey: "user",
  as: "userInfo",
  constraints: false,
});

module.exports = {
  /*
  ===================================================================
  Socket IO Functions
  ===================================================================
*/
  getAll(id) {
    return new Promise((resolve, reject) => {
      videos
        .findAll({
          where: {
            room: id,
          },
          include: [
            {
              model: users,
              attributes: ["username"],
              as: "userInfo",
            },
          ],
          order: [["createdAt", "ASC"]],
        })
        .then((result) => {
          resolve(result);
        })
        .catch((error) => {
          reject(error);
        });
    });
  },
  addVideo(video, provider, room, user) {
    return new Promise((resolve, reject) => {
      let newVideo = {
        src: video.videoID,
        provider: provider,
        room: room,
        title: video.title,
        channel: video.channel,
        image: video.image,
        user: user,
      };
      videos
        .create(newVideo)
        .then((result) => {
          resolve(result);
        })
        .catch((error) => {
          reject(error);
        });
    });
  },
  removeVideo(videoID) {
    return new Promise((resolve, reject) => {
      videos
        .destroy({
          where: {
            id: videoID,
          },
        })
        .then((result) => {
          resolve(result);
        })
        .catch((error) => {
          reject(error);
        });
    });
  },
  async voteToSkip(payload, votesNeeded) {
    //Check if user posted video
    let videoOwner = await videos.findOne({
      where: {
        id: payload.video,
        user: payload.user,
      },
    });

    let roomOwner = await rooms.findOne({
      where: {
        id: payload.room,
        user: payload.user,
      },
    });
    //Check if user has already skipped video
    let userVoted = await vote_to_skip.findOrCreate({
      defaults: payload,
      where: {
        video: payload.video,
        room: payload.room,
        user: payload.user,
      },
    });
    let currentVotes = await vote_to_skip.findAndCountAll({
      where: {
        video: payload.video,
        room: payload.room,
      },
    });
    return new Promise((resolve, reject) => {
      //Auto skip video if user who posted video skips.
      let video = {
        skipVideo: false,
        currentVotes: currentVotes.count,
        alreadyVoted: false,
      };
      // userVoted[1] returns if a new record is created
      //If no new record is created User already votted
      if (!userVoted[1]) {
        video.alreadyVoted = true;
      }
      if (videoOwner || roomOwner) {
        video.skipVideo = true;
        resolve(video);
      }
      if (currentVotes.count > votesNeeded) {
        video.skipVideo = true;
        resolve(video);
      } else {
        resolve(video);
      }
    });
  },
  /*
  ===================================================================
  Socket IO Functions
  ===================================================================
*/
  /*
  ===================================================================
  Routes Functions
  ===================================================================
*/
  getVideos(req, res) {
    module.exports
      .getAll(req.query.roomID)
      .then((result) => {
        res.status(200).send(result);
      })
      .catch((error) => {
        console.error(error);
      });
  },
  postVideo(req, res) {
    let io = req.app.get("io");

    switch (req.body.provider) {
      case 1:
        console.log("Youtube");
        addYouTubeVideo(req.body)
          .then((result) => {
            module.exports
              .getAll(req.body.room)
              .then((result) => {
                io.sockets.in(req.body.room).emit("getVideos", result);
                res.status(200).send(result);
              })
              .catch((error) => {
                console.error(error);
              });
          })
          .catch((error) => {
            console.error(error);
          });
        break;
      case 2:
        console.log("Vimeo");
        addVimeoVideo(req.body)
          .then((result) => {
            module.exports
              .getAll(req.body.room)
              .then((result) => {
                io.sockets.in(req.body.room).emit("getVideos", result);
                res.status(200).send(result);
              })
              .catch((error) => {
                console.error(error);
              });
          })
          .catch((error) => {
            console.error(error);
          });
        break;

      default:
        console.log("None");
        break;
    }
  },
  searchVideos(req, res) {
    const { query, provider } = req.body;
    switch (provider) {
      case 1:
        console.log("searching Youtube");
        searchYoutubeVideo(query, provider)
          .then((result) => {
            res.status(200).send(result);
          })
          .catch((error) => {
            console.error(error);
          });
        break;
      case 2:
        console.log("searching Vimeo");
        searchVimeoVideo(query, provider)
          .then((result) => {
            res.status(200).send(result);
          })
          .catch((error) => {
            res.status(403).send(error);
          });
        break;

      default:
        break;
    }
  },
  /*
  ===================================================================
  Routes Functions
  ===================================================================
*/
};
