// SPDX-License-Identifier: MIT
pragma solidity 0.8.34;

import {Script, console} from "forge-std/Script.sol";
import {AgentIdentityRegistry} from "../src/AgentIdentityRegistry.sol";
import {AgentReputationRegistry} from "../src/AgentReputationRegistry.sol";

contract DeployAgentReputationRegistry is Script {
    AgentReputationRegistry public reputationRegistry;

    function run() external {
        vm.startBroadcast();

        address identity = vm.envAddress("AGENT_IDENTITY_REGISTRY");
        reputationRegistry = new AgentReputationRegistry(identity);

        console.log("AgentReputationRegistry deployed at:", address(reputationRegistry));

        vm.stopBroadcast();
    }
}