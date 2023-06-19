const debug = require("debug")("api_lib_db:debug");
const error = require("debug")("api_lib_db:error");
import com from "./commons";

const { DB_SERVER, OPENAI_API_KEY } = process.env;
const {ChromaClient, OpenAIEmbeddingFunction} = require('chromadb');
const dbClient = new ChromaClient(DB_SERVER);
const embedder = new OpenAIEmbeddingFunction(OPENAI_API_KEY);

async function uploadFile(filepath, dabId) {
    debug("uploadFileToVectorDb.start: %o",{filepath, dabId, embedder});
    const collection = await dbClient.getCollection("pds_docs_collection", embedder);

    let fileContent = await com.getFileContent(filepath);
    const result = await collection.add(
        "dabId_"+dabId,
        undefined,
        [{dabId}],
        [fileContent]
        // [fs.createReadStream(file.filepath)]
    );
    debug("uploadFileToVectorDb.result: %s", (result ? JSON.stringify(result).substring(0, 100) : result));
    return true;
}

async function deleteFile(fileId) {
    debug("deleteFileFromVectorDb.start: %o", {fileId, embedder});
    const collection = await dbClient.getCollection("pds_docs_collection", embedder);
    const result = await collection.delete([fileId]);
    debug("deleteFileFromVectorDb.result: %o", result);
    return true;
}

async function searchFiles(searchText, limit) {
    debug("dbReq.searchText: "+searchText);
    const coll = await dbClient.getCollection("pds_docs_collection", embedder);
    debug("dbReq.getCollection: "+(coll ? JSON.stringify(coll).substring(0, 99) : coll));

    const result = await coll.query(
        undefined,
        limit,
        undefined, //{"metadata_field": "is_equal_to_this"},
        [searchText]
    );
    debug("dbReq.result: "+(result ? JSON.stringify(result).substring(0, 99) : result));

    return result;
}

async function searchFile(searchText) {
    return await searchFiles(searchText, 1);
}

async function getFileByDabId(dabId) {
    debug("dbReq.dabId: "+dabId);
    const coll = await dbClient.getCollection("pds_docs_collection", embedder);
    debug("dbReq.getCollection: "+(coll ? JSON.stringify(coll).substring(0, 99) : coll));

    const result = await coll.get(["dabId_"+dabId]);
    debug("dbReq.result: "+(result ? JSON.stringify(result).substring(0, 99) : result));

    return result;
}

async function isFileSimilarToDabIds(filepath, dabIds) {
    let tmpId = "tmp_"+new Date().getTime();
    let isOk = await uploadFile(filepath, tmpId);
    if(!isOk) throw new Error("Can not vectorize file");

    let fileToCompare = await getFileByDabId(tmpId);
    debug("isFileSimilarToDabIds.fileToCompare: %o...", fileToCompare ? fileToCompare.documents[0][0].substring(0, 150) : null);
    let limit = 10+dabIds.length;
    let result = await searchFiles(fileToCompare.documents[0], limit > 20 ? 20 : limit);
    debug("isFileSimilarToDabIds.files: %o", {ids: result.ids, distances: result.distances});

    // {
    //   "ids":[["pds_doc_1"]],
    //   "embeddings":null,
    //   "documents":[["\nNFT Transfers.\n\nIn0 leos.\n\n\t\t"]],
    //   "metadatas":[[{"dabId":"8767"}]],
    //   "distances":[[0.513995885848999]]
    // }
    let found_i = null;
    result.distances[0].find((d, i) => {
        let curId = result.ids[0][i];
        // debug("checking distance %o", {d, i, curId});
        if(d < 0.1 && curId != ("dabId_"+tmpId)) {
            // debug("checking distance with protected ids: %o", {curId, dabIds});
            let similarToProtected = dabIds.find(_cmpId => { return  (curId == ("dabId_"+_cmpId)) ? true : false; });
            // debug("similarToProtected: %o", similarToProtected);
            if(similarToProtected) {
                found_i = i;
                return true;
            } else return false;
        } else return false;
    });

    await deleteFile("dabId_"+tmpId);

    if(found_i === null) return null;

    let foundId = result.ids[0][found_i];
    debug("foundId=%o", foundId);
    let distance = result.distances[0][found_i];
    debug("distance=%o", distance);
    distance = (""+distance).substring(0, 8);
    debug("distance_trim=%o", distance);
    return foundId.startsWith("dabId_") ? (foundId.substring(6) + " distance="+distance) : null;
}

export default {
    uploadFile,
    searchFile,
    searchFiles,
    deleteFile,
    getFileByDabId,
    isFileSimilarToDabIds
}