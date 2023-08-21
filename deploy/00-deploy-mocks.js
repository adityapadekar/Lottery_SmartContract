const { network, ethers } = require("hardhat");
const {
    developmentChains,
    BASE_FEE,
    GAS_PRICE_LINK,
} = require("../helper-hardhat-config");

const baseFee = ethers.parseEther(BASE_FEE);

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();

    if (developmentChains.includes(network.name)) {
        log(
            "================================================================="
        );
        log("Local Network detected! Deploying Mocks........\n");
        await deploy("VRFCoordinatorV2Mock", {
            contract: "VRFCoordinatorV2Mock",
            from: deployer,
            log: true,
            args: [baseFee, GAS_PRICE_LINK],
        });
        log("\nMocks Deployed!...");
        log(
            "================================================================="
        );
    }
};

module.exports.tags = ["all", "mocks"];
