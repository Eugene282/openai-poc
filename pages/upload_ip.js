import { useState } from "react";
import styles from "./index.module.css";

export default function Upload(props) {
  const [result, setResult]   = useState("No action yet");
  const [image, setImage]     = useState(null);

  const {APP_USER_ID, APP_USER_KEY, APP_PWD} = props;

  const prepareForUpload = (event) => {
    if (event.target.files && event.target.files[0])
      setImage(event.target.files[0]);
  };

  const uploadToServer = async (event) => {
    setResult("Uploading with the IP Space Protection...");
    console.log(JSON.stringify(props));
    const body = new FormData();
    body.append("file", image);
    let apiPath = "/api/file_ip?APP_USER_ID="+APP_USER_ID+"&APP_USER_KEY="+APP_USER_KEY+"&APP_PWD="+APP_PWD;
    const resp = await fetch(apiPath, { method: "POST", body });
    let msg = await resp.text();
    if(resp.ok) {
      setResult("The file is uploaded and registered with dabId="+msg);
    } else {
      let errMsg = "An error happened while uploading or registering file: " + msg;
      setResult(errMsg);
      alert(errMsg);
    }
  };

  return (
      <div>
        <main className={styles.main}>
          <h4>Secure Upload</h4>
          <center><div><b>Me:</b> {APP_USER_ID}</div></center>
          <div>
            <input type="file" name="myImage" onChange={prepareForUpload} />
            <input type="submit" onClick={uploadToServer} value="Upload" />
          </div>
          <center><div className={styles.result}>Status: {result}</div></center>
        </main>
      </div>
  );
}