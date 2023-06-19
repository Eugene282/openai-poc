import formidable from "formidable";
const debug = require("debug")("api_lib_file:debug");
const error = require("debug")("api_lib_file:error");
import libVlt from "./vault";
import libVec from "./vectordb";
import com from "./commons";
import libPds from "./pds";
import { Constants as cst } from "dsd-constants-lib";

const { VAULT_ID, VAULT_API } = process.env;

async function uploadAndRegister(req, res, checkIPSpace) {
    // debug("req.body: %o", req.body);
    com.assertPostAndPwd(req, res);
    let {APP_USER_ID, APP_USER_KEY} = req.query;
    debug("post.file.query: %o -> %o", req.query, {APP_USER_ID, APP_USER_KEY});
    const form = new formidable.IncomingForm();
    form.parse(req, async function (err, fields, files) {
        //upload file to vault
        let file = files.file;
        let { originalFilename, newFilename, filepath, mimetype } = file;
        debug("post.file: %o",  { originalFilename, newFilename, filepath, mimetype });


        /////////////<check IP Space
        if(checkIPSpace) {
            let protectedDabIds = await libPds.getProtectedDabIds(100);
            debug("compare.vectordb.protectedDabIds:%o", protectedDabIds);
            let similarToDabId = await libVec.isFileSimilarToDabIds(file.filepath, protectedDabIds);
            debug("compare.vectordb.is_similar:%o", similarToDabId);
            if(similarToDabId) return res.status(400).send("File is similar to protected dabId="+similarToDabId);
        }
        /////////////>check IP Space


        let status = await libVlt.uploadFileToVault(file, APP_USER_ID, VAULT_ID, VAULT_API);
        debug("post.vault.status:%o", status);
        if(!status || !status.success) return res.status(400).send("File hasn't been uploaded to a Vault");

        //deposit asset in pds
        let assetStorageId = status.asset.name;
        debug("post.assetStorageId:%o", assetStorageId);
        let dabId = await libPds.depositAsset(
            file.originalFilename,
            APP_USER_ID,
            APP_USER_KEY,
            cst.VaultProtocol.assembleAssetUrl(VAULT_ID, null, assetStorageId, mimetype)
        );
        debug("post.dabId:%o", dabId);
        if(!dabId) return res.status(400).send("Asset hasn't been registered in PDS");

        //upload to vector db
        status = await libVec.uploadFile(file.filepath, dabId);
        debug("post.vectordb.status:%o", status);
        if(!status) return res.status(400).send("Asset "+dabId+" has been registered, but file hasn't been uploaded to a Vector db");

        return res.status(201).send(dabId);
    });
}

export default {
    uploadAndRegister
}