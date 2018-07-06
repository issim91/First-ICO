pragma solidity ^0.4.23;

import "../token/SimpleTokenCoin.sol";
import "../common/Ownable.sol";
import "../common/SafeMath.sol";

contract Crowdsale is Ownable {
    using SafeMath for uint256;

    SimpleTokenCoin public token;

    address owner;
    
    uint256 rate = 10000;

    uint hardcap;

    address multisig;

    uint restrictedPercent;

    address restricted;

    uint start = 1529625600; // 22.06.2018

    uint period = 61;

    uint bonusTime1 = 10;

    uint bonusTime2 = 20;

    uint bonusTime3 = 25;

    event Sell (address _bayer, uint _amount);
    event EditIso (address _sender);

    modifier saleIsOn() {
    	require(now > start && now < start + period * 1 days);
    	_;
    }
    
    modifier isUnderHardCap() {
        require(multisig.balance <= hardcap);
        _;
    }

    constructor (SimpleTokenCoin _token) public {
        owner = msg.sender;
        token = _token;
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
        emit Sell(msg.sender, msg.value);
        token.mint(msg.sender, tokens);
        
    }

    function finishMint() public onlyOwner {
        uint issuedTokenSupply = token.totalSupply();
        uint restrictedTokens = issuedTokenSupply.mul(restrictedPercent).div(100 - restrictedPercent);
        token.mint(restricted, restrictedTokens);
        token.finishMinting();
    }

    function viewISO () public view returns (uint256, address, uint, address, uint, uint, uint) {
        return (rate, multisig, hardcap, restricted, restrictedPercent, start, period);
    }

    function rateEdit (uint256 newRate) public onlyOwner {
        rate = newRate;
        emit EditIso (msg.sender);
    }

    function multisigEdit (address newMultisig) public onlyOwner {
        multisig = newMultisig;
        emit EditIso (msg.sender);
    }

    function hardcapEdit (uint newHardcap) public onlyOwner {
        hardcap = newHardcap;
        emit EditIso (msg.sender);
    }

    function restrictedEdit (address newRestricted) public onlyOwner {
        restricted = newRestricted;
        emit EditIso (msg.sender);
    }

    function restrictedPercentEdit (uint newRestrictedPercent) public onlyOwner {
        restrictedPercent = newRestrictedPercent;
        emit EditIso (msg.sender);
    }

    function upPeriodEdit (uint newPeriod) public onlyOwner {
        period = period + newPeriod;
        emit EditIso (msg.sender);
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
