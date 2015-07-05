'use strict';

describe('edkCharApp module', function() {
    beforeEach(module('edkChartApp'));
    describe('edkCharApp controllers', function() {
        var $controller;

        beforeEach(inject(function(_$controller_){
            $controller = _$controller_;
        }));
        describe('edkCharApp controllers charCtrl', function() {
            it('should create random data set for char', 
                function() {
                    var $scope = {},
                        ctrl = $controller("charCtrl", {$scope: $scope});

                    expect($scope).to.have.property('charData');
                    expect($scope.charData).to.be.a('array');
                    expect($scope.charData).to.have.length.above(400);
                    var elem = $scope.charData[0];
                    expect(elem).to.have.length(4);
                });
        })
    });
});
