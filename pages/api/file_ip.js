const debug = require("debug")("api_file_ip:debug");
const error = require("debug")("api_file_ip:error");
import libFile from "./lib/file";

export const config = { api: { bodyParser: false } };

export default function (req, res) {
    return libFile.uploadAndRegister(req, res, true);
}