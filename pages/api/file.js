const debug = require("debug")("api_file:debug");
const error = require("debug")("api_file:error");

import libFile from "./lib/file";

export const config = { api: { bodyParser: false } };

export default function (req, res) {
    return libFile.uploadAndRegister(req, res, false);
}