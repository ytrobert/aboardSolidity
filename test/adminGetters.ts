import {loadFixture} from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
const hre = require("hardhat");


describe("Admin_Getters", function () {
  async function deployPerpetualFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, signer, otherAccount] = await ethers.getSigners();
    //contract deployment: PerpetualV1
    const PerpetualV1 = await ethers.getContractFactory("PerpetualV1"); //PerpetualProxy
    const perp = await PerpetualV1.deploy();
    //contract deployment: PerpetualProxy
    const PerpetualProxy = await ethers.getContractFactory("PerpetualProxy");
    const perpetualp = await PerpetualProxy.deploy(perp.address, owner.address, "0x");
    const jsonStr = await hre.artifacts.readArtifact("PerpetualV1");
    const perpetual = new ethers.Contract(perpetualp.address, jsonStr.abi, owner);
    //contract deployment: token test model
    const tokenTest = await ethers.getContractFactory("tokenTest");
    const token = await tokenTest.deploy();
    const nftTest = await ethers.getContractFactory("nftTest");
    const nft1 = await nftTest.deploy("nft test model", "nft1");
    //console.log(nft1);
    await nft1.mint(owner.address, 1);
    await nft1.mint(owner.address, 2);
    await nft1.mint(owner.address, 3);
    //await token.mint(owner.address, 2000); //owner:2000
    //await token.mint(otherAccount.address, 1000); //otherAccount: 1000
    //contract initialization
    //await perpetual.setSigner(signer.address);
    return { perpetual, token, owner, signer, otherAccount, nft1 };
  }

  describe("setGateway", function () {
    it("Admin can set gateway", async function () {
      const { perpetual, token, otherAccount } = await loadFixture(deployPerpetualFixture);
      //setter
      await perpetual.setGateway(otherAccount.address);
      //getter
      expect(await perpetual.getGateway()).to.equal(otherAccount.address);
    });
    it("Others cannot set gateway", async function () {
      const { perpetual, token, otherAccount } = await loadFixture(deployPerpetualFixture);
      //setter
      await expect(perpetual.connect(otherAccount).setGateway(otherAccount.address))
        .to.be.revertedWith("Adminable: caller is not admin");
    });
  });

  describe("setSigner", function () {
    it("Admin can set signer", async function () {
      const { perpetual, token, otherAccount } = await loadFixture(deployPerpetualFixture);
      //setter
      await perpetual.setSigner(otherAccount.address);
      //getter
      expect(await perpetual.getSigner()).to.equal(otherAccount.address);
    });
    it("Others cannot set signer", async function () {
      const { perpetual, token, otherAccount } = await loadFixture(deployPerpetualFixture);
      //setter
      await expect(perpetual.connect(otherAccount).setSigner(otherAccount.address))
        .to.be.revertedWith("Adminable: caller is not admin");
    });
  });

  describe("setNftContract", function () {
    it("Admin can set NftContract", async function () {
      const { perpetual, token, otherAccount } = await loadFixture(deployPerpetualFixture);
      //setter
      await perpetual.setNftContract(otherAccount.address, true);
      //getter
      expect(await perpetual.getNftContractStatus(otherAccount.address)).to.equal(true);
      //getNftStakingList
      expect(await perpetual.getNftStakingList(token.address, [otherAccount.address])).to.deep.equal([]);
      //getNftStakingList
      expect(await perpetual.getNftStakingList(token.address, [])).to.deep.equal([]);
      //setter
      await perpetual.setNftContract(perpetual.address, false);
      //getter
      expect(await perpetual.getNftContractStatus(perpetual.address)).to.equal(false);
      //getNftStakingList
      await expect(perpetual.getNftStakingList(token.address, [perpetual.address]))
        .to.be.revertedWith("Aboard: nftContract is not on");
    });
    it("Others cannot set NftContract", async function () {
      const { perpetual, token, otherAccount } = await loadFixture(deployPerpetualFixture);
      //setter
      await expect(perpetual.connect(otherAccount).setNftContract(otherAccount.address, true))
        .to.be.revertedWith("Adminable: caller is not admin");
    });
  });
  
  describe("tokensOfOwner", function () {
    it("can get tokens list", async function () {
      const { perpetual, owner, nft1 } = await loadFixture(deployPerpetualFixture);
      expect(await perpetual.tokensOfOwner(nft1.address, owner.address)).to.deep.equal([1, 2, 3]);
    });
  });

  describe("setNftBeginEndTimestamp", function () {
    it("Admin can set NftBeginEndTimestamp", async function () {
      const { perpetual, token, otherAccount } = await loadFixture(deployPerpetualFixture);
      //setter
      await perpetual.setNftBeginEndTimestamp(123, 456);
      //getter
      expect(await perpetual.getNftBeginEndTimestamp()).to.deep.equal([123,456]);
    });
    it("Begin <= end timestamp ", async function () {
      const { perpetual, token, otherAccount } = await loadFixture(deployPerpetualFixture);
      //setter
      await expect(perpetual.setNftBeginEndTimestamp(456, 123))
        .to.be.revertedWith("Aboard: NFT begin > end timestamp");
    });
    it("Others cannot set NftBeginEndTimestamp", async function () {
      const { perpetual, token, otherAccount } = await loadFixture(deployPerpetualFixture);
      //setter
      await expect(perpetual.connect(otherAccount).setNftBeginEndTimestamp(123, 456))
        .to.be.revertedWith("Adminable: caller is not admin");
    });
  });
  
  describe("setBrokerMin", function () {
    it("Admin can set brokerMin", async function () {
      const { perpetual, token, otherAccount } = await loadFixture(deployPerpetualFixture);
      //setter
      await perpetual.setBrokerMin('USDC', 123);
      //getter
      expect(await perpetual.getBrokerMin('USDC')).to.equal(123);
    });
    it("Others cannot set NftBeginEndTimestamp", async function () {
      const { perpetual, token, otherAccount } = await loadFixture(deployPerpetualFixture);
      //setter
      await expect(perpetual.connect(otherAccount).setBrokerMin('USDC', 123))
        .to.be.revertedWith("Adminable: caller is not admin");
    });
  });


  describe("setTokenMap", function () {
    it("Admin can set token map", async function () {
      const { perpetual, token, otherAccount } = await loadFixture(deployPerpetualFixture);
      //setter
      await perpetual.setTokenMap(0, "USDC", token.address, 1);
      await perpetual.setTokenMap(1, "ETH", token.address, 1);
      //getter
      expect((await perpetual.getTokenMap(0, "USDC")).token).to.equal(token.address);
      expect((await perpetual.getTokenMap(0, "USDC")).status).to.equal(1);
      expect((await perpetual.getTokenMap(0, "ETH")).token).to.equal(ethers.constants.AddressZero);
      expect((await perpetual.getTokenMap(0, "ETH")).status).to.equal(0);
      expect((await perpetual.getTokenMap(1, "USDC")).token).to.equal(ethers.constants.AddressZero);
      expect((await perpetual.getTokenMap(1, "USDC")).status).to.equal(0);
      expect((await perpetual.getTokenMap(1, "ETH")).token).to.equal(token.address);
      expect((await perpetual.getTokenMap(1, "ETH")).status).to.equal(1);

    });
    it("Others cannot set token map", async function () {
      const { perpetual, token, otherAccount } = await loadFixture(deployPerpetualFixture);
      //setter
      await expect(perpetual.connect(otherAccount).setTokenMap(0, "USDC", token.address, 1))
        .to.be.revertedWith("Adminable: caller is not admin");
      await expect(perpetual.connect(otherAccount).setTokenMap(1, "USDC", token.address, 1))
        .to.be.revertedWith("Adminable: caller is not admin");
    });
  });

});