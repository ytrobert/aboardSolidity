import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
//const jsonStr = require('C:/Users/yangt/yt_try/web3/hardhat/perpetual_ts/artifacts/contracts/protocol/v1/PerpetualV1.sol/PerpetualV1.json');
//const jsonStr = require('../artifacts/contracts/protocol/v1/PerpetualV1.sol/PerpetualV1.json');
const hre = require("hardhat");

describe("Deposit_Withdraw", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
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
    await token.mint(owner.address, 2000); //owner:2000
    await token.mint(otherAccount.address, 1000); //otherAccount: 1000
    //contract initialization
    await perpetual.setSigner(signer.address);
    return { perpetual, token, owner, signer, otherAccount };
  }

  describe("deposit", function () {
    it("Can deposit USDC", async function () {
      const { perpetual, token, otherAccount } = await loadFixture(deployPerpetualFixture);
      //configure perpetual
      await perpetual.setTokenMap(0, "USDC", token.address, 1);
      await perpetual.setTokenMap(3, "USDC", token.address, 1);
      await perpetual.setBrokerMin('USDC', 123);
      //approve
      const tk = token.connect(otherAccount);
      await tk.approve(perpetual.address, ethers.constants.MaxUint256);
      //deposit
      const contract = perpetual.connect(otherAccount);
      await expect(
        contract.deposit(otherAccount.address, 0, 'USDC', 20))
        .to.changeTokenBalances(token, [otherAccount, perpetual], [-20, 20]);
      //configure perpetual
      await perpetual.setTokenMap(0, "USDC", token.address, 0);
      await perpetual.setTokenMap(2, "USDC", token.address, 1);
      //deposit
      await expect(
        contract.deposit(otherAccount.address, 2, 'USDC', 20))
        .to.changeTokenBalances(token, [otherAccount, perpetual], [-20, 20]);
      //broker
      await expect(
        contract.deposit(otherAccount.address, 3, 'USDC', 123))
        .to.changeTokenBalances(token, [otherAccount, perpetual], [-123, 123]);
    });
    it("Can emit LogDeposit", async function () {
      const { perpetual, token, otherAccount } = await loadFixture(deployPerpetualFixture);
      //configure perpetual
      await perpetual.setTokenMap(1, "USDC", token.address, 1);
      //approve
      const tk = token.connect(otherAccount);
      await tk.approve(perpetual.address, ethers.constants.MaxUint256);
      //deposit
      const contract = perpetual.connect(otherAccount);
      await expect(contract.deposit(otherAccount.address, 1, 'USDC', 20))
        .to.emit(perpetual, "LogDeposit")
        .withArgs(otherAccount.address, 1, "USDC", 20);
    });
    it("Can fail if deposit vaule too small in broker type", async function () {
      const { perpetual, token, otherAccount } = await loadFixture(deployPerpetualFixture);
      //configure perpetual
      await perpetual.setTokenMap(3, "USDC", token.address, 1);
      await perpetual.setBrokerMin('USDC', 123);
      //approve
      const tk = token.connect(otherAccount);
      await tk.approve(perpetual.address, ethers.constants.MaxUint256);
      //deposit
      const contract = perpetual.connect(otherAccount);
      await expect(contract.deposit(otherAccount.address, 3, 'USDC', 20))
        .to.be.revertedWith("Aboard: broker deposit too small");
    });  
    it("Can fail if deposit for others", async function () {
      const { perpetual, token, owner, otherAccount } = await loadFixture(deployPerpetualFixture);
      //configure perpetual
      await perpetual.setTokenMap(0, "USDC", token.address, 1);
      //approve
      //const tk = token.connect(otherAccount);
      await token.approve(perpetual.address, ethers.constants.MaxUint256);
      await expect(perpetual.deposit(otherAccount.address, 0, 'USDC', 20))
        .to.be.revertedWith("Aboard: deposit msg.sender is not account");
      //deposit
      //const contract = perpetual.connect(otherAccount);
      //   await expect(perpetual.deposit(otherAccount.address, 0, 'USDC', 20))
      //     .to.changeTokenBalances(token, [owner, perpetual], [-20, 20])
      //     .to.emit(perpetual, "LogDeposit")
      //     .withArgs(otherAccount.address, "USDC", 20);
    });
    it("Can fail if is not approve", async function () {
      const { perpetual, token, otherAccount } = await loadFixture(deployPerpetualFixture);
      //configure perpetual
      await perpetual.setTokenMap(1, "USDC", token.address, 1);
      //approve
      // const tk = token.connect(otherAccount);
      // await tk.approve(perpetual.address, ethers.constants.MaxUint256);
      //deposit
      const contract = perpetual.connect(otherAccount);
      await expect(contract.deposit(otherAccount.address, 1, 'USDC', 20))
        .to.be.revertedWith("ERC20: insufficient allowance");
    });
    it("Can fail if balance is limited", async function () {
      const { perpetual, token, otherAccount } = await loadFixture(deployPerpetualFixture);
      //configure perpetual
      await perpetual.setTokenMap(0, "USDC", token.address, 1);
      //approve
      const tk = token.connect(otherAccount);
      await tk.approve(perpetual.address, ethers.constants.MaxUint256);
      //deposit
      const contract = perpetual.connect(otherAccount);
      await expect(contract.deposit(otherAccount.address, 0, 'USDC', 2000))
        .to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });
    it("Can fail if status is not 1", async function () {
      const { perpetual, token, otherAccount } = await loadFixture(deployPerpetualFixture);
      await perpetual.setTokenMap(0, "USDC", token.address, 2);
      await perpetual.setTokenMap(1, "USDC", token.address, 1);
      const contract = perpetual.connect(otherAccount);
      const tk = token.connect(otherAccount);
      await tk.approve(perpetual.address, ethers.constants.MaxUint256);
      //await contract.deposit(otherAccount.address, 'USDC', 20);
      await expect(contract.deposit(otherAccount.address, 0, 'USDC', 20))
        .to.be.revertedWith("Aboard: deposit incorrect status or address");
    });
    it("Can fail if token symbol is Native", async function () {
      const { perpetual, token, otherAccount } = await loadFixture(deployPerpetualFixture);
      await perpetual.setTokenMap(1, "ETH", ethers.constants.AddressZero, 1);
      const contract = perpetual.connect(otherAccount);
      const tk = token.connect(otherAccount);
      await tk.approve(perpetual.address, ethers.constants.MaxUint256);
      //await contract.deposit(otherAccount.address, 'USDC', 20);
      await expect(contract.deposit(otherAccount.address, 1, 'ETH', 20))
        .to.be.revertedWith("Aboard: deposit incorrect status or address");
    });
  });

  describe("depositNative", function () {
    it("Can deposit native token", async function () {
      const { perpetual, token, otherAccount } = await loadFixture(deployPerpetualFixture);
      await perpetual.setTokenMap(0, "ETH", ethers.constants.AddressZero, 1);
      await perpetual.setTokenMap(3, "ETH", ethers.constants.AddressZero, 1);
      await perpetual.setBrokerMin('ETH', 201);
      const contract = perpetual.connect(otherAccount);
      //console.log(await otherAccount.getBalance());
      await expect(contract.depositNative(otherAccount.address, 0, {value: 200 }))
        .to.changeEtherBalances([otherAccount, perpetual], [-200, 200]);
      //accountType 1
      await perpetual.setTokenMap(0, "ETH", ethers.constants.AddressZero, 0);
      await perpetual.setTokenMap(1, "ETH", ethers.constants.AddressZero, 1);
      await expect(contract.depositNative(otherAccount.address, 1, {value: 200 }))
        .to.changeEtherBalances([otherAccount, perpetual], [-200, 200]);
      //broker
      await expect(contract.depositNative(otherAccount.address, 1, {value: 201 }))
        .to.changeEtherBalances([otherAccount, perpetual], [-201, 201]);
    });
    it("Can emit LogDeposit", async function () {
      const { perpetual, token, otherAccount } = await loadFixture(deployPerpetualFixture);
      await perpetual.setTokenMap(1, "ETH", ethers.constants.AddressZero, 1);
      const contract = perpetual.connect(otherAccount);
      //console.log(await otherAccount.getBalance());
      await expect(contract.depositNative(otherAccount.address, 1, {value: 200 }))
        .to.emit(perpetual, "LogDeposit")
        .withArgs(otherAccount.address, 1, "ETH", 200);
    });
    it("Can fail if broker depositNative too small", async function () {
      const { perpetual, token, otherAccount } = await loadFixture(deployPerpetualFixture);
      await perpetual.setTokenMap(3, "ETH", ethers.constants.AddressZero, 1);
      await perpetual.setBrokerMin('ETH', 123);
      const contract = perpetual.connect(otherAccount);
      await expect(contract.depositNative(otherAccount.address, 3, {value: 100 }))
        .to.be.revertedWith("Aboard: broker depositNative too small");
    });
    it("Can fail if status incorrect", async function () {
      const { perpetual, token, otherAccount } = await loadFixture(deployPerpetualFixture);
      await perpetual.setTokenMap(0, "ETH", ethers.constants.AddressZero, 2);
      await perpetual.setTokenMap(1, "ETH", ethers.constants.AddressZero, 1);
      const contract = perpetual.connect(otherAccount);
      await expect(contract.depositNative(otherAccount.address, 0, {value: 200 }))
        .to.be.revertedWith("Aboard: deposit native incorrect status");
      await perpetual.setTokenMap(0, "ETH", ethers.constants.AddressZero, 1);
      await perpetual.setTokenMap(1, "ETH", ethers.constants.AddressZero, 2);
      await expect(contract.depositNative(otherAccount.address, 1, {value: 200 }))
        .to.be.revertedWith("Aboard: deposit native incorrect status");
    });
    it("Can fail if deposit for others", async function () {
      const { perpetual, token, owner, otherAccount } = await loadFixture(deployPerpetualFixture);
      //configure perpetual
      await perpetual.setTokenMap(0, "ETH", ethers.constants.AddressZero, 1);
      await expect(perpetual.depositNative(otherAccount.address, 0, {value: 200 }))
        .to.be.revertedWith("Aboard: depositNative msg.sender is not account");
    });
  });
  
  describe("withdraw", function () {
    async function withdrawFixture() {
      const { perpetual, token, owner, signer, otherAccount } = await loadFixture(deployPerpetualFixture);
      //configure perpetual
      const token_symbol = "USDC";
      await perpetual.setTokenMap(0, token_symbol, token.address, 1);
      await perpetual.setTokenMap(0, "ETH", ethers.constants.AddressZero, 1);
      //deposit
      await token.approve(perpetual.address, ethers.constants.MaxUint256);
      await perpetual.deposit(owner.address, 0, token_symbol, 1000);
      //deposit native
      await perpetual.depositNative(owner.address, 0, {value: 100});
      //otherAccount as withdrawer
      const contract = perpetual.connect(otherAccount);
      //withdraw parameters
      const account = otherAccount.address;
      const accountType = 0;
      const amount = 10;
      const withdrawid = 1;
      const blockNum = await ethers.provider.getBlockNumber();
      const blockInfo = await ethers.provider.getBlock(blockNum);
      const timestamp = blockInfo.timestamp + 50;
      const hash = ethers.utils.solidityKeccak256(["address","uint8", "string","uint256","uint256","uint256"], 
        [account, accountType, token_symbol, amount, withdrawid, timestamp]);
      const messageHashBinary = ethers.utils.arrayify(hash);
      const signature = await signer.signMessage(messageHashBinary);
      const sig = ethers.utils.splitSignature(signature);
      return {contract, token, owner, otherAccount, signer, 
        account, token_symbol, amount, withdrawid, timestamp, sig};
    }
    it("Can withdraw USDC", async function () {
      const {contract, token, owner, otherAccount, 
             token_symbol, amount, withdrawid, timestamp, sig} 
        = await loadFixture(withdrawFixture);
      const contractOwner = contract.connect(owner);
      await contractOwner.setTokenMap(0, "USDC", token.address, 2);
      await expect(
        contract.withdraw(0,token_symbol,amount,withdrawid,timestamp,sig.r,sig.s,sig.v))
        .to.changeTokenBalances(token, [otherAccount, contract], [10, -10]);
      //console.log(timestamp);
      expect((await contract.getWithdrawStatus(otherAccount.address, 0))[0]).to.equal(1);
    });
    it("Can emit LogWithdraw", async function () {
      const {contract, token, otherAccount, 
             token_symbol, amount, withdrawid, timestamp, sig} 
        = await loadFixture(withdrawFixture);
      await expect(contract.withdraw(0, token_symbol,amount,withdrawid,timestamp,sig.r,sig.s,sig.v))
        .to.emit(contract, "LogWithdraw")
        .withArgs(otherAccount.address, 0, token_symbol, amount, withdrawid);
    });
    it("Can withdraw eth", async function () {
      const {contract, token, owner, otherAccount, signer,
             amount, withdrawid, timestamp} 
        = await loadFixture(withdrawFixture);
      const contractOwner = contract.connect(owner);
      await contractOwner.setTokenMap(1, "ETH", ethers.constants.AddressZero, 1);
      const token_symbol = "ETH";
      const accountType = 1;
      const hash = ethers.utils.solidityKeccak256(["address","uint8","string","uint256","uint256","uint256"], 
        [otherAccount.address, accountType, token_symbol, amount, withdrawid, timestamp]);
      const messageHashBinary = ethers.utils.arrayify(hash);
      const signature = await signer.signMessage(messageHashBinary);
      const sig = ethers.utils.splitSignature(signature);
      await expect(
        contract.withdraw(1,token_symbol,amount,withdrawid,timestamp,sig.r,sig.s,sig.v))
        .to.changeEtherBalances([otherAccount, contract], [10, -10])
        .to.emit(contract, "LogWithdraw")
        .withArgs(otherAccount.address, 1, token_symbol, amount, withdrawid);
      expect((await contract.getWithdrawStatus(otherAccount.address, 1))[0]).to.equal(1);
    });
    it("Can fail if timestamp is expired", async function () {
      const {contract, token, otherAccount, 
             token_symbol, amount, withdrawid, timestamp, sig} 
         = await loadFixture(withdrawFixture);
      await expect(contract.withdraw(0,token_symbol,amount,withdrawid,timestamp-50,
        sig.r,sig.s,sig.v))
        .to.be.revertedWith("Aboard: withdraw timestamp expired");
    });
    it("Can fail if invalid signatrue", async function () {
      const {contract, token, otherAccount, 
             token_symbol, amount, withdrawid, timestamp, sig} 
        = await loadFixture(withdrawFixture);
      await expect(contract.withdraw(0, token_symbol,amount,2,timestamp,sig.r,sig.s,sig.v))
        .to.be.revertedWith("Aboard: withdraw invalid signature");
    });
    it("Can fail if invalid withdraw id", async function () {
      const {contract, token, owner, otherAccount, signer,
             token_symbol, amount, withdrawid, timestamp, sig} 
        = await loadFixture(withdrawFixture);
      await contract.withdraw(0, token_symbol,amount,withdrawid,timestamp,sig.r,sig.s,sig.v);
      const withdrawid1 = 1;
      const accountType = 0;
      const hash = ethers.utils.solidityKeccak256(["address","uint8","string","uint256","uint256","uint256"], 
        [otherAccount.address, accountType, token_symbol, amount, withdrawid1, timestamp]);
      const messageHashBinary = ethers.utils.arrayify(hash);
      const signature = await signer.signMessage(messageHashBinary);
      const sig1 = ethers.utils.splitSignature(signature);
      await expect(contract.withdraw(0,token_symbol,amount,withdrawid,timestamp,
        sig1.r,sig1.s,sig1.v)).to.be.revertedWith("Aboard: withdraw id fail");
      expect((await contract.getWithdrawStatus(otherAccount.address, 0))[0]).to.equal(1);
      expect((await contract.getWithdrawStatus(otherAccount.address, 1))[0]).to.equal(0);
      //accountType 1
      const contractOwner = contract.connect(owner);
      await contractOwner.setTokenMap(1, "USDC", token.address, 1);
      const hash2 = ethers.utils.solidityKeccak256(["address","uint8","string","uint256","uint256","uint256"], 
        [otherAccount.address, 1, token_symbol, amount, withdrawid1, timestamp]);
      const messageHashBinary2 = ethers.utils.arrayify(hash2);
      const signature2 = await signer.signMessage(messageHashBinary2);
      const sig2 = ethers.utils.splitSignature(signature2);
      await expect(contract.withdraw(1, token_symbol,amount,withdrawid1,timestamp,sig2.r,sig2.s,sig2.v))
        .to.emit(contract, "LogWithdraw")
        .withArgs(otherAccount.address, 1, token_symbol, amount, withdrawid1);
      await expect(contract.withdraw(1,token_symbol,amount,withdrawid,timestamp,
        sig2.r,sig2.s,sig2.v)).to.be.revertedWith("Aboard: withdraw id fail");
      expect((await contract.getWithdrawStatus(otherAccount.address, 0))[0]).to.equal(1);
      expect((await contract.getWithdrawStatus(otherAccount.address, 1))[0]).to.equal(1);
    });
    it("Can fail if invalid token status", async function () {
      const {contract, token, owner, otherAccount, signer,
        token_symbol, amount, withdrawid, timestamp, sig} 
        = await loadFixture(withdrawFixture);
      const contractOwner = contract.connect(owner);
      await contractOwner.setTokenMap(0, "USDC", token.address, 0);
      await contractOwner.setTokenMap(1, "USDC", token.address, 1);
      await expect(contract.withdraw(0, token_symbol,amount,withdrawid,timestamp,
        sig.r,sig.s,sig.v)).to.be.revertedWith("Aboard: withdraw token incorrect status");
      //accountType 1
      const withdrawid1 = 1;
      const hash2 = ethers.utils.solidityKeccak256(["address","uint8","string","uint256","uint256","uint256"], 
        [otherAccount.address, 1, token_symbol, amount, withdrawid1, timestamp]);
      const messageHashBinary2 = ethers.utils.arrayify(hash2);
      const signature2 = await signer.signMessage(messageHashBinary2);
      const sig2 = ethers.utils.splitSignature(signature2);
      await expect(contract.withdraw(1, token_symbol,amount,withdrawid1,timestamp,sig2.r,sig2.s,sig2.v))
        .to.emit(contract, "LogWithdraw")
        .withArgs(otherAccount.address, 1, token_symbol, amount, withdrawid1);
      await contractOwner.setTokenMap(1, "USDC", token.address, 0);
      const withdrawid2 = 2;
      const hash3 = ethers.utils.solidityKeccak256(["address","uint8","string","uint256","uint256","uint256"], 
        [otherAccount.address, 1, token_symbol, amount, withdrawid2, timestamp]);
      const messageHashBinary3 = ethers.utils.arrayify(hash3);
      const signature3 = await signer.signMessage(messageHashBinary3);
      const sig3 = ethers.utils.splitSignature(signature3);
      await expect(contract.withdraw(1, token_symbol,amount,withdrawid2,timestamp,
        sig3.r,sig3.s,sig3.v)).to.be.revertedWith("Aboard: withdraw token incorrect status");
    });
    it("Can fail if msg.sender is not the withdrawer", async function () {
      const {contract, token, owner, otherAccount,
        token_symbol, amount, withdrawid, timestamp, sig} 
        = await loadFixture(withdrawFixture);
      const contractOwner = contract.connect(owner);
      await expect(contractOwner.withdraw(0, token_symbol,amount,withdrawid,timestamp,
        sig.r,sig.s,sig.v)).to.be.revertedWith("Aboard: withdraw invalid signature");
    });
    it("Can fail if amount exceeds perpetual balance", async function () {
      const {contract, token, otherAccount, signer,
             token_symbol, withdrawid, timestamp} 
        = await loadFixture(withdrawFixture);
      const amount = 2000;
      const hash = ethers.utils.solidityKeccak256(["address","uint8","string","uint256","uint256","uint256"], 
        [otherAccount.address, 0, token_symbol, amount, withdrawid, timestamp]);
      const messageHashBinary = ethers.utils.arrayify(hash);
      const signature = await signer.signMessage(messageHashBinary);
      const sig = ethers.utils.splitSignature(signature);
      await expect(contract.withdraw(0,token_symbol,amount,withdrawid,timestamp,
        sig.r,sig.s,sig.v)).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });
    it("Can fail if amount exceeds perpetual eth balance", async function () {
      const {contract, token, otherAccount, signer,
             withdrawid, timestamp} 
        = await loadFixture(withdrawFixture);
      const token_symbol = "ETH";
      const amount = 200;
      const hash = ethers.utils.solidityKeccak256(["address","uint8","string","uint256","uint256","uint256"], 
        [otherAccount.address, 0, token_symbol, amount, withdrawid, timestamp]);
      const messageHashBinary = ethers.utils.arrayify(hash);
      const signature = await signer.signMessage(messageHashBinary);
      const sig = ethers.utils.splitSignature(signature);
      //reverted without a reason
      await expect(
        contract.withdraw(0,token_symbol,amount,withdrawid,timestamp,sig.r,sig.s,sig.v))
        .to.be.reverted;
    });
  });
  

  /*
  describe("Withdraw", function () {
    async function withdrawFixture() {
      const { perpetual, token, owner, signer, otherAccount } = await loadFixture(deployPerpetualFixture);
    }

  });
  */

  /*
  describe("Deployment", function () {
    it("Should set the right unlockTime", async function () {
      const { lock, unlockTime } = await loadFixture(deployOneYearLockFixture);

      expect(await lock.unlockTime()).to.equal(unlockTime);
    });

    it("Should set the right owner", async function () {
      const { lock, owner } = await loadFixture(deployOneYearLockFixture);

      expect(await lock.owner()).to.equal(owner.address);
    });

    it("Should receive and store the funds to lock", async function () {
      const { lock, lockedAmount } = await loadFixture(
        deployOneYearLockFixture
      );

      expect(await ethers.provider.getBalance(lock.address)).to.equal(
        lockedAmount
      );
    });

    it("Should fail if the unlockTime is not in the future", async function () {
      // We don't use the fixture here because we want a different deployment
      const latestTime = await time.latest();
      const Lock = await ethers.getContractFactory("Lock");
      await expect(Lock.deploy(latestTime, { value: 1 })).to.be.revertedWith(
        "Unlock time should be in the future"
      );
    });
  });

  describe("Withdrawals", function () {
    describe("Validations", function () {
      it("Should revert with the right error if called too soon", async function () {
        const { lock } = await loadFixture(deployOneYearLockFixture);

        await expect(lock.withdraw()).to.be.revertedWith(
          "You can't withdraw yet"
        );
      });

      it("Should revert with the right error if called from another account", async function () {
        const { lock, unlockTime, otherAccount } = await loadFixture(
          deployOneYearLockFixture
        );

        // We can increase the time in Hardhat Network
        await time.increaseTo(unlockTime);

        // We use lock.connect() to send a transaction from another account
        await expect(lock.connect(otherAccount).withdraw()).to.be.revertedWith(
          "You aren't the owner"
        );
      });

      it("Shouldn't fail if the unlockTime has arrived and the owner calls it", async function () {
        const { lock, unlockTime } = await loadFixture(
          deployOneYearLockFixture
        );

        // Transactions are sent using the first signer by default
        await time.increaseTo(unlockTime);

        await expect(lock.withdraw()).not.to.be.reverted;
      });
    });

    describe("Events", function () {
      it("Should emit an event on withdrawals", async function () {
        const { lock, unlockTime, lockedAmount } = await loadFixture(
          deployOneYearLockFixture
        );

        await time.increaseTo(unlockTime);

        await expect(lock.withdraw())
          .to.emit(lock, "Withdrawal")
          .withArgs(lockedAmount, anyValue); // We accept any value as `when` arg
      });
    });

    describe("Transfers", function () {
      it("Should transfer the funds to the owner", async function () {
        const { lock, unlockTime, lockedAmount, owner } = await loadFixture(
          deployOneYearLockFixture
        );

        await time.increaseTo(unlockTime);

        await expect(lock.withdraw()).to.changeEtherBalances(
          [owner, lock],
          [lockedAmount, -lockedAmount]
        );
      });
    });
  });*/
});
