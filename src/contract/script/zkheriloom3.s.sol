//SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Script} from "forge-std/Script.sol";
import {ZkHeriloom3} from "../zkheriloom3.sol";

contract DeployZkHeriloom3 is Script {
    address public semaphoreAddress = 0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D;
    function run() external returns (address) {
        vm.startBroadcast();
        ZkHeriloom3 deployedContract = new ZkHeriloom3(semaphoreAddress);
        vm.stopBroadcast();
        return address(deployedContract);
    }
}