const debug = require("debug")("api_db:info");
const error = require("debug")("api_db:error");

import com from "./lib/commons";
import libVec from "./lib/vectordb";

export default async function (req, res) {
  debug("entering api/vectordb...");
  try {
    com.assertPostAndPwd(req);
    let result = null;
    if(req.body.searchText) {
      result = await libVec.searchFile(req.body.searchText);
    } //else if...call another method
    res.status(200).json({result});
  } catch(err) {
    com.handleError(res, err, error, "VectorDB");
  }
}