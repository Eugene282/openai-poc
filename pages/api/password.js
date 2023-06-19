const debug = require("debug")("api_password:debug");
const error = require("debug")("api_password:error");
import com from "./lib/commons";

export default async function (req, res) {
    try {
      com.assertPostAndPwd(req);
      res.status(200).json({ result: true });
    } catch(err) {
        com.handleError(res, err, error, "PASSWORD");
    }
}