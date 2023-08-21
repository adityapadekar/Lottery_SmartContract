const { network, ethers } = require("hardhat");
const {
    developmentChains,
    networkConfig,
} = require("../helper-hardhat-config");

const { verify } = require("../utils/verify");

const VRF_SUB_FUND_AMOUNT = ethers.parseEther("2");

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();

    const chainId = network.config.chainId;

    let vrfCoordinatorV2Address, subscriptionId, vrfCoordinatorV2Mock;

    if (developmentChains.includes(network.name)) {
        const signer = await ethers.getSigner(deployer);
        vrfCoordinatorV2Address = (
            await deployments.get("VRFCoordinatorV2Mock")
        ).address;
        vrfCoordinatorV2Mock = await ethers.getContractAt(
            "VRFCoordinatorV2Mock",
            vrfCoordinatorV2Address,
            signer
        );

        const txResponse = await vrfCoordinatorV2Mock.createSubscription();
        const txReceipt = await txResponse.wait(1);

        // console.log(txReceipt);
        subscriptionId = txReceipt.logs[0].args.subId;
        // subscriptionId = 1;
        // console.log(subscriptionId);

        await vrfCoordinatorV2Mock.fundSubscription(
            subscriptionId,
            VRF_SUB_FUND_AMOUNT
        );
    } else {
        vrfCoordinatorV2Address = networkConfig[chainId].vrfCoordinatorV2;
        subscriptionId = networkConfig[chainId].subscriptionId;
        // console.log(subscriptionId)
    }

    const entranceFee = networkConfig[chainId].entranceFee;
    const gasLane = networkConfig[chainId].gasLane;
    const callbackGasLimit = networkConfig[chainId].callbackGasLimit;
    const interval = networkConfig[chainId].interval;

    const args = [
        vrfCoordinatorV2Address,
        entranceFee,
        gasLane,
        subscriptionId,
        callbackGasLimit,
        interval,
    ];

    log("\n=================================================================");
    log("Deploying Contract........\n");
    const lottery = await deploy("Lottery", {
        from: deployer,
        log: true,
        args: args,
        waitConfirmations: network.config.blockConfirmations || 1,
    });

    if (developmentChains.includes(network.name)) {
        await vrfCoordinatorV2Mock.addConsumer(subscriptionId, lottery.address);
    }

    log("\nContract Deployed!...");
    log("=================================================================\n");
    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        log(
            "================================================================="
        );
        log("\nVerifying...\n");
        await verify(lottery.address, args);
        log(
            "\n================================================================="
        );
    }
};

module.exports.tags = ["all", "lottery"];
