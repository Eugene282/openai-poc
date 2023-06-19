const debug = require("debug")("api_pds:debug");
const error = require("debug")("api_pds:error");
import com from "./lib/commons"
import libPds from "./lib/pds"

export default async function (req, res) {
    debug("entering api/pds...");
    try {
      com.assertPostAndPwd(req);
      let body = req.body;
      let opt = body ? body.opt : null;
      let data = null;
      debug("body: %o, opt: %o", body, opt);

      if(body && body.routingCmd === "getAccessTicket") {
          data = await libPds.getAccessTicket(opt.buyerId, opt.buyerCredentials, opt.dabIds[0]);
      } else {//Routes any request to PDS REST API
          data = await libPds.callPds(body.url, opt);
      }

      res.status(200).json({ result: data });
    } catch(err) {
        com.handleError(res, err, error, "PDS");
    }
}