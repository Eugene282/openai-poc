
function postOpt(body) {
  return {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(body)
  };
}

function throwIfNeeded(fetch_resp, data) {
  if (fetch_resp.status !== 200) {
    data = data && data.result && !data.error ? data.result : data;
    if(data && data.error) throw data.error;
    else throw new Error(`Request failed with status ${fetch_resp.status}`);
  }
}

function setPageStatus(text) {
  console.log(text);
  let elem = document.getElementById("page_status");
  if(elem) elem.innerHTML = text;
}

function handleFrontendError(error) {
    console.error("pdsErr: "+(error ? JSON.stringify(error) : error));
    setPageStatus("Status: "+error.message);
    // alert(error.message);
}

export default {
    postOpt,
    throwIfNeeded,
    setPageStatus,
    handleFrontendError
}