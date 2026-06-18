import { network } from "hardhat";
const { ethers } = await network.create();
console.log("ethers is defined:", ethers !== undefined);
const signers = await ethers.getSigners();
console.log("signers count:", signers.length);
console.log("first signer address:", signers[0]?.address);

