// SPDX-License-Identifier: MIT
pragma solidity 0.8.34;

import {Script, console} from "forge-std/Script.sol";
import {AgentIdentityRegistry} from "../src/AgentIdentityRegistry.sol";
import {AgentReputationRegistry} from "../src/AgentReputationRegistry.sol";

contract DeployAll is Script {
    AgentIdentityRegistry public identityRegistry;
    AgentReputationRegistry public reputationRegistry;

    function run() external {
        vm.startBroadcast();

        identityRegistry = new AgentIdentityRegistry();
        console.log("AgentIdentityRegistry deployed at:", address(identityRegistry));

        reputationRegistry = new AgentReputationRegistry(address(identityRegistry));
        console.log("AgentReputationRegistry deployed at:", address(reputationRegistry));

        vm.stopBroadcast();
    }
}
