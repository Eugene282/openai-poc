import fs from "fs";
const debug = require("debug")("api_lib_vault");
import request from "request";
import com from "./commons";
import pds from "./pds";

import { Constants as cst } from "dsd-constants-lib";

async function uploadFileToVault(file, userId, vaultId, vaultUrl) {
    let ticket = await pds.getUploadTicket(userId, vaultId);
    debug("uploadFileToVault.ticket: %o", ticket);
    let sessionId = await _getSessionByTicket(ticket, vaultUrl);
    debug("uploadFileToVault.sessionId: %o", sessionId);
    if(!sessionId) return null;
    let uploadStatus = await _uploadFileToVaultBySession(file, vaultUrl, sessionId);
    debug(uploadStatus.success, "asset was successfully uploaded");
    return uploadStatus;
}

async function _getSessionByTicket(ticket) {
    let ticket64 = Buffer.from(JSON.stringify(ticket)).toString("base64");
    let resp = await fetch(ticket.vaultUrl+"/"+cst.VaultProtocol.cmd_getsession +
        '?' + cst.VaultProtocol.param_ticket + '=' + ticket64, { method: "GET" });

    debug("getsession.headers: %o", resp.headers);
    debug("getsession.text: %o", await resp.text());
    if(resp && resp.headers)
        return resp.headers.get(cst.VaultProtocol.hdr_sessionId);
    else return null;

    // let headers =  {
    //     [Symbol(map)]:
    //         [Object: null prototype] {
    //         server: [ 'nginx/1.23.4' ],
    //         date: [ 'Tue, 25 Apr 2023 22:08:13 GMT' ],
    //         'transfer-encoding': [ 'chunked' ],
    //         connection: [ 'keep-alive' ],
    //         'access-control-allow-origin': [ '*' ],
    //         'access-control-allow-methods': [ '*' ],
    //         'access-control-allow-headers': [ '*' ],
    //         'vault-session-id': [ 'vsid-SPbqfL7zbIL1rN-d-865895.381524-1682460493826' ],
    //         'vault-session-key': [ 'PUGBa#qP2EPQQ^lDK|ZG1ri$wkL$GmG@P6q0L91a' ],
    //         'access-control-expose-headers': [ 'vault-session-id, vault-session-key' ]
    //     }
    // }

}

async function _uploadFileToVaultBySession(file, vaultUrl, session) {
    return new Promise((resolve, reject) => {
        const formData = {
            custom_file: {
                value:   fs.createReadStream(file.filepath),
                options: {
                    filename: file.newFilename+"_"+file.originalFilename,
                    contentType:  file.mimetype
                }
            }
        };

        debug("UPLOAD... to "+vaultUrl);

        request.post({
            url: (vaultUrl  + '/' + cst.VaultProtocol.cmd_upload + '?' + cst.VaultProtocol.param_sessionId + '=' + encodeURIComponent(session)),
            formData: formData
        }, function (err, response, body) {
            if (err) {
                debug(`upload failed: ${JSON.stringify(err)}`);

                reject(err);
                return;
            }

            debug(`body: ${body}`);

            resolve(JSON.parse(body));
        });
    });
}

export default {
    _uploadFileToVaultBySession,
    _getSessionByTicket,
    uploadFileToVault
}