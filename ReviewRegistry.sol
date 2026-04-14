// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ReviewRegistry {

    // ==============================
    // STRUCT
    // ==============================
    struct ReviewRecord {
        uint256 reviewId;
        bytes32 reviewHash;
        string orderId;
        string productId;
        address submitter;
        uint256 timestamp;
        bool exists;
    }

    // ==============================
    // STATE VARIABLES
    // ==============================
    address public immutable owner;
    address public backendSigner;

    uint256 public totalReviews;

    // orderId => review
    mapping(string => ReviewRecord) private reviewsByOrder;

    // reviewId => review
    mapping(uint256 => ReviewRecord) private reviewsById;

    // hash => orderId
    mapping(bytes32 => string) private orderByHash;

    // ==============================
    // EVENTS
    // ==============================
    event ReviewSubmitted(
        uint256 indexed reviewId,
        string indexed orderId,
        bytes32 indexed reviewHash,
        string productId,
        address submitter,
        uint256 timestamp
    );

    event BackendSignerUpdated(
        address indexed oldSigner,
        address indexed newSigner
    );

    // ==============================
    // ERRORS
    // ==============================
    error NotAuthorized();
    error AlreadyReviewed();
    error InvalidHash();
    error InvalidOrderId();

    // ==============================
    // MODIFIERS
    // ==============================
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotAuthorized();
        _;
    }

    modifier onlyBackend() {
        if (msg.sender != backendSigner) revert NotAuthorized();
        _;
    }

    // ==============================
    // CONSTRUCTOR
    // ==============================
    constructor(address _backendSigner) {
        owner = msg.sender;
        backendSigner = _backendSigner;
    }

    // ==============================
    // SUBMIT REVIEW
    // ==============================
    function submitReview(
        string calldata orderId,
        string calldata productId,
        bytes32 reviewHash
    ) external onlyBackend {

        if (bytes(orderId).length == 0) revert InvalidOrderId();
        if (reviewHash == bytes32(0)) revert InvalidHash();
        if (reviewsByOrder[orderId].exists) revert AlreadyReviewed();

        totalReviews++;

        ReviewRecord memory newReview = ReviewRecord({
            reviewId: totalReviews,
            reviewHash: reviewHash,
            orderId: orderId,
            productId: productId,
            submitter: msg.sender,
            timestamp: block.timestamp,
            exists: true
        });

        reviewsByOrder[orderId] = newReview;
        reviewsById[totalReviews] = newReview;
        orderByHash[reviewHash] = orderId;

        emit ReviewSubmitted(
            totalReviews,
            orderId,
            reviewHash,
            productId,
            msg.sender,
            block.timestamp
        );
    }

    // ==============================
    // CHECK ORDER REVIEWED
    // ==============================
    function hasReviewed(string calldata orderId)
        external
        view
        returns (bool)
    {
        return reviewsByOrder[orderId].exists;
    }

    // ==============================
    // GET REVIEW BY ORDER
    // ==============================
    function getReviewByOrder(string calldata orderId)
        external
        view
        returns (
            uint256 reviewId,
            bytes32 reviewHash,
            address submitter,
            uint256 timestamp
        )
    {
        ReviewRecord storage r = reviewsByOrder[orderId];
        require(r.exists, "Review not found");

        return (
            r.reviewId,
            r.reviewHash,
            r.submitter,
            r.timestamp
        );
    }

    // ==============================
    // GET REVIEW BY ID
    // ==============================
    function getReviewById(uint256 reviewId)
        external
        view
        returns (
            string memory orderId,
            string memory productId,
            bytes32 reviewHash,
            uint256 timestamp
        )
    {
        ReviewRecord storage r = reviewsById[reviewId];
        require(r.exists, "Review not found");

        return (
            r.orderId,
            r.productId,
            r.reviewHash,
            r.timestamp
        );
    }

    // ==============================
    // VERIFY REVIEW
    // ==============================
    function verifyReview(
        string calldata orderId,
        string calldata reviewContent,
        string calldata userId
    )
        external
        view
        returns (
            bool isValid,
            bytes32 storedHash
        )
    {
        ReviewRecord storage r = reviewsByOrder[orderId];

        if (!r.exists) {
            return (false, bytes32(0));
        }

        bytes32 computedHash = keccak256(
            abi.encodePacked(orderId, "-", userId, "-", reviewContent)
        );

        return (
            computedHash == r.reviewHash,
            r.reviewHash
        );
    }

    // ==============================
    // HASH LOOKUP
    // ==============================
    function getOrderByHash(bytes32 reviewHash)
        external
        view
        returns (string memory)
    {
        return orderByHash[reviewHash];
    }

    // ==============================
    // UPDATE BACKEND SIGNER
    // ==============================
    function setBackendSigner(address newSigner)
        external
        onlyOwner
    {
        require(newSigner != address(0), "Zero address");

        emit BackendSignerUpdated(
            backendSigner,
            newSigner
        );

        backendSigner = newSigner;
    }
}