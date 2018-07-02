var token = artifacts.require("./iso/Crowdsale.sol");

module.exports = function(deployer, network, accounts) {
  deployer.deploy(token);
};
