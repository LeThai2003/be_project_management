import {v2 as cloudinary} from "cloudinary"
import streamifier from "streamifier";

cloudinary.config({ 
  cloud_name: "dl54jz2u3", 
  api_key: "523926365921691", 
  api_secret: "O7Zhta7IBl6GPVSC16G7KURkdUg"
  // cloud_name: process.env.CLOUD_NAME, 
  // api_key: process.env.CLOUD_KEY, 
  // api_secret: process.env.CLOUD_SECRET 
});

const streamUpload = (buffer) => {
  return new Promise((resolve, reject) => {
      let stream = cloudinary.uploader.upload_stream(
        (error, result) => {
          if (result) {
            resolve(result);
          } else {
            reject(error);
          }
        }
      );

    streamifier.createReadStream(buffer).pipe(stream);
  });
};

const uploadToCloud = async (buffer) => {
  let result = await streamUpload(buffer);
  return result["url"];
}

export const uploadSingle = async (req, res, next) => {
  // console.log(req.file)
  if(req["file"])
  {
    const result = await uploadToCloud(req["file"].buffer);
    // console.log(result);
    req.body[req["file"]["fieldname"]] = result;
    next();
  }
  else
  {
      next();
  }
}

export const uploadFileds = async (req, res, next) => {
  if(req.files)
  {
    // console.log(req.files);   // { keyname1: [ {file}, {file}], keyname2: [{file}, {file}]   } 
    // req.body.avatar = [url] 
    // req.body.gallery = [url]
    for (const key in req.files) {
      req.body[key] = []
      for (const file of req.files[key]) {
        const result = await uploadToCloud(file.buffer);
        req.body[key].push(result);
      }
    }
    next();
  }
  else
  {
    next();
  }
}