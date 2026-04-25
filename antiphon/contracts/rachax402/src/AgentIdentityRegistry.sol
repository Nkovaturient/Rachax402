// SPDX-License-Identifier: MIT
pragma solidity 0.8.34;

interface IAgentReputationRegistry {
    function freezeReputation(address agent) external;
}

/// @dev Minimal surface used for EIP-165 `interfaceId` (must match `IAgentIdentityRegistry` in `AgentReputationRegistry.sol`).
interface IAgentIdentityRegistryLookup {
    function isAgentRegistered(address agent) external view returns (bool);
}

/**
 * @title AgentIdentityRegistry Contract
 * @author Rachax402
 * @dev Allows agents to register with their agent card CIDs and enables discovery by capability tags
 * @notice Base mainnet: set non-zero `registrationFeeWei`, treasury `feeRecipient`, then `setReputationRegistry`
 *         after deploying `AgentReputationRegistry`. Wire reputation only to the registry that passed constructor checks.
 */
contract AgentIdentityRegistry {
    // Errors
    error AgentAlreadyRegistered(address agent);
    error AgentNotRegistered(address agent);
    error NotAgentOwner(address caller, address agent);
    error InvalidCID();
    error InvalidCapabilityTag();
    error EmptyCapabilityTags();
    error InvalidAddress();
    error CIDTooLong();
    error TagTooLong();
    error TooManyCapabilities();
    error NotOwner();
    error EnforcedPause();
    error IncorrectRegistrationFee(uint256 sent, uint256 required);
    error FeeTransferFailed();
    error RegistrationFeeNotConfigured();
    error DiscoverAgentsRequestTooLarge(uint256 requested, uint256 maxAllowed);
    error NotPendingOwner();
    error PendingOwnerAlreadySet(address pendingOwner);

    // Type Declarations
    struct AgentInfo {
        string agentCardCID;
        string[] capabilityTags;
        bool isRegistered;
    }

    // Constants
    uint256 public constant MAX_CAPABILITIES = 20;
    uint256 public constant MAX_CID_LENGTH = 256;
    uint256 public constant MAX_TAG_LENGTH = 64;
    uint256 public constant MAX_DISCOVER_AGENTS_CANDIDATES = 2048;

    /// @dev EIP-165: identifier for IERC165 (required for standards-compliant `supportsInterface`).
    bytes4 private constant IID_IERC165 = 0x01ffc9a7;

    // State Variables
    address private s_owner;
    address private s_pendingOwner;
    bool private s_paused;

    /// @dev ETH required on `registerAgent` (wei). Mitigates cheap Sybil identities when set above zero.
    uint256 private s_registrationFeeWei;

    /// @dev Receives registration fees (treasury, DAO, or burn address).
    address private s_feeRecipient;
    IAgentReputationRegistry private s_reputationRegistry;

    /// @dev Mapping from agent address to their info
    mapping(address => AgentInfo) private s_agents;

    /// @dev Mapping from capability tag to list of agent addresses for efficient lookup
    mapping(string => address[]) private s_capabilityToAgents;

    /// @dev Mapping to track agent index in capability array for O(1) removal
    mapping(string => mapping(address => uint256))
        private s_agentIndexInCapability;

    /// @dev Mapping to track if agent has a specific capability (for O(1) lookup)
    mapping(address => mapping(string => bool)) private s_agentHasCapability;

    /// @dev Array of all registered agent addresses
    address[] private s_registeredAgents;

    /// @dev Mapping to track agent index in registered agents array
    mapping(address => uint256) private s_agentIndexInRegistry;

    // Events
    event AgentRegistered(
        address indexed agent,
        string agentCardCID,
        string[] capabilityTags
    );
    event AgentCardUpdated(
        address indexed agent,
        string oldAgentCardCID,
        string newAgentCardCID,
        string[] newCapabilityTags
    );
    event CapabilityAdded(address indexed agent, string capability);
    event CapabilityRemoved(address indexed agent, string capability);
    event AgentDeregistered(address indexed agent);
    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );
    event OwnershipTransferStarted(
        address indexed previousOwner,
        address indexed pendingOwner
    );
    event OwnershipTransferCanceled(
        address indexed owner,
        address indexed canceledPendingOwner
    );
    event Paused(address account);
    event Unpaused(address account);
    event RegistrationFeeUpdated(uint256 feeWei);
    event FeeRecipientUpdated(address indexed recipient);
    event ReputationRegistryUpdated(address indexed reputationRegistry);

    // Modifiers
    modifier onlyOwner() {
        if (msg.sender != s_owner) {
            revert NotOwner();
        }
        _;
    }

    modifier whenNotPaused() {
        if (s_paused) {
            revert EnforcedPause();
        }
        _;
    }

    modifier onlyAgentOwner() {
        if (!s_agents[msg.sender].isRegistered) {
            revert AgentNotRegistered(msg.sender);
        }
        _;
    }

    modifier validCID(string memory cid) {
        if (bytes(cid).length == 0) {
            revert InvalidCID();
        }
        if (bytes(cid).length > MAX_CID_LENGTH) {
            revert CIDTooLong();
        }
        _;
    }

    modifier nonZeroAddress(address a) {
        if (a == address(0)) {
            revert InvalidAddress();
        }
        _;
    }

    constructor() {
        s_owner = msg.sender;
        s_feeRecipient = msg.sender;
    }

    function registrationFeeWei() external view returns (uint256) {
        return s_registrationFeeWei;
    }

    function feeRecipient() external view returns (address) {
        return s_feeRecipient;
    }

    function pendingOwner() external view returns (address) {
        return s_pendingOwner;
    }

    function reputationRegistry() external view returns (address) {
        return address(s_reputationRegistry);
    }

    function setRegistrationFeeWei(uint256 feeWei) external onlyOwner {
        s_registrationFeeWei = feeWei;
        emit RegistrationFeeUpdated(feeWei);
    }

    function setFeeRecipient(address recipient) external onlyOwner nonZeroAddress(recipient) {
        s_feeRecipient = recipient;
        emit FeeRecipientUpdated(recipient);
    }

    function setReputationRegistry(address reputationRegistry_) external onlyOwner nonZeroAddress(reputationRegistry_) {
        s_reputationRegistry = IAgentReputationRegistry(reputationRegistry_);
        emit ReputationRegistryUpdated(reputationRegistry_);
    }

    // External Functions

    function pause() external onlyOwner {
        s_paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyOwner {
        s_paused = false;
        emit Unpaused(msg.sender);
    }

    function transferOwnership(
        address newOwner
    ) external onlyOwner nonZeroAddress(newOwner) {
        if (s_pendingOwner == newOwner) {
            revert PendingOwnerAlreadySet(newOwner);
        }
        s_pendingOwner = newOwner;
        emit OwnershipTransferStarted(s_owner, newOwner);
    }

    function acceptOwnership() external {
        address pending = s_pendingOwner;
        if (msg.sender != pending) {
            revert NotPendingOwner();
        }
        address previous = s_owner;
        s_owner = pending;
        delete s_pendingOwner;
        emit OwnershipTransferred(previous, pending);
    }

    function cancelOwnershipTransfer() external onlyOwner {
        address canceled = s_pendingOwner;
        delete s_pendingOwner;
        emit OwnershipTransferCanceled(msg.sender, canceled);
    }

    function owner() external view returns (address) {
        return s_owner;
    }

    function paused() external view returns (bool) {
        return s_paused;
    }

    /**
     * @dev registerAgent Register an agent with their agent card CID and capability tags
     * @param agentCardCID The CID of the agent's identity card stored on IPFS
     * @param capabilityTags An array of capability tags for the agent
     */
    function registerAgent(
        string calldata agentCardCID,
        string[] calldata capabilityTags
    ) external payable whenNotPaused validCID(agentCardCID) {
        if (s_registrationFeeWei == 0) {
            revert RegistrationFeeNotConfigured();
        }
        if (msg.value != s_registrationFeeWei) {
            revert IncorrectRegistrationFee(msg.value, s_registrationFeeWei);
        }
        if (s_agents[msg.sender].isRegistered) {
            revert AgentAlreadyRegistered(msg.sender);
        }

        // Store agent info
        s_agents[msg.sender].agentCardCID = agentCardCID;
        s_agents[msg.sender].isRegistered = true;

        // Add to registered agents array
        s_agentIndexInRegistry[msg.sender] = s_registeredAgents.length;
        s_registeredAgents.push(msg.sender);

        // index capability tags
        _addCapabilities(msg.sender, capabilityTags);

        if (msg.value != 0) {
            (bool sent, ) = payable(s_feeRecipient).call{value: msg.value}("");
            if (!sent) {
                revert FeeTransferFailed();
            }
        }

        emit AgentRegistered(msg.sender, agentCardCID, capabilityTags);
    }

    /**
     * @dev updateAgentCard update the agent identity card CID and capability tags
     * @notice Only the agent owner can update their agent card
     * @param newCID The new CID of the agent's identity card stored on IPFS
     * @param newCapabilityTags The new capability tags for the agent
     */
    function updateAgentCard(
        string calldata newCID,
        string[] calldata newCapabilityTags
    ) external onlyAgentOwner whenNotPaused validCID(newCID) {
        string memory oldCID = s_agents[msg.sender].agentCardCID;

        // Remove old capabilities
        _removeAllCapabilities(msg.sender);

        // Update CID
        s_agents[msg.sender].agentCardCID = newCID;

        // Add new capabilities
        _addCapabilities(msg.sender, newCapabilityTags);

        emit AgentCardUpdated(msg.sender, oldCID, newCID, newCapabilityTags);
    }

    /**
     * @dev Deregister the caller as an agent (key rotation / leaving the registry).
     */
    function deregisterAgent() external onlyAgentOwner whenNotPaused {
        address agent = msg.sender;
        _freezeReputationIfConfigured(agent);

        _removeAllCapabilities(agent);

        uint256 index = s_agentIndexInRegistry[agent];
        uint256 lastIndex = s_registeredAgents.length - 1;
        if (index != lastIndex) {
            address lastAgent = s_registeredAgents[lastIndex];
            s_registeredAgents[index] = lastAgent;
            s_agentIndexInRegistry[lastAgent] = index;
        }
        s_registeredAgents.pop();
        delete s_agentIndexInRegistry[agent];

        delete s_agents[agent];

        emit AgentDeregistered(agent);
    }

    /**
     * @dev discoverAgents discover agents matching any of the provided capability tags with pagination
     * @notice Reverts when the candidate set implied by queried tags exceeds MAX_DISCOVER_AGENTS_CANDIDATES.
     *         This keeps worst-case memory/gas bounded for on-chain callers.
     * @param capabilityTags An array of capability tags to search for agents
     * @param offset The starting index for pagination
     * @param limit Maximum number of results to return (0 for all remaining)
     * @return agents An array of unique agent addresses matching any capability tag
     * @return total The total count of unique matching agents (for pagination)
     * @notice Use getAgentCard(address) to fetch individual CIDs for discovered agents.
     */
    function discoverAgents(
        string[] calldata capabilityTags,
        uint256 offset,
        uint256 limit
    ) external view returns (address[] memory agents, uint256 total) {
        if (capabilityTags.length == 0) {
            revert EmptyCapabilityTags();
        }

        // First pass: collect unique agents
        uint256 maxAgents = 0;
        for (uint256 i = 0; i < capabilityTags.length; i++) {
            maxAgents += s_capabilityToAgents[capabilityTags[i]].length;
            if (maxAgents > MAX_DISCOVER_AGENTS_CANDIDATES) {
                revert DiscoverAgentsRequestTooLarge(
                    maxAgents,
                    MAX_DISCOVER_AGENTS_CANDIDATES
                );
            }
        }

        if (maxAgents == 0) {
            return (new address[](0), 0);
        }

        bool[] memory seen = new bool[](s_registeredAgents.length);
        address[] memory tempAgents = new address[](maxAgents);
        uint256 uniqueCount = 0;

        for (uint256 i = 0; i < capabilityTags.length; i++) {
            address[] storage agentsWithCapability = s_capabilityToAgents[
                capabilityTags[i]
            ];

            for (uint256 j = 0; j < agentsWithCapability.length; j++) {
                address agent = agentsWithCapability[j];

                if (!s_agents[agent].isRegistered) {
                    continue;
                }

                uint256 regIdx = s_agentIndexInRegistry[agent];
                if (!seen[regIdx]) {
                    seen[regIdx] = true;
                    tempAgents[uniqueCount] = agent;
                    uniqueCount++;
                }
            }
        }

        total = uniqueCount;

        // Handle offset beyond array bounds
        if (offset >= total) {
            return (new address[](0), total);
        }

        // Apply pagination
        uint256 remaining = total - offset;
        uint256 count = (limit == 0 || limit > remaining) ? remaining : limit;

        agents = new address[](count);

        for (uint256 i = 0; i < count; i++) {
            agents[i] = tempAgents[offset + i];
        }

        return (agents, total);
    }

    // External Getter Functions

    /**
     * @dev getAgentCard Get the agent card CID for a given agent address
     * @param agent The address of the agent
     * @return The CID of the agent's identity card stored on IPFS
     */
    function getAgentCard(
        address agent
    ) external view nonZeroAddress(agent) returns (string memory) {
        if (!s_agents[agent].isRegistered) {
            revert AgentNotRegistered(agent);
        }
        return s_agents[agent].agentCardCID;
    }

    /**
     * @dev Get the capability tags for a given agent address
     * @param agent The address of the agent
     * @return The capability tags of the agent
     */
    function getAgentCapabilities(
        address agent
    ) external view nonZeroAddress(agent) returns (string[] memory) {
        if (!s_agents[agent].isRegistered) {
            revert AgentNotRegistered(agent);
        }
        return s_agents[agent].capabilityTags;
    }

    /**
     * @dev Check if an agent is registered
     * @param agent The address of the agent
     * @return True if the agent is registered, false otherwise
     */
    function isAgentRegistered(
        address agent
    ) external view nonZeroAddress(agent) returns (bool) {
        return s_agents[agent].isRegistered;
    }

    /**
     * @dev Get agents with a capability, paginated
     * @param offset Starting index
     * @param limit Max items (0 = all remaining)
     */
    function getAgentsByCapability(
        string calldata capability,
        uint256 offset,
        uint256 limit
    ) external view returns (address[] memory page, uint256 total) {
        address[] storage list = s_capabilityToAgents[capability];
        total = list.length;
        if (offset >= total) {
            return (new address[](0), total);
        }
        uint256 remaining = total - offset;
        uint256 count = (limit == 0 || limit > remaining) ? remaining : limit;
        page = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            page[i] = list[offset + i];
        }
    }

    /**
     * @dev Get the total number of registered agents
     * @return The count of registered agents
     */
    function getRegisteredAgentsCount() external view returns (uint256) {
        return s_registeredAgents.length;
    }

    /**
     * @dev Paginated list of all registered agent addresses
     * @param offset Starting index
     * @param limit Max items (0 = all remaining)
     */
    function getAllRegisteredAgents(
        uint256 offset,
        uint256 limit
    ) external view returns (address[] memory page, uint256 total) {
        total = s_registeredAgents.length;
        if (offset >= total) {
            return (new address[](0), total);
        }
        uint256 remaining = total - offset;
        uint256 count = (limit == 0 || limit > remaining) ? remaining : limit;
        page = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            page[i] = s_registeredAgents[offset + i];
        }
    }

    function adminRemoveAgent(
        address agent
    ) external onlyOwner nonZeroAddress(agent) {
        if (!s_agents[agent].isRegistered) revert AgentNotRegistered(agent);
        _freezeReputationIfConfigured(agent);
        _removeAllCapabilities(agent);
        uint256 idx = s_agentIndexInRegistry[agent];
        uint256 last = s_registeredAgents.length - 1;
        if (idx != last) {
            address lastAgent = s_registeredAgents[last];
            s_registeredAgents[idx] = lastAgent;
            s_agentIndexInRegistry[lastAgent] = idx;
        }
        s_registeredAgents.pop();
        delete s_agentIndexInRegistry[agent];
        delete s_agents[agent];
        emit AgentDeregistered(agent);
    }

    /**
     * @dev Check if an agent has a specific capability
     * @param agent The address of the agent
     * @param capability The capability tag to check
     * @return True if the agent has the capability, false otherwise
     */
    function agentHasCapability(
        address agent,
        string calldata capability
    ) external view nonZeroAddress(agent) returns (bool) {
        return s_agentHasCapability[agent][capability];
    }

    /**
     * @dev EIP-165. Lets `AgentReputationRegistry` verify this address is the expected identity registry at deploy time.
     * @return true for IERC165, this registry's agent-lookup interface id, and false for the reserved invalid id.
     */
    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        if (interfaceId == 0xffffffff) {
            return false;
        }
        return interfaceId == IID_IERC165 || interfaceId == type(IAgentIdentityRegistryLookup).interfaceId;
    }

    // Internal Functions

    /**
     * @dev Counts capability strings that would be newly added (non-empty, not duplicate, within tag length).
     */
    function _countNewCapabilities(
        address agent,
        string[] calldata capabilities
    ) internal view returns (uint256 count) {
        for (uint256 i = 0; i < capabilities.length; i++) {
            string calldata capability = capabilities[i];
            if (bytes(capability).length == 0) {
                continue;
            }
            if (bytes(capability).length > MAX_TAG_LENGTH) {
                revert TagTooLong();
            }
            if (s_agentHasCapability[agent][capability]) {
                continue;
            }
            count++;
        }
    }

    /**
     * @dev Add capability tags to an agent and update the capability index
     * @param agent The address of the agent
     * @param capabilities The capability tags to add
     */
    function _addCapabilities(
        address agent,
        string[] calldata capabilities
    ) internal {
        uint256 current = s_agents[agent].capabilityTags.length;
        uint256 toAdd = _countNewCapabilities(agent, capabilities);
        if (current + toAdd > MAX_CAPABILITIES) {
            revert TooManyCapabilities();
        }

        for (uint256 i = 0; i < capabilities.length; i++) {
            string calldata capability = capabilities[i];

            // skip the empty capabilities
            if (bytes(capability).length == 0) {
                continue;
            }
            if (bytes(capability).length > MAX_TAG_LENGTH) {
                revert TagTooLong();
            }

            // skip if agent already have the capability
            if (s_agentHasCapability[agent][capability]) {
                continue;
            }

            // Add to agent's capabilities
            s_agents[agent].capabilityTags.push(capability);

            // index for efficient lookup
            s_agentIndexInCapability[capability][agent] = s_capabilityToAgents[
                capability
            ].length;
            s_capabilityToAgents[capability].push(agent);
            s_agentHasCapability[agent][capability] = true;

            emit CapabilityAdded(agent, capability);
        }
    }

    /**
     * @dev Remove all capability tags from an agent using swap-and-pop on per-tag agent lists.
     */
    function _removeAllCapabilities(address agent) internal {
        string[] memory capabilities = s_agents[agent].capabilityTags;

        for (uint256 i = 0; i < capabilities.length; i++) {
            string memory capability = capabilities[i];

            // Remove from capability index using swap-and-pop
            uint256 indexToRemove = s_agentIndexInCapability[capability][agent];
            uint256 lastIndex = s_capabilityToAgents[capability].length - 1;

            if (indexToRemove != lastIndex) {
                address lastAgent = s_capabilityToAgents[capability][lastIndex];
                s_capabilityToAgents[capability][indexToRemove] = lastAgent;
                s_agentIndexInCapability[capability][lastAgent] = indexToRemove;
            }

            s_capabilityToAgents[capability].pop();
            delete s_agentIndexInCapability[capability][agent];
            delete s_agentHasCapability[agent][capability];

            emit CapabilityRemoved(agent, capability);
        }

        // Clear agent's capabilities array
        delete s_agents[agent].capabilityTags;
    }

    function _freezeReputationIfConfigured(address agent) internal {
        IAgentReputationRegistry rep = s_reputationRegistry;
        if (address(rep) != address(0)) {
            rep.freezeReputation(agent);
        }
    }
}
