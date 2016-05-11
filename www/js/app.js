var db = null;

angular.module('starter', ['ionic', 'ngCordova', 'starter.controllers', 'starter.services', 'ngIOS9UIWebViewPatch'])

.run(function($ionicPlatform, $ionicPopup, $cordovaStatusbar, $cordovaSQLite) {
  $ionicPlatform.ready(function() {
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }

    if(window.StatusBar) {
      $cordovaStatusbar.overlaysWebView(true);
      $cordovaStatusbar.style(1);
      $cordovaStatusbar.styleHex('#135eb2');
      $cordovaStatusbar.hide();
      $cordovaStatusbar.show();
      var isVisible = $cordovaStatusbar.isVisible();
    }

    if (window.cordova && window.SQLitePlugin) {
      db = $cordovaSQLite.openDB( 'appguia2015.db', 1 );
    } else {
      db = window.openDatabase('appguia2015', '1.0', 'appguia2015.db', 100 * 1024 * 1024);
    }
    $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS cities (id integer primary key, city text)");
    $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS companies (id integer primary key, cities_id INTEGER NOT NULL, company text, company_ascii text, website text, email text, facebook text, advertiser TINYINT(1))");
    $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS phones (id INTEGER PRIMARY KEY AUTOINCREMENT, cities_id INTEGER NOT NULL, company_id INTEGER NOT NULL, isWhatsApp text, phone text)");

  });

})



.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider) {

  $ionicConfigProvider.tabs.position('top');

  $stateProvider

  // setup an abstract state for the tabs directive
    .state('tab', {
    url: "/tab",
    abstract: true,
    templateUrl: "templates/tabs.html"
  })

  // Each tab has its own nav history stack:

  .state('tab.search', {
      url: '/search',
      views: {
        'tab-search': {
          templateUrl: 'templates/tab-search.html'
        }
      }
    })
    .state('tab.search-resul', {
      url: '/search',
      views: {
        'tab-search': {
          templateUrl: 'templates/search-resul.html',
          controller: 'ReturnCtrl'
        }
      }
    })

  .state('tab.sync', {
      url: '/sync',
      views: {
        'tab-sync': {
          templateUrl: 'templates/tab-sync.html',
          controller: 'SyntCtrl'
        }
      }
    })

  .state('tab.account', {
    url: '/account',
    views: {
      'tab-account': {
        templateUrl: 'templates/tab-account.html'
      }
    }
  });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/tab/search');

})


.filter('split', function() {
  return function(input, delimiter) {
    var delimiter = delimiter || ',';

    return input.split(delimiter);
  }
})

.filter('tel', function () {
  return function (phoneNumber) {
  if (!phoneNumber)
    return phoneNumber;

    return formatLocal('BR', phoneNumber);
  }
})

.filter('formatE164', function () {
  return function (phoneNumber) {
  if (!phoneNumber)
    return phoneNumber;

    var resul = formatE164('BR', phoneNumber).replace(/\+55\d\d/, '');

    return resul;
  }
});
