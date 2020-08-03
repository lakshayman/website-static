const fs = require("fs");
const util = require("util");

const readDir = util.promisify(fs.readdir);
const readfile = util.promisify(fs.readFile);

const rawImageBaseUrl =
  "https://raw.githubusercontent.com/Real-Dev-Squad/website-static/main/members";

async function fileWalker(dir) {
  const readMemberDir = readDir(dir);
  const personFolderNames = await readMemberDir.then(
    (personFolder) => personFolder
  );
  const userDataPromises = personFolderNames.map((person) =>
    readfile(`${dir}/${person}/data.json`)
  );
  const userImagePromises = personFolderNames.map((person) =>
    readfile(`${dir}/${person}/img.png`, "base64")
  );

  const dataMap = new Map();
  let dataPromise = Promise.all(userDataPromises).then((usersData) => {
    // userData is array with buffer
    usersData.forEach((singleUserData, index) => {
      let userData = JSON.parse(singleUserData);
      let user = personFolderNames[index];
      if (dataMap.has(user)) {
        let existData = dataMap.get(user);
        let newData = {
          userData,
          ...existData,
        };
        dataMap.set(user, newData);
      } else {
        dataMap.set(user, userData);
      }
    });
  });

  let imagesPromise = Promise.all(userImagePromises).then((usersImage) => {
    usersImage.forEach((singleUserImage, index) => {
      let user = personFolderNames[index];
      let imageData = {
        img_b64: singleUserImage,
        img_raw: `${rawImageBaseUrl}/${user}/img.png`,
      };
      if (dataMap.has(user)) {
        let existData = dataMap.get(user);
        let newData = {
          ...existData,
          ...imageData,
        };
        dataMap.set(user, newData);
      } else {
        dataMap.set(user, imageData);
      }
    });
  });

  let fullUsersData = await Promise.all([dataPromise, imagesPromise]).then((data) => {
    return Array.from(dataMap);
  });
  return Promise.resolve(fullUsersData);
}

fileWalker("../members").then((data) => {
  let newData = {};
  data.forEach((userArray) => {
    newData[userArray[0]] = userArray[1];
  });
  fs.writeFile("../dist/members.json", JSON.stringify(newData), function (err) {
    console.error({ err });
  });
});
