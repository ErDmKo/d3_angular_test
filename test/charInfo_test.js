'use strict';

describe('edkCharInfo module', function() {
    beforeEach(module('edkChartInfo'));
    describe('edkCharInfo directives', function() {
        var $compile,
            $rootScope,
            $scope;

        beforeEach(inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
            $scope = $rootScope.$new();

            $scope.testModel = 1;
            $scope.chartInfo = {
                test: [
                    [0, 1, 1, 1],
                    [1, 2, 2, 2],
                ]
            };
        }));
        describe('edkCharInfo directives chartInfo', function() {
            it('should create div', function(){
                var element = angular.element("<chart-info source='chartInfo.test'></chart-info>"),
                    compiledElement = $compile(element)($scope);

            expect(compiledElement.contents()[0].tagName).to.equal('DIV');
            $rootScope.$digest();
            var controller = element.controller('chartInfo');
            expect(controller).to.have.property('getChartInfo');
            expect(controller).to.have.property('setType');
            expect(controller).to.have.property('setDuration');
            expect(controller.getChartInfo()).to.be.an('array');
            expect(controller.getChartInfo()[0]).to.have.length(2);
            expect(controller.getChartInfo())
                .to.deep.equal([[0, 1], [1, 2]]);
            })
        });
        describe('edkCharInfo directives rangeSelector', function() {
            it('should create ', function(){
                var element = angular
                        .element("<div range-selector></div>"),
                    compiledElement = 
                        $compile(angular
                            .element('<chart-info></chart-info>')
                            .append(element))($rootScope);

            expect(compiledElement.contents()[0]
                .childNodes[0]
                .tagName).to.equal('DIV');
            $rootScope.$digest();
            var controller = element.controller('rangeSelector');
            console.log(controller);
            //expect(controller).to.have.property('setType');
            });
        });
        describe('edkCharInfo directives rangeItem', function() {
            it('should create div', function(){
                var element = angular
                    .element("<chart-info><div range-selector><range-item></range-item></div></chart-info>"),
                    compiledElement = $compile(element)($rootScope);

            $rootScope.$digest();
            expect(compiledElement.contents()[0]
                .childNodes[0]
                .childNodes[0]
                .childNodes[0]
                .tagName).to.equal('DIV');
            });
        });
        describe('edkCharInfo directives chartItem', function() {
            it('should create svg', function(){
                var element = 
                    $compile("<chart-info><chart-item/></chart-info>")($rootScope);
            expect(element.contents()[0]
                .childNodes[0]
                .childNodes[0]
                .tagName).to.equal('svg');
            });
        });
        describe('edkCharInfo directives typeSelector', function() {
            it('should create div', function(){
                var element = 
                    $compile("<chart-info><select type-selector/></select>")($rootScope);
            });
        })
    });
});
