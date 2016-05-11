angular.module('ngImgCache', ['ionic.utils'])
.run(function($ionicPlatform, $log) {
    ImgCache.options.debug = true;
    ImgCache.options.chromeQuota = 10*1024*1024;

    $ionicPlatform.ready(function() {
        ImgCache.init(function() {
            $log.debug('ImgCache init: success!');
        }, function(){
            $log.error('ImgCache init: error! Check the log for errors');
        });
    });
})
.service('CacheImages', function($q){
    return {
        checkCacheStatus : function(src){
            var deferred = $q.defer();
            ImgCache.isCached(src, function(path, success) {
                if (success) {
                    deferred.resolve(path);
                } else {
                    ImgCache.cacheFile(src, function() {
                        ImgCache.isCached(src, function(path, success) {
                            deferred.resolve(path);
                        }, deferred.reject);
                    }, deferred.reject);
                }
            }, deferred.reject);
            return deferred.promise;
        }
    };
})
// <img ng-cache ng-src="..." />
.directive('ngCache', function() {
    return {
        restrict: 'A',
        link: function(scope, el, attrs) {
            attrs.$observe('ngSrc', function(src) {
                ImgCache.isCached(src, function(path, success) {
                    if (success) {
                        ImgCache.useCachedFile(el);
                    } else {
                        ImgCache.cacheFile(src, function() {
                            ImgCache.useCachedFile(el);
                        });
                    }
                });

            });
        }
    };
});
