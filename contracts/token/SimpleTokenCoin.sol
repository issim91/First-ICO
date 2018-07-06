pragma solidity ^0.4.23;

import "./MintableToken.sol";

contract SimpleTokenCoin is MintableToken {

    string public constant name = "Crypto Iluha Coin";

    string public constant symbol = "CIC";

    uint32 public constant decimals = 0;

    function viewToken () public view returns (string, string, uint32) {
        return (name, symbol, decimals);
    }   
}