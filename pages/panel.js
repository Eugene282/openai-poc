import { useState } from "react";
import styles from "./index.module.css";
import Upload from "./upload"
import UploadIP from "./upload_ip"
import Trade from "./trade"
import Search from "./search"

export default function Panel(props) {
  const [pad, setPad] = useState(<Upload {...props}/>);

  return (
    <div>
      <main className={styles.main}>
        <div>
        <a onClick={(e) => {setPad(<Upload   {...props} />)}}>Upload</a>
        <a onClick={(e) => {setPad(<UploadIP {...props} />)}}>Secure Upload</a>
        <a onClick={(e) => {setPad(<Trade    {...props} />)}}>Trade</a>
        <a onClick={(e) => {setPad(<Search   {...props} />)}}>Search</a>
        </div>
        <div>{pad}</div>
      </main>
    </div>
  );
}