var MyToken = artifacts.require("./token/SimpleTokenCoin.sol");

module.exports = function(deployer, network, accounts) {
  deployer.deploy(MyToken);
};
