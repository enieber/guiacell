var app = angular.module('starter.controllers', []);

app.controller('bannerCapa', function($scope, $ionicSlideBoxDelegate, $interval, CommonSv){

  //Verificação Online Offline by Edailton
  document.addEventListener("online", onOnline, false);
  document.addEventListener("offline", onOffline, false);

  if(window.Connection) {
    if(navigator.connection.type == Connection.NONE) {
      $scope.bannerConnection = false;
    }else{
      $scope.bannerConnection = true;
      $ionicSlideBoxDelegate.update();
    }
  }

  function onOnline() {
    $scope.bannerConnection = true;
  }

  function onOffline() {
    $scope.bannerConnection = false;
  }

  /* Faz Pesquisa */
  var promiseBanners = CommonSv.citiesOnline();
  promiseBanners.then(function(data) {
    $scope.searchBanners = data.banners;
    $ionicSlideBoxDelegate.update();
  });
});

app.controller('SearchCtrl', function($scope, $ionicSlideBoxDelegate, $ionicPopup, $state, $ionicLoading, $cordovaVibration, CommonSv, SearchSv, ReturnSv) {

      $scope.mudouCidade = function() {
         //Salva a última cidade para fixar no selectBox
         window.localStorage.setItem("nomeCidade", $scope.nomeCidade);
       };
      //Verificação Online Offline by Edailton
      document.addEventListener("online", onOnline, false);
      document.addEventListener("offline", onOffline, false);


      // Mostra ultima cidade pesquisada
      var itemCity = window.localStorage.getItem('nomeCidade');
      if(itemCity){
        $scope.itemCity = itemCity;
      }else{
        $scope.itemCity = window.localStorage.setItem("nomeCidade", "SINOP - MT");
      }


      function loading(text){
        $ionicLoading.show({
          template: text
        });
      }

      function allCities(){
        var promiseBanners = CommonSv.citiesOnline();
        promiseBanners.then(function(data) {
          $scope.searchBanners = data.banners;
          $ionicSlideBoxDelegate.update();
        });
        var promise = CommonSv.citiesOnline();
        promise.then(function(data) {
          $scope.cities = data.cities;
          $ionicLoading.hide();
        });
      }

      function allCitiesOff(){
        var promise = CommonSv.citiesOffline();
        promise.then(function(data) {
          $scope.cities = data.cities;
          $ionicLoading.hide();
        });
      }

      /*
        Verifica se existe coneão com a internet e define o tipo de busca
        1. Entrou sem internet = Muda para offline
        2. Se conectou a internet = opção de mudar o push para online
      */
      if(window.Connection) {
        if(navigator.connection.type == Connection.NONE) {

          $scope.typeSearch = 'Offline';
          loading('Aguarde, carregando informações...');
          allCitiesOff();

        }else{

          $scope.typeSearch = 'Online';
          loading('Aguarde, carregando informações...');
          allCities();

        }
      }

      // Faz Pesquisa
      $scope.btnSearch = function(){

        if($scope.word =='' || $scope.word =='undefined' || $scope.word.length <= 2 || $scope.word.length == 0){
          $cordovaVibration.vibrate(100);
          $ionicPopup.alert({
              title: "Digite no mínimo 3 caracteres!",
              okText: "Ok"
          })
          .then(function(result) {
            if(!result) {
              ionic.Platform.exitApp();
            }
          });

          return false;

        }else{

          if(navigator.connection.type == Connection.NONE) {

            $scope.nomeCidade = window.localStorage.getItem('nomeCidade');
            loading('Aguarde, carregando informações...');
            $scope.typeSearch = "Offline";
            allCitiesOff();

              // Pesquisa no Sqlite
              var itemCity = window.localStorage.getItem('nomeCidade');
              console.log('Pesquisa Offline');

              loading('Aguarde carregando informações...');

              var data = {
                'city'    :   itemCity,
                'word'    :   $scope.word
              };

              var promise = SearchSv.offline(data);
              promise.then(function(data) {
              $ionicLoading.hide();

                var count = Object.keys(data.companies).length;
                if(count == 0){
                  $ionicPopup.alert({
                      title: "Não encontramos registro com o termo pesquisado!",
                      okText: "Ok"
                  })
                  .then(function(result) {
                    if(!result) {
                      ionic.Platform.exitApp();
                    }
                  });
                }else{
                  $state.go('tab.search-resul', {});
                  ReturnSv.data.term  =  $scope.word;
                  ReturnSv.data.resul =  data.companies;
                  ReturnSv.data.typeSearch =  'Offline';
                  console.log(data.companies);
                }

              });

              }else{

              var itemCity = window.localStorage.getItem('nomeCidade');

              // Pesquisa na Api
                console.log('Pesquisa Online');

                loading('Aguarde carregando informações...');

                var data = {
                  'city'    :   itemCity,
                  'word'    :   $scope.word
                };

                var promise = SearchSv.online(data);
                promise.then(function(data) {
                  $ionicLoading.hide();

                  var count = Object.keys(data.companies.companies).length;
                  if(count == 0){
                    $cordovaVibration.vibrate(100);
                    $ionicPopup.alert({
                        title: "Não encontramos registros com o termo pesquisado.",
                        okText: "Ok"
                    })
                    .then(function(result) {

                      if(!result) {
                        ionic.Platform.exitApp();
                      }
                    });
                  }else{
                    $state.go('tab.search-resul', {});
                    ReturnSv.data.term   =  $scope.word;
                    ReturnSv.data.resul  =  data.companies.companies;
                    ReturnSv.data.banners  =  data.listBanner.banner_app_resultado;
                    ReturnSv.data.typeSearch =  'Online';
                    console.log(data.companies.companies);
                  }

                });

              }
            }

          }

      function onOnline() {
        $scope.typeSearch = 'Online';
        window.localStorage.setItem("typeJson", 'Online');
        $scope.nomeCidade = window.localStorage.getItem('nomeCidade');
        loading('Aguarde, carregando informações...');
        allCities();
      }

      function onOffline() {
        window.localStorage.setItem("typeJson", 'Offline');
        $scope.nomeCidade = window.localStorage.getItem('nomeCidade');
        loading('Aguarde, carregando informações...');
        $scope.typeSearch = "Offline";
        allCitiesOff();
      }

});

app.controller('ReturnCtrl', function($scope, $ionicSlideBoxDelegate, $interval, $cordovaInAppBrowser, ReturnSv){

  $scope.openBrowser = function(url){
      window.open(url, '_system', 'location=yes');
  }

  $scope.searchTerm  = ReturnSv.data.term;
  $scope.searchResul = ReturnSv.data.resul;

  if(ReturnSv.data.typeSearch == 'Offline'){
    $scope.bannerResul = false;
    $scope.searchOnline = false;
    $scope.searchOffline = true;
  }
  if(ReturnSv.data.typeSearch == 'Online'){
    $scope.bannerResul = true;
    $scope.searchOnline = true;
    $scope.searchOffline = false;

    $scope.searchBanners = ReturnSv.data.banners;
    $ionicSlideBoxDelegate.update();

  }
});

app.controller('SyntCtrl', function($scope, CommonSv, SyncSv){

  function allCities(){
    $scope.spinner = true;
    var promise = CommonSv.citiesOnline();
    promise.then(function(data) {
      $scope.cities = data.cities;
      $scope.spinner = false;
    });
  }

  if(window.Connection) {
    if(navigator.connection.type == Connection.NONE) {
      $scope.connectionInfo = true;
    }else{
      allCities();
    }
  }

  //Verificação Online Offline by Edailton
  document.addEventListener("online", onOnline, false);
  document.addEventListener("offline", onOffline, false);

  function onOnline() {
    $scope.connectionInfo = false;
    $scope.spinner = true;
    var promise = CommonSv.citiesOnline();
    promise.then(function(data) {
      $scope.cities = data.cities;
      $scope.spinner = false;
    });
  }

  function onOffline() {
    $scope.connectionInfo = true;
  }

  // Sincroniza Informações
  var off_idCity = localStorage.getItem('off_idCity');
  var selection = []; // Array de cidades Sincronizadas

  if(off_idCity){
    // ja existe cidades sincronizadas no array
    selection = off_idCity.split(',');

    var storedTasksArray = off_idCity.split(',');

    for(var i = 0; i < storedTasksArray.length; i++){
      var item      = 'listCheckout'+storedTasksArray[i];
      var valorItem = storedTasksArray[i];

      $scope[ item ] = valorItem;
    }
  }

  $scope.btnSync = function(action, idCity, nameCity){

    var idx = selection.indexOf(idCity);
    console.log(idx);

    if (idx > -1) {

      // Condicional para remover item do localstorage
      selection.splice(idx, 1);
      localStorage.setItem('off_idCity', selection);

      SyncSv.removeRegister(idCity, nameCity);

    }else{

      // Adiciona itens no localstorage
      selection.push(idCity);
      localStorage.setItem('off_idCity', selection);

      // Faz Sincronização
      var promise = SyncSv.insertRegister(idCity, nameCity);

    }

  }

  $scope.deleteRegisters = function(){
    SyncSv.deleteRegisters();
  }

});
