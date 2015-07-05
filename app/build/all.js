var chartModule = angular.module('edkChartApp', [
    'edkChartInfo',
])
.controller('charCtrl', function($scope) {
    var dateCounter = new Date().getTime(),
        timeStep = 1000*60*60*24;

    $scope.charData = Object.keys(new Int8Array(410))
        .reduce(function(prev, next, i) {
            var min = -1,
                max = 1,
                prev_val = prev[prev.length-1] || [0, 0, 0, 0];

            prev.push([
                dateCounter,
                +prev_val[1] + Math.random() * (max - min) + min,
                +prev_val[2] + Math.random() * (max - min) + min,
                +prev_val[3] + Math.random() * (max - min) + min
            ]);
            dateCounter += timeStep;
            return prev;
        }, []);
});

var directiveModule = angular.module('edkChartInfo', [])
.factory('d3lib', [function(){
    return {
        get: function(){ return window.d3 }
    };
}])
.directive('chartInfo', function() {
    return {
        restrict: 'E',
        transclude: true,
        scope: {
            source: '='
        },
        template: '<div ng-transclude></div>',
        controller: [
            '$scope',
            function (scope) {
                var type = 0,
                    duration = 0;

                this.setType = function(rawType) {
                    type = rawType;
                };
                this.setDuration = function(rawDuration) {
                    duration = rawDuration;
                };
                this.getChartInfo = function(){
                    return (scope.source || [])
                        .reduce(function(array, source, i){
                            var elem = [source[0], source[type+1]],
                                elmDuration = scope.source[0][0] - source[0];
                            if (!duration || elmDuration <= duration) {
                                array.push(elem);
                            }
                            return array;
                        }, []);
                };
            }
        ],
    };
})
.directive('rangeSelector', function() {
    return {
        restrict: 'E',
        transclude: true,
        require: ['^chartInfo', 'rangeSelector'],
        template: '<div ng-transclude></div>',
        controller: [
            '$scope',
            function(scope) {
                var callback = function() {};
                this.setCallBack = function(rawCallback){
                    callback = rawCallback;
                };
                this.setDuration = function(rawDuration){
                     callback(rawDuration);
                };
            }
        ],
        link: function(scope, element, attrs, controllers) {
            controllers[1].setCallBack(controllers[0].setDuration);
        }
    };
})
.directive('rangeItem', function() {
    return {
        restrict: 'E',
        transclude: true,
        require: '^rangeSelector',
        scope: {
            'days': '=',
            'month': '='
        },
        template: '<div ng-transclude></div>',
        link: function(scope, element, attrs, controller) {
            element.on('click', function(){
                element;
                controller
                    .setDuration(scope.days || scope.month * 30 || 0);
            })
        }
    };
})
.directive('chartItem', ['d3lib', function(d3) {
    var d3 = d3.get();
    return {
        restrict: 'E',
        require: '^chartInfo',
        link: function(scope, element, attrs, controller) {
            var charInfo = controller.getChartInfo(),
                svg = d3
                    .select(element[0])
                    .append('svg')
        }
    };
}])
.directive('typeSelector', function() {
    return {
        restrict: 'E',
        require: ['^chartInfo', 'typeSelector'],
        transclude: true,
        template: '<div ng-transclude></div>',
        controller: [
            '$scope',
            function(scope) {
                var callback = function() {};
                this.setCallBack = function(rawCallback){
                    callback = rawCallback;
                };
                this.setType = function(rawType){
                     callback(rawType);
                };
            }
        ],
        link: function(scope, element, attrs, controllers) {
            controllers[1].setCallBack(controllers[0].setType);
        }
    };
})
.directive('typeItem', function() {
    return {
        restrict: 'E',
        require: '^typeSelector',
        transclude: true,
        scope: {
            'dataindex': '='
        },
        template: '<div ng-transclude></div>',
        link: function(scope, element, attrs, controller) {
            element.on('click', function(){
                controller.setType(scope.dataindex);
            })
        }
    };
});

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvbnRyb2xsZXJzLmpzIiwiZGlyZWN0aXZlcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiYWxsLmpzIiwic291cmNlc0NvbnRlbnQiOlsidmFyIGNoYXJ0TW9kdWxlID0gYW5ndWxhci5tb2R1bGUoJ2Vka0NoYXJ0QXBwJywgW1xuICAgICdlZGtDaGFydEluZm8nLFxuXSlcbi5jb250cm9sbGVyKCdjaGFyQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSkge1xuICAgIHZhciBkYXRlQ291bnRlciA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpLFxuICAgICAgICB0aW1lU3RlcCA9IDEwMDAqNjAqNjAqMjQ7XG5cbiAgICAkc2NvcGUuY2hhckRhdGEgPSBPYmplY3Qua2V5cyhuZXcgSW50OEFycmF5KDQxMCkpXG4gICAgICAgIC5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgbmV4dCwgaSkge1xuICAgICAgICAgICAgdmFyIG1pbiA9IC0xLFxuICAgICAgICAgICAgICAgIG1heCA9IDEsXG4gICAgICAgICAgICAgICAgcHJldl92YWwgPSBwcmV2W3ByZXYubGVuZ3RoLTFdIHx8IFswLCAwLCAwLCAwXTtcblxuICAgICAgICAgICAgcHJldi5wdXNoKFtcbiAgICAgICAgICAgICAgICBkYXRlQ291bnRlcixcbiAgICAgICAgICAgICAgICArcHJldl92YWxbMV0gKyBNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbikgKyBtaW4sXG4gICAgICAgICAgICAgICAgK3ByZXZfdmFsWzJdICsgTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4pICsgbWluLFxuICAgICAgICAgICAgICAgICtwcmV2X3ZhbFszXSArIE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluKSArIG1pblxuICAgICAgICAgICAgXSk7XG4gICAgICAgICAgICBkYXRlQ291bnRlciArPSB0aW1lU3RlcDtcbiAgICAgICAgICAgIHJldHVybiBwcmV2O1xuICAgICAgICB9LCBbXSk7XG59KTtcbiIsInZhciBkaXJlY3RpdmVNb2R1bGUgPSBhbmd1bGFyLm1vZHVsZSgnZWRrQ2hhcnRJbmZvJywgW10pXG4uZmFjdG9yeSgnZDNsaWInLCBbZnVuY3Rpb24oKXtcbiAgICByZXR1cm4ge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCl7IHJldHVybiB3aW5kb3cuZDMgfVxuICAgIH07XG59XSlcbi5kaXJlY3RpdmUoJ2NoYXJ0SW5mbycsIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHRyYW5zY2x1ZGU6IHRydWUsXG4gICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgICBzb3VyY2U6ICc9J1xuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZTogJzxkaXYgbmctdHJhbnNjbHVkZT48L2Rpdj4nLFxuICAgICAgICBjb250cm9sbGVyOiBbXG4gICAgICAgICAgICAnJHNjb3BlJyxcbiAgICAgICAgICAgIGZ1bmN0aW9uIChzY29wZSkge1xuICAgICAgICAgICAgICAgIHZhciB0eXBlID0gMCxcbiAgICAgICAgICAgICAgICAgICAgZHVyYXRpb24gPSAwO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5zZXRUeXBlID0gZnVuY3Rpb24ocmF3VHlwZSkge1xuICAgICAgICAgICAgICAgICAgICB0eXBlID0gcmF3VHlwZTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0RHVyYXRpb24gPSBmdW5jdGlvbihyYXdEdXJhdGlvbikge1xuICAgICAgICAgICAgICAgICAgICBkdXJhdGlvbiA9IHJhd0R1cmF0aW9uO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgdGhpcy5nZXRDaGFydEluZm8gPSBmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKHNjb3BlLnNvdXJjZSB8fCBbXSlcbiAgICAgICAgICAgICAgICAgICAgICAgIC5yZWR1Y2UoZnVuY3Rpb24oYXJyYXksIHNvdXJjZSwgaSl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGVsZW0gPSBbc291cmNlWzBdLCBzb3VyY2VbdHlwZSsxXV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsbUR1cmF0aW9uID0gc2NvcGUuc291cmNlWzBdWzBdIC0gc291cmNlWzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZHVyYXRpb24gfHwgZWxtRHVyYXRpb24gPD0gZHVyYXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJyYXkucHVzaChlbGVtKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFycmF5O1xuICAgICAgICAgICAgICAgICAgICAgICAgfSwgW10pO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIF0sXG4gICAgfTtcbn0pXG4uZGlyZWN0aXZlKCdyYW5nZVNlbGVjdG9yJywgZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgdHJhbnNjbHVkZTogdHJ1ZSxcbiAgICAgICAgcmVxdWlyZTogWydeY2hhcnRJbmZvJywgJ3JhbmdlU2VsZWN0b3InXSxcbiAgICAgICAgdGVtcGxhdGU6ICc8ZGl2IG5nLXRyYW5zY2x1ZGU+PC9kaXY+JyxcbiAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgJyRzY29wZScsXG4gICAgICAgICAgICBmdW5jdGlvbihzY29wZSkge1xuICAgICAgICAgICAgICAgIHZhciBjYWxsYmFjayA9IGZ1bmN0aW9uKCkge307XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRDYWxsQmFjayA9IGZ1bmN0aW9uKHJhd0NhbGxiYWNrKXtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sgPSByYXdDYWxsYmFjaztcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0RHVyYXRpb24gPSBmdW5jdGlvbihyYXdEdXJhdGlvbil7XG4gICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhyYXdEdXJhdGlvbik7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgXSxcbiAgICAgICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBjb250cm9sbGVycykge1xuICAgICAgICAgICAgY29udHJvbGxlcnNbMV0uc2V0Q2FsbEJhY2soY29udHJvbGxlcnNbMF0uc2V0RHVyYXRpb24pO1xuICAgICAgICB9XG4gICAgfTtcbn0pXG4uZGlyZWN0aXZlKCdyYW5nZUl0ZW0nLCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICB0cmFuc2NsdWRlOiB0cnVlLFxuICAgICAgICByZXF1aXJlOiAnXnJhbmdlU2VsZWN0b3InLFxuICAgICAgICBzY29wZToge1xuICAgICAgICAgICAgJ2RheXMnOiAnPScsXG4gICAgICAgICAgICAnbW9udGgnOiAnPSdcbiAgICAgICAgfSxcbiAgICAgICAgdGVtcGxhdGU6ICc8ZGl2IG5nLXRyYW5zY2x1ZGU+PC9kaXY+JyxcbiAgICAgICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBjb250cm9sbGVyKSB7XG4gICAgICAgICAgICBlbGVtZW50Lm9uKCdjbGljaycsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgZWxlbWVudDtcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyXG4gICAgICAgICAgICAgICAgICAgIC5zZXREdXJhdGlvbihzY29wZS5kYXlzIHx8IHNjb3BlLm1vbnRoICogMzAgfHwgMCk7XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgfTtcbn0pXG4uZGlyZWN0aXZlKCdjaGFydEl0ZW0nLCBbJ2QzbGliJywgZnVuY3Rpb24oZDMpIHtcbiAgICB2YXIgZDMgPSBkMy5nZXQoKTtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICByZXF1aXJlOiAnXmNoYXJ0SW5mbycsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycywgY29udHJvbGxlcikge1xuICAgICAgICAgICAgdmFyIGNoYXJJbmZvID0gY29udHJvbGxlci5nZXRDaGFydEluZm8oKSxcbiAgICAgICAgICAgICAgICBzdmcgPSBkM1xuICAgICAgICAgICAgICAgICAgICAuc2VsZWN0KGVsZW1lbnRbMF0pXG4gICAgICAgICAgICAgICAgICAgIC5hcHBlbmQoJ3N2ZycpXG4gICAgICAgIH1cbiAgICB9O1xufV0pXG4uZGlyZWN0aXZlKCd0eXBlU2VsZWN0b3InLCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICByZXF1aXJlOiBbJ15jaGFydEluZm8nLCAndHlwZVNlbGVjdG9yJ10sXG4gICAgICAgIHRyYW5zY2x1ZGU6IHRydWUsXG4gICAgICAgIHRlbXBsYXRlOiAnPGRpdiBuZy10cmFuc2NsdWRlPjwvZGl2PicsXG4gICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICckc2NvcGUnLFxuICAgICAgICAgICAgZnVuY3Rpb24oc2NvcGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgY2FsbGJhY2sgPSBmdW5jdGlvbigpIHt9O1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0Q2FsbEJhY2sgPSBmdW5jdGlvbihyYXdDYWxsYmFjayl7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrID0gcmF3Q2FsbGJhY2s7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB0aGlzLnNldFR5cGUgPSBmdW5jdGlvbihyYXdUeXBlKXtcbiAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKHJhd1R5cGUpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIF0sXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycywgY29udHJvbGxlcnMpIHtcbiAgICAgICAgICAgIGNvbnRyb2xsZXJzWzFdLnNldENhbGxCYWNrKGNvbnRyb2xsZXJzWzBdLnNldFR5cGUpO1xuICAgICAgICB9XG4gICAgfTtcbn0pXG4uZGlyZWN0aXZlKCd0eXBlSXRlbScsIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHJlcXVpcmU6ICdedHlwZVNlbGVjdG9yJyxcbiAgICAgICAgdHJhbnNjbHVkZTogdHJ1ZSxcbiAgICAgICAgc2NvcGU6IHtcbiAgICAgICAgICAgICdkYXRhaW5kZXgnOiAnPSdcbiAgICAgICAgfSxcbiAgICAgICAgdGVtcGxhdGU6ICc8ZGl2IG5nLXRyYW5zY2x1ZGU+PC9kaXY+JyxcbiAgICAgICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBjb250cm9sbGVyKSB7XG4gICAgICAgICAgICBlbGVtZW50Lm9uKCdjbGljaycsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgY29udHJvbGxlci5zZXRUeXBlKHNjb3BlLmRhdGFpbmRleCk7XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgfTtcbn0pO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9