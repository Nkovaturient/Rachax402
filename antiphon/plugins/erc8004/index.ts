/**
 * ERC-8004 Actions - UPDATED with Correct ABIs
 * Uses deployed contracts on Base Sepolia
 */

import { elizaLogger } from "@elizaos/core";
import type { Address } from "viem";
import { baseSepolia } from "viem/chains";
import { WalletService } from "../../shared/blockchain/index.js";
import type { ActionHandlerCallback, ActionHandlerState } from "../../index.js";
import { AgentIdentityABI } from "../ABI/AgentIdentityABI.js";
import { AgentReputationABI } from "../ABI/AgentReputationABI.js";

/**
 * Configuration for ERC-8004 contracts
 * These addresses are on Base Sepolia testnet
 */
export interface ERC8004Config {
  identityRegistryAddress: string;  // 0x1352abA587fFbbC398d7ecAEA31e2948D3aFE4Fb
  reputationRegistryAddress: string; // 0x3FdD300147940a35F32AdF6De36b3358DA682B5c
  rpcUrl: string;
  privateKey: string;
}

export function getERC8004Actions(config: ERC8004Config | null) {
  const walletService = config ? new WalletService(config.rpcUrl) : null;

  return {
    /**
     * Register Agent B on-chain
     */
    AGENT_REGISTER: {
      name: 'AGENT_REGISTER',
      description: 'Register agent in ERC-8004 AgentIdentityRegistry with capabilities',
      similes: ['register', 'enroll', 'sign up'],
      validate: async () => true,
      handler: async (
        _runtime: unknown,
        _message: unknown,
        state: ActionHandlerState,
        _options: unknown,
        callback: ActionHandlerCallback
      ) => {
        if (!config || !walletService) {
          await callback?.({ text: "ERC-8004 not configured. Check .env file." });
          return;
        }

        const agentCardCID = state.data?.agentCardCID as string;
        const capabilities = state.data?.capabilities as string[] || [
          "DataAnalyzer",
          "csv-analysis",
          "statistics",
          "data-transformation"
        ];

        if (!agentCardCID) {
          await callback?.({ text: "Agent card CID not found. Upload agent metadata to Storacha first." });
          return;
        }

        try {
          const publicClient = walletService.createPublicClient();
          const walletClient = walletService.createWalletClient(config.privateKey);
          const account = walletService.getAccount(config.privateKey);

          await callback?.({
            text: `Registering agent with capabilities: ${capabilities.join(', ')}...`
          });

          const hash = await walletClient.writeContract({
            chain: baseSepolia,
            address: config.identityRegistryAddress as Address,
            abi: AgentIdentityABI,
            functionName: "registerAgent",
            args: [agentCardCID, capabilities],
            account,
          });

          await callback?.({
            text: `Transaction submitted: ${hash}\nWaiting for confirmation...`
          });

          const receipt = await publicClient.waitForTransactionReceipt({ hash });

          await callback?.({
            text: `✅ Agent registered successfully!\nTransaction: ${receipt.transactionHash}\nYou can now be discovered by other agents.`
          });
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error);
          elizaLogger.error("ERC-8004 registration error:", error);
          await callback?.({ text: `Registration failed: ${msg}` });
        }
      },
    },


    /**
     * Discover Agent B by querying the registry
     * Agent A calls this to find providers
     */
    AGENT_DISCOVER: {
      name: 'AGENT_DISCOVER',
      description: 'Find service providers by capability (e.g., csv-analysis)',
      similes: ['discover', 'find', 'search', 'locate'],
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

        // Determine capability tags from user message or state
        const userMessage = state.recentMessagesData
          ?.find((m) => m.content?.text)
          ?.content?.text || '';

        let capabilityTags: string[];
        if (userMessage.includes('csv') || userMessage.includes('analyze')) {
          capabilityTags = ['csv-analysis', 'DataAnalyzer', 'data-transformation'];
        } else if (userMessage.includes('store') || userMessage.includes('storage')) {
          capabilityTags = ['file-storage', 'Storacha', 'ipfs', 'decentralized-storage'];
        } else {
          capabilityTags = ['csv-analysis', 'DataAnalyzer', 'data-transformation']; // Default
        }

        try {
          const publicClient = walletService.createPublicClient();

          await callback?.({
            text: `🔍 Searching for agents with capabilities: ${capabilityTags.join(', ')}...`
          });

          // Query the blockchain
          const result = await publicClient.readContract({
            address: config.identityRegistryAddress as Address,
            abi: AgentIdentityABI,
            functionName: "discoverAgents",
            args: [capabilityTags, 0n, 10n], // Get first 10 results
          });

          const [agentAddresses, totalCount] = result;

          if (agentAddresses.length === 0) {
            await callback?.({
              text: `❌ No agents found with capabilities: ${capabilityTags.join(', ')}.\n\n` +
                `Make sure services are registered on-chain.\n`
            });
            return;
          }

          await callback?.({
            text: `✅ Found ${agentAddresses.length} agent(s) (${totalCount} total).\n⭐ Checking reputation scores...`
          });

          // Get details for each agent
          const agentsWithDetails = await Promise.all(
            agentAddresses.map(async (agentAddress: Address) => {
              try {
                const agentCardCID = await publicClient.readContract({
                  address: config.identityRegistryAddress as Address,
                  abi: AgentIdentityABI,
                  functionName: "getAgentCard",
                  args: [agentAddress],
                });

                // Get reputation score
                const [score, totalRatings] = await publicClient.readContract({
                  address: config.reputationRegistryAddress as Address,
                  abi: AgentReputationABI,
                  functionName: "getReputationScore",
                  args: [agentAddress],
                });

                // Score is multiplied by 100 in the contract (480 = 4.8/5)
                const reputation = Number(score) / 100;

                return {
                  address: agentAddress,
                  agentCardCID,
                  reputation,
                  totalRatings: Number(totalRatings)
                };
              } catch (err) {
                elizaLogger.warn(`Failed to get details for agent ${agentAddress}:`, err);
                return null;
              }
            })
          );

          // Filter out failed fetches and sort by reputation
          const validAgents = agentsWithDetails
            .filter((a: { reputation: number; totalRatings: number; agentCardCID: string; address: Address }) => a !== null)
            .sort((a: { reputation: number; totalRatings: number; agentCardCID: string; address: Address }, b: { reputation: number; totalRatings: number; agentCardCID: string; address: Address }) => b!.reputation - a!.reputation);

          if (validAgents.length === 0) {
            await callback?.({ text: "Found agents but couldn't fetch their details." });
            return;
          }

          const topAgent = validAgents[0] as { reputation: number; totalRatings: number; agentCardCID: string; address: Address };

          await callback?.({
            text: `🏆 Selected top agent:\n` +
              `• Address: ${topAgent.address.slice(0, 10)}...${topAgent.address.slice(-8)}\n` +
              `• Reputation: ${topAgent.reputation}/5 ⭐ (${topAgent.totalRatings} ratings)\n` +
              `• Agent Card: ${topAgent.agentCardCID.slice(0, 15)}...\n\n` +
              `📡 Fetching service details from IPFS...`
          });

          // fetch the agent card from Storacha
          let providerEndpoint: string;
          let pricing: any;
          let agentName: string = "Third Party Service";

          try {
            const agentCardResponse = await fetch(`https://w3s.link/ipfs/${topAgent.agentCardCID}`);

            if (!agentCardResponse.ok) {
              throw new Error(`HTTP ${agentCardResponse.status}: ${agentCardResponse.statusText}`);
            }

            const agentCard = await agentCardResponse.json();
            providerEndpoint = agentCard.endpoint;
            pricing = agentCard.pricing;
            agentName = agentCard.name || "Third Party Service";

            await callback?.({
              text: `✅ Service details retrieved:\n` +
                `• Service: ${agentName}\n` +
                `• Endpoint: ${providerEndpoint}\n` +
                `• Price: ${pricing.baseRate || pricing.upload} ${pricing.currency}\n` +
                `• Network: ${pricing.network}`
            });
          } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            elizaLogger.warn(`Failed to fetch agent card from Storacha: ${msg}`);

            // Fallback to known endpoints if fetch fails
            providerEndpoint = capabilityTags.includes('DataAnalyzer')
              ? "http://localhost:8001/analyze"
              : "http://localhost:8000/upload";

            await callback?.({
              text: `⚠️  Agent card fetch failed. Using fallback endpoint: ${providerEndpoint}\n` +
                `Error: ${msg}`
            });
          }

          state.data = {
            ...(state.data || {}),
            selectedAgent: topAgent,
            providerEndpoint,
            pricing,
            agentName
          };

          await callback?.({
            text: `🚀 Ready to send task to: ${providerEndpoint}`
          });

        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error);
          elizaLogger.error("ERC-8004 discovery error:", error);
          await callback?.({ text: `❌ Discovery failed: ${msg}` });
        }
      },
    },

    /**
     * Post reputation feedback after task completion
     * Agent A calls this after receiving results
     */
    REPUTATION_POST: {
      name: 'REPUTATION_POST',
      description: 'Post reputation feedback after task completion',
      similes: ['feedback', 'rate', 'review', 'score'],
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
          await callback?.({ text: "No agent specified for feedback." });
          return;
        }

        if (rating < 1 || rating > 5) {
          await callback?.({ text: "Rating must be between 1 and 5 stars." });
          return;
        }

        try {
          const publicClient = walletService.createPublicClient();
          const walletClient = walletService.createWalletClient(config.privateKey);
          const account = walletService.getAccount(config.privateKey);

          await callback?.({
            text: `⭐ Posting ${rating}/5 star rating for agent ${targetAgent.slice(0, 10)}...`
          });

          const hash = await walletClient.writeContract({
            chain: baseSepolia,
            address: config.reputationRegistryAddress as Address,
            abi: AgentReputationABI,
            functionName: "postReputation",
            args: [targetAgent as Address, rating, comment, proofCID],
            account,
          });

          await callback?.({ text: `📝 Reputation submitted: ${hash}` });

          const receipt = await publicClient.waitForTransactionReceipt({ hash });

          await callback?.({
            text: `✅ Feedback posted on-chain!\n` +
              `• Rating: ${rating}/5 ⭐\n` +
              `• Comment: "${comment}"\n` +
              `• Transaction: ${receipt.transactionHash}`
          });
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error);
          elizaLogger.error("Reputation post error:", error);
          await callback?.({ text: `Failed to post reputation: ${msg}` });
        }
      },
    },

    /**
     * Query reputation before selecting an agent
     */
    REPUTATION_QUERY: {
      name: 'REPUTATION_QUERY',
      description: 'Check agent reputation scores and recent ratings',
      similes: ['check reputation', 'query rating', 'check reviews'],
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

          const [score, totalRatings] = await publicClient.readContract({
            address: config.reputationRegistryAddress as Address,
            abi: AgentReputationABI,
            functionName: "getReputationScore",
            args: [agentAddress as Address],
          });

          const reputation = Number(score) / 100;

          const recentRatings = await publicClient.readContract({
            address: config.reputationRegistryAddress as Address,
            abi: AgentReputationABI,
            functionName: "getRecentRatings",
            args: [agentAddress as Address, 5n],
          });

          let feedbackText = `⭐ Reputation for ${agentAddress.slice(0, 10)}...${agentAddress.slice(-8)}:\n`;
          feedbackText += `• Score: ${reputation}/5 ⭐ (${totalRatings} ratings)\n\n`;

          if (recentRatings.length > 0) {
            feedbackText += `📋 Recent Feedback:\n`;
            recentRatings.forEach((rating, i) => {
              const date = new Date(Number(rating.timestamp) * 1000).toLocaleDateString();
              feedbackText += `${i + 1}. ${rating.rating}/5 - "${rating.comment}" (${date})\n`;
            });
          } else {
            feedbackText += `No ratings yet.`;
          }

          await callback?.({ text: feedbackText });

        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error);
          elizaLogger.error("Reputation query error:", error);
          await callback?.({ text: `Failed to query reputation: ${msg}` });
        }
      },
    },
  };
}