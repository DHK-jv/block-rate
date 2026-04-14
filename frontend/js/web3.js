/**
 * BlockRate — Web3 Module (web3.js)
 * Dùng chung cho toàn bộ frontend.
 * Yêu cầu: ethers.js UMD được load trước file này qua CDN.
 *
 * Sử dụng:
 *   const wallet = await BlockRateWeb3.connectWallet();
 *   await BlockRateWeb3.listProduct("BR-001", "0.1", 10);
 *   await BlockRateWeb3.buyProduct("BR-001", "0.1");
 *   const allowed = await BlockRateWeb3.canReview("BR-001", wallet.address);
 */

const BlockRateWeb3 = (() => {
  "use strict";

  // ──────────────────────────────
  // ABI inline (khớp với BlockRateMarket.sol)
  // ──────────────────────────────
  const MARKET_ABI = [
    "function listProduct(string calldata productId, uint256 price, uint256 stock) external",
    "function isSeller(string calldata productId, address addr) external view returns (bool)",
    "function owner() external view returns (address)",
    "event ProductListed(string indexed productId, address indexed seller, uint256 price, uint256 stock)",
    "error ProductAlreadyExists(string productId)",
    "error ProductNotFound(string productId)",
    "error NotSeller(string productId, address caller)",
    "error NotOwner()"
  ];

  // ──────────────────────────────
  // Contract Addresses (theo chainId)
  // ──────────────────────────────
  const ADDRESSES = {
    31337: {
      BlockRateMarket: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    },
    11155111: {
      BlockRateMarket: "", // ← Cập nhật sau khi deploy Sepolia
    },
  };

  // ──────────────────────────────
  // Internal State
  // ──────────────────────────────
  let _provider = null;
  let _signer   = null;
  let _address  = null;
  let _chainId  = null;

  const LS_KEY = "blockrate_wallet";

  // ──────────────────────────────
  // HELPERS
  // ──────────────────────────────
  function _requireEthers() {
    if (typeof ethers === "undefined") {
      throw new Error("ethers.js chưa được load. Hãy thêm CDN ethers vào HTML trước web3.js.");
    }
  }

  function _requireMetaMask() {
    if (!window.ethereum) {
      throw new Error("MetaMask chưa được cài đặt. Vui lòng cài MetaMask tại metamask.io.");
    }
  }

  function _shortAddress(addr) {
    if (!addr) return "";
    return addr.slice(0, 6) + "..." + addr.slice(-4);
  }

  function _getContractAddress(chainId) {
    const addrs = ADDRESSES[Number(chainId)];
    if (!addrs || !addrs.BlockRateMarket) {
      throw new Error(
        `Mạng chainId=${chainId} chưa được hỗ trợ hoặc chưa deploy contract.\n` +
        `Đang hỗ trợ: Hardhat Local (31337), Sepolia (11155111).`
      );
    }
    return addrs.BlockRateMarket;
  }

  function _getContract(signerOrProvider) {
    const addr = _getContractAddress(_chainId);
    return new ethers.Contract(addr, MARKET_ABI, signerOrProvider);
  }

  // Decode custom errors từ ethers v6
  function _decodeError(err) {
    const msg = err?.info?.error?.message || err?.reason || err?.message || "Giao dịch thất bại";

    const errorMap = {
      "ProductAlreadyExists": "Sản phẩm đã được đăng ký trên blockchain.",
      "ProductNotFound"     : "Sản phẩm không tồn tại trên blockchain.",
      "InsufficientPayment" : "Số ETH gửi không đủ để mua sản phẩm.",
      "OutOfStock"          : "Sản phẩm đã hết hàng.",
      "AlreadyPurchased"    : "Bạn đã mua sản phẩm này trước đó.",
      "TransferFailed"      : "Chuyển ETH cho người bán thất bại.",
      "NotSeller"           : "Bạn không phải người bán sản phẩm này.",
      "NotOwner"            : "Bạn không có quyền thực hiện hành động này.",
      "user rejected"       : "Bạn đã từ chối giao dịch trong MetaMask.",
    };

    for (const [key, friendly] of Object.entries(errorMap)) {
      if (msg.toLowerCase().includes(key.toLowerCase())) return friendly;
    }
    return msg;
  }

  // ──────────────────────────────
  // WALLET: KẾT NỐI & API Backend
  // ──────────────────────────────
  async function _backendLogin(address) {
    try {
      await fetch('/api/auth/wallet-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address })
      });
    } catch(err) {
      console.error("Lỗi đăng nhập backend:", err);
    }
  }

  async function _backendLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch(err) {}
  }

  async function connectWallet() {
    _requireEthers();
    _requireMetaMask();

    await window.ethereum.request({ method: "eth_requestAccounts" });

    _provider = new ethers.BrowserProvider(window.ethereum);
    _signer   = await _provider.getSigner();
    _address  = await _signer.getAddress();

    const network = await _provider.getNetwork();
    _chainId = Number(network.chainId);

    localStorage.setItem(LS_KEY, JSON.stringify({ address: _address, chainId: _chainId }));

    await _backendLogin(_address);

    // Lắng nghe thay đổi tài khoản / mạng
    window.ethereum.removeAllListeners("accountsChanged");
    window.ethereum.removeAllListeners("chainChanged");
    window.ethereum.on("accountsChanged", _onAccountsChanged);
    window.ethereum.on("chainChanged", _onChainChanged);

    return { address: _address, chainId: _chainId, shortAddress: _shortAddress(_address) };
  }

  function _onAccountsChanged(accounts) {
    if (accounts.length === 0) {
      disconnectWallet();
    } else {
      _address = accounts[0];
      localStorage.setItem(LS_KEY, JSON.stringify({ address: _address, chainId: _chainId }));
      _backendLogin(_address).then(() => {
        window.dispatchEvent(new CustomEvent("walletChanged", {
          detail: { address: _address, chainId: _chainId, shortAddress: _shortAddress(_address) }
        }));
        window.location.reload(); // Reload trang để backend nhận cookie mới
      });
    }
  }

  function _onChainChanged() {
    // Reload để refresh provider & state
    window.location.reload();
  }

  // ──────────────────────────────
  // WALLET: NGẮT KẾT NỐI
  // ──────────────────────────────
  async function disconnectWallet() {
    _provider = null;
    _signer   = null;
    _address  = null;
    _chainId  = null;
    localStorage.removeItem(LS_KEY);
    await _backendLogout();
    window.dispatchEvent(new CustomEvent("walletDisconnected"));
    window.location.reload();
  }

  // ──────────────────────────────
  // WALLET: LẤY TRẠNG THÁI HIỆN TẠI
  // ──────────────────────────────
  function getWalletState() {
    const saved = localStorage.getItem(LS_KEY);
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }

  // Khôi phục kết nối nếu đã từng connect (không cần popup lại)
  async function restoreWallet() {
    if (!localStorage.getItem(LS_KEY)) return null;

    _requireEthers();
    if (!window.ethereum) return null;

    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    if (accounts.length === 0) {
      disconnectWallet();
      return null;
    }

    _provider = new ethers.BrowserProvider(window.ethereum);
    _signer   = await _provider.getSigner();
    _address  = accounts[0];

    const network = await _provider.getNetwork();
    _chainId = Number(network.chainId);

    localStorage.setItem(LS_KEY, JSON.stringify({ address: _address, chainId: _chainId }));

    await _backendLogin(_address);

    window.ethereum.removeAllListeners("accountsChanged");
    window.ethereum.removeAllListeners("chainChanged");
    window.ethereum.on("accountsChanged", _onAccountsChanged);
    window.ethereum.on("chainChanged", _onChainChanged);

    return { address: _address, chainId: _chainId, shortAddress: _shortAddress(_address) };
  }

  // ──────────────────────────────
  // SELLER: ĐĂNG SẢN PHẨM
  // ──────────────────────────────
  /**
   * @param {string} productId   — ID sản phẩm (MongoDB _id hoặc BR-XXXX)
   * @param {string} priceEth    — Giá bằng ETH (vd: "0.05")
   * @param {number} stock       — Số lượng tồn kho
   * @returns {object}           — { txHash, receipt }
   */
  async function listProduct(productId, priceEth, stock) {
    if (!_signer) throw new Error("Chưa kết nối ví. Hãy nhấn 'Kết nối MetaMask'.");
    try {
      const contract = _getContract(_signer);
      const priceWei = ethers.parseEther(String(priceEth));
      const tx = await contract.listProduct(productId, priceWei, BigInt(stock));
      const receipt = await tx.wait();
      return { txHash: receipt.hash, receipt };
    } catch (err) {
      throw new Error(_decodeError(err));
    }
  }


  // ──────────────────────────────
  // VIEW: THÔNG TIN SẢN PHẨM
  // ──────────────────────────────
  /**
   * @param {string} productId
   * @returns {{ seller, priceEth, priceWei, stock, totalSold, exists }}
   */
  async function getProduct(productId) {
    try {
      const rpc = _provider || new ethers.BrowserProvider(window.ethereum);
      const contract = _getContract(rpc);
      const [seller, price, stock, totalSold, exists] = await contract.getProduct(productId);
      return {
        seller,
        priceWei: price.toString(),
        priceEth: ethers.formatEther(price),
        stock: Number(stock),
        totalSold: Number(totalSold),
        exists,
      };
    } catch {
      return null;
    }
  }

  // ──────────────────────────────
  // VIEW: KIỂM TRA SELLER
  // ──────────────────────────────
  async function isSeller(productId, addr) {
    try {
      const rpc = _provider || new ethers.BrowserProvider(window.ethereum);
      const contract = _getContract(rpc);
      return await contract.isSeller(productId, addr);
    } catch {
      return false;
    }
  }

  // ──────────────────────────────
  // UTILITIES
  // ──────────────────────────────
  function formatAddress(addr) { return _shortAddress(addr); }

  function getEtherscanUrl(txHash, chainId) {
    const id = chainId || _chainId;
    if (id === 11155111) return `https://sepolia.etherscan.io/tx/${txHash}`;
    if (id === 1)        return `https://etherscan.io/tx/${txHash}`;
    return `#tx-${txHash}`;
  }

  // ──────────────────────────────
  // PUBLIC API
  // ──────────────────────────────
  return {
    connectWallet,
    disconnectWallet,
    restoreWallet,
    getWalletState,
    listProduct,
    getProduct,
    isSeller,
    formatAddress,
    getEtherscanUrl,
    get address() { return _address; },
    get chainId() { return _chainId; },
    get isConnected() { return !!_address; },
  };
})();

// Expose globally
window.BlockRateWeb3 = BlockRateWeb3;
