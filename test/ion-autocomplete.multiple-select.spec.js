'use strict';

describe('ion-autocomplete multiple select', function () {

    var scope, document, compile, q;

    // load the directive's module
    beforeEach(module('ionic'));
    beforeEach(module('ion-autocomplete'));

    beforeEach(inject(function ($rootScope, $document, $compile, $q) {
        scope = $rootScope.$new();
        document = $document;
        compile = $compile;
        q = $q;
    }));

    afterEach(function () {
        // remove the autocomplete container from the dom after each test to have an empty body on each test start
        getSearchContainerElement().remove();
        angular.element(document[0].querySelector('div.backdrop')).remove();
    });

    it('must set the selectItems label', function () {
        var selectItemLabelValue = "select-item";
        compileElement('<input ion-autocomplete type="text" readonly="readonly" class="ion-autocomplete" autocomplete="off" ng-model="model" selected-items-label="' + selectItemLabelValue + '"/>');

        expect(getItemDividerElement(0)[0].innerText).toBe(selectItemLabelValue);
    });

    it('must set the selectedItemsLabel label', function () {
        var selectedItemLabelValue = "selected-items";
        compileElement('<input ion-autocomplete type="text" readonly="readonly" class="ion-autocomplete" autocomplete="off" ng-model="model" selected-items-label="' + selectedItemLabelValue + '"/>');

        expect(getItemDividerElement(0)[0].innerText).toBe(selectedItemLabelValue);
    });

    it('must hide/show the selectItems label if the items size changes', function () {
        var element = compileElement('<input ion-autocomplete type="text" readonly="readonly" class="ion-autocomplete" autocomplete="off" ng-model="model" multiple-select="true"/>');

        // expect that the search container has no display css attribute set
        expect(getSearchContainerElement().css('display')).toBe('none');

        // click on the element
        element.triggerHandler('click');
        scope.$digest();

        // expect that the search container has block set as display css attribute
        expect(getSearchContainerElement().css('display')).toBe('block');

        // expect that the selectItems divider is hidden
        expect(getItemDividerElement(1)[0]).toBe(undefined);

        // add some items
        element.controller('ionAutocomplete').searchItems = ["value1", "value2"];
        scope.$digest();

        // expect that the selectItems divider is shown
        expect(getItemDividerElement(1).hasClass('ng-hide')).toBeFalsy();
    });

    it('must hide the search container when the cancel field is clicked', function () {
        var element = compileElement('<input ion-autocomplete type="text" readonly="readonly" class="ion-autocomplete" autocomplete="off" ng-model="model" multiple-select="true"/>');

        // expect that the search container has no display css attribute set
        expect(getSearchContainerElement().css('display')).toBe('none');

        // click on the element
        element.triggerHandler('click');
        scope.$digest();

        // expect that the search container has block set as display css attribute
        expect(getSearchContainerElement().css('display')).toBe('block');

        // click on the cancel button
        var cancelButtonElement = getCancelButtonElement();
        cancelButtonElement.triggerHandler('click');
        scope.$digest();

        // expect that the search container has block set as display css attribute
        expect(getSearchContainerElement().css('display')).toBe('none');
    });

    /**
     * Compiles the given element and executes a digest cycle on the scope.
     *
     * @param element the element to compile
     * @returns {*} the compiled element
     */
    function compileElement(element) {
        var compiledElement = compile(element)(scope);
        scope.$digest();
        return compiledElement;
    }

    /**
     * Gets the angular element for the autocomplete search container div
     * @returns {*} the search container element
     */
    function getSearchContainerElement() {
        return angular.element(document[0].querySelector('div.ion-autocomplete-container'))
    }

    /**
     * Gets the angular element for the autocomplete cancel button
     * @returns {*} the cancel button
     */
    function getCancelButtonElement() {
        return angular.element(document[0].querySelector('button'))
    }

    /**
     * Gets the angular element for the autocomplete cancel button
     * @returns {*} the cancel button
     */
    function getItemDividerElement(index) {
        return angular.element(document[0].querySelectorAll('ion-item.item-divider.item')[index])
    }

});
