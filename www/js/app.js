angular.module('app', ['ionic', 'ngCordova', 'lokijs', 'app.controllers', 'app.services', 'app.filters'])

.run(function($ionicPlatform, $localstorage, $rootScope, $interval, $timeout, $state, $cordovaGoogleAnalytics, $cordovaSplashscreen, LokiFactory) {

    $ionicPlatform.ready(function() {

        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
          cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
          cordova.plugins.Keyboard.disableScroll(true);

          // Hide the splash screen
          $timeout(function () {
              $cordovaSplashscreen.hide();
          }, 1000);
        }
        if (window.StatusBar) {
            // org.apache.cordova.statusbar required
            StatusBar.styleDefault();
        }

        //Start Google Analytics
        if(window.cordova){
            //$cordovaGoogleAnalytics.debugMode();
            //$cordovaGoogleAnalytics.startTrackerWithId('UA-62784869-1');
        }

        // test data for testing old localstorage codes transfer
        // var oldCodes = $localstorage.getObject('codes');
        // var totpObj = new TOTP(),
        //     secret1 = "sshhh",
        //     otp1 = totpObj.getOTP(secret1),
        //     newCode1 = {
        //         'code' : otp1,
        //         'label' : 'Old code test 1',
        //         'secret' : secret1
        //     },
        //     secret2 = "donttell",
        //     otp2 = totpObj.getOTP(secret1),
        //     newCode2 = {
        //         'code' : otp2,
        //         'label' : 'Old code test 2',
        //         'secret' : secret2
        //     };

        // oldCodes[newCode1.label] = newCode1;
        // oldCodes[newCode2.label] = newCode2;
        // $localstorage.setObject('codes', oldCodes);
        // end old codes test insert

        // Check if tour already viewed
        var tourSeen = $localstorage.get('tour', 'unseen');
        if (tourSeen == 'seen') {
            $state.go('app.codes');
        } else {
            $state.go('app.intro');
        }
    });
})

.config(function($stateProvider, $urlRouterProvider) {
    $stateProvider

    .state('app', {
        url: "/app",
        abstract: true,
        templateUrl: "templates/menu.html",
        controller: 'AppCtrl'
    })

    .state('app.intro', {
        cache: false,
        url: '/intro',
        views: {
            'menuContent': {
                templateUrl: "templates/intro.html",
                controller: 'IntroCtrl'
            }
        }
    })

    .state('app.codes', {
        url: "/codes",
        views: {
            'menuContent': {
                templateUrl: "templates/codes.html",
                controller: 'CodesCtrl'
            }
        }
    })

    .state('app.add', {
        url: "/add",
        views: {
            'menuContent': {
                templateUrl: "templates/add.html",
                controller: 'AddCtrl'
            }
        }
    })

    .state('app.manual-add', {
        url: "/manual-add",
        views: {
            'menuContent': {
                templateUrl: "templates/manual-add.html",
                controller: 'AddCtrl'
            }
        }
    })

    .state('app.settings', {
        url: "/settings",
        views: {
            'menuContent': {
                templateUrl: "templates/settings.html",
                controller: 'SettingsCtrl'
            }
        }
    })

    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/app.codes');
});
