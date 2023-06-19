const debug = require("debug")("api_lib_pds:debug");
const error = require("debug")("api_lib_pds:error");
import com from "./commons";
import { DsdCrypto as crypto } from "dsd-common-lib";

const { PDS_API } = process.env;

async function callPds(path, body) {
    debug("lib_pds.callPds(%o)", {path, body});
    let fetchUrl = PDS_API+path;
    debug("lib_pds.callPds.fetchUrl: %o", fetchUrl);
    let payload = body ? com.postOpt(body) : { method: "GET" };
    debug("lib_pds.callPds.payload: %o", payload);
    let resp = await fetch(fetchUrl, payload);
    debug("lib_pds.callPDs.resp: %o", resp);
    let data = resp && resp.ok ? await resp.json() : null;
    debug("lib_pds.callPds.resp_json: %o", data);
    com.throwIfNeeded(resp, data);
    return data;
}

async function depositAsset(originalFilename, ownerId, ownerCredentials, assetUrl) {
    let body = {
        ownerId,
        ownerCredentials,
        dataArr: [{ assetUrl, description: "AI testing "+originalFilename+"-"+Math.round(Math.random()*1000) }]
    };

    debug("depositAsset: %o", {dataArr_0: body.dataArr[0]});
    let respObj = await callPds("/assets/create", body);
    if(!respObj || respObj.length != 1 || !respObj[0]) return null;
    debug("resp.json_0: %o", respObj[0]);
    return +respObj[0];
}

async function getProtectedDabIds(limit) {
    let dabArr = await callPds("/tags?queryOption=hierarchy_list&tagIds=9071&offset=0&limit="+limit);
    return dabArr.map(d => {return d.assetId});
}

function getUploadTicket(userId, vaultId) {
    return callPds("/tokens?accessType=UPLOAD&userId="+userId+"&vaultId="+vaultId);
}

async function getAccessTicket(userId, userCredentials, dabId) {
    debug("Use license for dab: "+dabId+"...");

    let opt = {
        accessType:         "ACCESS",
        buyerId:            userId.toLowerCase(),
        buyerCredentials:   userCredentials.toLowerCase(),
        dabIds:             [+dabId],
        licenseType:        "ACCESS"
    };
    // req: POST https://acceptance.dase.io:8081/api/tokens
    let data = await callPds("/tokens", opt);
    if(data && data.length > 0) {
        debug("usages: "+JSON.stringify(data));
        let cnt = data[0];
        debug(" Usage counter has been updated: "+cnt);
    } else throw Error("Could not increment license usages");

    debug("Checking license for dab: "+dabId+"...");

    // req: https://acceptance.dase.io:8081/api/assets?assetIds=3767
    data = await callPds("/assets?assetIds="+dabId);
    let sellerId = 0;
    debug("assets.resp.data: "+JSON.stringify(data));
    // [
    //   {
    //     "assetId": 2234,
    //     "ownerId": "0x3adf478c252011011b5212c1afeb496ad7477cb1",
    //     "assetContentType": "",
    //     "description": "Hand Rash (Propranolol)",
    //     "custodians": [],
    //     "dataHash": "0x0",
    //     "createdAt": "2022-11-11T19:06:42.000Z",
    //     "linkedDabId": "0"
    //   }
    // ]
    if(data && data.length > 0) {
        debug("DABS: "+JSON.stringify(data));
        sellerId = data[0].ownerId;
    } else throw Error("Could not obtain assets metadata");

    let params = {
        dabIds: [+dabId],
        buyerId: userId.toLowerCase(),
        sellerIds: [sellerId]
    };

    debug("signData: "+userCredentials);
    let sig = crypto.signData(params, userCredentials);
    let pubKey = com.getPublicKey(userCredentials);
    debug("hasAccessTicket.sig="+sig+", pubKey="+pubKey);

    let ticketPath = "/tokens?accessType=ACCESS&dabIds="+dabId+"&userId="+userId+"&sellerIds="+sellerId+"&argsBuyerSignature="+sig+"&publicKey="+pubKey;
    data = await callPds(ticketPath);
    debug("tokens.resp.data: "+JSON.stringify(data));
    if(data && data.length > 0) {
        debug("TICKETS: "+JSON.stringify(data));
        let ticketId = data[0].id;
        let pdsSig = data[0].signature;
        if(ticketId && pdsSig) return data[0];
    } else throw Error("Could not obtain access ticket");

    return null;
}

export default {
    getUploadTicket,
    getAccessTicket,
    depositAsset,
    getProtectedDabIds,
    callPds
}