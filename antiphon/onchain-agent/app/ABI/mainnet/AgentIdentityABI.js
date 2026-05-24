export const AgentIdentityABI = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "agent",
                "type": "address"
            }
        ],
        "name": "AgentAlreadyRegistered",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "agent",
                "type": "address"
            }
        ],
        "name": "AgentNotRegistered",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "CIDTooLong",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "requested",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "maxAllowed",
                "type": "uint256"
            }
        ],
        "name": "DiscoverAgentsRequestTooLarge",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "EmptyCapabilityTags",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "EnforcedPause",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "FeeTransferFailed",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "sent",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "required",
                "type": "uint256"
            }
        ],
        "name": "IncorrectRegistrationFee",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "InvalidAddress",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "InvalidCID",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "InvalidCapabilityTag",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "caller",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "agent",
                "type": "address"
            }
        ],
        "name": "NotAgentOwner",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "NotOwner",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "NotPendingOwner",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "pendingOwner",
                "type": "address"
            }
        ],
        "name": "PendingOwnerAlreadySet",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "RegistrationFeeNotConfigured",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "TagTooLong",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "TooManyCapabilities",
        "type": "error"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "agent",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "oldAgentCardCID",
                "type": "string"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "newAgentCardCID",
                "type": "string"
            },
            {
                "indexed": false,
                "internalType": "string[]",
                "name": "newCapabilityTags",
                "type": "string[]"
            }
        ],
        "name": "AgentCardUpdated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "agent",
                "type": "address"
            }
        ],
        "name": "AgentDeregistered",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "agent",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "agentCardCID",
                "type": "string"
            },
            {
                "indexed": false,
                "internalType": "string[]",
                "name": "capabilityTags",
                "type": "string[]"
            }
        ],
        "name": "AgentRegistered",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "agent",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "capability",
                "type": "string"
            }
        ],
        "name": "CapabilityAdded",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "agent",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "capability",
                "type": "string"
            }
        ],
        "name": "CapabilityRemoved",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "recipient",
                "type": "address"
            }
        ],
        "name": "FeeRecipientUpdated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "canceledPendingOwner",
                "type": "address"
            }
        ],
        "name": "OwnershipTransferCanceled",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "previousOwner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "pendingOwner",
                "type": "address"
            }
        ],
        "name": "OwnershipTransferStarted",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "previousOwner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "OwnershipTransferred",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "Paused",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "feeWei",
                "type": "uint256"
            }
        ],
        "name": "RegistrationFeeUpdated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "reputationRegistry",
                "type": "address"
            }
        ],
        "name": "ReputationRegistryUpdated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "Unpaused",
        "type": "event"
    },
    {
        "inputs": [],
        "name": "MAX_CAPABILITIES",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "MAX_CID_LENGTH",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "MAX_DISCOVER_AGENTS_CANDIDATES",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "MAX_TAG_LENGTH",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "acceptOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "agent",
                "type": "address"
            }
        ],
        "name": "adminRemoveAgent",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "agent",
                "type": "address"
            },
            {
                "internalType": "string",
                "name": "capability",
                "type": "string"
            }
        ],
        "name": "agentHasCapability",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "cancelOwnershipTransfer",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "deregisterAgent",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string[]",
                "name": "capabilityTags",
                "type": "string[]"
            },
            {
                "internalType": "uint256",
                "name": "offset",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "limit",
                "type": "uint256"
            }
        ],
        "name": "discoverAgents",
        "outputs": [
            {
                "internalType": "address[]",
                "name": "agents",
                "type": "address[]"
            },
            {
                "internalType": "uint256",
                "name": "total",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "feeRecipient",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "agent",
                "type": "address"
            }
        ],
        "name": "getAgentCapabilities",
        "outputs": [
            {
                "internalType": "string[]",
                "name": "",
                "type": "string[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "agent",
                "type": "address"
            }
        ],
        "name": "getAgentCard",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "capability",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "offset",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "limit",
                "type": "uint256"
            }
        ],
        "name": "getAgentsByCapability",
        "outputs": [
            {
                "internalType": "address[]",
                "name": "page",
                "type": "address[]"
            },
            {
                "internalType": "uint256",
                "name": "total",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "offset",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "limit",
                "type": "uint256"
            }
        ],
        "name": "getAllRegisteredAgents",
        "outputs": [
            {
                "internalType": "address[]",
                "name": "page",
                "type": "address[]"
            },
            {
                "internalType": "uint256",
                "name": "total",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getRegisteredAgentsCount",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "agent",
                "type": "address"
            }
        ],
        "name": "isAgentRegistered",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "pause",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "paused",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "pendingOwner",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "agentCardCID",
                "type": "string"
            },
            {
                "internalType": "string[]",
                "name": "capabilityTags",
                "type": "string[]"
            }
        ],
        "name": "registerAgent",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "registrationFeeWei",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "reputationRegistry",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "recipient",
                "type": "address"
            }
        ],
        "name": "setFeeRecipient",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "feeWei",
                "type": "uint256"
            }
        ],
        "name": "setRegistrationFeeWei",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "reputationRegistry_",
                "type": "address"
            }
        ],
        "name": "setReputationRegistry",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes4",
                "name": "interfaceId",
                "type": "bytes4"
            }
        ],
        "name": "supportsInterface",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "pure",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "transferOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "unpause",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "newCID",
                "type": "string"
            },
            {
                "internalType": "string[]",
                "name": "newCapabilityTags",
                "type": "string[]"
            }
        ],
        "name": "updateAgentCard",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
]