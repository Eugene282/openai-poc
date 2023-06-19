import { useState } from "react";
import styles from "./index.module.css";
import com from "./lib/commons";
import libPds from "./lib/pds";

export default function Search(props) {
  const [nlInput, setNlInput] = useState("");
  const [result, setResult]   = useState("No action yet");
  const {APP_PWD, APP_USER_ID, APP_USER_KEY} = props;

  async function hasAccessTicket(userId, dabId) {
      let opt = {
        accessType:         "ACCESS",
        buyerId:            APP_USER_ID.toLowerCase(),
        buyerCredentials:   APP_USER_KEY.toLowerCase(),
        dabIds:             [+dabId],
        licenseType:        "ACCESS"
      };
      let data = await libPds.callPds("Getting access ticket for dab "+dabId+"...", "", opt, APP_PWD, "getAccessTicket");
      console.log("TICKET: "+JSON.stringify(data));
      return data;
  }

  async function searchInVectorDb(userId, nlText) {
    try {
      setResult(" search in DB...");
      const resp = await fetch("/api/vectordb", com.postOpt({ searchText: nlText, APP_PWD }));
      setResult(" got response from DB");
      const data = await resp.json();
      com.throwIfNeeded(resp, data);
      // data.result:
      // {
      //   "ids":[["pds_doc_1"]],
      //   "embeddings":null,
      //   "documents":[["\nNFT Transfers.\n\nIn0 leos.\n\n\t\t"]],
      //   "metadatas":[[{"dabId":"8767"}]],
      //   "distances":[[0.513995885848999]]
      // }
      if(data) {
        let r = data.result;
        let rS = JSON.stringify(r);
        console.log("db.response:"+rS.substring(0, 100)+" [ ... ] "+rS.substring(rS.length-100));
        if(r
            && r.metadatas && r.metadatas.length > 0
            && r.documents && r.documents.length > 0
            && (+r.distances[0][0] < 0.4)
        ) {
          setResult(" found in DB");

          let retDoc = r.documents[0][0];

          let dabId = r.metadatas[0][0].dabId;
          let isOk = userId ? await hasAccessTicket(userId, dabId) : false;
          if(isOk) {
            setResult(" license is confirmed");
            return { dabId, retDoc, code: 0 };
          } else return {dabId, retDoc: '', code: 401};
        }
      }

      setResult(" relevant document is no found in DB");
      return {dabId: null, retDoc: '', code: 1};
    } catch (error) {
      com.handleFrontendError(error)
      return {dabId: null, retDoc: '', code: 2};
    }
  }

  async function onSubmit(event) {
    event.preventDefault();
    try {
      let userId = APP_USER_ID;
      let nlInputText = nlInput;
      if(!nlInput || nlInputText.trim().length == 0) throw new Error("Enter a valid search text");
      let dbRespObj = await searchInVectorDb(userId, nlInputText);
      console.log("dbRespObj: "+dbRespObj.dabId+", "+dbRespObj.code);
      let dbResp = dbRespObj.retDoc;
      console.log("onSubmit.dbResp: "+JSON.stringify(dbResp || {}).substring(0, 100)+"...");
      let cause = '';
      if(dbRespObj.dabId) cause = "(dab "+dbRespObj.dabId+") ";
      if(dbRespObj.code != 401) {
        com.setPageStatus(" requesting AI...");
        const resp = await fetch("/api/openai", com.postOpt({ searchText: dbResp ? dbResp : nlInputText, APP_PWD }));
        com.setPageStatus(" got response from AI");
        const data = await resp.json();
        com.throwIfNeeded(resp, data);
        com.setPageStatus((dbResp ? "FROM DB "+cause+", PROCESSED BY AI:  " : "NOT FROM DB, PURE AI RESPONSE:  ")+data.result);
        // setNlInput("");
      } else {
        com.setPageStatus('You are not licensed for observing the data '+cause+'you search');
      }
    } catch(error) {
      com.handleFrontendError(error)
    }
  }

  return (
    <div>
      <main className={styles.main}>
        <h4>Search</h4>
        <center><div><b>Me:</b> {APP_USER_ID}</div></center>
        <form onSubmit={onSubmit}>
          <textarea
            type="text"
            name="Question"
            placeholder="Enter your question"
            value={nlInput}
            onChange={(e) => setNlInput(e.target.value)}
          />
          <input type="submit" value="Generate answer" />
        </form>
        <center><div id={"page_status"} className={styles.result}>Status: {result}</div></center>
      </main>
    </div>
  );
}