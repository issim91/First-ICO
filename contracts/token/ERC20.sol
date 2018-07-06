pragma solidity ^0.4.23;

import "./ERC20Basic.sol";


/**
 * @title ERC20 interface
 * @dev see https://github.com/ethereum/EIPs/issues/20
 */
contract ERC20 {
  event Transfer(address indexed from, address indexed to, uint256 value);

  function allowance(address owner, address spender)
    public view returns (uint256);

  function transferFrom(address from, address to, uint256 value)
    public returns (bool);

  function approve(address spender, uint256 value) public returns (bool);
  
  event Approval(address indexed owner, address indexed spender, uint256 value);
}
