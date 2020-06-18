const VideoController = require('./controllers/VideoController');
const UserController = require('./controllers/UserController');
const RoomController = require('./controllers/RoomController');

module.exports = (app) => {

    // // Get Requests
    app.get('/videos/getVideos', VideoController.getVideos);
    // // Post Requests
    app.post('/videos/postVideo', VideoController.postVideo);
    app.post('/videos/search', VideoController.searchVideos);
    //User's Requests
    app.post('/users/register', UserController.register);
    app.post('/users/login', UserController.login);
    app.post('/users/getUser', UserController.getUser);
    app.post('/users/getUsers', UserController.getUsers);
    app.post('/users/requestPasswordChange', UserController.requestPasswordChange);
    app.post('/users/changePassword', UserController.changePassword);
    //Rooms Requests
    app.post('/rooms/getAll', RoomController.getAll);
    app.post('/rooms/register', RoomController.register);
    app.post('/rooms/toggleRoom', RoomController.toggleRoom);
    app.post('/rooms/getInfo', RoomController.getInfo);
    app.post('/rooms/updateRoom', RoomController.updateRoom);
    // app.post('/rooms/checkPassword', RoomController.checkPassword);

};