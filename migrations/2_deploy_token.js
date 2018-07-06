var SimpleTokenCoin = artifacts.require("../token/SimpleTokenCoin.sol");
var Crowdsale = artifacts.require("../iso/Crowdsale.sol");

module.exports = function(deployer, network, accounts) {
  deployer.deploy(SimpleTokenCoin).then(function() {
    return deployer.deploy(Crowdsale, SimpleTokenCoin.address);
  }).then(function(){
    return SimpleTokenCoin.deployed();
  }).then(function(instance){
    token = instance;
    token.transferOwnership(Crowdsale.address);
  });
};