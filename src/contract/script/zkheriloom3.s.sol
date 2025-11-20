//SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Script} from "forge-std/Script.sol";
import {ZkHeriloom3} from "../zkheriloom3.sol";

contract DeployZkHeriloom3 is Script {
    function run() external {
        vm.startBroadcast();
        new ZkHeriloom3();
        vm.stopBroadcast();
    }
}