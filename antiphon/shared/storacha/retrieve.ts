/**THIs may not be needed for a while,  implementing here for frontend setup feasibility as we proceed */

import { elizaLogger, HandlerCallback, Memory, State } from "@elizaos/core";

export async function retrieveData( message: Memory, state : State, callback : HandlerCallback, storageClient: any){
  const ipfsLink = message.content.text.match(/https:\/\/[^ ]+\.ipfs\.w3s\.link\/?/i);
  if (!ipfsLink) {
    await callback?.({ text: "couldn't find a valid CID link in your message. Could you try again?" });
    return;
  }

  const link = ipfsLink?.[0];
  const cid = link.match(/^https:\/\/([^.]+)\.ipfs\.w3s\.link/)[1];
  const username = state?.actorsData?.[0]?.username || 'agentA';
  const gatewayUrl = storageClient?.config?.GATEWAY_URL || "https://w3s.link";

  try {
    const response = await fetch(`${gatewayUrl}/ipfs/${cid}/${username}- Data.json `);
    if (!response.ok) {
      await callback?.({ text: `Couldn’t fetch the data from CID. Status: ${response.statusText}` });
      return;
    }
    
    const data = await response.text();
    
    /**
     * IMPLEMENT RETRIEVE DATA LOGIC HERE
     */

  } catch (error) {
    await callback?.({ text: "Error retrieving the data." });
    elizaLogger.error("retrieve Data error:", error);
  }
}