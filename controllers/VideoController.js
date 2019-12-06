const { videos, vote_to_skip, rooms, users } = require('../models')
const { getVideoID, getVideoInfo } = require('../functions')

videos.hasOne(users, {
  foreignKey: 'id',
  sourceKey: 'user',
  as: 'userInfo',
  constraints: false
})

module.exports = {
  getAll(id) {
    return new Promise((resolve, reject) => {
      videos
        .findAll({
          where: {
            room: id
          },
          include: [
            {
              model: users,
              attributes: ['username'],
              as: 'userInfo'
            }
          ],
          order: [['createdAt', 'ASC']]
        })
        .then(result => {
          resolve(result)
        })
        .catch(error => {
          reject(error)
        })
    })
  },
  getVideos(req, res) {
    videos
      .findAll({
        where: {
          room: req.query.roomID
        },
        include: [
          {
            model: users
          }
        ],
        order: [['createdAt', 'ASC']]
      })
      .then(result => {
        return res.send(result)
      })
      .catch(error => {
        return res.send(error)
      })
  },
  postVideo(req, res) {
    let io = req.app.get('io')
    module.exports
      .addVideo(req.body)
      .then(result => {
        if (result) {
          module.exports
            .getAll(req.body.roomID)
            .then(videoResult => {
              io.sockets.in(req.body.roomID).emit('getVideos', videoResult)
            })
            .catch(error => {
              catchError(error)
            })
        }
        return res.send(result)
      })
      .catch(error => {
        console.error(error)
      })
  },
  addVideo(payload) {
    return new Promise((resolve, reject) => {
      const { videoLink, roomID, pure, user } = payload
      videoID = ''
      //Pure means Pure video ID was passed
      if (pure) {
        videoID = videoLink
      } else {
        videoID = getVideoID('v', videoLink)
      }
      getVideoInfo(videoID, roomID, user.id)
        .then(result => {
          let videoInfo = result.data.items[0].snippet
          // let nsfw = result.data.items[0].contentDetails.contentRating;
          let newVideo = {
            videoID: videoID,
            room: roomID,
            title: videoInfo.title,
            channel: videoInfo.channelTitle,
            image: videoInfo.thumbnails.high.url,
            user: user.id
          }
          videos
            .create(newVideo)
            .then(result => {
              resolve(result)
            })
            .catch(error => {
              reject(error)
            })
        })
        .catch(error => {
          reject(error)
        })
    })
  },
  async voteToSkip(payload, votesNeeded) {
    //Check if user posted video
    let videoOwner = await videos.findOne({
      where: {
        id: payload.video,
        user: payload.user
      }
    })

    let roomOwner = await rooms.findOne({
      where: {
        id: payload.room,
        user: payload.user
      }
    })
    //Check if user has already skipped video
    let userVoted = await vote_to_skip.findOrCreate({
      defaults: payload,
      where: {
        video: payload.video,
        room: payload.room,
        user: payload.user
      }
    })
    let currentVotes = await vote_to_skip.findAndCountAll({
      where: {
        video: payload.video,
        room: payload.room
      }
    })
    return new Promise((resolve, reject) => {
      //Auto skip video if user who posted video skips.
      let video = {
        skipVideo: false,
        currentVotes: currentVotes.count,
        alreadyVoted: false
      }
      // userVoted[1] returns if a new record is created
      //If no new record is created User already votted
      if (!userVoted[1]) {
        video.alreadyVoted = true
      }
      if (videoOwner || roomOwner) {
        video.skipVideo = true
        resolve(video)
      }
      if (currentVotes.count > votesNeeded) {
        video.skipVideo = true
        resolve(video)
      } else {
        resolve(video)
      }
    })
  },
  searchVideos(payload) {},
  removeVideo(videoID) {
    return new Promise((resolve, reject) => {
      videos
        .destroy({
          where: {
            id: videoID
          }
        })
        .then(result => {
          resolve(result)
        })
        .catch(error => {
          reject(error)
        })
    })
  },
  getThumbnail(req, res) {
    Video.findOne({
      room: req.body.roomID
    })
      .then(result => {
        if (result) {
          return res.send({
            error: false,
            image: result.image
          })
        } else {
          return res.send({
            error: false,
            image: null
          })
        }
      })
      .catch(error => {
        return res.send({
          error: true,
          message: error
        })
      })
  }
}
