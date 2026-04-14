// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title BlockRateMarket
/// @notice Marketplace contract: Seller lists products, Buyer purchases, Review gate enforced on-chain
contract BlockRateMarket {

    // ==============================
    // STRUCTS
    // ==============================
    struct Product {
        string productId;
        address payable seller;
        uint256 price;    // in wei
        uint256 stock;
        uint256 totalSold;
        bool exists;
    }

    // ==============================
    // STATE VARIABLES
    // ==============================
    address public immutable owner;

    // productId => Product
    mapping(string => Product) private products;


    // ==============================
    // EVENTS
    // ==============================
    event ProductListed(
        string indexed productId,
        address indexed seller,
        uint256 price,
        uint256 stock
    );

    event StockUpdated(
        string indexed productId,
        uint256 newStock
    );

    // ==============================
    // ERRORS
    // ==============================
    error ProductAlreadyExists(string productId);
    error ProductNotFound(string productId);

    error NotSeller(string productId, address caller);
    error NotOwner();

    // ==============================
    // MODIFIERS
    // ==============================
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    // ==============================
    // CONSTRUCTOR
    // ==============================
    constructor() {
        owner = msg.sender;
    }

    // ==============================
    // SELLER: LIST PRODUCT
    // ==============================
    /// @notice Seller đăng sản phẩm lên blockchain
    /// @param productId ID sản phẩm (khớp với MongoDB _id)
    /// @param price     Giá tính bằng wei
    /// @param stock     Số lượng tồn kho ban đầu
    function listProduct(
        string calldata productId,
        uint256 price,
        uint256 stock
    ) external {
        if (products[productId].exists) revert ProductAlreadyExists(productId);
        require(price > 0, "Price must be > 0");
        require(stock > 0, "Stock must be > 0");

        products[productId] = Product({
            productId: productId,
            seller: payable(msg.sender),
            price: price,
            stock: stock,
            totalSold: 0,
            exists: true
        });

        emit ProductListed(productId, msg.sender, price, stock);
    }

    // ==============================
    // SELLER: UPDATE STOCK
    // ==============================
    /// @notice Seller cập nhật số lượng tồn kho
    function updateStock(string calldata productId, uint256 newStock) external {
        Product storage p = products[productId];
        if (!p.exists) revert ProductNotFound(productId);
        if (msg.sender != p.seller) revert NotSeller(productId, msg.sender);

        p.stock = newStock;
        emit StockUpdated(productId, newStock);
    }


    // ==============================
    // VIEW: THÔNG TIN SẢN PHẨM
    // ==============================
    function getProduct(string calldata productId)
        external
        view
        returns (
            address seller,
            uint256 price,
            uint256 stock,
            uint256 totalSold,
            bool exists
        )
    {
        Product storage p = products[productId];
        return (p.seller, p.price, p.stock, p.totalSold, p.exists);
    }

    // ==============================
    // VIEW: KIỂM TRA SELLER
    // ==============================
    function isSeller(string calldata productId, address addr)
        external
        view
        returns (bool)
    {
        Product storage p = products[productId];
        return p.exists && p.seller == addr;
    }
}
