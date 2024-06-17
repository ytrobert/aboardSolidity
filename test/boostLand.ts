import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
const hre = require("hardhat");

describe("nftBoost_nftLand", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployPerpetualFixture() {
    // Contracts are deployed using the first signer/account by default
    const [admin, otherAccount] = await ethers.getSigners();
    //contract deployment: PerpetualV1
    const PerpetualV1 = await ethers.getContractFactory("PerpetualV1"); //PerpetualProxy
    const perp = await PerpetualV1.deploy();
    //contract deployment: PerpetualProxy
    const PerpetualProxy = await ethers.getContractFactory("PerpetualProxy");
    const perpetualp = await PerpetualProxy.deploy(perp.address, admin.address, "0x");
    const jsonStr = await hre.artifacts.readArtifact("PerpetualV1");
    const perpetual = new ethers.Contract(perpetualp.address, jsonStr.abi, admin);
    //contract deployment: nft erc721 test model
    const nftTest = await ethers.getContractFactory("nftTest");
    const nft1 = await nftTest.deploy("nft test model", "nft1");
    //const nftTest2 = await ethers.getContractFactory("nftTest");
    const nft2 = await nftTest.deploy("nft test model", "nft2");
    await nft1.mint(admin.address, 1);
    await nft1.mint(otherAccount.address,2);
    await nft2.mint(admin.address, 3);
    await nft2.mint(otherAccount.address, 4);
    await perpetual.setNftContract(nft1.address, true);
    await perpetual.setNftContract(nft2.address, true);
    await perpetual.setNftBeginEndTimestamp(0, 9999999999);
    //return { perpetual, admin, nft1, otherAccount };
    return { perpetual, nft1, nft2, admin, otherAccount };
  }

  describe("nftBoost", function () {
    it("Can stake nft", async function () {
      //load
      const { perpetual, admin, nft1, nft2, otherAccount } = await loadFixture(deployPerpetualFixture);
      //approve
      await nft1.setApprovalForAll(perpetual.address, true);
      await nft2.approve(perpetual.address, 3);
      //stake
      await perpetual.nftBoost(admin.address, [nft1.address, nft2.address], [1,3],[0,1]);
      //check
      const stakingList = await perpetual.getNftStakingList(admin.address, [nft1.address, nft2.address]);
      //console.log(stakingList[0]);
      expect(stakingList[0].contractAddr).to.equal(nft1.address);
      expect(stakingList[1].contractAddr).to.equal(nft2.address);
      expect(stakingList[0].nftInfos[0].tokenId).to.equal(1);
      expect(stakingList[0].nftInfos[0].timestamp).to.gt(1685432180);
      expect(stakingList[0].nftInfos[0].usetype).to.equal(0);
      expect(stakingList[1].nftInfos[0].tokenId).to.equal(3);
      expect(stakingList[1].nftInfos[0].timestamp).to.gt(1685432180);
      expect(stakingList[1].nftInfos[0].usetype).to.equal(1);
      expect(await nft1.ownerOf(1)).to.equal(perpetual.address);
      expect(await nft2.ownerOf(3)).to.equal(perpetual.address);
    });
    it("Can emit LogBoost", async function () {
      //load
      const { perpetual, admin, nft1, nft2, otherAccount } = await loadFixture(deployPerpetualFixture);
      //approve
      await nft1.setApprovalForAll(perpetual.address, true);
      await nft2.approve(perpetual.address, 3);
      //stake & check
      await expect(perpetual.nftBoost(admin.address, [nft1.address, nft2.address], [1,3],[0,1]))
        .to.emit(perpetual, "LogBoost")
        .withArgs(admin.address, [nft1.address, nft2.address], [1, 3], [0, 1], gt1685432180);
    });
    it("Can fail if timstamp too small ", async function () {
      //load
      const { perpetual, admin, nft1, nft2, otherAccount } = await loadFixture(deployPerpetualFixture);
      await perpetual.setNftBeginEndTimestamp(9999999998, 9999999999);
      //approve
      await nft1.setApprovalForAll(perpetual.address, true);
      await nft2.approve(perpetual.address, 3);
      //stake & check
      await expect(perpetual.nftBoost(admin.address, [nft1.address, nft2.address], [1,3],[0,1]))
        .to.be.revertedWith("Aboard: nftBoost time incorrect");
    });
    it("Can fail if timstamp too big ", async function () {
      //load
      const { perpetual, admin, nft1, nft2, otherAccount } = await loadFixture(deployPerpetualFixture);
      await perpetual.setNftBeginEndTimestamp(0, 1);
      //approve
      await nft1.setApprovalForAll(perpetual.address, true);
      await nft2.approve(perpetual.address, 3);
      //stake & check
      await expect(perpetual.nftBoost(admin.address, [nft1.address, nft2.address], [1,3],[0,1]))
        .to.be.revertedWith("Aboard: nftBoost time incorrect");
    });
    it("Can fail if [] ", async function () {
      //load
      const { perpetual, admin, nft1, nft2, otherAccount } = await loadFixture(deployPerpetualFixture);
      //approve
      await nft1.setApprovalForAll(perpetual.address, true);
      await nft2.approve(perpetual.address, 3);
      //stake & check
      await expect(perpetual.nftBoost(admin.address, [], [], []))
        .to.be.revertedWith("Aboard: nftBoost blank");
    });
    it("Can fail if boost for others ", async function () {
      //load
      const { perpetual, admin, nft1, nft2, otherAccount } = await loadFixture(deployPerpetualFixture);
      //approve
      await nft1.setApprovalForAll(perpetual.address, true);
      await nft2.approve(perpetual.address, 3);
      //stake & check
      await expect(perpetual.nftBoost(otherAccount.address, [], [], []))
        .to.be.revertedWith("Aboard: nftBoost msg.sender is not account");
    });
    it("Can fail if length mismatch ", async function () {
      //load
      const { perpetual, admin, nft1, nft2, otherAccount } = await loadFixture(deployPerpetualFixture);
      //approve
      await nft1.setApprovalForAll(perpetual.address, true);
      await nft2.approve(perpetual.address, 3);
      //stake & check
      await expect(perpetual.nftBoost(admin.address, [nft1.address, nft2.address], [1,3], [0]))
        .to.be.revertedWith("Aboard: nftBoost length mismatch");
    });
    it("Can fail if not approved ", async function () {
      //load
      const { perpetual, admin, nft1, nft2, otherAccount } = await loadFixture(deployPerpetualFixture);
      //approve
      //await nft1.setApprovalForAll(perpetual.address, true);
      //await nft2.approve(perpetual.address, 3);
      //stake & check
      await expect(perpetual.nftBoost(admin.address, [nft1.address, nft2.address], [1,3],[0,1]))
        .to.be.revertedWith("ERC721: caller is not token owner or approved");
    });
    it("Can fail if not the owner ", async function () {
      //load
      const { perpetual, admin, nft1, nft2, otherAccount } = await loadFixture(deployPerpetualFixture);
      //approve
      await nft1.setApprovalForAll(perpetual.address, true);
      await nft2.approve(perpetual.address, 3);
      //stake & check
      await expect(perpetual.nftBoost(admin.address, [nft1.address, nft2.address], [2,3],[0,1]))
        .to.be.revertedWith("ERC721: caller is not token owner or approved");
    });
    it("Can fail if nftContract is not set ", async function () {
      //load
      const { perpetual, admin, nft1, nft2, otherAccount } = await loadFixture(deployPerpetualFixture);
      //approve
      await nft1.setApprovalForAll(perpetual.address, true);
      await nft2.approve(perpetual.address, 3);
      //stake & check
      await expect(perpetual.nftBoost(admin.address, [otherAccount.address, nft2.address], [2,3],[0,1]))
        .to.be.revertedWith("Aboard: nftBoost contract is not on");
    });
  });

  describe("nftLand", function () {
    async function nftLandFixture() {
      //load
      const { perpetual, admin, nft1, nft2, otherAccount } = await loadFixture(deployPerpetualFixture);
      //approve
      await nft1.setApprovalForAll(perpetual.address, true);
      await nft2.approve(perpetual.address, 3);
      //stake
      await perpetual.nftBoost(admin.address, [nft1.address, nft2.address], [1,3], [0,1]);
      await perpetual.setNftBeginEndTimestamp(0, 1);
      return {perpetual, admin, nft1, nft2, otherAccount};
    }
    it("Can unstake nft", async function () {
      //load
      const { perpetual, admin, nft1, nft2, otherAccount } = await loadFixture(nftLandFixture);
      //unstake
      await perpetual.nftLand(admin.address, [nft1.address, nft2.address], [1,3]);
      //check
      expect((await perpetual.getNftStakingList(admin.address, [nft1.address, nft2.address]))).to.deep.equal([]);
      expect(await nft1.ownerOf(1)).to.equal(admin.address);
      expect(await nft2.ownerOf(3)).to.equal(admin.address);
    });
    it("Can emit LogBoost", async function () {
      //load
      const { perpetual, admin, nft1, nft2, otherAccount } = await loadFixture(nftLandFixture);
      await perpetual.setNftBeginEndTimestamp(9999999998, 9999999999);
      //unstake & check
      await expect(perpetual.nftLand(admin.address, [nft1.address, nft2.address], [1,3]))
        .to.emit(perpetual, "LogLand")
        .withArgs(admin.address, [nft1.address, nft2.address], [1,3], gt1685432180);
    });
    it("Can fail if []", async function () {
      //load
      const { perpetual, admin, nft1, nft2, otherAccount } = await loadFixture(nftLandFixture);
      //unstake & check
      await expect(perpetual.nftLand(admin.address, [], []))
        .to.be.revertedWith("Aboard: nftLand blank");
    });
    it("Can fail if land for others ", async function () {
      //load
      const { perpetual, admin, nft1, nft2, otherAccount } = await loadFixture(nftLandFixture);
      //stake & check
      await expect(perpetual.nftLand(otherAccount.address, [], []))
        .to.be.revertedWith("Aboard: nftLand msg.sender is not account");
    });
    it("Can fail if length mismatch ", async function () {
      //load
      const { perpetual, admin, nft1, nft2, otherAccount } = await loadFixture(nftLandFixture);
      //stake & check
      await expect(perpetual.nftLand(admin.address, [nft1.address, nft2.address], [1]))
        .to.be.revertedWith("Aboard: nftLand length mismatch");
    });
    it("Can fail if nftContract is not set ", async function () {
      //load
      const { perpetual, admin, nft1, nft2, otherAccount } = await loadFixture(nftLandFixture);
      //stake & check
      await expect(perpetual.nftLand(admin.address, [otherAccount.address, nft2.address], [2,3]))
        .to.be.revertedWith("Aboard: nftLand contract is not on");
    });
    it("Can fail if nft token is not staked ", async function () {
      //load
      const { perpetual, admin, nft1, nft2, otherAccount } = await loadFixture(nftLandFixture);
      //stake & check
      await expect(perpetual.nftLand(admin.address, [nft1.address, nft2.address], [4,3]))
        .to.be.revertedWith("Aboard: nftLand token is not boosting");
    });
    it("Can fail if timestamp >= begin time & timestamp <= end time ", async function () {
      //load
      const { perpetual, admin, nft1, nft2, otherAccount } = await loadFixture(nftLandFixture);
      await perpetual.setNftBeginEndTimestamp(0, 9999999999);
      //stake & check
      await expect(perpetual.nftLand(admin.address, [nft1.address, nft2.address], [4,3]))
        .to.be.revertedWith("Aboard: nftLand time incorrect");
    });

  });
});

function gt1685432180(x: number): boolean {
  return x > 1685432180;
}