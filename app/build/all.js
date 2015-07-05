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
                dateMargin = 10000;

            prev.push([
                dateCounter,
                +prev_val[1] + Math.random() * (max - min) + min,
                +prev_val[2] + Math.random() * (max - min) + min,
                +prev_val[3] + Math.random() * (max - min) + min
            ]);
            dateCounter += timeStep + Math.random() * (max*dateMargin - min*dateMargin) + min*dateMargin;
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
                    duration = 0,
                    changeCallBack = function(){};

                this.setCallBack = function(callBack) {
                    changeCallBack = callBack;
                };
                this.setType = function(rawType) {
                    type = rawType;
                    changeCallBack();
                };
                this.setDuration = function(rawDuration) {
                    duration = rawDuration * 1000*60*60*24;
                    changeCallBack();
                };
                this.getChartInfo = function(){
                    return (scope.source || [])
                        .reduce(function(array, source, i){
                            var elem = [source[0], source[type+1]],
                                elmDuration = source[0]- scope.source[0][0];
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
        restrict: 'A',
        require: ['^chartInfo', 'rangeSelector'],
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
                size = {
                    width: 700,
                    height: 300
                },
                margin = {
                    top: 30,
                    right: 10,
                    bottom: 30,
                    left: 35
                },
                width = size.width - margin.left - margin.right,
                height = size.height - margin.top - margin.bottom,
                ANIMATION_DURATION = 700;

            var svg = d3
                .select(element[0])
                .append('svg')
                .attr({
                    "height": size.height,
                    "width": size.width
                })
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            var background = svg
                .append('rect')
                .attr({
                    'class': 'background',
                    height: height,
                    width: width
                });

            var time_axis = svg.append("g")
                .attr({
                    'class': "x axis time",
                    transform: "translate(0," + height + ")"
                });

            var val_axis = svg.append("g")
                .attr({
                    'class': "y axis val",
                });
            var line = svg.append("g")
                .attr({
                    'class': "line_info",
                })
                .append("path")
            line
                .transition()
                .duration(ANIMATION_DURATION)
                .ease("linear")

           var locale = d3.locale({
                "decimal": ",",
                "thousands": "\xa0",
                "grouping": [3],
                "currency": ["", " руб."],
                "dateTime": "%A, %e %B %Y г. %X",
                "date": "%d.%m.%Y",
                "time": "%H:%M:%S",
                "periods": ["AM", "PM"],
                "days": ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"],
                "shortDays": ["вс", "пн", "вт", "ср", "чт", "пт", "сб"],
                "months": ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
                "shortMonths": ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"]
            });


            var insertData = function(data) {
                var xScale = d3.time.scale()
                    .range([0, width])
                    .domain(d3.extent(data.map(function(d) {
                        return d[0];
                    })));

                var yScale = d3.scale.linear()
                    .range([0, height])
                    .domain(d3.extent(data.map(function(d) {
                        return d[1];
                    })));

                var line_function = d3.svg.line()
                    .x(function(d) {
                        return xScale(d[0]);
                    })
                    .y(function(d) {
                        return yScale(d[1]);
                    })
                    .interpolate("monotone");

                line
                      .data([data])
                      .attr("class", "line")
                      .attr("d", line_function);

                 var xAxisTime = d3.svg.axis()
                    .scale(xScale)
                    .orient("bottom")
                    .ticks(5)
                    .innerTickSize(-height)
                    .outerTickSize(0)
                    .tickFormat(locale.timeFormat('%e.%m'))
                    
                 var yAxisVal = d3.svg.axis()
                    .scale(yScale)
                    .orient("left")
                    .ticks(5)
                    .innerTickSize(-width)
                    .outerTickSize(0)

                 val_axis
                    .transition()
                    .duration(ANIMATION_DURATION)
                    .ease("linear")
                    .call(yAxisVal)

                 time_axis
                    .transition()
                    .duration(ANIMATION_DURATION)
                    .ease("linear")
                    .call(xAxisTime);
            }
            insertData(controller.getChartInfo());
            controller.setCallBack(function(){
                insertData(controller.getChartInfo());
            })
        }
    };
}])
.directive('typeSelector', function() {
    return {
        restrict: 'A',
        require: '^chartInfo',
        link: function(scope, element, attrs, controller) {
            element.on('change', function(){
                controller.setType(+element.val());
            });
        }
    };
});

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvbnRyb2xsZXJzLmpzIiwiZGlyZWN0aXZlcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJhbGwuanMiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgY2hhcnRNb2R1bGUgPSBhbmd1bGFyLm1vZHVsZSgnZWRrQ2hhcnRBcHAnLCBbXG4gICAgJ2Vka0NoYXJ0SW5mbycsXG5dKVxuLmNvbnRyb2xsZXIoJ2NoYXJDdHJsJywgZnVuY3Rpb24oJHNjb3BlKSB7XG4gICAgdmFyIGRhdGVDb3VudGVyID0gbmV3IERhdGUoKS5nZXRUaW1lKCksXG4gICAgICAgIHRpbWVTdGVwID0gMTAwMCo2MCo2MCoyNDtcblxuICAgICRzY29wZS5jaGFyRGF0YSA9IE9iamVjdC5rZXlzKG5ldyBJbnQ4QXJyYXkoNDEwKSlcbiAgICAgICAgLnJlZHVjZShmdW5jdGlvbihwcmV2LCBuZXh0LCBpKSB7XG4gICAgICAgICAgICB2YXIgbWluID0gLTEsXG4gICAgICAgICAgICAgICAgbWF4ID0gMSxcbiAgICAgICAgICAgICAgICBwcmV2X3ZhbCA9IHByZXZbcHJldi5sZW5ndGgtMV0gfHwgWzAsIDAsIDAsIDBdO1xuICAgICAgICAgICAgICAgIGRhdGVNYXJnaW4gPSAxMDAwMDtcblxuICAgICAgICAgICAgcHJldi5wdXNoKFtcbiAgICAgICAgICAgICAgICBkYXRlQ291bnRlcixcbiAgICAgICAgICAgICAgICArcHJldl92YWxbMV0gKyBNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbikgKyBtaW4sXG4gICAgICAgICAgICAgICAgK3ByZXZfdmFsWzJdICsgTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4pICsgbWluLFxuICAgICAgICAgICAgICAgICtwcmV2X3ZhbFszXSArIE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluKSArIG1pblxuICAgICAgICAgICAgXSk7XG4gICAgICAgICAgICBkYXRlQ291bnRlciArPSB0aW1lU3RlcCArIE1hdGgucmFuZG9tKCkgKiAobWF4KmRhdGVNYXJnaW4gLSBtaW4qZGF0ZU1hcmdpbikgKyBtaW4qZGF0ZU1hcmdpbjtcbiAgICAgICAgICAgIHJldHVybiBwcmV2O1xuICAgICAgICB9LCBbXSk7XG59KTtcbiIsInZhciBkaXJlY3RpdmVNb2R1bGUgPSBhbmd1bGFyLm1vZHVsZSgnZWRrQ2hhcnRJbmZvJywgW10pXG4uZmFjdG9yeSgnZDNsaWInLCBbZnVuY3Rpb24oKXtcbiAgICByZXR1cm4ge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCl7IHJldHVybiB3aW5kb3cuZDMgfVxuICAgIH07XG59XSlcbi5kaXJlY3RpdmUoJ2NoYXJ0SW5mbycsIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHRyYW5zY2x1ZGU6IHRydWUsXG4gICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgICBzb3VyY2U6ICc9J1xuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZTogJzxkaXYgbmctdHJhbnNjbHVkZT48L2Rpdj4nLFxuICAgICAgICBjb250cm9sbGVyOiBbXG4gICAgICAgICAgICAnJHNjb3BlJyxcbiAgICAgICAgICAgIGZ1bmN0aW9uIChzY29wZSkge1xuICAgICAgICAgICAgICAgIHZhciB0eXBlID0gMCxcbiAgICAgICAgICAgICAgICAgICAgZHVyYXRpb24gPSAwLFxuICAgICAgICAgICAgICAgICAgICBjaGFuZ2VDYWxsQmFjayA9IGZ1bmN0aW9uKCl7fTtcblxuICAgICAgICAgICAgICAgIHRoaXMuc2V0Q2FsbEJhY2sgPSBmdW5jdGlvbihjYWxsQmFjaykge1xuICAgICAgICAgICAgICAgICAgICBjaGFuZ2VDYWxsQmFjayA9IGNhbGxCYWNrO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRUeXBlID0gZnVuY3Rpb24ocmF3VHlwZSkge1xuICAgICAgICAgICAgICAgICAgICB0eXBlID0gcmF3VHlwZTtcbiAgICAgICAgICAgICAgICAgICAgY2hhbmdlQ2FsbEJhY2soKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0RHVyYXRpb24gPSBmdW5jdGlvbihyYXdEdXJhdGlvbikge1xuICAgICAgICAgICAgICAgICAgICBkdXJhdGlvbiA9IHJhd0R1cmF0aW9uICogMTAwMCo2MCo2MCoyNDtcbiAgICAgICAgICAgICAgICAgICAgY2hhbmdlQ2FsbEJhY2soKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHRoaXMuZ2V0Q2hhcnRJbmZvID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChzY29wZS5zb3VyY2UgfHwgW10pXG4gICAgICAgICAgICAgICAgICAgICAgICAucmVkdWNlKGZ1bmN0aW9uKGFycmF5LCBzb3VyY2UsIGkpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBlbGVtID0gW3NvdXJjZVswXSwgc291cmNlW3R5cGUrMV1dLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbG1EdXJhdGlvbiA9IHNvdXJjZVswXS0gc2NvcGUuc291cmNlWzBdWzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZHVyYXRpb24gfHwgZWxtRHVyYXRpb24gPD0gZHVyYXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJyYXkucHVzaChlbGVtKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFycmF5O1xuICAgICAgICAgICAgICAgICAgICAgICAgfSwgW10pO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIF0sXG4gICAgfTtcbn0pXG4uZGlyZWN0aXZlKCdyYW5nZVNlbGVjdG9yJywgZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdBJyxcbiAgICAgICAgcmVxdWlyZTogWydeY2hhcnRJbmZvJywgJ3JhbmdlU2VsZWN0b3InXSxcbiAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgJyRzY29wZScsXG4gICAgICAgICAgICBmdW5jdGlvbihzY29wZSkge1xuICAgICAgICAgICAgICAgIHZhciBjYWxsYmFjayA9IGZ1bmN0aW9uKCkge307XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRDYWxsQmFjayA9IGZ1bmN0aW9uKHJhd0NhbGxiYWNrKXtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sgPSByYXdDYWxsYmFjaztcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0RHVyYXRpb24gPSBmdW5jdGlvbihyYXdEdXJhdGlvbil7XG4gICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhyYXdEdXJhdGlvbik7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgXSxcbiAgICAgICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBjb250cm9sbGVycykge1xuICAgICAgICAgICAgY29udHJvbGxlcnNbMV0uc2V0Q2FsbEJhY2soY29udHJvbGxlcnNbMF0uc2V0RHVyYXRpb24pO1xuICAgICAgICB9XG4gICAgfTtcbn0pXG4uZGlyZWN0aXZlKCdyYW5nZUl0ZW0nLCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICB0cmFuc2NsdWRlOiB0cnVlLFxuICAgICAgICByZXF1aXJlOiAnXnJhbmdlU2VsZWN0b3InLFxuICAgICAgICBzY29wZToge1xuICAgICAgICAgICAgJ2RheXMnOiAnPScsXG4gICAgICAgICAgICAnbW9udGgnOiAnPSdcbiAgICAgICAgfSxcbiAgICAgICAgdGVtcGxhdGU6ICc8ZGl2IG5nLXRyYW5zY2x1ZGU+PC9kaXY+JyxcbiAgICAgICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBjb250cm9sbGVyKSB7XG4gICAgICAgICAgICBlbGVtZW50Lm9uKCdjbGljaycsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgZWxlbWVudDtcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyXG4gICAgICAgICAgICAgICAgICAgIC5zZXREdXJhdGlvbihzY29wZS5kYXlzIHx8IHNjb3BlLm1vbnRoICogMzAgfHwgMCk7XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgfTtcbn0pXG4uZGlyZWN0aXZlKCdjaGFydEl0ZW0nLCBbJ2QzbGliJywgZnVuY3Rpb24oZDMpIHtcbiAgICB2YXIgZDMgPSBkMy5nZXQoKTtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICByZXF1aXJlOiAnXmNoYXJ0SW5mbycsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycywgY29udHJvbGxlcikge1xuICAgICAgICAgICAgdmFyIGNoYXJJbmZvID0gY29udHJvbGxlci5nZXRDaGFydEluZm8oKSxcbiAgICAgICAgICAgICAgICBzaXplID0ge1xuICAgICAgICAgICAgICAgICAgICB3aWR0aDogNzAwLFxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IDMwMFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgbWFyZ2luID0ge1xuICAgICAgICAgICAgICAgICAgICB0b3A6IDMwLFxuICAgICAgICAgICAgICAgICAgICByaWdodDogMTAsXG4gICAgICAgICAgICAgICAgICAgIGJvdHRvbTogMzAsXG4gICAgICAgICAgICAgICAgICAgIGxlZnQ6IDM1XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB3aWR0aCA9IHNpemUud2lkdGggLSBtYXJnaW4ubGVmdCAtIG1hcmdpbi5yaWdodCxcbiAgICAgICAgICAgICAgICBoZWlnaHQgPSBzaXplLmhlaWdodCAtIG1hcmdpbi50b3AgLSBtYXJnaW4uYm90dG9tLFxuICAgICAgICAgICAgICAgIEFOSU1BVElPTl9EVVJBVElPTiA9IDcwMDtcblxuICAgICAgICAgICAgdmFyIHN2ZyA9IGQzXG4gICAgICAgICAgICAgICAgLnNlbGVjdChlbGVtZW50WzBdKVxuICAgICAgICAgICAgICAgIC5hcHBlbmQoJ3N2ZycpXG4gICAgICAgICAgICAgICAgLmF0dHIoe1xuICAgICAgICAgICAgICAgICAgICBcImhlaWdodFwiOiBzaXplLmhlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgXCJ3aWR0aFwiOiBzaXplLndpZHRoXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuYXBwZW5kKFwiZ1wiKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiICsgbWFyZ2luLmxlZnQgKyBcIixcIiArIG1hcmdpbi50b3AgKyBcIilcIik7XG5cbiAgICAgICAgICAgIHZhciBiYWNrZ3JvdW5kID0gc3ZnXG4gICAgICAgICAgICAgICAgLmFwcGVuZCgncmVjdCcpXG4gICAgICAgICAgICAgICAgLmF0dHIoe1xuICAgICAgICAgICAgICAgICAgICAnY2xhc3MnOiAnYmFja2dyb3VuZCcsXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgICB3aWR0aDogd2lkdGhcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgdmFyIHRpbWVfYXhpcyA9IHN2Zy5hcHBlbmQoXCJnXCIpXG4gICAgICAgICAgICAgICAgLmF0dHIoe1xuICAgICAgICAgICAgICAgICAgICAnY2xhc3MnOiBcInggYXhpcyB0aW1lXCIsXG4gICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybTogXCJ0cmFuc2xhdGUoMCxcIiArIGhlaWdodCArIFwiKVwiXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHZhciB2YWxfYXhpcyA9IHN2Zy5hcHBlbmQoXCJnXCIpXG4gICAgICAgICAgICAgICAgLmF0dHIoe1xuICAgICAgICAgICAgICAgICAgICAnY2xhc3MnOiBcInkgYXhpcyB2YWxcIixcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHZhciBsaW5lID0gc3ZnLmFwcGVuZChcImdcIilcbiAgICAgICAgICAgICAgICAuYXR0cih7XG4gICAgICAgICAgICAgICAgICAgICdjbGFzcyc6IFwibGluZV9pbmZvXCIsXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuYXBwZW5kKFwicGF0aFwiKVxuICAgICAgICAgICAgbGluZVxuICAgICAgICAgICAgICAgIC50cmFuc2l0aW9uKClcbiAgICAgICAgICAgICAgICAuZHVyYXRpb24oQU5JTUFUSU9OX0RVUkFUSU9OKVxuICAgICAgICAgICAgICAgIC5lYXNlKFwibGluZWFyXCIpXG5cbiAgICAgICAgICAgdmFyIGxvY2FsZSA9IGQzLmxvY2FsZSh7XG4gICAgICAgICAgICAgICAgXCJkZWNpbWFsXCI6IFwiLFwiLFxuICAgICAgICAgICAgICAgIFwidGhvdXNhbmRzXCI6IFwiXFx4YTBcIixcbiAgICAgICAgICAgICAgICBcImdyb3VwaW5nXCI6IFszXSxcbiAgICAgICAgICAgICAgICBcImN1cnJlbmN5XCI6IFtcIlwiLCBcIiDRgNGD0LEuXCJdLFxuICAgICAgICAgICAgICAgIFwiZGF0ZVRpbWVcIjogXCIlQSwgJWUgJUIgJVkg0LMuICVYXCIsXG4gICAgICAgICAgICAgICAgXCJkYXRlXCI6IFwiJWQuJW0uJVlcIixcbiAgICAgICAgICAgICAgICBcInRpbWVcIjogXCIlSDolTTolU1wiLFxuICAgICAgICAgICAgICAgIFwicGVyaW9kc1wiOiBbXCJBTVwiLCBcIlBNXCJdLFxuICAgICAgICAgICAgICAgIFwiZGF5c1wiOiBbXCLQstC+0YHQutGA0LXRgdC10L3RjNC1XCIsIFwi0L/QvtC90LXQtNC10LvRjNC90LjQulwiLCBcItCy0YLQvtGA0L3QuNC6XCIsIFwi0YHRgNC10LTQsFwiLCBcItGH0LXRgtCy0LXRgNCzXCIsIFwi0L/Rj9GC0L3QuNGG0LBcIiwgXCLRgdGD0LHQsdC+0YLQsFwiXSxcbiAgICAgICAgICAgICAgICBcInNob3J0RGF5c1wiOiBbXCLQstGBXCIsIFwi0L/QvVwiLCBcItCy0YJcIiwgXCLRgdGAXCIsIFwi0YfRglwiLCBcItC/0YJcIiwgXCLRgdCxXCJdLFxuICAgICAgICAgICAgICAgIFwibW9udGhzXCI6IFtcItGP0L3QstCw0YDRj1wiLCBcItGE0LXQstGA0LDQu9GPXCIsIFwi0LzQsNGA0YLQsFwiLCBcItCw0L/RgNC10LvRj1wiLCBcItC80LDRj1wiLCBcItC40Y7QvdGPXCIsIFwi0LjRjtC70Y9cIiwgXCLQsNCy0LPRg9GB0YLQsFwiLCBcItGB0LXQvdGC0Y/QsdGA0Y9cIiwgXCLQvtC60YLRj9Cx0YDRj1wiLCBcItC90L7Rj9Cx0YDRj1wiLCBcItC00LXQutCw0LHRgNGPXCJdLFxuICAgICAgICAgICAgICAgIFwic2hvcnRNb250aHNcIjogW1wi0Y/QvdCyXCIsIFwi0YTQtdCyXCIsIFwi0LzQsNGAXCIsIFwi0LDQv9GAXCIsIFwi0LzQsNC5XCIsIFwi0LjRjtC9XCIsIFwi0LjRjtC7XCIsIFwi0LDQstCzXCIsIFwi0YHQtdC9XCIsIFwi0L7QutGCXCIsIFwi0L3QvtGPXCIsIFwi0LTQtdC6XCJdXG4gICAgICAgICAgICB9KTtcblxuXG4gICAgICAgICAgICB2YXIgaW5zZXJ0RGF0YSA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICB2YXIgeFNjYWxlID0gZDMudGltZS5zY2FsZSgpXG4gICAgICAgICAgICAgICAgICAgIC5yYW5nZShbMCwgd2lkdGhdKVxuICAgICAgICAgICAgICAgICAgICAuZG9tYWluKGQzLmV4dGVudChkYXRhLm1hcChmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZFswXTtcbiAgICAgICAgICAgICAgICAgICAgfSkpKTtcblxuICAgICAgICAgICAgICAgIHZhciB5U2NhbGUgPSBkMy5zY2FsZS5saW5lYXIoKVxuICAgICAgICAgICAgICAgICAgICAucmFuZ2UoWzAsIGhlaWdodF0pXG4gICAgICAgICAgICAgICAgICAgIC5kb21haW4oZDMuZXh0ZW50KGRhdGEubWFwKGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkWzFdO1xuICAgICAgICAgICAgICAgICAgICB9KSkpO1xuXG4gICAgICAgICAgICAgICAgdmFyIGxpbmVfZnVuY3Rpb24gPSBkMy5zdmcubGluZSgpXG4gICAgICAgICAgICAgICAgICAgIC54KGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB4U2NhbGUoZFswXSk7XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIC55KGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB5U2NhbGUoZFsxXSk7XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIC5pbnRlcnBvbGF0ZShcIm1vbm90b25lXCIpO1xuXG4gICAgICAgICAgICAgICAgbGluZVxuICAgICAgICAgICAgICAgICAgICAgIC5kYXRhKFtkYXRhXSlcbiAgICAgICAgICAgICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwibGluZVwiKVxuICAgICAgICAgICAgICAgICAgICAgIC5hdHRyKFwiZFwiLCBsaW5lX2Z1bmN0aW9uKTtcblxuICAgICAgICAgICAgICAgICB2YXIgeEF4aXNUaW1lID0gZDMuc3ZnLmF4aXMoKVxuICAgICAgICAgICAgICAgICAgICAuc2NhbGUoeFNjYWxlKVxuICAgICAgICAgICAgICAgICAgICAub3JpZW50KFwiYm90dG9tXCIpXG4gICAgICAgICAgICAgICAgICAgIC50aWNrcyg1KVxuICAgICAgICAgICAgICAgICAgICAuaW5uZXJUaWNrU2l6ZSgtaGVpZ2h0KVxuICAgICAgICAgICAgICAgICAgICAub3V0ZXJUaWNrU2l6ZSgwKVxuICAgICAgICAgICAgICAgICAgICAudGlja0Zvcm1hdChsb2NhbGUudGltZUZvcm1hdCgnJWUuJW0nKSlcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgIHZhciB5QXhpc1ZhbCA9IGQzLnN2Zy5heGlzKClcbiAgICAgICAgICAgICAgICAgICAgLnNjYWxlKHlTY2FsZSlcbiAgICAgICAgICAgICAgICAgICAgLm9yaWVudChcImxlZnRcIilcbiAgICAgICAgICAgICAgICAgICAgLnRpY2tzKDUpXG4gICAgICAgICAgICAgICAgICAgIC5pbm5lclRpY2tTaXplKC13aWR0aClcbiAgICAgICAgICAgICAgICAgICAgLm91dGVyVGlja1NpemUoMClcblxuICAgICAgICAgICAgICAgICB2YWxfYXhpc1xuICAgICAgICAgICAgICAgICAgICAudHJhbnNpdGlvbigpXG4gICAgICAgICAgICAgICAgICAgIC5kdXJhdGlvbihBTklNQVRJT05fRFVSQVRJT04pXG4gICAgICAgICAgICAgICAgICAgIC5lYXNlKFwibGluZWFyXCIpXG4gICAgICAgICAgICAgICAgICAgIC5jYWxsKHlBeGlzVmFsKVxuXG4gICAgICAgICAgICAgICAgIHRpbWVfYXhpc1xuICAgICAgICAgICAgICAgICAgICAudHJhbnNpdGlvbigpXG4gICAgICAgICAgICAgICAgICAgIC5kdXJhdGlvbihBTklNQVRJT05fRFVSQVRJT04pXG4gICAgICAgICAgICAgICAgICAgIC5lYXNlKFwibGluZWFyXCIpXG4gICAgICAgICAgICAgICAgICAgIC5jYWxsKHhBeGlzVGltZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpbnNlcnREYXRhKGNvbnRyb2xsZXIuZ2V0Q2hhcnRJbmZvKCkpO1xuICAgICAgICAgICAgY29udHJvbGxlci5zZXRDYWxsQmFjayhmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIGluc2VydERhdGEoY29udHJvbGxlci5nZXRDaGFydEluZm8oKSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgfTtcbn1dKVxuLmRpcmVjdGl2ZSgndHlwZVNlbGVjdG9yJywgZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdBJyxcbiAgICAgICAgcmVxdWlyZTogJ15jaGFydEluZm8nLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMsIGNvbnRyb2xsZXIpIHtcbiAgICAgICAgICAgIGVsZW1lbnQub24oJ2NoYW5nZScsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgY29udHJvbGxlci5zZXRUeXBlKCtlbGVtZW50LnZhbCgpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTtcbn0pO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9