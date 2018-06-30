pragma solidity ^0.4.23;

import "./MintableToken.sol";

contract SimpleTokenCoin is MintableToken {

    string public name;
    string public symbol;
    uint8 public decimals;

    constructor () public {
        name = "Crypto Iluha Coin";
        symbol = "CIC";
        decimals = 18;
    }

    function viewToken () public view returns (string, string, uint8) {
        return (name, symbol, decimals);
    }
}
