const { network, getNamedAccounts, deployments, ethers } = require("hardhat");
const {
    developmentChains,
    networkConfig,
} = require("../../helper-hardhat-config");
const { assert, expect } = require("chai");

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Lottery Unit Tests", async function () {
          let lottery, vrfCoordinatorV2Mock;
          let deployer, entranceFee, interval;
          const chainId = network.config.chainId;
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer;
              const deploymentResults = await deployments.fixture(["all"]);
              const Lottery_address = deploymentResults["Lottery"]?.address;
              const VRFCoordinatorV2Mock_address =
                  deploymentResults["VRFCoordinatorV2Mock"]?.address;
              lottery = await ethers.getContractAt("Lottery", Lottery_address);
              vrfCoordinatorV2Mock = await ethers.getContractAt(
                  "VRFCoordinatorV2Mock",
                  VRFCoordinatorV2Mock_address
              );
              entranceFee = await lottery.getEntranceFee();
              interval = await lottery.getInterval();
          });

          describe("constructor", async function () {
              it("initializes the raffle correctly", async function () {
                  const lotteryState = await lottery.getLotteryState();
                  assert.equal(lotteryState.toString(), "0");
                  assert.equal(
                      interval.toString(),
                      networkConfig[chainId].interval
                  );
              });
          });
          describe("Enter Lottery", async function () {
              it("revert if not entrace fee is not enough", async function () {
                  await expect(
                      lottery.enterLottery()
                  ).to.be.revertedWithCustomError(
                      lottery,
                      "Lottery__InsufficientEntranceFee"
                  );
              });
              it("allow entry in lottery", async function () {
                  await lottery.enterLottery({ value: entranceFee });
                  const player = await lottery.getPlayer(0);
                  assert.equal(player, deployer);
              });
              it("emits an event", async function () {
                  await expect(
                      lottery.enterLottery({ value: entranceFee })
                  ).to.emit(lottery, "LotteryEnter");
              });
              it("reject entry when lottery close", async function () {
                  await lottery.enterLottery({ value: entranceFee });
                  await network.provider.send("evm_increaseTime", [
                      Number(interval) + 1,
                  ]);
                  await network.provider.send("evm_mine", []);
                  await lottery.performUpkeep("0x");
                  await expect(
                      lottery.enterLottery({ value: entranceFee })
                  ).to.be.revertedWithCustomError(lottery, "Lottery__NotOpen");
              });
          });
      });
