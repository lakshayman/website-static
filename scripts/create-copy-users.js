const fs = require('fs');
const util = require('util');

const readDir = util.promisify(fs.readdir);
const readfile = util.promisify(fs.readFile);

const rawImageBaseUrl =
  "https://raw.githubusercontent.com/Real-Dev-Squad/website-static/main/members";

async function fileWalker(dir) {
  const readMemberDir = readDir(dir);
  const usersFolderNames = await readMemberDir.then(
    (usersFolder) => usersFolder
  );
  const userDataPromises = usersFolderNames.map((user) =>
    readfile(`${dir}/${user}/data.json`)
  );
  const userImagePromises = usersFolderNames.map((user) =>
    readfile(`${dir}/${user}/img.png`, "base64")
  );

  const dataMap = new Map();
  let dataPromise = Promise.all(userDataPromises).then((usersData) => {
    // userData is array with buffer
    usersData.forEach((singleUserData, index) => {
      const userData = JSON.parse(singleUserData);
      const user = usersFolderNames[index];
      if (dataMap.has(user)) {
        const existData = dataMap.get(user);
        const newData = {
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
      let user = usersFolderNames[index];
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

  const fullUsersData = await Promise.all([dataPromise, imagesPromise]).then(() => {
    return Array.from(dataMap);
  });
  return Promise.resolve(fullUsersData);
}

fileWalker('../members').then((data) => {
  const newData = {};
  data.forEach((userArray) => {
    newData[userArray[0]] = userArray[1];
  });
  fs.writeFile('../dist/members.json', JSON.stringify(newData), function (err) {
    console.error({ err });
  });
});
