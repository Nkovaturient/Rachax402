import { elizaLogger } from "@elizaos/core";
import type { Address } from "viem";
import { baseSepolia } from "viem/chains";
import { WalletService } from "../../shared/blockchain/index.js";
import type { ActionHandlerCallback, ActionHandlerState } from "../../index.js";
import { AgentIdentityABI } from "../ABI/AgentIdentityABI.js";
import { AgentReputationABI } from "../ABI/AgentReputationABI.js";

export interface ERC8004Config {
  identityRegistryAddress: string;
  reputationRegistryAddress: string;
  rpcUrl: string;
  privateKey: string;
}

interface ServiceRoute {
  capability: string;
  endpointSuffix: string;
  pricingKey: string;
}

export function resolveServiceRoute(intent: string): ServiceRoute {
  const t = intent.toLowerCase();

  if (t.includes('analyz') || t.includes('csv') || t.includes('statistics') || t.includes('data-transform')) {
    return { capability: 'csv-analysis', endpointSuffix: '/analyze', pricingKey: 'baseRate' };
  }

  if (t.includes('retrieve') || t.includes('fetch file') || t.includes('get file') || t.includes('download')) {
    return { capability: 'file-storage', endpointSuffix: '/retrieve', pricingKey: 'retrieve' };
  }

  return { capability: 'file-storage', endpointSuffix: '/upload', pricingKey: 'upload' };
}

export function getERC8004Actions(config: ERC8004Config | null) {
  const walletService = config ? new WalletService(config.rpcUrl) : null;

  return {
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
          "DataAnalyzer", "csv-analysis", "statistics", "data-transformation"
        ];

        if (!agentCardCID) {
          await callback?.({ text: "Agent card CID not found. Upload agent metadata to Storacha first." });
          return;
        }

        try {
          const publicClient = walletService.createPublicClient();
          const walletClient = walletService.createWalletClient(config.privateKey);
          const account = walletService.getAccount(config.privateKey);

          await callback?.({ text: `Registering agent with capabilities: ${capabilities.join(', ')}...` });

          const hash = await walletClient.writeContract({
            chain: baseSepolia,
            address: config.identityRegistryAddress as Address,
            abi: AgentIdentityABI,
            functionName: "registerAgent",
            args: [agentCardCID, capabilities],
            account,
          });

          await callback?.({ text: `Transaction submitted: ${hash}\nWaiting for confirmation...` });
          const receipt = await publicClient.waitForTransactionReceipt({ hash });
          await callback?.({ text: `Agent registered on-chain. Tx: ${receipt.transactionHash}` });
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error);
          elizaLogger.error("ERC-8004 registration error:", error);
          await callback?.({ text: `Registration failed: ${msg}` });
        }
      },
    },

    AGENT_DISCOVER: {
      name: 'AGENT_DISCOVER',
      description: 'Find service providers by capability via ERC-8004 on-chain registry',
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

        const userIntent = (state.data?.serviceIntent as string) ||
          state.recentMessagesData?.find((m) => m.content?.text)?.content?.text || 'csv-analysis';

        const route = resolveServiceRoute(userIntent);

        try {
          const publicClient = walletService.createPublicClient();

          await callback?.({ text: `Querying ERC-8004 for capability: ${route.capability}...` });

          const agentAddresses = await publicClient.readContract({
            address: config.identityRegistryAddress as Address,
            abi: AgentIdentityABI,
            functionName: "getAgentsByCapability",
            args: [route.capability],
          }) as Address[];

          if (!agentAddresses || agentAddresses.length === 0) {
            const [discoveredAddrs] = await publicClient.readContract({
              address: config.identityRegistryAddress as Address,
              abi: AgentIdentityABI,
              functionName: "discoverAgents",
              args: [[route.capability], 0n, 10n],
            }) as [Address[], bigint];

            if (!discoveredAddrs || discoveredAddrs.length === 0) {
              await callback?.({ text: `No agents found for capability: ${route.capability}` });
              return;
            }
            agentAddresses.push(...discoveredAddrs);
          }

          await callback?.({ text: `Found ${agentAddresses.length} agent(s). Checking reputation...` });

          const agentsWithDetails = await Promise.all(
            agentAddresses.map(async (addr: Address) => {
              try {
                const agentCardCID = await publicClient.readContract({
                  address: config.identityRegistryAddress as Address,
                  abi: AgentIdentityABI,
                  functionName: "getAgentCard",
                  args: [addr],
                }) as string;

                let reputation = 0;
                let totalRatings = 0;
                try {
                  const [score, ratings] = await publicClient.readContract({
                    address: config.reputationRegistryAddress as Address,
                    abi: AgentReputationABI,
                    functionName: "getReputationScore",
                    args: [addr],
                  }) as [bigint, bigint];
                  reputation = Number(score) / 100;
                  totalRatings = Number(ratings);
                } catch { /* no ratings yet */ }

                return { address: addr, agentCardCID, reputation, totalRatings };
              } catch (err) {
                elizaLogger.warn(`Failed to get details for ${addr}:`, err);
                return null;
              }
            })
          );

          const validAgents = agentsWithDetails
            .filter(Boolean)
            .sort((a, b) => b!.reputation - a!.reputation) as NonNullable<typeof agentsWithDetails[number]>[];

          if (validAgents.length === 0) {
            await callback?.({ text: "Found agents but couldn't fetch their details." });
            return;
          }

          const topAgent = validAgents[0];

          await callback?.({
            text: `Selected agent ${topAgent.address.slice(0, 10)}... (rep: ${topAgent.reputation}/5, ${topAgent.totalRatings} ratings). Fetching service card from IPFS...`
          });

          let providerEndpoint: string;
          let providerWallet: string;
          let price: number;
          let agentName = "Service Provider";

          try {
            const agentCardResponse = await fetch(`https://w3s.link/ipfs/${topAgent.agentCardCID}`);
            if (!agentCardResponse.ok) throw new Error(`HTTP ${agentCardResponse.status}`);
            const agentCard = await agentCardResponse.json();

            const baseUrl = (agentCard.endpoint as string).replace(/\/(upload|analyze|retrieve)$/, '');
            providerEndpoint = `${baseUrl}${route.endpointSuffix}`;
            providerWallet = agentCard.walletAddress || topAgent.address;
            price = agentCard.pricing?.[route.pricingKey] ?? agentCard.pricing?.baseRate ?? 0.0001;
            agentName = agentCard.name || agentName;

            await callback?.({
              text: `Service: ${agentName}\nEndpoint: ${providerEndpoint}\nPrice: $${price} USDC\nPays to: ${providerWallet}`
            });
          } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            elizaLogger.warn(`Agent card fetch failed: ${msg}`);

            providerEndpoint = route.capability === 'csv-analysis'
              ? `http://localhost:8001${route.endpointSuffix}`
              : `http://localhost:8000${route.endpointSuffix}`;
            providerWallet = topAgent.address;
            price = route.pricingKey === 'baseRate' ? 0.0001 : route.pricingKey === 'upload' ? 0.001 : 0.00002;

            await callback?.({ text: `Agent card fetch failed. Using fallback: ${providerEndpoint}` });
          }

          const x402Capability = route.endpointSuffix === '/retrieve' ? 'file-retrieval' : route.capability;
          state.data = {
            ...(state.data || {}),
            selectedAgent: topAgent,
            providerEndpoint,
            providerWallet,
            price,
            capability: x402Capability,
            agentName,
          };

          await callback?.({ text: `Ready to send task to: ${providerEndpoint}` });

        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error);
          elizaLogger.error("ERC-8004 discovery error:", error);
          await callback?.({ text: `Discovery failed: ${msg}` });
        }
      },
    },

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

        const providerAddr = (state.data?.providerWallet as string) || (state.data?.selectedAgent?.address as string);
        const resultCID = (state.data?.resultCID as string) || "";
        const capability = (state.data?.capability as string) || "";

        if (!providerAddr) {
          await callback?.({ text: "No provider address for feedback. Run AGENT_DISCOVER first." });
          return;
        }

        const commentMap: Record<string, string> = {
          'csv-analysis': `Analysis #${Date.now()} —Accurate statistical analysis, fast delivery.`,
          'file-storage': `Storacha Upload #${Date.now()} — Reliable IPFS storage, instant CID returned.`,
          'file-retrieval': `Storacha Retrieval #${Date.now()} — Instant retrieval, content integrity confirmed.`,
        };
        const rating = (state.data?.rating as number) || 5;
        const comment = (state.data?.comment as string) || commentMap[capability] || 'Service completed successfully.';

        if (rating < 1 || rating > 5) {
          await callback?.({ text: "Rating must be between 1 and 5." });
          return;
        }

        try {
          const publicClient = walletService.createPublicClient();
          const walletClient = walletService.createWalletClient(config.privateKey);
          const account = walletService.getAccount(config.privateKey);

          // Check rate limit before attempting to post
          const [allowed, nextAllowedTime] = await publicClient.readContract({
            address: config.reputationRegistryAddress as Address,
            abi: AgentReputationABI,
            functionName: 'canRate',
            args: [account.address, providerAddr as Address],
          }) as [boolean, bigint];

          if (!allowed) {
            const cooldownEnd = new Date(Number(nextAllowedTime) * 1000).toLocaleString();
            await callback?.({
              text: `⏭️ Reputation skipped — rate limit active until ${cooldownEnd}. Task still succeeded.`
            });
            return; // soft-skip, not an error
          }

          await callback?.({ text: `Submitting ${rating}/5 rating for ${providerAddr.slice(0, 10)}...` });

          const hash = await walletClient.writeContract({
            chain: baseSepolia,
            address: config.reputationRegistryAddress as Address,
            abi: AgentReputationABI,
            functionName: "postReputation",
            args: [providerAddr as Address, rating, comment, resultCID],
            account,
          });

          await callback?.({ text: `Reputation tx submitted: ${hash}` });
          const receipt = await publicClient.waitForTransactionReceipt({ hash });

          await callback?.({
            text: `Reputation posted on-chain.\nProvider: ${providerAddr}\nRating: ${rating}/5\nTx: ${receipt.transactionHash}`
          });

          state.data = { ...(state.data || {}), reputationTxHash: receipt.transactionHash };
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error);
          elizaLogger.error("Reputation post error:", error);
          await callback?.({ text: `Failed to post reputation: ${msg}` });
        }
      },
    },

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

        const agentAddress = (state.data?.providerWallet as string) || (state.data?.selectedAgent?.address as string);
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
          }) as [bigint, bigint];

          const reputation = Number(score) / 100;

          const recentRatings = await publicClient.readContract({
            address: config.reputationRegistryAddress as Address,
            abi: AgentReputationABI,
            functionName: "getRecentRatings",
            args: [agentAddress as Address, 5n],
          }) as Array<{ rating: number; comment: string; timestamp: bigint }>;

          let feedbackText = `Reputation for ${agentAddress.slice(0, 10)}...${agentAddress.slice(-8)}:\n`;
          feedbackText += `Score: ${reputation}/5 (${totalRatings} ratings)\n`;

          if (recentRatings.length > 0) {
            feedbackText += `\nRecent:\n`;
            recentRatings.forEach((r, i) => {
              const date = new Date(Number(r.timestamp) * 1000).toLocaleDateString();
              feedbackText += `${i + 1}. ${r.rating}/5 - "${r.comment}" (${date})\n`;
            });
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