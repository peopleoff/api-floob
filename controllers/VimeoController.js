const Vimeo = require("vimeo").Vimeo;
const client = new Vimeo(
  "e16226ab4ea55692b7a9febfd8880cd3bf839573",
  "/NWeoGWciEsxn+XncuI5KGkTO/OLHl6FFv9d2lNN8SdHlg1y5KTKCNZMFOmaYJ4VmcNlbCuYYKRcTAVDz00iXUjYPDL5T8PGv0LMV8T4gq5wQgSv5vQScoVH33ekhTaj",
  "dbe0129a89d9a662152cc965a8fea02d"
);
const { validURL } = require("../functions");
const { videos } = require("../models");

function parseVimeoURI(URI) {
  return URI.split("/").pop(-1);
}

function parseImage(imageArray) {
  return imageArray[imageArray.length - 1].link;
}

module.exports = {
  addVimeoVideo(video) {
    return new Promise((resolve, reject) => {
      console.log(video);
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
  searchVimeoVideo(query, provider) {
    return new Promise((resolve, reject) => {
      client.request(
        {
          method: "GET",
          path: "/videos",
          query: {
            query: query,
            page: 1,
            per_page: 10,
            fields:
              "uri,name,user.name,user.link,description,content_rating,pictures",
          },
        },
        function (error, body, status_code, headers) {
          if (error) {
            console.log("error");
            console.log(error);
            reject(error);
          } else {
            console.log("body");
            console.log(body);
            let searchResults = [];
            body.data.forEach((element) => {
              searchResults.push({
                src: parseVimeoURI(element.uri),
                title: element.name,
                channel: element.user.name,
                channelLink: element.user.link,
                image: parseImage(element.pictures.sizes),
                provider: provider,
              });
            });
            resolve(searchResults);
          }
        }
      );
    });
  },
};
