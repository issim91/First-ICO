var Crowdsale = artifacts.require("./iso/Crowdsale.sol");

module.exports = function(deployer, network, accounts) {
  deployer.deploy(Crowdsale);
};
