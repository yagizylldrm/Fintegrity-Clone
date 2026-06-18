import { network } from "hardhat";

async function main() {
  const { ethers } = await network.create();
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy FintegrityCore
  const FintegrityCore = await ethers.getContractFactory("FintegrityCore");
  const core = await FintegrityCore.deploy();
  await core.waitForDeployment();
  console.log("FintegrityCore deployed to:", await core.getAddress());

  // Deploy SmartAgreements
  const SmartAgreements = await ethers.getContractFactory("SmartAgreements");
  const agreements = await SmartAgreements.deploy();
  await agreements.waitForDeployment();
  console.log("SmartAgreements deployed to:", await agreements.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
