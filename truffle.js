var HDWalletProvider = require("truffle-hdwallet-provider");

module.exports = {
   networks: {
    development: {
        host: "localhost",
        port: 8545,
        network_id: "*" // Match any network id
    },
    ropsten: {
        provider: function() {
            var mnemonic = "olive film fame alcohol arrow rate shield pill pizza kitchen finger genre";
            return new HDWalletProvider(mnemonic, "https://ropsten.infura.io/U3jz6NG45tEbJXqkmsdX ")
        },
        network_id: 3,
      }
    }
};
