// Variaveis
var apiCidadesAtendidas = 'http://guiaempresarialnorte.com.br/cidades-atendidas.json';
var apiSearch = 'http://guiaempresarialnorte.com.br/search.json';


var app = angular.module('starter.services', []);



app.factory('DBA', function($cordovaSQLite, $q, $ionicPlatform) {
  var self = this;

  // Handle query's and potential errors
  self.query = function (query, parameters) {
    parameters = parameters || [];
    var q = $q.defer();

    $ionicPlatform.ready(function () {
      $cordovaSQLite.execute(db, query, parameters)
        .then(function (result) {
          q.resolve(result);
        }, function (error) {
          console.warn('I found an error');
          console.warn(error);
          q.reject(error);
        });
    });
    return q.promise;
  }

  // Proces a result set
  self.getAll = function(result) {
    var output = [];

    for (var i = 0; i < result.rows.length; i++) {
      output.push(result.rows.item(i));
    }
    return output;
  }

  // Proces a single result
  self.getById = function(result) {
    var output = null;
    output = angular.copy(result.rows.item(0));
    return output;
  }

  return self;
});


app.factory('CommonSv', function($http, $cordovaSQLite, DBA){

  return {
    // Lista todos as cidades
    citiesOnline: function() {
      return $http.get(apiCidadesAtendidas)
      .then(
      function (response) {
        return {
          cities: response.data.regions[0].cityCollection,
          banners: response.data.banners.banner_app_inicial
        }
      },
      function (httpError) {
        throw 'Error => '+httpError.status;
      });
    },

    citiesOffline: function(){
      return DBA.query("SELECT * FROM cities")
      .then(function(result){

        return {
          cities: DBA.getAll(result)
        }
      });
    }
  }

});



app.factory('SearchSv', function($http, $cordovaSQLite, DBA){

  function RemoveAccents(strAccents) {
      var strAccents = strAccents.split('');
      var strAccentsOut = new Array();
      var strAccentsLen = strAccents.length;
      var accents = 'ÀÁÂÃÄÅàáâãäåÒÓÔÕÕÖØòóôõöøÈÉÊËèéêëðÇçÐÌÍÎÏìíîïÙÚÛÜùúûüÑñŠšŸÿýŽž';
      var accentsOut = "AAAAAAaaaaaaOOOOOOOooooooEEEEeeeeeCcDIIIIiiiiUUUUuuuuNnSsYyyZz";
      for (var y = 0; y < strAccentsLen; y++) {
        if (accents.indexOf(strAccents[y]) != -1) {
          strAccentsOut[y] = accentsOut.substr(accents.indexOf(strAccents[y]), 1);
        } else
          strAccentsOut[y] = strAccents[y];
      }
      strAccentsOut = strAccentsOut.join('');
      return strAccentsOut;
    }


  return {
    online: function(data){
      return $http.get(apiSearch+'?city='+data.city+'&p='+data.word)
      .then(
      function(response){
        return {
          companies: response.data,
          listBanner:   response.data.banners
        }
      },
      function (httpError){
        throw 'Error => '+httpError.status;
      });
    },

    offline: function(data){
      var normal_word = RemoveAccents(data.word);
      return DBA.query("SELECT cities.city, companies.company, companies.facebook, companies.website, companies.email, group_concat(phones.phone) as phones, group_concat(phones.isWhatsApp) as whatsapp, companies.advertiser as advertiser FROM cities, companies, phones WHERE cities.id = companies.cities_id and companies.id = phones.company_id AND cities.city = '"+data.city+"' AND companies.company_ascii LIKE '%"+normal_word+"%' GROUP BY companies.company ORDER BY companies.advertiser DESC, companies.company_ascii ASC")
      .then(function(result){
        return {
          companies: DBA.getAll(result)
        }
      });
    }
  }

});


app.factory('ReturnSv', function(){
  return {
    data: {}
  };
});









app.factory('SyncSv', function($http, $cordovaSQLite, $ionicPopup, $rootScope, $cordovaVibration, $timeout, $state, $ionicLoading, $window, $ionicScrollDelegate, CommonSv){
  return {

    insertRegister: function(idCity, nameCity){

      var query = "INSERT INTO cities (id, city) VALUES (?,?)";
      $cordovaSQLite.execute(db, query, [idCity, nameCity]).then(function(res) {

        $ionicLoading.show({
          template: 'Sincronizando '+nameCity+', aguarde...'
        });
        $ionicScrollDelegate.scrollTop();

        // Variaveis de feedback para o parseamento do json
        $rootScope.message = "Preparando os Dados";



        // Sincronização cidades e fones
        $http.get(apiSearch+'?city='+nameCity)
        .success(function(data) {

          // Variaveis de feedback após o parceamento do json
          $rootScope.message = "Sincronizando "+nameCity+": ";

          // Loop para que chama as funções de inserções
          var count = data.companies.length;
          for(var i = 0; i < count; i++){
            var e = data.companies[i];
            insertCompany(e, i);

            var countPhone = e.phoneCollection.length;
            for(var p = 0; p < countPhone; p++){
              var phone = e.phoneCollection[p];
              insertPhones(i, e, phone);
            }

          }

          function RemoveAccents(strAccents) {
          		var strAccents = strAccents.split('');
          		var strAccentsOut = new Array();
          		var strAccentsLen = strAccents.length;
          		var accents = 'ÀÁÂÃÄÅàáâãäåÒÓÔÕÕÖØòóôõöøÈÉÊËèéêëðÇçÐÌÍÎÏìíîïÙÚÛÜùúûüÑñŠšŸÿýŽž';
          		var accentsOut = "AAAAAAaaaaaaOOOOOOOooooooEEEEeeeeeCcDIIIIiiiiUUUUuuuuNnSsYyyZz";
          		for (var y = 0; y < strAccentsLen; y++) {
          			if (accents.indexOf(strAccents[y]) != -1) {
          				strAccentsOut[y] = accentsOut.substr(accents.indexOf(strAccents[y]), 1);
          			} else
          				strAccentsOut[y] = strAccents[y];
          		}
          		strAccentsOut = strAccentsOut.join('');
          		return strAccentsOut;
          	}

          // Funções para inserção de Empresas e Fones
          function insertCompany(e, i){
            db.transaction(function(tx) {
              var company_ascii = RemoveAccents(e.company);

              tx.executeSql("INSERT OR REPLACE INTO companies (id, cities_id, company, company_ascii, website, email, facebook, advertiser) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [e.id, e.cities.id, e.company, company_ascii, e.website, e.email, e.facebook, e.advertiser], function(tx, res) {


              }, function(err) {
                alert("ERROR: " + err.message);
              });
            });
          }

          function insertPhones(i, e, phone, $scope){
            db.transaction(function(tx) {
              tx.executeSql("INSERT OR REPLACE INTO phones (id, cities_id, company_id, isWhatsApp, phone) VALUES (?, ?, ?, ?, ?)", [phone.id, e.cities.id, e.id, phone.isWhatsApp, phone.phone], function(tx, res) {

                //console.log(i+' : '+e.company+"=>"+phone.phone);
                if((count - i) == 1){
                  i += 1;
                  $ionicLoading.hide();
                  $cordovaVibration.vibrate(100);
                  $ionicPopup.alert({
                      title: "A cidade "+nameCity+", foi sincronizada com sucesso!",
                      okText: "Ok"
                  })
                  .then(function(result) {
                    $rootScope.message = "";
                    $rootScope.progressbar = "";
                    $window.location.reload(true);
                    if(!result) {
                      ionic.Platform.exitApp();
                    }
                  });
                }
                $timeout( function(){ $rootScope.progressbar = i +' de '+ count +' registros'; }, 200);


              }, function(err) {
                alert("ERROR: " + err.message);
              });
            });
          }

        })
        .error(function(response, status) {
          alert("Falha no pedido, " + response + " código do erro " + status);
        });


      }, function (error) {
        $cordovaVibration.vibrate(100);
        $ionicPopup.alert({
            title: "Olá! Infelizmente não conseguimos sincronizar esta cidade, limpe o Offline e tente novamente!",
            okText: "Ok"
        })
        .then(function(result) {
          if(!result) {
            ionic.Platform.exitApp();
          }
        });
      });

    },

    /*
      Comando para remoção de registro no Sqlite.
      Remove uma cidade por vez
    */
    removeRegister: function(idCity, nameCity){
      $cordovaSQLite.execute(db, "DELETE FROM cities WHERE id="+idCity);
      $cordovaSQLite.execute(db, "DELETE FROM companies WHERE cities_id="+idCity);
      $cordovaSQLite.execute(db, "DELETE FROM phones WHERE cities_id="+idCity);
      //$cordovaSQLite.execute(db, "DELETE FROM tag WHERE cities_id="+idCity);

      $ionicPopup.alert({
          title: "Olá! Você removeu os registros da cidade, "+nameCity+".",
          okText: "Ok"
      })
      .then(function(result) {
        if(!result) {
          ionic.Platform.exitApp();
        }
      });
      $window.location.reload(true);
    },

    deleteRegisters: function(){
      localStorage.removeItem('off_idCity');
      $cordovaSQLite.execute(db, "DELETE FROM cities");
      $cordovaSQLite.execute(db, "DELETE FROM companies");
      $cordovaSQLite.execute(db, "DELETE FROM phones");
      //$cordovaSQLite.execute(db, "DELETE FROM tag");
      $ionicPopup.alert({
          title: "Olá! Todos os registros Offline foram removidos!",
          okText: "Ok"
      })
      .then(function(result) {
        $window.location.reload(true);
        if(!result) {
          ionic.Platform.exitApp();
        }
      });
    }
  }
});
