import { useState } from "react";
import styles from "./index.module.css";
import com from "./lib/commons";
import libPds from "./lib/pds";

const price = 5000;
const MAX_OFFSET = 1000000;

export default function Trade(props) {
  const {APP_PWD, APP_USER_ID, APP_USER_KEY} = props;
  const [incomeOfferPrice, setIncomeOfferPrice]   = useState(0);
  const [dabIdToBuy, setDabIdToBuy] = useState("");
  const [dabIdToSell, setDabIdToSell] = useState("");
  const [dabDescrToSell, setDabDescrToSell] = useState("");
  const [buyerIdInput, setBuyerIdInput] = useState("");

  getMyDabs();
  getOffersToMe();

  async function getMyDabs() {
    try {
      let dealsUrl = "/deals?userId="+APP_USER_ID+"&dabType=ASSET&tradeType=BUY&licenseType=OWNERSHIP&limit=1&offset=";
      let data = await libPds.callPds("Requesting my licenses count from PDS...", dealsUrl+MAX_OFFSET, null, APP_PWD);
      if(data.totalCount > 0) 
        data = await libPds.callPds("Requesting my latest license from PDS...", dealsUrl+(+data.totalCount-1), null, APP_PWD);
      else data = {};
      let dabId = 0;
      // {
      //   "totalCount": 1,
      //   "deals": [
      //     {
      //       "assetId": 3767,
      //       "licenseType": "OWNERSHIP",
      //       "buyerId": "0x003e8C791cb39b4CAD756b9C25431D6eb3Fed85c",
      //       "sellerId": "0x0000000000000000000000000000000000000000",
      //       "dateTime": "2022-07-19T03:29:16.000Z",
      //       ...
      //     }
      if(data.deals && data.deals.length > 0) {
        console.log("DEALS: "+JSON.stringify(data));
        com.setPageStatus("Licenses have been obtained");
        dabId = data.deals[0].assetId;
        setDabIdToSell(dabId);
      }

      data = await libPds.callPds("Requesting my DABs from PDS ...", "/assets?assetIds="+dabId, null, APP_PWD);
      // [
      //   {
      //     "assetId": 2234,
      //     "ownerId": "0x3adf478c252011011b5212c1afeb496ad7477cb1",
      //     "description": "Hand Rash (Propranolol)",
      //     "createdAt": "2022-11-11T19:06:42.000Z",
      //     ...
      if(data && data.length > 0) {
        console.log("DABS: "+JSON.stringify(data));
        com.setPageStatus("DABS have been obtained");
        setDabDescrToSell(data[0].description);
      }
    } catch (error) {
      com.handleFrontendError(error);
    }
  }

  async function getOffersToMe() {
    try {
      let offersUrl = "/offers?userId="+APP_USER_ID+"&dabType=ASSET&tradeType=SELL&offerDirectionType=IN&limit=1&offset=";
      let data = await libPds.callPds("Requesting SELL-offers count to me from another accounts...", offersUrl+MAX_OFFSET, null, APP_PWD);
      if(data.totalCount > 0)
        data = await libPds.callPds("Requesting SELL-offer to me from another accounts...", offersUrl+(+data.totalCount-1), null, APP_PWD );
      else data = {};
      let dabId = 0;
      // {
      //   "totalCount": 0,
      //     "offers": []
      // }
      if(data.offers && data.offers.length > 0) {
        console.log("OFFERS: "+JSON.stringify(data));
        com.setPageStatus("Offers have been obtained");
        dabId = data.offers[0].assetId;
        setIncomeOfferPrice(data.offers[0].sellerMinPrice);
        setDabIdToBuy(dabId);
      }
    } catch (error) {
      com.handleFrontendError(error);
    }
  }

  async function onSubmitSell(event) {
    event.preventDefault();
    try {
      let opt = {
          tradeType: "SELL",
          licenseType: "ACCESS",
          sellerId: APP_USER_ID,
          sellerCredentials: APP_USER_KEY,
          buyerId: document.getElementById("buyerIdInput").value,
          dabId: dabIdToSell,
          minLeosPrice: price
      };
      let data = await libPds.callPds("Sending SELL-offer...", "/offers/create", opt, APP_PWD);
      if(data.id == 201) {
        console.log("OFFER has been written: "+JSON.stringify(data));
        com.setPageStatus("Offer has been written successfully");
      }
    } catch(error) {
      com.handleFrontendError(error);
    }
  }

  async function onSubmitBuy(event) {
    event.preventDefault();
    try {
      let opt = {
          tradeType: "BUY",
          licenseType: "ACCESS",
          buyerId: APP_USER_ID,
          buyerCredentials: APP_USER_KEY,
          dabId: dabIdToBuy,
          maxLeosPrice: price
      };
      let data = await libPds.callPds("Sending BUY-offer...", "/offers/create", opt, APP_PWD);
      if(data.id == 202) {
        console.log("DEAL has been completed: "+JSON.stringify(data));
        com.setPageStatus("Deal has been completed successfully");
      }
    } catch(error) {
      com.handleFrontendError(error);
    }
  }

  async function onSubmitBuyIP(event) {
    event.preventDefault();
    try {
      let opt = {
          tradeType: "BUY",
          licenseType: "TAGFORDABS",
          buyerId: APP_USER_ID,
          buyerCredentials: APP_USER_KEY,
          tagId: 9071,
          maxLeosPrice: 1000
      };
      let data = await libPds.callPds("Sending BUY-offer...", "/offers/create", opt, APP_PWD);
      console.log("onSubmitIP.data:"+data);
      if(data.id == 202) {
        opt = {
          userId: APP_USER_ID,
          userCredentials: APP_USER_KEY,
          licenseType: "TAGFORDABS",
          fromTagId: 9071,
          toDabId: dabIdToSell
        };
        let data = await libPds.callPds("Sending BUY-offer...", "/tags/mark", opt, APP_PWD);
        console.log("onSubmitIP.{data}: %o", {data});
        if(data) com.setPageStatus("Deal has been completed successfully");
        else com.setPageStatus("Deal has not been completed successfully");
      } else com.setPageStatus("Deal has not been completed successfully");
    } catch(error) {
      com.handleFrontendError(error);
    }
  }

  return (
    <div>
      <main className={styles.main}>
        <h4>Trade</h4>
        <center>
        {/*<div><b>Me:</b> {APP_USER_ID}</div>*/}
          <center><div><b>Me:</b> {APP_USER_ID}</div></center>
          {/*<center><div><b>Me:</b> {APP_USER_ID.substring(0,12)+"..."+APP_USER_ID.substring(29)}</div></center>*/}
        <br/>
        <form onSubmit={onSubmitSell}>
          { (dabIdToSell ?
          <div>
          <div><b>My newest AI_Use_License to sell</b></div>
          <div>
            dabId: <b>{dabIdToSell}</b>, price: <b>{price}</b>
            <br/>descr: <i>{dabDescrToSell}</i>
            <br/><input id="buyerIdInput" type="text" placeholder="Type buyerId" defaultValue={buyerIdInput} />
            &nbsp;<input type="submit" value="Sell" />
          </div>
          </div>
          : <span/>) }
        </form>

        <form onSubmit={onSubmitBuyIP}>
          { (dabIdToSell ?
          <div>
          <div><b>IP_Space_Protection_License to buy</b></div>
          <div>
            For dabId: <b>{dabIdToSell}</b>, price: <b>{1000}</b>
            &nbsp;<input type="submit" value="Buy" />
          </div>
          </div>
          : <span/>) }
        </form>

        <span/>

        { (dabIdToBuy ?
        <form onSubmit={onSubmitBuy}>
          <br/>
          <div><b>My latest licenses offers to buy</b></div>
          <div>
            dabId: <b>{dabIdToBuy}</b>, lic: {"AI_Use_License"}, price: <b>{incomeOfferPrice}</b>
          &nbsp;<input type="submit" value="Buy" />
          </div>
        </form>
          : <span/>) }
        <center><div id={"page_status"} className={styles.result}>Status: No action yet</div></center>
        </center>
      </main>
    </div>
  );
}