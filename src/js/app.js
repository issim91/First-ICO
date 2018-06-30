App = {
  web3Provider: null,
  contracts: {},
  account: "0x0",
  TokenSymbol: "Token",
  loading: false,
  network: 'http://ropsten.etherscan.io/address/',
  networkToken: 'http://ropsten.etherscan.io/token/',
  CrowdsaleAddress: "0x0",
  TokenAddress: "0x0",


  initWeb3: function() {
    // Is there an injected web3 instance?
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
    } else {
      // If no injected web3 instance is detected, fall back to Ganache
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
    }
    web3 = new Web3(App.web3Provider);
    return App.initContract();
  },

  initContract: function() {
    $.getJSON('Crowdsale.json', function(crowdsale) {
      App.contracts.Crowdsale = TruffleContract(crowdsale);
      App.contracts.Crowdsale.setProvider(App.web3Provider);
      App.contracts.Crowdsale.deployed().then(function(instance){
        App.CrowdsaleAddress = instance.address;
        console.log("Адрес контракта распродажи токенов: "+instance.address);
      });
    }).done(function() {
        $.getJSON('SimpleTokenCoin.json', function(simpleTokenCoin) {
          App.contracts.SimpleTokenCoin = TruffleContract(simpleTokenCoin);
          App.contracts.SimpleTokenCoin.setProvider(App.web3Provider);
          App.contracts.SimpleTokenCoin.deployed().then(function(simpleTokenCoin) {
            App.TokenAddress = simpleTokenCoin.address;
            console.log("Адрес контракта токена: "+simpleTokenCoin.address);
          });
        });
        App.listenForEvents();
      return App.initAll();
      });
      
  },

  listenForEvents: function() {
    App.contracts.Crowdsale.deployed().then(function(instance) {
      instance.Sell({}, {
        fromBlock: 0,
        toBlock: 'latest',
      }).watch(function(error, event){
        console.log("event Trigger: ", event)
        App.initAll();
      })
    });
  },

  initAll: function() {
    if (App.loading){
      return;
    }
    App.loading = true;
    var loader =  $('#loader');
    var content = $('#content');

    loader.show();
    content.hide();

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
      App.account = accounts[0];
    })


    App.contracts.Crowdsale.deployed().then(function(instance) {
      TokenInstance = instance;
      return TokenInstance.viewToken();
    }).then(function(viewToken) {
      $('#TokenName').text("Полное название токена: " + viewToken[0]);
      App.TokenSymbol = viewToken[1];
      $('.TokenSymbol').text(App.TokenSymbol);
      $('#TokenSymbol').text("Символ токена: " + App.TokenSymbol);
      $('#TokenDecimals').text("Количество знаков после запятой: " + viewToken[2]);

      return TokenInstance.totalSupply();
    }).then(function(totalSupply) {
      $('#AllToken').text("Общее количество токенов: " + totalSupply + " " + App.TokenSymbol);

      return TokenInstance.balanceOf(App.account)
    }).then(function(balanceOf) {
      $('#wallet').text("Текущий аккаунт: " + App.account);
      $('#wallet').attr("href", App.network + App.account);
      $('#walletBal').text("Количество токенов на аккаунте: "+balanceOf + " " + App.TokenSymbol);

      return TokenInstance.whoOwner();
    }).then(function(whoOwner) {
      if (whoOwner != App.account){
        $('#owner').hide();
      }
        $('#whoOwnerNow').text("Адрес владельца контракта: " + whoOwner);
        $('#whoOwnerNow').attr("href", App.network + whoOwner);

        $('#whoTokenAddress').text("Адрес контракта токена: " + App.TokenAddress);
        $('#whoTokenAddress').attr("href", App.networkToken + App.TokenAddress);

      return TokenInstance.viewISO();
    }).then(function(viewISO) {
      getEndTimeISO(viewISO[5], viewISO[6]);
      
      App.initBonusToken();
      var res = 1/viewISO[0];
      $('#Rate').text("1 токен = "+ res + " ETH");
      $('#RateVal').val(viewISO[0]);

      $('#hardcapValue').text("Hardcap: "+web3.fromWei(viewISO[2], "ether")+" ETH");

      $('#whoMultisig').text("Адрес куда капает эфир с ISO: " + viewISO[1]);
      $('#whoMultisig').attr("href", App.network + viewISO[1]);
      $('#whoMultisigAdrr').val(viewISO[1]);
      var adrrMultisig = $('#whoMultisigAdrr').val(); 
      web3.eth.getBalance(adrrMultisig,(function (err, res) {
        var balance = web3.fromWei(res, "ether");
        $('#multisigValue').text("Собрано денег в ходе ISO: "+balance.toString(10)+" ETH");
      })); 

      $('#whoRestricted').text("Адрес куда будут перечисляться токены для нужд команды ISO: "+viewISO[3]);
      $('#whoRestricted').attr("href", App.network + viewISO[3]);

      $('#restrictedPercentValue').text("Процент токенов для команды ISO: "+viewISO[4]+"%");
    });

    App.loading = false;
    loader.hide();
    content.show();
  },

  initBonusToken: function() {
    App.contracts.Crowdsale.deployed().then(function(instance) {
      return instance.viewBonusTokens();
    }).then(function(result) {
      if (result == 0){
        $('#bonusTokensView').hide();
        $('#CrowdsaleBonusTokenDiv').hide();
      }
        $('#bonusTokensView').text("Бонус токенов: "+result+" %");
        $('#bonusTokens').val(result);
    }).catch(function(err) {
      console.log(err.message);
    });
  },


  initBalance: function() {
    var adrr = $('#newAdrr').val();
    App.contracts.Crowdsale.deployed().then(function(instance) {
      return instance.balanceOf(adrr);
    }).then(function(result) {
      $('#bal').text("Баланс кошелька: "+result);
    }).catch(function(err) {
      console.log(err.message);
    });
  },


  initMint: function() {
    var toSend = $('#toMint').val();
    var valueToken = $('#valueMint').val();
    App.contracts.Crowdsale.deployed().then(function(instance) {
      return instance.mint(toSend, valueToken, {from:App.account});
    }).then(function(result) {
      $('#success').text("Монеты успешно начеканены");
    }).catch(function(err) {
      console.log(err.message);
  });
},


  initSendToken: function() {
    var toSend = $('#toSend').val();
    var valueToken = $('#valueToken').val();
    App.contracts.Crowdsale.deployed().then(function(instance) {
      return instance.transfer(toSend, valueToken, {from:App.account});
    }).then(function(result) {
      $('#success').text("Монеты успешно отправлены");
    }).catch(function(err) {
      console.log(err.message);
    });
  },


  initCrowdsale: function() {
    var loader =  $('#loader');
    var content = $('#content');
    loader.show();
    content.hide();

    var CrowdsaleToken = $('#CrowdsaleToken').val();
    App.contracts.Crowdsale.deployed().then(function(instance) {
      return instance.sendTransaction({from:App.account, value: web3.toWei(CrowdsaleToken, "ether")});
    }).then(function(result) {
      console.log("Токены покупаются");
      $('form').trigger('reset');
      $('#successCrowdsale').text("Токены успешно куплены");
    })
  },

  initEditRate: function() {
    var newRate = $('#newRate').val();
    App.contracts.Crowdsale.deployed().then(function(instance) {
      return instance.rateEdit(newRate);
    }).then(function(result) {
      $('#successEditRate').text("Коэффициент успешно изменен");
    }).catch(function(err) {
      console.log(err.message);
    });
  },

  initEditOwner: function() {
    var newOwner = $('#newOwner').val();
    App.contracts.Crowdsale.deployed().then(function(instance) {
      return instance.transferOwnership(newOwner);
    }).then(function(result) {
      $('#successEditOwner').text("Владелец контракта успешно изменен");
    }).catch(function(err) {
      console.log(err.message);
    });
  },

  initEditHardcap: function() {
    var newHardcap = $('#newHardcap').val();
    App.contracts.Crowdsale.deployed().then(function(instance) {
      return instance.hardcapEdit(web3.toWei(newHardcap, "ether"));
    }).then(function(result) {
      $('#successEditHardcap').text("Hardcap успешно изменен");
    }).catch(function(err) {
      console.log(err.message);
    });
  },

  initEditMultisig: function() {
    var newMultisig = $('#newMultisig').val();
    App.contracts.Crowdsale.deployed().then(function(instance) {
      return instance.multisigEdit(newMultisig);
    }).then(function(result) {
      $('#successEditMultisig').text("Адрес успешно изменен");
    }).catch(function(err) {
      console.log(err.message);
    });
  },

  initApprov: function() {
    var approveSpender = $('#approveSpender').val();
    var approveValue = $('#approveValue').val();
    App.contracts.Crowdsale.deployed().then(function(instance) {
      return instance.approve(approveSpender, approveValue, {from:App.account});
    }).then(function(result) {
      $('#successApprove').text("Управление передано");
    }).catch(function(err) {
      console.log(err.message);
    });
  },

  initApprovMoney: function() {
    var approveSpender = $('#approveMoney').val();
    App.contracts.Crowdsale.deployed().then(function(instance) {
      return instance.allowance(App.account, approveSpender);
    }).then(function(result) {
      $('#resultApproveMoney').text(result + " монет в управлении");
    }).catch(function(err) {
      console.log(err.message);
    });
  },

  initSendTransferFrom: function() {
    var fromSend = $('#transferFrom').val();  
    var toSend = $('#transferTo').val();
    var valueToken = $('#transferFromValue').val(); 
    App.contracts.Crowdsale.deployed().then(function(instance) {
      return instance.transferFrom(fromSend, toSend, valueToken, {from:App.account});
    }).then(function(result) {
      $('#successTransferFrom').text("Монеты успешно отправлены на кошелек");
    }).catch(function(err) {
      console.log(err.message);
    });
  },

  initUpLimitApprove: function() {
    var approveSpender = $('#upLimitApproveSpender').val();
    var approveValue = $('#upLimitApproveValue').val();
    App.contracts.Crowdsale.deployed().then(function(instance) {
      return instance.increaseApproval(approveSpender, approveValue, {from:App.account});
    }).then(function(result) {
      $('#successUpLimitApprove').text("Лимит успешно увеличен");
    }).catch(function(err) {
      console.log(err.message);
    });
  },

  initDownLimitApprove: function() {
    var approveSpender = $('#downLimitApproveSpender').val();
    var approveValue = $('#downLimitApproveValue').val();
    App.contracts.Crowdsale.deployed().then(function(instance) {
      return instance.decreaseApproval(approveSpender, approveValue, {from:App.account});
    }).then(function(result) {
      $('#successDownLimitApprove').text("Лимит успешно уменьшен");
    }).catch(function(err) {
      console.log(err.message);
    });
  },

  initEditPeriod: function() {
    var newPeriod = $('#newPeriod').val();
    App.contracts.Crowdsale.deployed().then(function(instance) {
      return instance.upPeriodEdit(newPeriod);
    }).then(function(result) {
        $('#successEditPeriod').text("Период успешно изменен");
    }).catch(function(err) {
      console.log(err.message);
    });
  },

  initFinishMint: function() {
    App.contracts.Crowdsale.deployed().then(function(instance) {
      return instance.finishMint();
    }).then(function() {
      $('#successFinishMint').text("ISO успешно завершено!");
    }).catch(function(err) {
      console.log(err.message);
    });
  },

}


$(function() {
  $(window).load(function() {
    App.initWeb3();
  });
  $('#but').on('click', function() {
    App.initBalance();
  });
  $('#mintToken').on('click', function() {
    App.initMint();
  });
  $('#sendToken').on('click', function() {
    App.initSendToken();
  });

  $('#editRateButton').on('click', function() {
    App.initEditRate();
  });
  $('#editOwnerButton').on('click', function() {
    App.initEditOwner();
  });
  $('#editHardcapButton').on('click', function() {
    App.initEditHardcap();
  });
  $('#editMultisigrButton').on('click', function() {
    App.initEditMultisig();
  });

  $('#sendApprove').on('click', function() {
    App.initApprov();
  });
  $('#sendApproveMoney').on('click', function() {
    App.initApprovMoney();
  });
  $('#sendTransferFrom').on('click', function() {
    App.initSendTransferFrom();
  });
  $('#sendUpLimitApprove').on('click', function() {
    App.initUpLimitApprove();
  });
  $('#sendDownLimitApprove').on('click', function() {
    App.initDownLimitApprove();
  });
  $('#finishMint').on('click', function() {
    App.initFinishMint();
  });
  $('#editPeriodButton').on('click', function() {
    App.initEditPeriod();
  });
});

// конвертор токенов
function tokenConvert (valNum) {
  var val = $('#RateVal').val();
  document.getElementById("CrowdsaleTokenETH").value=valNum*val;
  var token = $('#CrowdsaleTokenETH').val();
  tokenConvertBonus(token);
  if ($('#CrowdsaleToken').val() == ''){
    $('.Convert').val('');
  }
}

function tokenConvertEth (valNum) {
  var val = $('#RateVal').val();
  document.getElementById("CrowdsaleToken").value=valNum/val;
  var token = $('#CrowdsaleTokenETH').val();
  tokenConvertBonus(token);
  if ($('#CrowdsaleTokenETH').val() == ''){
    $('.Convert').val('');
  }
}

function tokenConvertBonus (valueToken) {
  var bonus = $('#bonusTokens').val();
  document.getElementById("CrowdsaleBonusToken").value=valueToken*bonus/100;
}

function timeConverter(UNIX_timestamp){
  var a = new Date(UNIX_timestamp * 1000);
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var year = a.getFullYear();
  var month = months[a.getMonth()];
  var date = a.getDate();
  var hour = a.getHours();
  var min = a.getMinutes();
  var sec = a.getSeconds();
  var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
  return time;
}

function getEndTimeISO(_start, _period){
  var endTimeIso = new Date();
  var startTimeIso = new Date(timeConverter(_start));
  var period = _period.toNumber();
  endTimeIso.setDate(startTimeIso.getDate() + period);
  
  initializeClock('endTimeIso', endTimeIso);
}

function getTimeRemaining(endtime){
  var t = Date.parse(endtime) - Date.parse(new Date());
  var seconds = Math.floor( (t/1000) % 60 );
  var minutes = Math.floor( (t/1000/60) % 60 );
  var hours = Math.floor( (t/(1000*60*60)) % 24 );
  var days = Math.floor( t/(1000*60*60*24) );
  return {
   'total': t,
   'days': days,
   'hours': hours,
   'minutes': minutes,
   'seconds': seconds
  };
}

function initializeClock(id, endtime){
  var clock = document.getElementById(id);

  var daysSpan = clock.querySelector('.days');
  var hoursSpan = clock.querySelector('.hours');
  var minutesSpan = clock.querySelector('.minutes');
  var secondsSpan = clock.querySelector('.seconds');

  function updateClock(){
    var t = getTimeRemaining(endtime);
    
    daysSpan.innerHTML = t.days;
    hoursSpan.innerHTML = t.hours;
    minutesSpan.innerHTML = t.minutes;
    secondsSpan.innerHTML = t.seconds;
    if(t.total<=0){
      clearInterval(timeinterval);
    }
  }
  updateClock(); // запустите функцию один раз, чтобы избежать задержки
  var timeinterval = setInterval(updateClock,1000);
}