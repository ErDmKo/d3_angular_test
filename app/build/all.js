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
                var customTicks = data.length/10,
                    addInfo = [];
                
                for (var i=customTicks; i<=data.length; i+=customTicks) {
                    var val = data[Math.ceil(i)];
                    if (val) {
                        addInfo.push(val);
                    }
                }

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

                var hover_g = svg
                    .selectAll('.circles')
                    .data(addInfo).enter()
                    .append('svg:g')
                    .attr({
                        transform: function(d) {
                            return 'translate('+xScale(d[0])+', 0)';
                        }
                    });
                    .append("svg:circle")
                    .attr({
                        cx: '1',
                        cy: function(d, i) {
                            return yScale(d[1]);
                        },
                        r: 3
                    })

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvbnRyb2xsZXJzLmpzIiwiZGlyZWN0aXZlcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImFsbC5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBjaGFydE1vZHVsZSA9IGFuZ3VsYXIubW9kdWxlKCdlZGtDaGFydEFwcCcsIFtcbiAgICAnZWRrQ2hhcnRJbmZvJyxcbl0pXG4uY29udHJvbGxlcignY2hhckN0cmwnLCBmdW5jdGlvbigkc2NvcGUpIHtcbiAgICB2YXIgZGF0ZUNvdW50ZXIgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKSxcbiAgICAgICAgdGltZVN0ZXAgPSAxMDAwKjYwKjYwKjI0O1xuXG4gICAgJHNjb3BlLmNoYXJEYXRhID0gT2JqZWN0LmtleXMobmV3IEludDhBcnJheSg0MTApKVxuICAgICAgICAucmVkdWNlKGZ1bmN0aW9uKHByZXYsIG5leHQsIGkpIHtcbiAgICAgICAgICAgIHZhciBtaW4gPSAtMSxcbiAgICAgICAgICAgICAgICBtYXggPSAxLFxuICAgICAgICAgICAgICAgIHByZXZfdmFsID0gcHJldltwcmV2Lmxlbmd0aC0xXSB8fCBbMCwgMCwgMCwgMF07XG4gICAgICAgICAgICAgICAgZGF0ZU1hcmdpbiA9IDEwMDAwO1xuXG4gICAgICAgICAgICBwcmV2LnB1c2goW1xuICAgICAgICAgICAgICAgIGRhdGVDb3VudGVyLFxuICAgICAgICAgICAgICAgICtwcmV2X3ZhbFsxXSArIE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluKSArIG1pbixcbiAgICAgICAgICAgICAgICArcHJldl92YWxbMl0gKyBNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbikgKyBtaW4sXG4gICAgICAgICAgICAgICAgK3ByZXZfdmFsWzNdICsgTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4pICsgbWluXG4gICAgICAgICAgICBdKTtcbiAgICAgICAgICAgIGRhdGVDb3VudGVyICs9IHRpbWVTdGVwICsgTWF0aC5yYW5kb20oKSAqIChtYXgqZGF0ZU1hcmdpbiAtIG1pbipkYXRlTWFyZ2luKSArIG1pbipkYXRlTWFyZ2luO1xuICAgICAgICAgICAgcmV0dXJuIHByZXY7XG4gICAgICAgIH0sIFtdKTtcbn0pO1xuIiwidmFyIGRpcmVjdGl2ZU1vZHVsZSA9IGFuZ3VsYXIubW9kdWxlKCdlZGtDaGFydEluZm8nLCBbXSlcbi5mYWN0b3J5KCdkM2xpYicsIFtmdW5jdGlvbigpe1xuICAgIHJldHVybiB7XG4gICAgICAgIGdldDogZnVuY3Rpb24oKXsgcmV0dXJuIHdpbmRvdy5kMyB9XG4gICAgfTtcbn1dKVxuLmRpcmVjdGl2ZSgnY2hhcnRJbmZvJywgZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgdHJhbnNjbHVkZTogdHJ1ZSxcbiAgICAgICAgc2NvcGU6IHtcbiAgICAgICAgICAgIHNvdXJjZTogJz0nXG4gICAgICAgIH0sXG4gICAgICAgIHRlbXBsYXRlOiAnPGRpdiBuZy10cmFuc2NsdWRlPjwvZGl2PicsXG4gICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICckc2NvcGUnLFxuICAgICAgICAgICAgZnVuY3Rpb24gKHNjb3BlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHR5cGUgPSAwLFxuICAgICAgICAgICAgICAgICAgICBkdXJhdGlvbiA9IDAsXG4gICAgICAgICAgICAgICAgICAgIGNoYW5nZUNhbGxCYWNrID0gZnVuY3Rpb24oKXt9O1xuXG4gICAgICAgICAgICAgICAgdGhpcy5zZXRDYWxsQmFjayA9IGZ1bmN0aW9uKGNhbGxCYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNoYW5nZUNhbGxCYWNrID0gY2FsbEJhY2s7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB0aGlzLnNldFR5cGUgPSBmdW5jdGlvbihyYXdUeXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGUgPSByYXdUeXBlO1xuICAgICAgICAgICAgICAgICAgICBjaGFuZ2VDYWxsQmFjaygpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgdGhpcy5zZXREdXJhdGlvbiA9IGZ1bmN0aW9uKHJhd0R1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIGR1cmF0aW9uID0gcmF3RHVyYXRpb24gKiAxMDAwKjYwKjYwKjI0O1xuICAgICAgICAgICAgICAgICAgICBjaGFuZ2VDYWxsQmFjaygpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgdGhpcy5nZXRDaGFydEluZm8gPSBmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKHNjb3BlLnNvdXJjZSB8fCBbXSlcbiAgICAgICAgICAgICAgICAgICAgICAgIC5yZWR1Y2UoZnVuY3Rpb24oYXJyYXksIHNvdXJjZSwgaSl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGVsZW0gPSBbc291cmNlWzBdLCBzb3VyY2VbdHlwZSsxXV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsbUR1cmF0aW9uID0gc291cmNlWzBdLSBzY29wZS5zb3VyY2VbMF1bMF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFkdXJhdGlvbiB8fCBlbG1EdXJhdGlvbiA8PSBkdXJhdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcnJheS5wdXNoKGVsZW0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYXJyYXk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LCBbXSk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgXSxcbiAgICB9O1xufSlcbi5kaXJlY3RpdmUoJ3JhbmdlU2VsZWN0b3InLCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0EnLFxuICAgICAgICByZXF1aXJlOiBbJ15jaGFydEluZm8nLCAncmFuZ2VTZWxlY3RvciddLFxuICAgICAgICBjb250cm9sbGVyOiBbXG4gICAgICAgICAgICAnJHNjb3BlJyxcbiAgICAgICAgICAgIGZ1bmN0aW9uKHNjb3BlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNhbGxiYWNrID0gZnVuY3Rpb24oKSB7fTtcbiAgICAgICAgICAgICAgICB0aGlzLnNldENhbGxCYWNrID0gZnVuY3Rpb24ocmF3Q2FsbGJhY2spe1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayA9IHJhd0NhbGxiYWNrO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgdGhpcy5zZXREdXJhdGlvbiA9IGZ1bmN0aW9uKHJhd0R1cmF0aW9uKXtcbiAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKHJhd0R1cmF0aW9uKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICBdLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMsIGNvbnRyb2xsZXJzKSB7XG4gICAgICAgICAgICBjb250cm9sbGVyc1sxXS5zZXRDYWxsQmFjayhjb250cm9sbGVyc1swXS5zZXREdXJhdGlvbik7XG4gICAgICAgIH1cbiAgICB9O1xufSlcbi5kaXJlY3RpdmUoJ3JhbmdlSXRlbScsIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHRyYW5zY2x1ZGU6IHRydWUsXG4gICAgICAgIHJlcXVpcmU6ICdecmFuZ2VTZWxlY3RvcicsXG4gICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgICAnZGF5cyc6ICc9JyxcbiAgICAgICAgICAgICdtb250aCc6ICc9J1xuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZTogJzxkaXYgbmctdHJhbnNjbHVkZT48L2Rpdj4nLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMsIGNvbnRyb2xsZXIpIHtcbiAgICAgICAgICAgIGVsZW1lbnQub24oJ2NsaWNrJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICBlbGVtZW50O1xuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXJcbiAgICAgICAgICAgICAgICAgICAgLnNldER1cmF0aW9uKHNjb3BlLmRheXMgfHwgc2NvcGUubW9udGggKiAzMCB8fCAwKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICB9O1xufSlcbi5kaXJlY3RpdmUoJ2NoYXJ0SXRlbScsIFsnZDNsaWInLCBmdW5jdGlvbihkMykge1xuICAgIHZhciBkMyA9IGQzLmdldCgpO1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHJlcXVpcmU6ICdeY2hhcnRJbmZvJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBjb250cm9sbGVyKSB7XG4gICAgICAgICAgICB2YXIgY2hhckluZm8gPSBjb250cm9sbGVyLmdldENoYXJ0SW5mbygpLFxuICAgICAgICAgICAgICAgIHNpemUgPSB7XG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiA3MDAsXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogMzAwXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBtYXJnaW4gPSB7XG4gICAgICAgICAgICAgICAgICAgIHRvcDogMzAsXG4gICAgICAgICAgICAgICAgICAgIHJpZ2h0OiAxMCxcbiAgICAgICAgICAgICAgICAgICAgYm90dG9tOiAzMCxcbiAgICAgICAgICAgICAgICAgICAgbGVmdDogMzVcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHdpZHRoID0gc2l6ZS53aWR0aCAtIG1hcmdpbi5sZWZ0IC0gbWFyZ2luLnJpZ2h0LFxuICAgICAgICAgICAgICAgIGhlaWdodCA9IHNpemUuaGVpZ2h0IC0gbWFyZ2luLnRvcCAtIG1hcmdpbi5ib3R0b20sXG4gICAgICAgICAgICAgICAgQU5JTUFUSU9OX0RVUkFUSU9OID0gNzAwO1xuXG4gICAgICAgICAgICB2YXIgc3ZnID0gZDNcbiAgICAgICAgICAgICAgICAuc2VsZWN0KGVsZW1lbnRbMF0pXG4gICAgICAgICAgICAgICAgLmFwcGVuZCgnc3ZnJylcbiAgICAgICAgICAgICAgICAuYXR0cih7XG4gICAgICAgICAgICAgICAgICAgIFwiaGVpZ2h0XCI6IHNpemUuaGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgICBcIndpZHRoXCI6IHNpemUud2lkdGhcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5hcHBlbmQoXCJnXCIpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyBtYXJnaW4ubGVmdCArIFwiLFwiICsgbWFyZ2luLnRvcCArIFwiKVwiKTtcblxuICAgICAgICAgICAgdmFyIGJhY2tncm91bmQgPSBzdmdcbiAgICAgICAgICAgICAgICAuYXBwZW5kKCdyZWN0JylcbiAgICAgICAgICAgICAgICAuYXR0cih7XG4gICAgICAgICAgICAgICAgICAgICdjbGFzcyc6ICdiYWNrZ3JvdW5kJyxcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiB3aWR0aFxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB2YXIgdGltZV9heGlzID0gc3ZnLmFwcGVuZChcImdcIilcbiAgICAgICAgICAgICAgICAuYXR0cih7XG4gICAgICAgICAgICAgICAgICAgICdjbGFzcyc6IFwieCBheGlzIHRpbWVcIixcbiAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtOiBcInRyYW5zbGF0ZSgwLFwiICsgaGVpZ2h0ICsgXCIpXCJcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgdmFyIHZhbF9heGlzID0gc3ZnLmFwcGVuZChcImdcIilcbiAgICAgICAgICAgICAgICAuYXR0cih7XG4gICAgICAgICAgICAgICAgICAgICdjbGFzcyc6IFwieSBheGlzIHZhbFwiLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdmFyIGxpbmUgPSBzdmcuYXBwZW5kKFwiZ1wiKVxuICAgICAgICAgICAgICAgIC5hdHRyKHtcbiAgICAgICAgICAgICAgICAgICAgJ2NsYXNzJzogXCJsaW5lX2luZm9cIixcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5hcHBlbmQoXCJwYXRoXCIpXG4gICAgICAgICAgICBsaW5lXG4gICAgICAgICAgICAgICAgLnRyYW5zaXRpb24oKVxuICAgICAgICAgICAgICAgIC5kdXJhdGlvbihBTklNQVRJT05fRFVSQVRJT04pXG4gICAgICAgICAgICAgICAgLmVhc2UoXCJsaW5lYXJcIilcblxuICAgICAgICAgICB2YXIgbG9jYWxlID0gZDMubG9jYWxlKHtcbiAgICAgICAgICAgICAgICBcImRlY2ltYWxcIjogXCIsXCIsXG4gICAgICAgICAgICAgICAgXCJ0aG91c2FuZHNcIjogXCJcXHhhMFwiLFxuICAgICAgICAgICAgICAgIFwiZ3JvdXBpbmdcIjogWzNdLFxuICAgICAgICAgICAgICAgIFwiY3VycmVuY3lcIjogW1wiXCIsIFwiINGA0YPQsS5cIl0sXG4gICAgICAgICAgICAgICAgXCJkYXRlVGltZVwiOiBcIiVBLCAlZSAlQiAlWSDQsy4gJVhcIixcbiAgICAgICAgICAgICAgICBcImRhdGVcIjogXCIlZC4lbS4lWVwiLFxuICAgICAgICAgICAgICAgIFwidGltZVwiOiBcIiVIOiVNOiVTXCIsXG4gICAgICAgICAgICAgICAgXCJwZXJpb2RzXCI6IFtcIkFNXCIsIFwiUE1cIl0sXG4gICAgICAgICAgICAgICAgXCJkYXlzXCI6IFtcItCy0L7RgdC60YDQtdGB0LXQvdGM0LVcIiwgXCLQv9C+0L3QtdC00LXQu9GM0L3QuNC6XCIsIFwi0LLRgtC+0YDQvdC40LpcIiwgXCLRgdGA0LXQtNCwXCIsIFwi0YfQtdGC0LLQtdGA0LNcIiwgXCLQv9GP0YLQvdC40YbQsFwiLCBcItGB0YPQsdCx0L7RgtCwXCJdLFxuICAgICAgICAgICAgICAgIFwic2hvcnREYXlzXCI6IFtcItCy0YFcIiwgXCLQv9C9XCIsIFwi0LLRglwiLCBcItGB0YBcIiwgXCLRh9GCXCIsIFwi0L/RglwiLCBcItGB0LFcIl0sXG4gICAgICAgICAgICAgICAgXCJtb250aHNcIjogW1wi0Y/QvdCy0LDRgNGPXCIsIFwi0YTQtdCy0YDQsNC70Y9cIiwgXCLQvNCw0YDRgtCwXCIsIFwi0LDQv9GA0LXQu9GPXCIsIFwi0LzQsNGPXCIsIFwi0LjRjtC90Y9cIiwgXCLQuNGO0LvRj1wiLCBcItCw0LLQs9GD0YHRgtCwXCIsIFwi0YHQtdC90YLRj9Cx0YDRj1wiLCBcItC+0LrRgtGP0LHRgNGPXCIsIFwi0L3QvtGP0LHRgNGPXCIsIFwi0LTQtdC60LDQsdGA0Y9cIl0sXG4gICAgICAgICAgICAgICAgXCJzaG9ydE1vbnRoc1wiOiBbXCLRj9C90LJcIiwgXCLRhNC10LJcIiwgXCLQvNCw0YBcIiwgXCLQsNC/0YBcIiwgXCLQvNCw0LlcIiwgXCLQuNGO0L1cIiwgXCLQuNGO0LtcIiwgXCLQsNCy0LNcIiwgXCLRgdC10L1cIiwgXCLQvtC60YJcIiwgXCLQvdC+0Y9cIiwgXCLQtNC10LpcIl1cbiAgICAgICAgICAgIH0pO1xuXG5cbiAgICAgICAgICAgIHZhciBpbnNlcnREYXRhID0gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIHZhciBjdXN0b21UaWNrcyA9IGRhdGEubGVuZ3RoLzEwLFxuICAgICAgICAgICAgICAgICAgICBhZGRJbmZvID0gW107XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaT1jdXN0b21UaWNrczsgaTw9ZGF0YS5sZW5ndGg7IGkrPWN1c3RvbVRpY2tzKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB2YWwgPSBkYXRhW01hdGguY2VpbChpKV07XG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFkZEluZm8ucHVzaCh2YWwpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIHhTY2FsZSA9IGQzLnRpbWUuc2NhbGUoKVxuICAgICAgICAgICAgICAgICAgICAucmFuZ2UoWzAsIHdpZHRoXSlcbiAgICAgICAgICAgICAgICAgICAgLmRvbWFpbihkMy5leHRlbnQoZGF0YS5tYXAoZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRbMF07XG4gICAgICAgICAgICAgICAgICAgIH0pKSk7XG5cbiAgICAgICAgICAgICAgICB2YXIgeVNjYWxlID0gZDMuc2NhbGUubGluZWFyKClcbiAgICAgICAgICAgICAgICAgICAgLnJhbmdlKFswLCBoZWlnaHRdKVxuICAgICAgICAgICAgICAgICAgICAuZG9tYWluKGQzLmV4dGVudChkYXRhLm1hcChmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZFsxXTtcbiAgICAgICAgICAgICAgICAgICAgfSkpKTtcblxuICAgICAgICAgICAgICAgIHZhciBob3Zlcl9nID0gc3ZnXG4gICAgICAgICAgICAgICAgICAgIC5zZWxlY3RBbGwoJy5jaXJjbGVzJylcbiAgICAgICAgICAgICAgICAgICAgLmRhdGEoYWRkSW5mbykuZW50ZXIoKVxuICAgICAgICAgICAgICAgICAgICAuYXBwZW5kKCdzdmc6ZycpXG4gICAgICAgICAgICAgICAgICAgIC5hdHRyKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybTogZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAndHJhbnNsYXRlKCcreFNjYWxlKGRbMF0pKycsIDApJztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIC5hcHBlbmQoXCJzdmc6Y2lyY2xlXCIpXG4gICAgICAgICAgICAgICAgICAgIC5hdHRyKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN4OiAnMScsXG4gICAgICAgICAgICAgICAgICAgICAgICBjeTogZnVuY3Rpb24oZCwgaSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB5U2NhbGUoZFsxXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgcjogM1xuICAgICAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICAgdmFyIGxpbmVfZnVuY3Rpb24gPSBkMy5zdmcubGluZSgpXG4gICAgICAgICAgICAgICAgICAgIC54KGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB4U2NhbGUoZFswXSk7XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIC55KGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB5U2NhbGUoZFsxXSk7XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIC5pbnRlcnBvbGF0ZShcIm1vbm90b25lXCIpO1xuXG4gICAgICAgICAgICAgICAgbGluZVxuICAgICAgICAgICAgICAgICAgICAgIC5kYXRhKFtkYXRhXSlcbiAgICAgICAgICAgICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwibGluZVwiKVxuICAgICAgICAgICAgICAgICAgICAgIC5hdHRyKFwiZFwiLCBsaW5lX2Z1bmN0aW9uKTtcblxuICAgICAgICAgICAgICAgICB2YXIgeEF4aXNUaW1lID0gZDMuc3ZnLmF4aXMoKVxuICAgICAgICAgICAgICAgICAgICAuc2NhbGUoeFNjYWxlKVxuICAgICAgICAgICAgICAgICAgICAub3JpZW50KFwiYm90dG9tXCIpXG4gICAgICAgICAgICAgICAgICAgIC50aWNrcyg1KVxuICAgICAgICAgICAgICAgICAgICAuaW5uZXJUaWNrU2l6ZSgtaGVpZ2h0KVxuICAgICAgICAgICAgICAgICAgICAub3V0ZXJUaWNrU2l6ZSgwKVxuICAgICAgICAgICAgICAgICAgICAudGlja0Zvcm1hdChsb2NhbGUudGltZUZvcm1hdCgnJWUuJW0nKSlcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgIHZhciB5QXhpc1ZhbCA9IGQzLnN2Zy5heGlzKClcbiAgICAgICAgICAgICAgICAgICAgLnNjYWxlKHlTY2FsZSlcbiAgICAgICAgICAgICAgICAgICAgLm9yaWVudChcImxlZnRcIilcbiAgICAgICAgICAgICAgICAgICAgLnRpY2tzKDUpXG4gICAgICAgICAgICAgICAgICAgIC5pbm5lclRpY2tTaXplKC13aWR0aClcbiAgICAgICAgICAgICAgICAgICAgLm91dGVyVGlja1NpemUoMClcblxuICAgICAgICAgICAgICAgICB2YWxfYXhpc1xuICAgICAgICAgICAgICAgICAgICAudHJhbnNpdGlvbigpXG4gICAgICAgICAgICAgICAgICAgIC5kdXJhdGlvbihBTklNQVRJT05fRFVSQVRJT04pXG4gICAgICAgICAgICAgICAgICAgIC5lYXNlKFwibGluZWFyXCIpXG4gICAgICAgICAgICAgICAgICAgIC5jYWxsKHlBeGlzVmFsKVxuXG4gICAgICAgICAgICAgICAgIHRpbWVfYXhpc1xuICAgICAgICAgICAgICAgICAgICAudHJhbnNpdGlvbigpXG4gICAgICAgICAgICAgICAgICAgIC5kdXJhdGlvbihBTklNQVRJT05fRFVSQVRJT04pXG4gICAgICAgICAgICAgICAgICAgIC5lYXNlKFwibGluZWFyXCIpXG4gICAgICAgICAgICAgICAgICAgIC5jYWxsKHhBeGlzVGltZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpbnNlcnREYXRhKGNvbnRyb2xsZXIuZ2V0Q2hhcnRJbmZvKCkpO1xuICAgICAgICAgICAgY29udHJvbGxlci5zZXRDYWxsQmFjayhmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIGluc2VydERhdGEoY29udHJvbGxlci5nZXRDaGFydEluZm8oKSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgfTtcbn1dKVxuLmRpcmVjdGl2ZSgndHlwZVNlbGVjdG9yJywgZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdBJyxcbiAgICAgICAgcmVxdWlyZTogJ15jaGFydEluZm8nLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMsIGNvbnRyb2xsZXIpIHtcbiAgICAgICAgICAgIGVsZW1lbnQub24oJ2NoYW5nZScsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgY29udHJvbGxlci5zZXRUeXBlKCtlbGVtZW50LnZhbCgpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTtcbn0pO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9