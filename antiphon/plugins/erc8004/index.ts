import { elizaLogger } from "@elizaos/core";
import type { Address } from "viem";
import { baseSepolia } from "viem/chains";
import { WalletService } from "../../shared/blockchain/index.js";
import type { ActionHandlerCallback, ActionHandlerState } from "../../index.js";

export interface ERC8004Config {
  identityRegistryAddress: string;
  reputationRegistryAddress: string;
  rpcUrl: string;
  privateKey: string;
}

export function getERC8004Actions(config: ERC8004Config | null) {
  const walletService = config ? new WalletService(config.rpcUrl) : null;

  return {
    AGENT_REGISTER: {
      name: 'AGENT_REGISTER',
      description: 'Register agent in ERC-8004 AgentIdentityRegistry with agent card CID',
      similes: ['register', 'enroll'],
      validate: async () => true,
      handler: async (
        _runtime: unknown,
        _message: unknown,
        state: ActionHandlerState,
        _options: unknown,
        callback: ActionHandlerCallback
      ) => {
        if (!config || !walletService) {
          await callback?.({ text: "ERC-8004 not configured. Set BASE_RPC_URL and contract addresses." });
          return;
        }

        const agentCardCID = state.data?.agentCardCID as string;
        if (!agentCardCID) {
          await callback?.({ text: "Agent card CID not found. Upload agent card to Storacha first." });
          return;
        }

        try {
          const publicClient = walletService.createPublicClient();
          const walletClient = walletService.createWalletClient(config.privateKey);
          const account = walletService.getAccount(config.privateKey);

          await callback?.({ text: `Registering agent on ERC-8004 IdentityRegistry with CID: ${agentCardCID}...` });

          const abi = [
            {
              name: "registerAgent",
              type: "function",
              stateMutability: "nonpayable",
              inputs: [{ name: "agentCardCID", type: "string" }],
              outputs: [],
            },
          ] as const;

          const hash = await walletClient.writeContract({
            chain: baseSepolia,
            address: config.identityRegistryAddress as Address,
            abi,
            functionName: "registerAgent",
            args: [agentCardCID],
            account,
          });

          await callback?.({ text: `Transaction submitted: ${hash}. Waiting for confirmation...` });

          const receipt = await publicClient.waitForTransactionReceipt({ hash });
          await callback?.({ text: `Agent registered successfully! Transaction: ${receipt.transactionHash}` });
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error);
          elizaLogger.error("ERC-8004 registration error:", error);
          await callback?.({ text: `Registration failed: ${msg}` });
        }
      },
    },

    AGENT_DISCOVER: {
      name: 'AGENT_DISCOVER',
      description: 'Query ERC-8004 AgentIdentityRegistry to find service providers by capability tags',
      similes: ['discover', 'find', 'search'],
      validate: async () => true,
      handler: async (
        _runtime: unknown,
        _message: unknown,
        state: ActionHandlerState,
        _options: unknown,
        callback: ActionHandlerCallback
      ) => {
        if (!config || !walletService) {
          await callback?.({ text: "ERC-8004 not configured." });
          return;
        }

        const capabilities = (state.recentMessagesData
          ?.find((m) => m.content?.text?.includes('csv') || m.content?.text?.includes('analyze'))
          ?.content?.text || 'csv-analysis').toLowerCase();

        try {
          const publicClient = walletService.createPublicClient();

          await callback?.({ text: `Querying ERC-8004 registry for capabilities: ${capabilities}...` });

          const abi = [
            {
              name: "discoverAgents",
              type: "function",
              stateMutability: "view",
              inputs: [{ name: "capabilityTags", type: "string[]" }],
              outputs: [
                { name: "", type: "address[]" },
                { name: "", type: "string[]" },
              ],
            },
          ] as const;

          const tags = capabilities.split(/[,\s]+/).filter(Boolean);
          const result = await publicClient.readContract({
            address: config.identityRegistryAddress as Address,
            abi,
            functionName: "discoverAgents",
            args: [tags],
          });

          const [addresses, cids] = result;

          if (addresses.length === 0) {
            await callback?.({ text: "No matching agents found." });
            return;
          }

          const agents = addresses.map((addr, i) => ({
            address: addr,
            agentCardCID: cids[i] || ""
          }));

          await callback?.({
            text: `Found ${agents.length} matching agent(s). Fetching reputation scores...`
          });

          const reputationAbi = [
            {
              name: "getReputationScore",
              type: "function",
              stateMutability: "view",
              inputs: [{ name: "agent", type: "address" }],
              outputs: [
                { name: "score", type: "uint256" },
                { name: "totalRatings", type: "uint256" },
              ],
            },
          ] as const;

          const agentsWithReputation = await Promise.all(
            agents.map(async (agent) => {
              try {
                const [score, totalRatings] = await publicClient.readContract({
                  address: config.reputationRegistryAddress as Address,
                  abi: reputationAbi,
                  functionName: "getReputationScore",
                  args: [agent.address as Address],
                });
                return {
                  ...agent,
                  reputation: Number(score) / 100,
                  totalRatings: Number(totalRatings)
                };
              } catch {
                return { ...agent, reputation: 0, totalRatings: 0 };
              }
            })
          );

          const bestAgent = agentsWithReputation.sort((a, b) => b.reputation - a.reputation)[0];

          if (!bestAgent) {
            await callback?.({ text: "No agents found after reputation filtering." });
            return;
          }

          await callback?.({
            text: `Selected agent: ${bestAgent.address} (Reputation: ${bestAgent.reputation}/5, Ratings: ${bestAgent.totalRatings}). Agent card CID: ${bestAgent.agentCardCID}`
          });

          state.data = { ...(state.data || {}), selectedAgent: bestAgent };
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error);
          elizaLogger.error("ERC-8004 discovery error:", error);
          await callback?.({ text: `Discovery failed: ${msg}` });
        }
      },
    },

    REPUTATION_POST: {
      name: 'REPUTATION_POST',
      description: 'Post reputation feedback to AgentReputationRegistry after task completion',
      similes: ['feedback', 'rate', 'review'],
      validate: async () => true,
      handler: async (
        _runtime: unknown,
        _message: unknown,
        state: ActionHandlerState,
        _options: unknown,
        callback: ActionHandlerCallback
      ) => {
        if (!config || !walletService) {
          await callback?.({ text: "ERC-8004 not configured." });
          return;
        }

        const targetAgent = state.data?.selectedAgent?.address as string;
        const rating = (state.data?.rating as number) || 5;
        const comment = (state.data?.comment as string) || "Excellent service";
        const proofCID = (state.data?.resultCID as string) || "";

        if (!targetAgent) {
          await callback?.({ text: "No target agent specified for reputation feedback." });
          return;
        }

        try {
          const publicClient = walletService.createPublicClient();
          const walletClient = walletService.createWalletClient(config.privateKey);
          const account = walletService.getAccount(config.privateKey);

          await callback?.({ text: `Posting reputation feedback for ${targetAgent}...` });

          const abi = [
            {
              name: "postReputation",
              type: "function",
              stateMutability: "nonpayable",
              inputs: [
                { name: "targetAgent", type: "address" },
                { name: "rating", type: "uint8" },
                { name: "comment", type: "string" },
                { name: "proofCID", type: "string" },
              ],
              outputs: [],
            },
          ] as const;

          const hash = await walletClient.writeContract({
            chain: baseSepolia,
            address: config.reputationRegistryAddress as Address,
            abi,
            functionName: "postReputation",
            args: [targetAgent as Address, rating, comment, proofCID],
            account,
          });

          await callback?.({ text: `Reputation feedback submitted: ${hash}` });

          const receipt = await publicClient.waitForTransactionReceipt({ hash });
          await callback?.({ text: `Feedback posted successfully! Transaction: ${receipt.transactionHash}` });
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error);
          elizaLogger.error("ERC-8004 reputation post error:", error);
          await callback?.({ text: `Reputation post failed: ${msg}` });
        }
      },
    },

    REPUTATION_QUERY: {
      name: 'REPUTATION_QUERY',
      description: 'Query agent reputation scores from AgentReputationRegistry',
      similes: ['check reputation', 'query rating'],
      validate: async () => true,
      handler: async (
        _runtime: unknown,
        _message: unknown,
        state: ActionHandlerState,
        _options: unknown,
        callback: ActionHandlerCallback
      ) => {
        if (!config || !walletService) {
          await callback?.({ text: "ERC-8004 not configured." });
          return;
        }

        const agentAddress = state.data?.selectedAgent?.address as string;
        if (!agentAddress) {
          await callback?.({ text: "No agent address specified." });
          return;
        }

        try {
          const publicClient = walletService.createPublicClient();

          const abi = [
            {
              name: "getReputationScore",
              type: "function",
              stateMutability: "view",
              inputs: [{ name: "agent", type: "address" }],
              outputs: [
                { name: "score", type: "uint256" },
                { name: "totalRatings", type: "uint256" },
              ],
            },
            {
              name: "getRecentRatings",
              type: "function",
              stateMutability: "view",
              inputs: [
                { name: "agent", type: "address" },
                { name: "limit", type: "uint256" },
              ],
              outputs: [
                {
                  name: "",
                  type: "tuple[]",
                  components: [
                    { name: "rating", type: "uint8" },
                    { name: "comment", type: "string" },
                    { name: "proofCID", type: "string" },
                    { name: "timestamp", type: "uint256" },
                  ],
                },
              ],
            },
          ] as const;

          const [score, totalRatings] = await publicClient.readContract({
            address: config.reputationRegistryAddress as Address,
            abi,
            functionName: "getReputationScore",
            args: [agentAddress as Address],
          });

          const recentRatings = await publicClient.readContract({
            address: config.reputationRegistryAddress as Address,
            abi,
            functionName: "getRecentRatings",
            args: [agentAddress as Address, 5n],
          });

          const reputation = Number(score) / 100;

          await callback?.({
            text: `Reputation for ${agentAddress}: ${reputation}/5 (${totalRatings} ratings). Recent feedback: ${recentRatings.length} entries.`
          });
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error);
          elizaLogger.error("ERC-8004 reputation query error:", error);
          await callback?.({ text: `Reputation query failed: ${msg}` });
        }
      },
    },
  };
}
