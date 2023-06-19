import fs from "fs";
import secp256k1 from "secp256k1/elliptic";
const debug = require("debug")("api_lib_commons:debug");
const error = require("debug")("api_lib_commons:error");

function postOpt(_body) {
    return {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(_body)
    };
}

function assertPostAndPwd(req) {
    if(req.method === "POST") {
        let b = req.body;
        let q = req.query;
        // debug("req.b: %o", b);
        // debug("req.q: %o", q);
        if((b && b.APP_PWD === process.env.APP_PWD) || (q && q.APP_PWD === process.env.APP_PWD)) {
            debug("password accepted");
        } else throw new Error("Wrong password");
    } else
        throw new Error("Wrong HTTP method");
}

function throwIfNeeded(fetch_resp, data) {
    if (fetch_resp.status !== 200) {
        debug("data_err: %o", data);
        data = data && data.result && !data.error ? data.result : data;
        if(data && data.error) throw data.error;
        else throw new Error(`Request failed with status ${fetch_resp.status}`);
    } else if(!fetch_resp.ok) throw new Error(`Request failed`);
}

function getFileContent(filepath) {
    return new Promise((res, rej) => {
        fs.readFile(filepath, "utf8", function (err, data) {
            res(data);
        });
    });
}

function getPublicKey(prvKey) {
    let removed0x_Key = prvKey.startsWith("0x") || prvKey.startsWith("0X") ? prvKey.substring(2) : prvKey;
    let compressed = secp256k1.publicKeyCreate(Buffer.from(removed0x_Key, "hex"));
    let bufPubKey = secp256k1.publicKeyConvert(compressed, false);
    let pfxPubKey = Buffer.from(bufPubKey).toString("hex");
    return "0x"+(pfxPubKey.length == 130 ? pfxPubKey.substring(2) : pfxPubKey);
}

function handleError(res, errObj, errLog, apiName) {
    let err = errObj;
    if (err.response) {
        errLog(err.response.status, err.response.data);
        res.status(err.response.status).json(err.response.data);
    } else {
        errLog(`Error with ${apiName} API request: ${err.message}`);
        res.status(500).json({
            error: { message: 'An error occurred during your request: '+err }
        });
    }
}

export default {
    getFileContent,
    postOpt,
    assertPostAndPwd,
    throwIfNeeded,
    getPublicKey,
    handleError
}