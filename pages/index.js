import Head from "next/head";
import { useState } from "react";
import styles from "./index.module.css";
import Panel from "./panel";
import com from "./lib/commons"

export default function Home() {
  const [panel, setPanel] = useState(
    <div><form onSubmit={onSubmit}>
      <input id="APP_PWD" type="password" placeholder="Enter your password" defaultValue={""}/>
      <input id="APP_USER_ID" type="text" placeholder="Enter b/ch userId" defaultValue={""}/>
      <input id="APP_USER_KEY" type="password" placeholder="Enter your b/ch prv. key" defaultValue={""}/>
      <input type="submit" value="Start demo" />
    </form></div>
  );

  async function onSubmit(event) {
    event.preventDefault();
    try {
      let APP_PWD = document.getElementById("APP_PWD").value;
      let APP_USER_ID = document.getElementById("APP_USER_ID").value;
      let APP_USER_KEY = document.getElementById("APP_USER_KEY").value;
        const resp = await fetch("/api/password", com.postOpt({ APP_PWD }));
        const data = await resp.json();
        com.throwIfNeeded(resp, data);
        if(data.result === true)
          setPanel(<Panel APP_PWD={APP_PWD} APP_USER_ID={APP_USER_ID} APP_USER_KEY={APP_USER_KEY} />);
        else alert("Incorrect password. Try again");
    } catch(error) {
      console.error(error);
      alert(error.message);
    }
  }

  return (
    <div>
      <Head>
        <title>PDS OpenAI Demo</title>
        <link rel="icon" href="/artificial-intelligence-ai-icon.png" />
      </Head>

      <main className={styles.main}>
        <img src="/artificial-intelligence-ai-icon.png" className={styles.icon} />
        <h3>PDS OpenAI Demo</h3>
        <div>{panel}</div>
      </main>
    </div>
  );
}