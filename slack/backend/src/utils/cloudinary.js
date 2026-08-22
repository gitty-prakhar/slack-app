import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({ 
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME, 
    api_key:process.env.CLOUDINARY_API_KEY, 
    api_secret:process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary=async(localFilePath)=>{
    try{
        if(!localFilePath)return null;

        //check if cloudinary is configured
        if(!process.env.CLOUDINARY_CLOUD_NAME){
            console.warn("cloudinary is not configured. Falling back to local storage (unimplemented) or returning null.");
            fs.unlinkSync(localFilePath);
            return null;
        }

        //upload file on cloudinary
        const response=await cloudinary.uploader.upload(localFilePath,{
            //cloudinary automatically determines what type of file we are uploading
            resource_type:"auto"
        });
        
        //file has been uploaded successfully
        fs.unlinkSync(localFilePath);
        return response;

    } 
    catch(error){
        //remove the locally saved temporary file as the upload operation failed
        if(fs.existsSync(localFilePath)){
            fs.unlinkSync(localFilePath);
        }
        return null;
    }
};

export{uploadOnCloudinary};
