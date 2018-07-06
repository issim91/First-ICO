App = {
  web3Provider: null,
  contracts: {},
  account: "0x0",
  TokenSymbol: "Token",
  loading: false,
  Event: false,
  network: 'http://ropsten.etherscan.io/address/',
  networkToken: 'http://ropsten.etherscan.io/token/',
  CrowdsaleAddress: "0x0",
  TokenAddress: "0x0",
  SimpleTokenCoin: null,
  Crowdsale: null,
  FinishMint: false,


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
      App.contracts.Crowdsale.deployed().then(function(crowdsale){
        App.Crowdsale = crowdsale;
        App.CrowdsaleAddress = crowdsale.address;
        console.log("Адрес контракта распродажи токенов: "+App.CrowdsaleAddress);
      });
    }).done(function() {
        $.getJSON('SimpleTokenCoin.json', function(simpleTokenCoin) {
          App.contracts.SimpleTokenCoin = TruffleContract(simpleTokenCoin);
          App.contracts.SimpleTokenCoin.setProvider(App.web3Provider);
          App.contracts.SimpleTokenCoin.deployed().then(function(simpleTokenCoin) {
            App.SimpleTokenCoin = simpleTokenCoin;
            App.TokenAddress = simpleTokenCoin.address;
            console.log("Адрес контракта токена: "+simpleTokenCoin.address);
          });
          App.listenForEvents();
          return App.initAll();
        });
      });
  },

  listenForEvents: function() {
    App.contracts.Crowdsale.deployed().then(function(_Sell) {
      _Sell.Sell({}, {
        fromBlock: 0,
        toBlock: 'latest',
      }).watch(function(error, event){
        console.log("event Crowdsale: ", event);
        App.initAll();
      });
    });

    App.contracts.SimpleTokenCoin.deployed().then(function(_Mint) {
      _Mint.Mint({}, {
        fromBlock: 0,
        toBlock: 'latest',
      }).watch(function(error, event){
        console.log("event Mint: ", event);
        App.initAll();
      });
    });

    App.contracts.SimpleTokenCoin.deployed().then(function(_Transfer){
      _Transfer.Transfer({}, {
        fromBlock: 0,
        toBlock: 'latest',
      }).watch(function(error, event){
        console.log("event Transfer: ", event);
        App.initAll();
      });
    });

    App.contracts.Crowdsale.deployed().then(function(_editIso) {
      _editIso.EditIso({}, {
        fromBlock: 0,
        toBlock: 'latest',
      }).watch(function(error, event){
        console.log("event Edit Iso: ", event);
        App.initAll();
      });
    });

    App.contracts.SimpleTokenCoin.deployed().then(function(_editOwner) {
      _editOwner.OwnershipTransferred({}, {
        fromBlock: 0,
        toBlock: 'latest',
      }).watch(function(error, event){
        console.log("event Edit Owner: ", event);
        App.initAll();
      });
    });

    App.contracts.SimpleTokenCoin.deployed().then(function(Approv) {
      Approv.Approval({}, {
        fromBlock: 0,
        toBlock: 'latest',
      }).watch(function(error, event){
        console.log("event Approv: ", event);
        App.initAll();
      });
    });

    App.contracts.SimpleTokenCoin.deployed().then(function(_MintFinished) {
      _MintFinished.MintFinished({}, {
        fromBlock: 0,
        toBlock: 'latest',
      }).watch(function(error, event){
        console.log("event Mint Finished: ", event);
        App.initAll();
      });
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
    if (App.FinishMint == true)
    {
      $('#CrowdsaleForm').hide()
    }

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
      App.account = accounts[0];
    });

    App.contracts.SimpleTokenCoin.deployed().then(function(instance) {
      TokenInstance = instance;
      return App.SimpleTokenCoin.viewToken();
    }).then(function(viewToken) {
      $('#TokenName').text(viewToken[0]);
      App.TokenSymbol = viewToken[1];
      $('.TokenSymbol').text(App.TokenSymbol);
      $('#TokenSymbol').text(App.TokenSymbol);
      $('#TokenDecimals').text(viewToken[2]);

      return App.SimpleTokenCoin.totalSupply();
    }).then(function(totalSupply) {
      $('#AllToken').text(totalSupply);

      return App.SimpleTokenCoin.balanceOf(App.account)
    }).then(function(balanceOf) {
      $('#wallet').text(App.account);
      $('#wallet').attr("href", App.network + App.account);
      $('#walletBal').text(balanceOf);

      return App.SimpleTokenCoin.whoOwner();
    }).then(function(whoOwner) {
      if (whoOwner[0] != App.account && whoOwner[1] != App.account){
        $('#owner').hide();
      }
        $('#whoOwnerNow').text(whoOwner[0]);
        $('#whoOwnerNow').attr("href", App.network + whoOwner[0]);

        $('#whoAdminNow').text(whoOwner[1]);
        $('#whoAdminNow').attr("href", App.network + whoOwner[1]);

        $('#whoTokenAddress').text(App.TokenAddress);
        $('#whoTokenAddress').attr("href", App.networkToken + App.TokenAddress);
    });
    
    App.contracts.Crowdsale.deployed().then(function(instance) {
      return instance.viewISO();
    }).then(function(viewISO) {
      getEndTimeISO(viewISO[5], viewISO[6]);
      
      App.initBonusToken();
      var res = 1/viewISO[0];
      $('#Rate').text(res);
      $('#RateVal').val(viewISO[0]);

      $('#hardcapValue').text(web3.fromWei(viewISO[2], "ether"));

      $('#whoMultisig').text(viewISO[1]);
      $('#whoMultisig').attr("href", App.network + viewISO[1]);
      $('#whoMultisigAdrr').val(viewISO[1]);
      var adrrMultisig = $('#whoMultisigAdrr').val(); 
      web3.eth.getBalance(adrrMultisig,(function (err, res) {
        var balance = web3.fromWei(res, "ether");
        $('#multisigValue').text(balance.toString(10));
      })); 

      $('#whoRestricted').text(viewISO[3]);
      $('#whoRestricted').attr("href", App.network + viewISO[3]);

      $('#restrictedPercentValue').text(viewISO[4]);
    });
  
    $('#bal').text("");
    App.loading = false;
    loader.hide();
    content.show();

    if (App.Event == true){
      $('.alert-success').show();
      $('.alert-success').delay(3000).fadeOut();
      App.Event = false;
    }
  },

  initBonusToken: function() {
  App.Crowdsale.viewBonusTokens().then(function(result) {
      if (result == 0){
        $('#bonusTokensView').hide();
        $('#CrowdsaleBonusTokenDiv').hide();
      }
        $('#bonusTokensView').text(result);
        $('#bonusTokens').val(result);
    });
  },

  Balance: function() {
    var adrr = $('#newAdrr').val();
    App.SimpleTokenCoin.balanceOf(adrr).then(function(result) {
      $('#bal').text("Баланс кошелька: " + result + " " + App.TokenSymbol);
    });
  },

  Mint: function() {
    var loader =  $('#loader');
    var content = $('#content');
    loader.show();
    content.hide();
    var toSend = $('#toMint').val();
    var valueToken = $('#valueMint').val();
    App.SimpleTokenCoin.mint(toSend, valueToken, {from:App.account}).then(function() {
      console.log("Токены чеканятся");
      App.Event = true;
      $('input').val('');
      $('#success').text("Монеты успешно начеканены");
    });
},

  SendToken: function() {
    var loader =  $('#loader');
    var content = $('#content');
    loader.show();
    content.hide();
    var toSend = $('#toSend').val();
    var valueToken = $('#valueToken').val();
    App.SimpleTokenCoin.transfer(toSend, valueToken, {from:App.account}).then(function() {
      console.log("Токены отправляются");
      App.Event = true;
      $('input').val('');
      $('#success').text("Монеты успешно отправлены");
    });
  },

  CrowdSale: function() {
    var loader =  $('#loader');
    var content = $('#content');
    loader.show();
    content.hide();
    var CrowdsaleToken = $('#CrowdsaleToken').val();
    App.Crowdsale.sendTransaction({from:App.account, value:web3.toWei(CrowdsaleToken, "ether"), gasPrice: 1000}).then(function() {
      console.log("Токены покупаются!");
      App.Event = true;
      $('form').trigger('reset');
      $('input').val('');
      $('#success').text("Токены успешно куплены");
    });
  },

  EditRate: function() {
    var loader =  $('#loader');
    var content = $('#content');
    loader.show();
    content.hide();
    var newRate = $('#newRate').val();
    App.Crowdsale.rateEdit(newRate).then(function() {
      console.log("Rate изменен");
      App.Event = true;
      $('input').val('');
      $('#success').text("Коэффициент успешно изменен");
    });
  },

  EditOwner: function() {
    var loader =  $('#loader');
    var content = $('#content');
    loader.show();
    content.hide();
    var newOwner = $('#newOwner').val();
    App.SimpleTokenCoin.transferOwnership(newOwner).then(function() {
      console.log("Владелец меняется");
      App.Event = true;
      $('input').val('');
      $('#success').text("Владелец контракта токена успешно изменен");
    });
  },

  EditHardcap: function() {
    var loader =  $('#loader');
    var content = $('#content');
    loader.show();
    content.hide();
    var newHardcap = $('#newHardcap').val();
    App.Crowdsale.hardcapEdit(web3.toWei(newHardcap, "ether")).then(function() {
      console.log("HacdCap меняется");
      App.Event = true;
      $('input').val('');
      $('#success').text("Hardcap успешно изменен");
    });
  },

  EditMultisig: function() {
    var loader =  $('#loader');
    var content = $('#content');
    loader.show();
    content.hide();
    var newMultisig = $('#newMultisig').val();
    App.Crowdsale.multisigEdit(newMultisig).then(function(result) {
      console.log("Адрес меняется");
      App.Event = true;
      $('input').val('');
      $('#success').text("Адрес успешно изменен");
    });
  },

  Approv: function() {
    var loader =  $('#loader');
    var content = $('#content');
    loader.show();
    content.hide();
    var approveSpender = $('#approveSpender').val();
    var approveValue = $('#approveValue').val();
    App.SimpleTokenCoin.approve(approveSpender, approveValue, {from:App.account}).then(function() {
      console.log("Управление токенами передается");
      App.Event = true;
      $('input').val('');
      $('#success').text("Управление передано");
    });
  },

  ApprovMoney: function() {
    var approveSpender = $('#approveMoney').val();
    App.SimpleTokenCoin.allowance(App.account, approveSpender).then(function(result) {
      $('#resultApproveMoney').text("В управлении - " + result + " " + App.TokenSymbol);
    });
  },

  SendTransferFrom: function() {
    var loader =  $('#loader');
    var content = $('#content');
    loader.show();
    content.hide();
    var fromSend = $('#transferFrom').val();  
    var toSend = $('#transferTo').val();
    var valueToken = $('#transferFromValue').val(); 
    App.SimpleTokenCoin.transferFrom(fromSend, toSend, valueToken, {from:App.account}).then(function() {
      console.log("Монеты отправляются");
      App.Event = true;
      $('input').val('');
      $('#success').text("Монеты успешно отправлены");
    });
  },

  UpLimitApprove: function() {
    var loader =  $('#loader');
    var content = $('#content');
    loader.show();
    content.hide();
    var approveSpender = $('#upLimitApproveSpender').val();
    var approveValue = $('#upLimitApproveValue').val();
    App.SimpleTokenCoin.increaseApproval(approveSpender, approveValue, {from:App.account}).then(function() {
      console.log("Лимит увеличивается");
      App.Event = true;
      $('input').val('');
      $('#success').text("Лимит успешно увеличен");
    });
  },

  DownLimitApprove: function() {
    var loader =  $('#loader');
    var content = $('#content');
    loader.show();
    content.hide();
    var approveSpender = $('#downLimitApproveSpender').val();
    var approveValue = $('#downLimitApproveValue').val();
    App.SimpleTokenCoin.decreaseApproval(approveSpender, approveValue, {from:App.account}).then(function() {
      console.log("Лимит уменьшается");
      App.Event = true;
      $('input').val('');
      $('#success').text("Лимит успешно уменьшен");
    });
  },

  EditPeriod: function() {
    var loader =  $('#loader');
    var content = $('#content');
    loader.show();
    content.hide();
    var newPeriod = $('#newPeriod').val();
    App.Crowdsale.upPeriodEdit(newPeriod).then(function(result) {
      console.log("Период меняется");
      App.Event = true;
      $('input').val('');
      $('#success').text("Период успешно изменен");
    });
  },

  FinishMint: function() {
    var loader =  $('#loader');
    var content = $('#content');
    loader.show();
    content.hide();
    App.Crowdsale.finishMint().then(function() {
      console.log("ISO Закончилось!");
      App.Event = true;
      App.FinishMint = true;
      $('#success').text("ISO успешно завершено!");
    }).catch(function(err) {
      console.log(err.message);
    });
  },

}


$(function() {
  $(window).load(function() {
    App.initWeb3();
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

// Счетчик обратного отсчета

function getEndTimeISO(_start, _period){
  var startTimeIso = new Date(timeConverter(_start));
  var endTimeIso = new Date();
  var period = _period.toNumber();
  endTimeIso.setDate(startTimeIso.getDate() + period);
  endTimeIso.setMonth(endTimeIso.getMonth() - 1); 
  endTimeIso.setHours(0);
  endTimeIso.setMinutes(0);
  endTimeIso.setSeconds(0);
  initializeClock('endTimeIso', endTimeIso);
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
    //console.log("Дни: " + t.days + "Часы: " + t.hours + "Минуты: " + t.minutes + "Секунды: " + t.seconds);
    if(t.total<=0){
      clearInterval(timeinterval);
    }
  }
  updateClock(); // запустите функцию один раз, чтобы избежать задержки
  var timeinterval = setInterval(updateClock, 1000);
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
