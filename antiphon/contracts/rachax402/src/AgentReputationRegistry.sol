// SPDX-License-Identifier: MIT
pragma solidity 0.8.34;

interface IAgentIdentityRegistry {
    function isAgentRegistered(address agent) external view returns (bool);
}

/**
 * @title AgentReputationRegistry Contract
 * @author Rachax402
 * @dev Contract for storing ratings and calculating reputation scores for agents.
 *      Upgradability (e.g. UUPS) can be added via a proxy wrapper without changing core logic here.
 */
contract AgentReputationRegistry {
    // Errors
    error InvalidRating(uint8 rating);
    error InvalidTargetAgent();
    error CannotRateSelf();
    error RateLimitExceeded(address rater, address targetAgent, uint256 nextAllowedTime);
    error NoRatingsFound(address agent);
    error InvalidLimit();
    error InvalidAddress();
    error RaterNotRegistered(address rater);
    error TargetNotRegistered(address targetAgent);
    error InvalidIdentityRegistry();
    error NotOwner();
    error EnforcedPause();
    error InvalidRatingIndex();
    error CIDTooLong();
    error CommentTooLong();

    // Type Declarations
    struct Rating {
        uint8 rating;
        string comment;
        string proofCID;
        uint256 timestamp;
        address rater;
    }

    struct AgentReputation {
        uint256 totalScore;
        uint256 totalRatings;
    }

    // Constants
    uint8 public constant MIN_RATING = 1;
    uint8 public constant MAX_RATING = 5;
    uint256 public constant SCORE_MULTIPLIER = 100;
    uint256 public constant RATE_LIMIT_PERIOD = 1 days;
    uint256 public constant MAX_CID_LENGTH = 256;
    uint256 public constant MAX_COMMENT_LENGTH = 512;

    // State Variables
    IAgentIdentityRegistry private immutable IDENTITY_REGISTRY;

    address private s_owner;
    bool private s_paused;

    mapping(address => AgentReputation) private s_agentReputations;

    /// @dev Mapping from agent address to their ratings array
    mapping(address => Rating[]) private s_agentRatings;

    /// @dev Mapping to track last rating timestamp: rater => targetAgent => timestamp
    mapping(address => mapping(address => uint256)) private s_lastRatingTime;

    /// @dev Array of all agents that have received ratings
    address[] private s_ratedAgents;

    /// @dev Mapping to check if agent has been rated before
    mapping(address => bool) private s_hasBeenRated;
    mapping(address => uint256) private s_ratedAgentIndex;

    // Events
    event ReputationPosted(
        address indexed targetAgent,
        address indexed rater,
        uint8 rating,
        string comment,
        string proofCID,
        uint256 timestamp
    );

    event FirstRatingReceived(address indexed agent);
    event RatingRemoved(address indexed targetAgent, uint256 ratingIndex, address indexed removedBy);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event Paused(address account);
    event Unpaused(address account);

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

    modifier validRating(uint8 rating) {
        if (rating < MIN_RATING || rating > MAX_RATING) {
            revert InvalidRating(rating);
        }
        _;
    }

    modifier validTarget(address targetAgent) {
        if (targetAgent == address(0)) {
            revert InvalidTargetAgent();
        }
        if (targetAgent == msg.sender) {
            revert CannotRateSelf();
        }
        if (!IDENTITY_REGISTRY.isAgentRegistered(targetAgent)) {
            revert TargetNotRegistered(targetAgent);
        }
        _;
    }

    modifier onlyRegisteredRater() {
        if (!IDENTITY_REGISTRY.isAgentRegistered(msg.sender)) {
            revert RaterNotRegistered(msg.sender);
        }
        _;
    }

    modifier rateLimitCheck(address targetAgent) {
        uint256 lastRating = s_lastRatingTime[msg.sender][targetAgent];
        if (lastRating != 0 && block.timestamp < lastRating + RATE_LIMIT_PERIOD) {
            revert RateLimitExceeded(
                msg.sender,
                targetAgent,
                lastRating + RATE_LIMIT_PERIOD
            );
        }
        _;
    }

    modifier nonZeroAddress(address a) {
        if (a == address(0)) {
            revert InvalidAddress();
        }
        _;
    }

    constructor(address identityRegistry) {
        if (identityRegistry == address(0)) {
            revert InvalidIdentityRegistry();
        }
        IDENTITY_REGISTRY = IAgentIdentityRegistry(identityRegistry);
        s_owner = msg.sender;
    }

    function identityRegistry() external view returns (address) {
        return address(IDENTITY_REGISTRY);
    }

    function pause() external onlyOwner {
        s_paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyOwner {
        s_paused = false;
        emit Unpaused(msg.sender);
    }

    function transferOwnership(address newOwner) external onlyOwner nonZeroAddress(newOwner) {
        address previous = s_owner;
        s_owner = newOwner;
        emit OwnershipTransferred(previous, newOwner);
    }

    function owner() external view returns (address) {
        return s_owner;
    }

    function paused() external view returns (bool) {
        return s_paused;
    }

    /**
     * @dev Remove a rating by index (swap-and-pop). Intended for spam / abuse response.
     */
    function removeRating(address targetAgent, uint256 ratingIndex) external onlyOwner nonZeroAddress(targetAgent) {
        Rating[] storage ratings = s_agentRatings[targetAgent];
        if (ratingIndex >= ratings.length) {
            revert InvalidRatingIndex();
        }

        Rating memory removed = ratings[ratingIndex];
        uint256 deduction = uint256(removed.rating) * SCORE_MULTIPLIER;

        AgentReputation storage rep = s_agentReputations[targetAgent];
        rep.totalScore -= deduction;
        rep.totalRatings -= 1;

        uint256 last = ratings.length - 1;
        if (ratingIndex != last) {
            ratings[ratingIndex] = ratings[last];
        }
        ratings.pop();

        if (ratings.length == 0) {
            rep.totalScore = 0;
            rep.totalRatings = 0;
            _clearRatedAgent(targetAgent);
        }

        emit RatingRemoved(targetAgent, ratingIndex, msg.sender);
    }

    /**
     * @dev postReputation Post a reputation rating for an agent
     * @param targetAgent The address of the agent being rated
     * @param rating The rating value (1-5)
     * @param comment comment about the rating
     * @param proofCID CID of proof/evidence stored on IPFS
     */
    function postReputation(
        address targetAgent,
        uint8 rating,
        string calldata comment,
        string calldata proofCID
    )
        external
        whenNotPaused
        onlyRegisteredRater
        validTarget(targetAgent)
        validRating(rating)
        rateLimitCheck(targetAgent)
    {
        if (bytes(proofCID).length > MAX_CID_LENGTH) {
            revert CIDTooLong();
        }
        if (bytes(comment).length > MAX_COMMENT_LENGTH) {
            revert CommentTooLong();
        }

        s_lastRatingTime[msg.sender][targetAgent] = block.timestamp;

        // Create new rating
        Rating memory newRating = Rating({
            rating: rating,
            comment: comment,
            proofCID: proofCID,
            timestamp: block.timestamp,
            rater: msg.sender
        });

        // Store the rating
        s_agentRatings[targetAgent].push(newRating);

        AgentReputation storage rep = s_agentReputations[targetAgent];
        rep.totalScore += uint256(rating) * SCORE_MULTIPLIER;
        rep.totalRatings += 1;

        // Optional: Track first-time rated agents
        if (!s_hasBeenRated[targetAgent]) {
            s_hasBeenRated[targetAgent] = true;
            s_ratedAgentIndex[targetAgent] = s_ratedAgents.length;
            s_ratedAgents.push(targetAgent);
            emit FirstRatingReceived(targetAgent);
        }

        emit ReputationPosted(
            targetAgent,
            msg.sender,
            rating,
            comment,
            proofCID,
            block.timestamp
        );
    }

    // External View Functions

    /**
     * @dev getReputationScore Get the reputation score for an agent
     * @param agent The address of the agent
     * @return score ( average reputation score * 100)
     * @return totalRatings The total number of ratings received
     * @notice Score of 500 = 5.00 average, 350 = 3.50 average, etc.
     */
    function getReputationScore(
        address agent
    ) external view nonZeroAddress(agent) returns (uint256 score, uint256 totalRatings) {
        AgentReputation storage rep = s_agentReputations[agent];
        totalRatings = rep.totalRatings;

        if (totalRatings == 0) {
            return (0, 0);
        }

        // Calculate average: (totalScore / totalRatings)
        // Since totalScore is already multiplied by 100, result is average * 100
        score = rep.totalScore / totalRatings;

        return (score, totalRatings);
    }

    /**
     * @dev Get recent ratings for an agent
     * @param agent The address of the agent
     * @param limit Maximum number of ratings to return (most recent first)
     * @return An array of Rating structs
     */
    function getRecentRatings(
        address agent,
        uint256 limit
    ) external view nonZeroAddress(agent) returns (Rating[] memory) {
        if (limit == 0) {
            revert InvalidLimit();
        }

        Rating[] storage allRatings = s_agentRatings[agent];
        uint256 total = allRatings.length;

        if (total == 0) {
            return new Rating[](0);
        }

        uint256 count = limit > total ? total : limit;
        Rating[] memory recentRatings = new Rating[](count);

        for (uint256 i = 0; i < count; i++) {
            recentRatings[i] = allRatings[total - 1 - i];
        }

        return recentRatings;
    }

    /**
     * @dev Paginated ratings for an agent (chronological segment starting at offset)
     * @param offset Index in the stored array
     * @param limit Max items (0 = all remaining)
     */
    function getAllRatings(
        address agent,
        uint256 offset,
        uint256 limit
    ) external view nonZeroAddress(agent) returns (Rating[] memory page, uint256 total) {
        Rating[] storage allRatings = s_agentRatings[agent];
        total = allRatings.length;
        if (offset >= total) {
            return (new Rating[](0), total);
        }
        uint256 remaining = total - offset;
        uint256 count = (limit == 0 || limit > remaining) ? remaining : limit;
        page = new Rating[](count);
        for (uint256 i = 0; i < count; i++) {
            page[i] = allRatings[offset + i];
        }
    }

    /**
     * @dev Get the total number of ratings for an agent
     * @param agent The address of the agent
     * @return The count of ratings
     */
    function getRatingsCount(address agent) external view nonZeroAddress(agent) returns (uint256) {
        return s_agentRatings[agent].length;
    }

    /**
     * @dev Check if a rater can rate a target agent (rate limit check)
     * @param rater The address of the potential rater
     * @param targetAgent The address of the target agent
     * @return canRate Whether the rater can rate now
     * @return nextAllowedTime The timestamp when rating will be allowed (0 if can rate now)
     */
    function canRate(
        address rater,
        address targetAgent
    ) external view nonZeroAddress(rater) nonZeroAddress(targetAgent) returns (bool, uint256 nextAllowedTime) {
        uint256 lastRating = s_lastRatingTime[rater][targetAgent];

        if (lastRating == 0) {
            return (true, 0);
        }

        nextAllowedTime = lastRating + RATE_LIMIT_PERIOD;

        if (block.timestamp >= nextAllowedTime) {
            return (true, 0);
        }

        return (false, nextAllowedTime);
    }

    /**
     * @dev Check if an agent has received any ratings
     * @param agent The address of the agent
     * @return True if the agent has been rated
     */
    function hasBeenRated(address agent) external view nonZeroAddress(agent) returns (bool) {
        return s_hasBeenRated[agent];
    }

    /**
     * @dev Clears rated-agent bookkeeping when the last rating for an agent is removed.
     */
    function _clearRatedAgent(address targetAgent) internal {
        uint256 idx = s_ratedAgentIndex[targetAgent];
        uint256 lastIdx = s_ratedAgents.length - 1;
        if (idx != lastIdx) {
            address lastAgent = s_ratedAgents[lastIdx];
            s_ratedAgents[idx] = lastAgent;
            s_ratedAgentIndex[lastAgent] = idx;
        }
        s_ratedAgents.pop();
        delete s_ratedAgentIndex[targetAgent];
        s_hasBeenRated[targetAgent] = false;
    }
}
