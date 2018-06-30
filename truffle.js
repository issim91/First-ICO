var HDWalletProvider = require("truffle-hdwallet-provider");
var mnemonic = "olive film fame alcohol arrow rate shield pill pizza kitchen finger genre";

module.exports = {
    networks: {
      ropsten: {
        provider: function() {
          return new HDWalletProvider(mnemonic, "https://ropsten.infura.io/U3jz6NG45tEbJXqkmsdX")
        },
        network_id: 3,
        gas: 4600000
      }   
    }
  };
