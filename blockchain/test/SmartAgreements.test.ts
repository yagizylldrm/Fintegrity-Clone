import { network } from "hardhat";
import { expect } from "chai";

describe("SmartAgreements", function () {
  let ethers: any;
  let agreements: any;
  let partyA: any;
  let partyB: any;
  let stranger: any;

  before(async function () {
    const net = await network.create();
    ethers = net.ethers;
    const signers = await ethers.getSigners();
    partyA = signers[0];
    partyB = signers[1];
    stranger = signers[2];
  });

  beforeEach(async function () {
    const SmartAgreements = await ethers.getContractFactory("SmartAgreements");
    agreements = await SmartAgreements.deploy();
    await agreements.waitForDeployment();
  });

  it("should create an agreement with Pending state", async function () {
    const termsHash = "0x9876543210abcdef9876543210abcdef9876543210abcdef9876543210abcdef";
    
    await expect(agreements.connect(partyA).createAgreement(partyB.address, termsHash))
      .to.emit(agreements, "AgreementCreated")
      .withArgs(1, partyA.address, partyB.address);

    const agg = await agreements.agreements(1);
    expect(agg.id).to.equal(1n);
    expect(agg.partyA).to.equal(partyA.address);
    expect(agg.partyB).to.equal(partyB.address);
    expect(agg.termsHash).to.equal(termsHash);
    expect(agg.state).to.equal(0); // 0 = Pending
  });

  it("should allow partyB to approve a pending agreement", async function () {
    const termsHash = "0x9876543210abcdef9876543210abcdef9876543210abcdef9876543210abcdef";
    await agreements.connect(partyA).createAgreement(partyB.address, termsHash);

    await expect(agreements.connect(partyB).approveAgreement(1))
      .to.emit(agreements, "AgreementStateChanged")
      .withArgs(1, 1); // 1 = Approved

    const agg = await agreements.agreements(1);
    expect(agg.state).to.equal(1); // 1 = Approved
  });

  it("should revert if non-partyB tries to approve the agreement", async function () {
    const termsHash = "0x9876543210abcdef9876543210abcdef9876543210abcdef9876543210abcdef";
    await agreements.connect(partyA).createAgreement(partyB.address, termsHash);

    await expect(agreements.connect(partyA).approveAgreement(1)).to.be.revertedWith(
      "Only Party B can approve"
    );
    await expect(agreements.connect(stranger).approveAgreement(1)).to.be.revertedWith(
      "Only Party B can approve"
    );
  });

  it("should allow partyA or partyB to reject a pending agreement", async function () {
    const termsHash = "0x9876543210abcdef9876543210abcdef9876543210abcdef9876543210abcdef";
    
    // Reject by Party B
    await agreements.connect(partyA).createAgreement(partyB.address, termsHash);
    await expect(agreements.connect(partyB).rejectAgreement(1))
      .to.emit(agreements, "AgreementStateChanged")
      .withArgs(1, 2); // 2 = Rejected

    // Reject by Party A
    await agreements.connect(partyA).createAgreement(partyB.address, termsHash);
    await expect(agreements.connect(partyA).rejectAgreement(2))
      .to.emit(agreements, "AgreementStateChanged")
      .withArgs(2, 2); // 2 = Rejected
  });

  it("should allow partyA or partyB to complete an approved agreement", async function () {
    const termsHash = "0x9876543210abcdef9876543210abcdef9876543210abcdef9876543210abcdef";
    await agreements.connect(partyA).createAgreement(partyB.address, termsHash);
    await agreements.connect(partyB).approveAgreement(1);

    await expect(agreements.connect(partyA).completeAgreement(1))
      .to.emit(agreements, "AgreementStateChanged")
      .withArgs(1, 3); // 3 = Completed

    const agg = await agreements.agreements(1);
    expect(agg.state).to.equal(3); // 3 = Completed
  });

  it("should revert completeAgreement if contract is not approved", async function () {
    const termsHash = "0x9876543210abcdef9876543210abcdef9876543210abcdef9876543210abcdef";
    await agreements.connect(partyA).createAgreement(partyB.address, termsHash);

    await expect(agreements.connect(partyA).completeAgreement(1)).to.be.revertedWith(
      "Agreement not approved"
    );
  });
});
