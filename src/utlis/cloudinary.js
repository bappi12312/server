import { v2 as cloudinary } from "cloudinary"
//fs - file system
import fs from "fs"
import dotenv from "dotenv";
dotenv.config({});

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath)=>{
    try{
        if(!localFilePath) return null
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type : "auto"
        })
        //file has been uploaded successfully 
        //console.log("file has been uploaded successfully on cloudinary ",response.url);
        fs.unlinkSync(localFilePath)
        return response;

    }catch(error){
        fs.unlinkSync(localFilePath) //remove the locally saved 
        //temporary file as the upload operation got failed

    }
}

export const deleteMediaFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.log(error);
  }
};

export const deleteVideoFromCloudinary = async (publicId) => {
  try {
      await cloudinary.uploader.destroy(publicId,{resource_type:"video"});
  } catch (error) {
      console.log(error);
      
  }
}

export {uploadOnCloudinary}