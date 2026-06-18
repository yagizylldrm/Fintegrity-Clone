import { network } from "hardhat";
import { expect } from "chai";

describe("FintegrityCore", function () {
  let ethers: any;
  let core: any;
  let deployer: any;
  let user: any;

  before(async function () {
    const net = await network.create();
    ethers = net.ethers;
    const signers = await ethers.getSigners();
    deployer = signers[0];
    user = signers[1];
  });

  beforeEach(async function () {
    const FintegrityCore = await ethers.getContractFactory("FintegrityCore");
    core = await FintegrityCore.deploy();
    await core.waitForDeployment();
  });

  it("should add document log and retrieve it", async function () {
    const docId = "DOC-TEST-001";
    const docHash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const metadata = "e-Fatura";

    await expect(core.addDocumentLog(docId, docHash, metadata))
      .to.emit(core, "LogAdded")
      .withArgs(docId, docHash, deployer.address);

    const log = await core.getDocumentLog(docId);
    expect(log[0]).to.equal(docId);
    expect(log[1]).to.equal(docHash);
    expect(log[3]).to.equal(deployer.address);
    expect(log[4]).to.equal(metadata);
  });

  it("should revert if document already exists", async function () {
    const docId = "DOC-TEST-001";
    const docHash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const metadata = "e-Fatura";

    await core.addDocumentLog(docId, docHash, metadata);
    await expect(core.addDocumentLog(docId, docHash, metadata)).to.be.revertedWith(
      "Document already exists!"
    );
  });

  it("should revert if document is not found", async function () {
    await expect(core.getDocumentLog("NON-EXISTENT")).to.be.revertedWith(
      "Document not found!"
    );
  });
});
