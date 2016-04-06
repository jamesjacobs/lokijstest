angular.module('app.controllers', [])

.controller('AppCtrl', function($ionicPlatform, $scope, LokiFactory, $timeout, $rootScope, OtpFactory) {

    $ionicPlatform.ready(function() {

        console.log('$ionicPlatform.ready');

        LokiFactory.initDB();

        // Capture time for OTP calcs
        var d = new Date();
        var secondsOnLaunch = d.getSeconds();
        var globalTimerPromise;

        document.addEventListener("resume", function (event) {
            d = new Date();
            secondsOnResume = d.getSeconds();

            if(secondsOnResume > 30) {
                secondsOnResume = Math.round(secondsOnResume - 30);
            }

            var appHasResumed = true;
            $rootScope.$emit('resume', appHasResumed);

            // Recalc codes on resume
            OtpFactory.calcOtpCodes();

            // Restart global timer
            OtpFactory.startGlobalTimer(secondsOnResume);
        });

        // If over 30 seconds recalc to under 30
        if(secondsOnLaunch > 30) {
            secondsOnLaunch = Math.round(secondsOnLaunch - 30);
        }

        // Emit for starting styles (doesnt work without timeout)
        // Might not need this as runing calcOtpCodes which emits !!!!! check
        $timeout(function() {
            $rootScope.$emit('timer', secondsOnLaunch);
        }, 100);

        // Calc codes at launch
        OtpFactory.calcOtpCodes();

        // Start global timer
        OtpFactory.startGlobalTimer(secondsOnLaunch);
    });
})

.controller('IntroCtrl', function($scope, $state, $ionicSlideBoxDelegate, $localstorage, $ionicHistory, $cordovaGoogleAnalytics) {

    // if (window.cordova) {
    //     $cordovaGoogleAnalytics.trackView('2fa Intro view');
    // }

    $scope.slideIndex = null;

    // Called to navigate to the main app
    $scope.startApp = function() {

        // if (window.cordova) {
        //     $cordovaGoogleAnalytics.trackEvent('2fa', 'intro start app pressed');
        // }

        // Set flag in localstorage - intro viewed
        $localstorage.set('tour', 'seen');

        $ionicHistory.nextViewOptions({
            disableBack: true
        });

        $state.go('app.codes');
    };

    $scope.next = function() {

        // if (window.cordova) {
        //     $cordovaGoogleAnalytics.trackEvent('2fa', 'intro next slide pressed');
        // }

        $ionicSlideBoxDelegate.next();
    };

    $scope.previous = function() {

        // if (window.cordova) {
        //     $cordovaGoogleAnalytics.trackEvent('2fa', 'intro previous slide pressed');
        // }

        $ionicSlideBoxDelegate.previous();
    };

    $scope.slideChanged = function(index) {
        $scope.slideIndex = index;
    };
})

.controller('CodesCtrl', function($window, $scope, $localstorage, $state, $ionicHistory, $rootScope, $ionicPopup, $cordovaGoogleAnalytics, $timeout, LokiFactory) {

    // if (window.cordova) {
    //     $cordovaGoogleAnalytics.trackView('2fa codes view');
    // }

    console.log('inside CodesCtrl');

    // Hide the warning by default
    $scope.showNoCodesWarning = false;
    $scope.viewTitle = "Codes";
    $scope.codes = {};

    // Check if codes is an empty object
    if ($scope.codes) {
    //if ($scope.codes.length === 0) {
        $scope.showProgressBar = false;
        $scope.showNoCodesWarning = true;
        $scope.viewTitle = "Get started";
        $scope.showHeaderAddButton = false;

    } else {
        $scope.showProgressBar = true;
        $scope.showNoCodesWarning = false;
        $scope.viewTitle = "Codes";
        $scope.showHeaderAddButton = true;
    }

    // Convert old local storage codes to Loki db documents
    var oldCodes = $localstorage.getObject('codes');

    if(Object.keys(oldCodes).length) {

        console.log('old LS codes exists');

        for(item in oldCodes){
            LokiFactory.addCode(oldCodes[item]);
        }

        $timeout(function() {
            LokiFactory.getAllCodes().then(function(codes) {
                $scope.codes = codes;

                // Check if codes is an empty object
                if ($scope.codes.length === 0) {
                    $scope.showProgressBar = false;
                    $scope.showNoCodesWarning = true;
                    $scope.viewTitle = "Get started";
                    $scope.showHeaderAddButton = false;

                } else {
                    $scope.showProgressBar = true;
                    $scope.showNoCodesWarning = false;
                    $scope.viewTitle = "Codes";
                    $scope.showHeaderAddButton = true;
                }

                $rootScope.$emit('codesUpdated', true);
                $localstorage.removeObject('codes');
            });
        }, 100);

    } else {

        console.log('no old LS codes exists');

        LokiFactory.getAllCodes().then(function(codes) {
            $scope.codes = codes;

            // Check if codes is an empty object
            if ($scope.codes.length === 0) {
                $scope.showProgressBar = false;
                $scope.showNoCodesWarning = true;
                $scope.viewTitle = "Get started";
                $scope.showHeaderAddButton = false;

            } else {
                $scope.showProgressBar = true;
                $scope.showNoCodesWarning = false;
                $scope.viewTitle = "Codes";
                $scope.showHeaderAddButton = true;
            }
        });
    }

    // When codes are updated
    $rootScope.$on('codesUpdated', function() {
        // needs timeout to make sure is ran after loki save
        $timeout(function() {
            LokiFactory.getAllCodes().then(function(codes) {

                $scope.codes = codes;

                // Check if codes is an empty object
                if ($scope.codes.length === 0) {
                    $scope.showProgressBar = false;
                    $scope.showNoCodesWarning = true;
                    $scope.viewTitle = "Get started";
                    $scope.showHeaderAddButton = false;

                } else {
                    $scope.showProgressBar = true;
                    $scope.showNoCodesWarning = false;
                    $scope.viewTitle = "Codes";
                    $scope.showHeaderAddButton = true;
                }
            });
        }, 100);
    });

    // Timed animation
    var progressBarTimerSteps = 30,
        progressBarWidth = '0%';
        progressBarPercent = 0;

    $scope.showProgressBarMeter == true;

    $rootScope.$on('resume', function(event, appHasResumed) {
        $scope.showProgressBarMeter == false;

        $timeout(function() {
            $scope.showProgressBarMeter == true;
        }, 500);
    });

    // Timer progress bar
    $rootScope.$on('timer', function(event, time) {

        if ($scope.codes !== null && typeof $scope.codes === 'object') {
            if (Object.keys($scope.codes).length !== 0) {
                $scope.textWarning = '';

                var progressBarPercent = (100 / progressBarTimerSteps) * time,
                    progressBarWidth = Math.round(progressBarPercent) + '%';

                $scope.progressBarStyling = 'progress';

                if (time == 29) {
                    $scope.textWarning = 'danger';
                    $scope.progressBarStyling = 'progress progress-danger';
                    $scope.progressBarWidth = '100%';
                    $scope.showProgressBarMeter = true;
                } else if (time == 30) {
                    $scope.progressBarWidth = '0%';
                    $scope.showProgressBarMeter = false;
                } else if (time > 19) {
                    $scope.textWarning = 'danger';
                    $scope.progressBarStyling = 'progress progress-danger';
                    $scope.progressBarWidth = progressBarWidth;
                    $scope.showProgressBarMeter = true;
                } else if (time == 1) {
                    $scope.showProgressBarMeter = true;
                } else {
                    $scope.progressBarWidth = progressBarWidth;
                    $scope.showProgressBarMeter = true;
                }
            }
        }
    });

    $scope.add = function() {

        // if (window.cordova) {
        //     $cordovaGoogleAnalytics.trackEvent('2fa', 'codes add link pressed');
        // }

        $state.go('app.add');
    };

    $scope.delete = function(code) {

        // if (window.cordova) {
        //     $cordovaGoogleAnalytics.trackEvent('2fa', 'codes delete link pressed');
        // }

        var codes = $scope.codes,
            updatedCodes;

        var confirmPopup = $ionicPopup.confirm({
            title: 'Are you sure?',
            template: 'Removing this code will not disable two-step verification. <br/><br/>If two-step verification is still enabled in your control center then you will need this code to be able to sign in.',
            okText: 'Remove',
            okType: 'button button-assertive',
        });

        confirmPopup.then(function(res) {

            if(res) {

                LokiFactory.deleteCode(code);

                $rootScope.$emit('codesUpdated', true);

                // if (window.cordova) {
                //     $cordovaGoogleAnalytics.trackEvent('2fa', 'codes delete confirm pressed');
                // }
            }
        });
    };
})

.controller('AddCtrl', function($scope, $cordovaBarcodeScanner, $ionicPlatform, $localstorage, $state, $ionicHistory, $rootScope, $ionicPopup, $cordovaGoogleAnalytics, LokiFactory) {
    // if(window.cordova){
    //     $cordovaGoogleAnalytics.trackView('add view');
    // }

    $scope.scan = function() {
        $ionicPlatform.ready(function(){
            $cordovaBarcodeScanner
                .scan()
                .then(function(barcodeData) {

                    // Hack to prevent x2 back button events firing on Nexus if scan cancelled
                    if (ionic.Platform.isAndroid() && barcodeData.cancelled == 1) {
                        $state.go('app.add');
                    } else {

                        var kaboom = barcodeData.text.split('otpauth://totp/'),
                            secretAndLabel = kaboom[1].split('?'),
                            label = unescape(secretAndLabel[0]),
                            secretExplode = secretAndLabel[1].split('secret='),
                            secret = secretExplode[1],
                            oldCodes;

                        var totpObj = new TOTP(),
                            otp = totpObj.getOTP(secret);

                        var newCode = {
                            'code' : otp,
                            'label' : label,
                            'secret' : secret
                        }

                        LokiFactory.addCode(newCode);

                        $rootScope.$emit('codesUpdated', true);

                        // if (window.cordova) {
                        //     $cordovaGoogleAnalytics.trackEvent('2fa', 'new code scanned');
                        // }

                        $state.go('app.codes');
                    }

                }, function(error) {

                    if (error) {

                        var alertPopup = $ionicPopup.alert({
                            title: 'Whoops, theres a problem!',
                            template: 'There was an error scanning the barcode, please check and try again.'
                        });
                        alertPopup;

                        if (window.cordova) {
                            $cordovaGoogleAnalytics.trackEvent('2fa', 'error scanning barcode');
                        }
                    }
                });
        });
    }

    $scope.manualAddOpen = function() {

        if (window.cordova) {
            $cordovaGoogleAnalytics.trackEvent('2fa', 'manual add open pressed');
        }

        $state.go('app.manual-add');
    }

    $scope.manualAdd = function() {

        if (window.cordova) {
            $cordovaGoogleAnalytics.trackView('manual add view');
        }

        var label = $scope.label,
            secret = $scope.secret.replace(/\s/g, ''),
            totpObj = new TOTP(),
            otp,
            updatedCodes;

        // Validation
        if (!label) {
            var labelNotEnteredPopup = $ionicPopup.alert({
                title: 'Whoops, theres a problem!',
                template: 'Please enter a label for your code and try again.'
            });
        } else if (!$scope.secret) {
            var secretNotEnteredPopup = $ionicPopup.alert({
                title: 'Whoops, theres a problem!',
                template: 'Please enter the secret and try again.'
            });
        } else {
            try {
                otp = totpObj.getOTP(secret);

                console.log(otp);

                var newCode = {
                    'code' : otp,
                    'label' : $scope.label,
                    'secret' : secret
                }

                console.log(newCode);

                LokiFactory.addCode(newCode);

                // Clear fields
                $scope.label = "";
                $scope.secret = "";

                // Disable back button when state change to codes
                $ionicHistory.nextViewOptions({
                    disableBack: true
                });

                $rootScope.$emit('codesUpdated', true);

                $state.go('app.codes');

                // if (window.cordova) {
                //     $cordovaGoogleAnalytics.trackEvent('2fa', 'manual add successful');
                // }

            } catch (error) {

                console.log(error);

                var secretNotValidPopup = $ionicPopup.alert({
                    title: 'Whoops, theres a problem!',
                    template: 'Your secret is not valid, please check and try again.'
                });
                secretNotValidPopup;

                // if (window.cordova) {
                //     $cordovaGoogleAnalytics.trackEvent('2fa', 'error adding code manually');
                // }
            }
        }
    }
})

.controller('SettingsCtrl', function($scope, $state, $ionicHistory, $cordovaGoogleAnalytics) {
    // if(window.cordova){
    //     $cordovaGoogleAnalytics.trackView('settings view');
    // }

    $scope.toIntro = function(){

        $ionicHistory.nextViewOptions({
            disableBack: true
        });

        if (window.cordova) {
            $cordovaGoogleAnalytics.trackEvent('2fa', 'view intro again pressed');
        }

        $state.go('app.intro');
    }
})
