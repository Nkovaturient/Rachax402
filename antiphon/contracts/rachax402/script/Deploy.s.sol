// SPDX-License-Identifier: MIT
pragma solidity 0.8.34;

import {Script, console} from "forge-std/Script.sol";
import {AgentIdentityRegistry} from "../src/AgentIdentityRegistry.sol";
import {AgentReputationRegistry} from "../src/AgentReputationRegistry.sol";

contract DeployAll is Script {
    AgentIdentityRegistry public identityRegistry;
    AgentReputationRegistry public reputationRegistry;

    function run() external {
        uint256 registrationFeeWei = vm.envOr(
            "REGISTRATION_FEE_WEI",
            uint256(0.001 ether)
        );
        uint256 minRaterStakeWei = vm.envOr(
            "MIN_RATER_STAKE_WEI",
            uint256(0.01 ether)
        );
        uint256 maxUniqueRatersPerPeriod = vm.envOr(
            "MAX_UNIQUE_RATERS_PER_PERIOD",
            uint256(10)
        );

        vm.startBroadcast();

        identityRegistry = new AgentIdentityRegistry();
        console.log("AgentIdentityRegistry deployed at:", address(identityRegistry));

        reputationRegistry = new AgentReputationRegistry(address(identityRegistry));
        console.log("AgentReputationRegistry deployed at:", address(reputationRegistry));

        identityRegistry.setRegistrationFeeWei(registrationFeeWei);
        identityRegistry.setReputationRegistry(address(reputationRegistry));
        reputationRegistry.setMinRaterStakeWei(minRaterStakeWei);
        reputationRegistry.setMaxUniqueRatersPerTargetPeriod(maxUniqueRatersPerPeriod);

        console.log("Configured registrationFeeWei:", registrationFeeWei);
        console.log("Configured minRaterStakeWei:", minRaterStakeWei);
        console.log(
            "Configured maxUniqueRatersPerPeriod:",
            maxUniqueRatersPerPeriod
        );

        vm.stopBroadcast();
    }
}
