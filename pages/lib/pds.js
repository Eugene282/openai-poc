import com from "./commons";

async function isLicensed(userId, dabId) {
  try {
    console.log("Checking license for dab: "+dabId+"...");
    // req: https://acceptance.dase.io:8081/api/deals?userId=0x003e8c791cb39b4cad756b9c25431d6eb3fed85c&tradeType=BUY&dabId=3767
    const resp = await fetch("/api/pds", com.postOpt({url: "/deals?userId="+userId+"&tradeType=BUY&dabId="+dabId, APP_PWD }));
    console.log("Got response from PDS");
    const data = await resp.json();
    com.throwIfNeeded(resp, data);
    // data.result:
    // {
    //   "totalCount": 1,
    //   "deals": [
    //     {
    //       "assetId": 3767,
    //       "licenseType": "OWNERSHIP",
    //       "buyerId": "0x003e8C791cb39b4CAD756b9C25431D6eb3Fed85c",
    //       "sellerId": "0x0000000000000000000000000000000000000000",
    //       "dateTime": "2022-07-19T03:29:16.000Z",
    //       "relatedDabId": "0",
    //       "sellOfferId": "4145",
    //       "buyOfferId": "4095",
    //       "stateBits": "1",
    //       "sellerReceivedValue": "0",
    //       "buyerSpentValue": "0",
    //       "dealRevokeValue": "0"
    //     }
    //   ]
    // }
    if(data) {
      let l = data.result;
      console.log("pds.response:"+JSON.stringify(l));
      return (l && l.deals && l.deals.length > 0 && l.deals[0].buyerId.toLowerCase() === (''+userId).toLowerCase());
    } else return false;
  } catch (error) {
    console.error("pdsErr: "+(error ? JSON.stringify(error) : error));
    alert(error.message);
    return false;
  }
}

async function callPds(status, url, opt, APP_PWD, routingCmd) {
  com.setPageStatus(status);
  let postBody = com.postOpt({url, opt, APP_PWD, routingCmd});
  console.log("callPds.postBody: "+JSON.stringify(postBody));
  let resp = await fetch("/api/pds", postBody);
  let data = resp && resp.ok ? await resp.json() : {};
  data = data ? data.result : {};
  console.log("callPds.data: "+JSON.stringify(data));
  com.throwIfNeeded(resp, data)
  return data;
}


export default {
    isLicensed,
    callPds
}

// var IncomingMessage = {
//   url: '/api/pds',
//   method: 'POST',
//   statusCode: null,
//   statusMessage: null,
//   client: {
//     _httpMessage: {
//       setHeader: [], statusCode: 200, flush: [],
//     },
//   },
//   query: {},
//   body: {
//     url: '/offers?userId=0x003e8c791cb39b4cad756b9c25431d6eb3fed85c&dabType=ASSET&tradeType=SELL&offerDirectionType=IN&limit=1&offset=1000000',
//     opt: null,
//     APP_PWD: '123'
//   }
// }
