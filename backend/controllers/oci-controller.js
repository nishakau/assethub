//oci related stuff comes here
const ociConfig = require("../config/oci");
const { response } = require("express");
const client = ociConfig.client;


exports.getFileFromBucket = async (request,response)=>{
    const prm = request.params;
    const getObjectRequest = {
        objectName: prm.name,
        bucketName: prm.bucket,
        namespaceName: ociConfig.namespace
      };
      try{
        const getObjectResponse = await client.getObject(getObjectRequest);
        console.log("File found");
        response.send(getObjectResponse);
        response.end();
      }catch(e){
        console.log("Unable to fetch file");
        response.end();
      }
}