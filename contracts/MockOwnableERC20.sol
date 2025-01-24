// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract MockOwnableERC20 is ERC20, Ownable {
    constructor(address owner, string memory name, string memory symbol) ERC20(name, symbol) Ownable(owner) {
        _mint(msg.sender, 999999999999999999 * 10 ** 18);
    }

    function mint(address to, uint256 amount) public virtual {
        _mint(to, amount);
    }
}
