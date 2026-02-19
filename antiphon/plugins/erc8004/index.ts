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
     * This happens ONCE when Agent B starts up for the first time
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

        // Agent card should contain: name, capabilities, pricing, endpoint
        const agentCardCID = state.data?.agentCardCID as string;
        const capabilities = state.data?.capabilities as string[] || [
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

          // Use the actual ABI from your deployed contract
          const hash = await walletClient.writeContract({
            chain: baseSepolia,
            address: config.identityRegistryAddress as Address,
            abi: AgentIdentityABI,
            functionName: "registerAgent",
            args: [agentCardCID, capabilities], // Your contract takes CID + capabilities array
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

        // Extract capabilities from user's message
        // "analyze CSV" -> ["csv-analysis"]
        const userMessage = state.recentMessagesData
          ?.find((m) => m.content?.text?.includes('csv') || m.content?.text?.includes('analyze'))
          ?.content?.text || '';
        
        const capabilityTags = userMessage.includes('csv') 
          ? ['csv-analysis'] 
          : ['data-transformation'];

        try {
          const publicClient = walletService.createPublicClient();

          await callback?.({ 
            text: `Searching for agents with capabilities: ${capabilityTags.join(', ')}...` 
          });

          // Query the contract using your actual ABI
          // Note: Your contract's discoverAgents takes (tags[], offset, limit)
          const result = await publicClient.readContract({
            address: config.identityRegistryAddress as Address,
            abi: AgentIdentityABI,
            functionName: "discoverAgents",
            args: [capabilityTags, 0n, 10n], // Get first 10 results
          });

          const [agentAddresses, totalCount] = result;

          if (agentAddresses.length === 0) {
            await callback?.({ 
              text: `No agents found with capabilities: ${capabilityTags.join(', ')}.\nMake sure Agent B is registered.` 
            });
            return;
          }

          await callback?.({
            text: `Found ${agentAddresses.length} agent(s) (${totalCount} total).\nChecking reputation scores...`
          });

          // For each discovered agent, get their reputation and agent card
          const agentsWithDetails = await Promise.all(
            agentAddresses.map(async (agentAddress) => {
              try {
                // Get agent card CID
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
            .filter(a => a !== null)
            .sort((a, b) => b!.reputation - a!.reputation);

          if (validAgents.length === 0) {
            await callback?.({ text: "Found agents but couldn't fetch their details." });
            return;
          }

          const topAgent = validAgents[0]!;

          await callback?.({
            text: `Selected top agent:\n` +
                  `Address: ${topAgent.address}\n` +
                  `Reputation: ${topAgent.reputation}/5 (${topAgent.totalRatings} ratings)\n` +
                  `Agent Card CID: ${topAgent.agentCardCID}\n\n` +
                  `Fetching endpoint from agent card...`
          });

          // In production, you'd fetch the agent card from Storacha using the CID
          // For now, we'll use the known endpoint
          const providerEndpoint = "http://localhost:8001/analyze";

          state.data = { 
            ...(state.data || {}), 
            selectedAgent: topAgent,
            providerEndpoint
          };

          await callback?.({
            text: `Ready to send task to: ${providerEndpoint}`
          });

        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error);
          elizaLogger.error("ERC-8004 discovery error:", error);
          await callback?.({ text: `Discovery failed: ${msg}` });
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
        const rating = (state.data?.rating as number) || 5; // 1-5 stars
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
            text: `Posting ${rating}/5 star rating for agent ${targetAgent}...` 
          });

          const hash = await walletClient.writeContract({
            chain: baseSepolia,
            address: config.reputationRegistryAddress as Address,
            abi: AgentReputationABI,
            functionName: "postReputation",
            args: [targetAgent as Address, rating, comment, proofCID],
            account,
          });

          await callback?.({ text: `Reputation submitted: ${hash}` });

          const receipt = await publicClient.waitForTransactionReceipt({ hash });
          
          await callback?.({ 
            text: `✅ Feedback posted on-chain!\n` +
                  `Rating: ${rating}/5\n` +
                  `Comment: "${comment}"\n` +
                  `Transaction: ${receipt.transactionHash}` 
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

          // Get overall score
          const [score, totalRatings] = await publicClient.readContract({
            address: config.reputationRegistryAddress as Address,
            abi: AgentReputationABI,
            functionName: "getReputationScore",
            args: [agentAddress as Address],
          });

          const reputation = Number(score) / 100;

          // Get recent ratings (last 5)
          const recentRatings = await publicClient.readContract({
            address: config.reputationRegistryAddress as Address,
            abi: AgentReputationABI,
            functionName: "getRecentRatings",
            args: [agentAddress as Address, 5n],
          });

          let feedbackText = `Reputation for ${agentAddress}:\n`;
          feedbackText += `Overall Score: ${reputation}/5 (${totalRatings} total ratings)\n\n`;
          
          if (recentRatings.length > 0) {
            feedbackText += `Recent Feedback:\n`;
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