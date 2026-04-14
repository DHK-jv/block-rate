import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import "dotenv/config";
import { ethers } from "ethers";

/**
 * MODULE TRIỂN KHAI SMART CONTRACT REVIEW REGISTRY
 * 
 * Bỏ qua biến môi trường ảo của Hardhat, fix cứng địa chỉ ví của Server
 * để đảm bảo không bao giờ bị lỗi NotAuthorized do môi trường.
 */
const ReviewRegistryModule = buildModule("ReviewRegistryModule", (m) => {
  const backendSigner = "0x7Bd19f409088D2e36d05DeA47D8EAc4b0c11c6DF";
  const reviewRegistry = m.contract("ReviewRegistry", [backendSigner]);

  return { reviewRegistry };
});

export default ReviewRegistryModule;
