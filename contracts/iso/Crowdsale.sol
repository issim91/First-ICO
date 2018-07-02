pragma solidity ^0.4.23;

import "../token/SimpleTokenCoin.sol";

contract Crowdsale is SimpleTokenCoin {

    address owner;
    
    uint256 rate = 1000000;

    uint hardcap;

    address multisig;

    uint restrictedPercent;

    address restricted;

    uint start = 1529612747; // 22.06.2018

    uint period = 40;

    uint bonusTime1 = 10;

    uint bonusTime2 = 20;

    uint bonusTime3 = 25;

    event Sell (address _bayer, uint _amount);

    modifier saleIsOn() {
    	require(now > start && now < start + period * 1 days);
    	_;
    }
    
    modifier isUnderHardCap() {
        require(multisig.balance <= hardcap);
        _;
    }

    constructor () public {
        owner = msg.sender;
        multisig = 0xA44F8B54B522b21889496309BaC1B42Ff43c8e1F;
        hardcap = 200 ether;
        restricted = 0xa03d2BF2c49a6be202AE21f541e487687Fe008a3;
        restrictedPercent = 50;
    }

    function () external payable  {
        createTokens();
    }

    function createTokens() public isUnderHardCap saleIsOn payable {
        multisig.transfer(msg.value);
        uint tokens = rate.mul(msg.value).div(1 ether);
        uint bonusTokens = 0;
        if(now < start + (bonusTime1 * 1 days)) {
          bonusTokens = tokens.div(4);
        } else if(now >= start + (bonusTime1 * 1 days) && now < start + (bonusTime2 * 1 days)) {
          bonusTokens = tokens.div(10);
        } else if(now >= start + (bonusTime2 * 1 days) && now < start + (bonusTime3 * 1 days)) {
          bonusTokens = tokens.div(20);
        }
        tokens += bonusTokens;
        mint(msg.sender, tokens);
        emit Sell(msg.sender, msg.value);
    }

    function finishMint() public onlyOwner {
        uint issuedTokenSupply = totalSupply();
        uint restrictedTokens = issuedTokenSupply.mul(restrictedPercent).div(100 - restrictedPercent);
        mint(restricted, restrictedTokens);
        finishMinting();
    }

    function viewISO () public view returns (uint256, address, uint, address, uint, uint, uint) {
        return (rate, multisig, hardcap, restricted, restrictedPercent, start, period);
    }

    function rateEdit (uint256 newRate) public onlyOwner {
        rate = newRate;        
    }

    function multisigEdit (address newMultisig) public onlyOwner {
        multisig = newMultisig;        
    }

    function hardcapEdit (uint newHardcap) public onlyOwner {
        hardcap = newHardcap;       
    }

    function restrictedEdit (address newRestricted) public onlyOwner {
        restricted = newRestricted;       
    }

    function restrictedPercentEdit (uint newRestrictedPercent) public onlyOwner {
        restrictedPercent = newRestrictedPercent;       
    }

    function upPeriodEdit (uint newPeriod) public onlyOwner {
        period = period + newPeriod;       
    }

    function viewBonusTokens () public view returns(uint) {        
        if(now < start + (bonusTime1 * 1 days)) {
            return 25;
        } else if(now >= start + (bonusTime1 * 1 days) && now < start + (bonusTime2 * 1 days)) {
            return 10;
        } else if(now >= start + (bonusTime2 * 1 days) && now < start + (bonusTime3 * 1 days)) {
            return 5;
        } else
        return 0;
    }

}