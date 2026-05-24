export const AgentReputationABI = [
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "identityRegistry_",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [],
        "name": "CIDTooLong",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "caller",
                "type": "address"
            }
        ],
        "name": "CallerNotIdentityRegistry",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "CannotRateSelf",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "CommentTooLong",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "EnforcedPause",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "identityRegistry",
                "type": "address"
            }
        ],
        "name": "IdentityRegistryInterfaceUnsupported",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "identityRegistry",
                "type": "address"
            }
        ],
        "name": "IdentityRegistryProbeFailed",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "rater",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "currentStake",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "required",
                "type": "uint256"
            }
        ],
        "name": "InsufficientRaterStake",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "InvalidAddress",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "InvalidIdentityRegistry",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "identityRegistry",
                "type": "address"
            }
        ],
        "name": "InvalidIdentityRegistryContract",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "InvalidLimit",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "InvalidMaxUniqueRatersPerPeriod",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "uint8",
                "name": "rating",
                "type": "uint8"
            }
        ],
        "name": "InvalidRating",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "InvalidRatingIndex",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "InvalidTargetAgent",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "MinRaterStakeNotConfigured",
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
        "name": "NoRatingsFound",
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
        "inputs": [
            {
                "internalType": "address",
                "name": "rater",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "targetAgent",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "nextAllowedTime",
                "type": "uint256"
            }
        ],
        "name": "RateLimitExceeded",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "rater",
                "type": "address"
            }
        ],
        "name": "RaterNotRegistered",
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
        "name": "ReputationFrozen",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "targetAgent",
                "type": "address"
            }
        ],
        "name": "TargetNotRegistered",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "targetAgent",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "periodId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "maxUniqueRaters",
                "type": "uint256"
            }
        ],
        "name": "TargetPeriodRaterCapReached",
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
                "name": "available",
                "type": "uint256"
            }
        ],
        "name": "WithdrawAmountExceedsBalance",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "WithdrawTransferFailed",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "ZeroWithdrawAmount",
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
            }
        ],
        "name": "FirstRatingReceived",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "maxUniqueRatersPerPeriod",
                "type": "uint256"
            }
        ],
        "name": "MaxUniqueRatersPerTargetPeriodUpdated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "minStakeWei",
                "type": "uint256"
            }
        ],
        "name": "MinRaterStakeUpdated",
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
                "indexed": true,
                "internalType": "address",
                "name": "rater",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "newBalance",
                "type": "uint256"
            }
        ],
        "name": "RaterStakeDeposited",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "rater",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "newBalance",
                "type": "uint256"
            }
        ],
        "name": "RaterStakeWithdrawn",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "targetAgent",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "fromIndex",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "toIndex",
                "type": "uint256"
            }
        ],
        "name": "RatingMoved",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "targetAgent",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "ratingIndex",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "removedBy",
                "type": "address"
            }
        ],
        "name": "RatingRemoved",
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
        "name": "ReputationFrozenForIdentity",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "targetAgent",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "rater",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint8",
                "name": "rating",
                "type": "uint8"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "comment",
                "type": "string"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "proofCID",
                "type": "string"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "timestamp",
                "type": "uint256"
            }
        ],
        "name": "ReputationPosted",
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
        "name": "ReputationUnfrozen",
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
        "name": "DEFAULT_MAX_UNIQUE_RATERS_PER_PERIOD",
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
        "name": "MAX_COMMENT_LENGTH",
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
        "name": "MAX_RATING",
        "outputs": [
            {
                "internalType": "uint8",
                "name": "",
                "type": "uint8"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "MIN_RATING",
        "outputs": [
            {
                "internalType": "uint8",
                "name": "",
                "type": "uint8"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "RATE_LIMIT_PERIOD",
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
        "name": "SCORE_MULTIPLIER",
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
                "name": "rater",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "targetAgent",
                "type": "address"
            }
        ],
        "name": "canRate",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            },
            {
                "internalType": "uint256",
                "name": "nextAllowedTime",
                "type": "uint256"
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
        "name": "depositRaterStake",
        "outputs": [],
        "stateMutability": "payable",
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
        "name": "freezeReputation",
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
        "name": "getAllRatings",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint8",
                        "name": "rating",
                        "type": "uint8"
                    },
                    {
                        "internalType": "string",
                        "name": "comment",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "proofCID",
                        "type": "string"
                    },
                    {
                        "internalType": "uint256",
                        "name": "timestamp",
                        "type": "uint256"
                    },
                    {
                        "internalType": "address",
                        "name": "rater",
                        "type": "address"
                    }
                ],
                "internalType": "struct AgentReputationRegistry.Rating[]",
                "name": "page",
                "type": "tuple[]"
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
                "internalType": "address",
                "name": "agent",
                "type": "address"
            }
        ],
        "name": "getRatingsCount",
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
            },
            {
                "internalType": "uint256",
                "name": "limit",
                "type": "uint256"
            }
        ],
        "name": "getRecentRatings",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint8",
                        "name": "rating",
                        "type": "uint8"
                    },
                    {
                        "internalType": "string",
                        "name": "comment",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "proofCID",
                        "type": "string"
                    },
                    {
                        "internalType": "uint256",
                        "name": "timestamp",
                        "type": "uint256"
                    },
                    {
                        "internalType": "address",
                        "name": "rater",
                        "type": "address"
                    }
                ],
                "internalType": "struct AgentReputationRegistry.Rating[]",
                "name": "",
                "type": "tuple[]"
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
        "name": "getReputationScore",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "score",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "totalRatings",
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
        "name": "hasBeenRated",
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
        "name": "identityRegistry",
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
        "name": "isReputationFrozen",
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
        "name": "maxUniqueRatersPerTargetPeriod",
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
        "name": "minRaterStakeWei",
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
                "internalType": "address",
                "name": "targetAgent",
                "type": "address"
            },
            {
                "internalType": "uint8",
                "name": "rating",
                "type": "uint8"
            },
            {
                "internalType": "string",
                "name": "comment",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "proofCID",
                "type": "string"
            }
        ],
        "name": "postReputation",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "rater",
                "type": "address"
            }
        ],
        "name": "raterStake",
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
                "name": "targetAgent",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "ratingIndex",
                "type": "uint256"
            }
        ],
        "name": "removeRating",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "maxUniqueRatersPerPeriod",
                "type": "uint256"
            }
        ],
        "name": "setMaxUniqueRatersPerTargetPeriod",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "minStakeWei",
                "type": "uint256"
            }
        ],
        "name": "setMinRaterStakeWei",
        "outputs": [],
        "stateMutability": "nonpayable",
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
        "inputs": [
            {
                "internalType": "address",
                "name": "agent",
                "type": "address"
            }
        ],
        "name": "unfreezeReputation",
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
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "withdrawRaterStake",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
]