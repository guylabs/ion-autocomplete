'use strict';

describe('ion-autocomplete single select', function () {

    var templateUrl = 'test/templates/test-template.html';
    var templateDataUrl = 'test/templates/test-template-data.html';

    var scope, document, compile, q, templateCache, timeout;

    // load the directive's module
    beforeEach(module('ionic', 'ion-autocomplete', templateUrl, templateDataUrl));

    beforeEach(inject(function ($rootScope, $document, $compile, $q, $templateCache, $timeout) {
        scope = $rootScope.$new();
        document = $document;
        compile = $compile;
        q = $q;
        templateCache = $templateCache;
        timeout = $timeout;
    }));

    afterEach(function () {
        // remove the autocomplete container from the dom after each test to have an empty body on each test start
        getSearchContainerElement().remove();
        angular.element(document[0].querySelector('div.backdrop')).remove();
        angular.element(document[0].querySelector('div.test-template-div')).remove();
    });

    it('must have the default values set on attribute directive', function () {
        var element = compileElement('<input ion-autocomplete ng-model="model" type="text" readonly="readonly" class="ion-autocomplete" autocomplete="off" />');

        timeout(function () {
            // expect the default values of the input field
            expect(element[0].type).toBe('text');
            expect(element[0].readOnly).toBe(true);
            expect(element.hasClass('ion-autocomplete')).toBe(true);
            expect(element[0].placeholder).toBe('');

            // expect the default values of the search input field
            var searchInputElement = getSearchInputElement();
            expect(searchInputElement[0].type).toBe('search');
            expect(searchInputElement.hasClass('ion-autocomplete-search')).toBe(true);
            expect(searchInputElement.attr('placeholder')).toBe('Click to enter a value...');

            // expect the placeholder icon element to no be platform dependent
            var placeholderIcon = getPlaceholderIconElement();
            expect(placeholderIcon.hasClass('ion-search')).toBe(true);

            // expect the default values of the cancel button
            var cancelButtonElement = getCancelButtonElement();
            expect(cancelButtonElement.hasClass('button')).toBe(true);
            expect(cancelButtonElement.hasClass('button-clear')).toBe(true);
            expect(cancelButtonElement.text()).toBe('Done');
        });

    });

    it('must show no value in the input field if the model is not defined', function () {
        var element = compileElement('<input ion-autocomplete type="text" readonly="readonly" class="ion-autocomplete" autocomplete="off" ng-model="model"/>');

        // expect the value of the input field to be empty
        expect(element[0].value).toBe('');
    });

    it('must show the value in the input field if the model is already defined', function () {
        scope.externalModel = "123";
        scope.modelToItemMethod = function (query) {
            return 'Model ' + [query];
        };
        spyOn(scope, 'modelToItemMethod').and.callThrough();
        var element = compileElement('<input ion-autocomplete type="text" readonly="readonly" class="ion-autocomplete" autocomplete="off" ng-model="model" external-model="externalModel" model-to-item-method="modelToItemMethod(modelValue)" />');

        // expect the value of the input field to be already set
        expect(element[0].value).toBe('Model 123');
    });

    it('must show the itemViewValueKey of the value in the input field if the model is already defined', function () {
        scope.model = {key: {value: "value1"}};
        scope.modelToItemMethod = function (query) {
            return query;
        };
        spyOn(scope, 'modelToItemMethod').and.callThrough();
        var element = compileElement('<input ion-autocomplete type="text" readonly="readonly" class="ion-autocomplete" autocomplete="off" ng-model="model" item-view-value-key="key.value" model-to-item-method="modelToItemMethod(modelValue)" />');

        // expect the value of the input field to be the evaluated itemViewValueKey expression on the model
        expect(element[0].value).toBe('value1');
    });

    it('must not show any value if the model is cleared', function () {
        scope.model = {key: {value: "value1"}};
        scope.modelToItemMethod = function (query) {
            return query;
        };
        spyOn(scope, 'modelToItemMethod').and.callThrough();
        var element = compileElement('<input ion-autocomplete type="text" readonly="readonly" class="ion-autocomplete" autocomplete="off" ng-model="model" item-view-value-key="key.value" model-to-item-method="modelToItemMethod(modelValue)" />');

        // expect the value of the input field to be the evaluated itemViewValueKey expression on the model
        expect(element[0].value).toBe('value1');

        // clear the model
        scope.model = undefined;
        scope.$digest();

        // expect the value of the input field to be cleared
        expect(element[0].value).toBe('');
    });

    it('must set the placeholder on the input field and on the search input field', function () {
        var placeholderValue = "placeholder value";
        var element = compileElement('<input ion-autocomplete type="text" readonly="readonly" class="ion-autocomplete" autocomplete="off" ng-model="model" placeholder="' + placeholderValue + '"/>');

        expect(element[0].placeholder).toBe(placeholderValue);
        expect(getSearchInputElement()[0].placeholder).toBe(placeholderValue);
    });

    it('must set the cancel label on the button', function () {
        var cancelLabelValue = "Cancel Button";
        compileElement('<input ion-autocomplete type="text" readonly="readonly" class="ion-autocomplete" autocomplete="off" ng-model="model" cancel-label="' + cancelLabelValue + '"/>');

        expect(getCancelButtonElement()[0].innerText).toBe(cancelLabelValue);
    });

    it('must get the proper item value', function () {
        var element = compileElement('<input ion-autocomplete type="text" readonly="readonly" class="ion-autocomplete" autocomplete="off" ng-model="model"/>');

        var itemValue = element.controller('ionAutocomplete').getItemValue("no-object");
        expect(itemValue).toBe("no-object");

        itemValue = element.controller('ionAutocomplete').getItemValue({key: "value"}, "key");
        expect(itemValue).toBe("value");

        itemValue = element.controller('ionAutocomplete').getItemValue({key: "value"});
        expect(itemValue).toEqual({key: "value"});
    });

    it('must get the proper item value with expressions', function () {
        var element = compileElement('<input ion-autocomplete type="text" readonly="readonly" class="ion-autocomplete" autocomplete="off" ng-model="model"/>');

        var itemValue = element.controller('ionAutocomplete').getItemValue({key: {value: "value1"}}, "key.value");
        expect(itemValue).toBe("value1");
    });

    it('must not call the items method if the passed query is undefined', function () {
        scope.itemsMethod = function (query) {
            return ['item'];
        };
        spyOn(scope, 'itemsMethod').and.callThrough();
        var element = compileElement('<input ion-autocomplete type="text" readonly="readonly" class="ion-autocomplete" autocomplete="off" ng-model="model" items-method="itemsMethod(query)"/>');

        scope.$digest();

        expect(scope.itemsMethod.calls.count()).toBe(0);
        expect(element.controller('ionAutocomplete').searchItems.length).toBe(0);
    });

    it('must call the items method if the passed query is empty', function () {
        scope.itemsMethod = function (query) {
            return ['item'];
        };
        spyOn(scope, 'itemsMethod').and.callThrough();
        var element = compileElement('<input ion-autocomplete type="text" readonly="readonly" class="ion-autocomplete" autocomplete="off" ng-model="model" items-method="itemsMethod(query)"/>');

        element.controller('ionAutocomplete').searchQuery = "";
        scope.$digest();

        expect(scope.itemsMethod.calls.count()).toBe(1);
        expect(element.controller('ionAutocomplete').searchItems.length).toBe(1);
    });

    it('must call the items method if the passed query is valid', function () {
        scope.itemsMethod = function (query) {
            return [query, 'item2'];
        };
        spyOn(scope, 'itemsMethod').and.callThrough();
        var element = compileElement('<input ion-autocomplete type="text" readonly="readonly" class="ion-autocomplete" autocomplete="off" ng-model="model" items-method="itemsMethod(query)"/>');

        element.controller('ionAutocomplete').searchQuery = "asd";
        scope.$digest();

        expect(scope.itemsMethod.calls.count()).toBe(1);
        expect(scope.itemsMethod).toHaveBeenCalledWith("asd");
        expect(element.controller('ionAutocomplete').searchItems.length).toBe(2);
        expect(element.controller('ionAutocomplete').searchItems).toEqual(['asd', 'item2']);
    });

    it('must call the items method if the passed query is valid and the componentId is set', function () {
        scope.itemsMethod = function (query, componentId) {
            return [query, componentId, 'item2'];
        };
        spyOn(scope, 'itemsMethod').and.callThrough();
        var element = compileElement('<input ion-autocomplete type="text" readonly="readonly" class="ion-autocomplete" autocomplete="off" ng-model="model" items-method="itemsMethod(query, componentId)" component-id="compId"/>');

        element.controller('ionAutocomplete').searchQuery = "asd";
        scope.$digest();

        expect(scope.itemsMethod.calls.count()).toBe(1);
        expect(scope.itemsMethod).toHaveBeenCalledWith("asd", "compId");
        expect(element.controller('ionAutocomplete').searchItems.length).toBe(3);
        expect(element.controller('ionAutocomplete').searchItems).toEqual(['asd', 'compId', 'item2']);
    });

    it('must call the items method promise if the passed query is valid', function () {
        var deferred = q.defer();

        scope.itemsMethod = function (query) {
            return deferred.promise;
        };
        spyOn(scope, 'itemsMethod').and.callThrough();
        var element = compileElement('<input ion-autocomplete type="text" readonly="readonly" class="ion-autocomplete" autocomplete="off" ng-model="model" items-method="itemsMethod(query)"/>');

        element.controller('ionAutocomplete').searchQuery = "asd";
        scope.$digest();

        expect(scope.itemsMethod.calls.count()).toBe(1);
        expect(scope.itemsMethod).toHaveBeenCalledWith("asd");
        expect(element.controller('ionAutocomplete').searchItems.length).toBe(0);

        // resolve the promise
        deferred.resolve(['asd', 'item2']);
        scope.$digest();

        expect(element.controller('ionAutocomplete').searchItems.length).toBe(2);
        expect(element.controller('ionAutocomplete').searchItems).toEqual(['asd', 'item2']);
    });

    it('must forward the items method promise error', function () {
        var deferred = q.defer();
        var errorFunction = jasmine.createSpy("errorFunction");

        // set the error function
        deferred.promise.then(function () {
        }, errorFunction);

        scope.itemsMethod = function (query) {
            return deferred.promise;
        };
        spyOn(scope, 'itemsMethod').and.callThrough();
        var element = compileElement('<input ion-autocomplete type="text" readonly="readonly" class="ion-autocomplete" autocomplete="off" ng-model="model" items-method="itemsMethod(query)"/>');

        element.controller('ionAutocomplete').searchQuery = "asd";
        scope.$digest();

        expect(scope.itemsMethod.calls.count()).toBe(1);
        expect(scope.itemsMethod).toHaveBeenCalledWith("asd");
        expect(element.controller('ionAutocomplete').searchItems.length).toBe(0);

        // resolve the promise
        deferred.reject('error');
        scope.$digest();

        expect(errorFunction.calls.count()).toBe(1);
    });

    it('must allow standard $http promises', function () {
        var deferred = q.defer();

        scope.itemsMethod = function (query) {
            return deferred.promise;
        };
        spyOn(scope, 'itemsMethod').and.callThrough();
        var element = compileElement('<input ion-autocomplete type="text" readonly="readonly" class="ion-autocomplete" autocomplete="off" ng-model="model" items-method="itemsMethod(query)" item-value-key="name" item-view-value-key="view" />');

        // add a text to the search query and execute a digest call
        element.controller('ionAutocomplete').searchQuery = "asd";
        scope.$digest();

        // assert that the items method is called once and that the list is still empty as the promise is not resolved yet
        expect(scope.itemsMethod.calls.count()).toBe(1);
        expect(scope.itemsMethod).toHaveBeenCalledWith("asd");
        expect(element.controller('ionAutocomplete').searchItems.length).toBe(0);

        // resolve the promise and expect that the list has two items
        deferred.resolve({data: [{name: "name", view: "view"}, {name: "name1", view: "view1"}]});
        scope.$digest();
        expect(element.controller('ionAutocomplete').searchItems.length).toBe(2);
    });

    it('must show the search container when the input field is clicked', function () {
        var element = compileElement('<input ion-autocomplete type="text" readonly="readonly" class="ion-autocomplete" autocomplete="off" ng-model="model"/>');

        // expect that the search container has no display css attribute set
        expect(getSearchContainerElement().css('display')).toBe('none');

        // click on the element
        element.triggerHandler('click');
        scope.$digest();

        // expect that the search container has block set as display css attribute
        expect(getSearchContainerElement().css('display')).toBe('block');
    });

    it('must hide the search container when the cancel field is clicked', function () {
        var element = compileElement('<input ion-autocomplete type="text" readonly="readonly" class="ion-autocomplete" autocomplete="off" ng-model="model"/>');

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

    it('must be able to set a templateUrl', function () {
        var template = templateCache.get(templateUrl);
        templateCache.put(templateUrl, template);

        var placeholder = "placeholder text";
        var element = compileElement('<input ion-autocomplete type="text" readonly="readonly" class="ion-autocomplete" autocomplete="off" ng-model="model" template-url="' + templateUrl + '" placeholder="' + placeholder + '"/>');

        // click on the element
        element.triggerHandler('click');
        scope.$digest();

        // check that the new test template is shown
        expect(angular.element(document[0].querySelector('div#test-template-div')).css('display')).toBe('block');
        expect(angular.element(document[0].querySelector('div#test-template-div'))[0].innerText).toBe(placeholder);
    });

    it('must be able to set a templateData', function () {
        var template = templateCache.get(templateDataUrl);
        templateCache.removeAll();
        templateCache.put(templateDataUrl, template);

        scope.templateData = {
            testData: "test-data"
        };
        var element = compileElement('<input ion-autocomplete type="text" readonly="readonly" class="ion-autocomplete" autocomplete="off" ng-model="model" template-url="' + templateDataUrl + '" template-data="templateData"/>');

        // click on the element
        element.triggerHandler('click');
        scope.$digest();

        // check that the new test template is shown
        expect(angular.element(document[0].querySelector('div#test-template-data')).css('display')).toBe('block');
        expect(angular.element(document[0].querySelector('div#test-template-data'))[0].innerText).toBe(scope.templateData.testData);
    });

    it('must be able to open the search container externally', function () {
        var element = compileElement('<input ion-autocomplete type="text" readonly="readonly" class="ion-autocomplete" autocomplete="off" ng-model="model" manage-externally="true"/>');

        // click on the element
        element.triggerHandler('click');
        scope.$digest();

        // expect that the search container has none set as display css attribute
        expect(getSearchContainerElement().css('display')).toBe('none');

        // show the search container externally
        element.controller('ionAutocomplete').showModal();

        // expect that the search container has block set as display css attribute
        expect(getSearchContainerElement().css('display')).toBe('block');

        // show the search container externally
        element.controller('ionAutocomplete').hideModal();

        // expect that the search container has none set as display css attribute
        expect(getSearchContainerElement().css('display')).toBe('none');
    });

    it('must pass the outter ng-model-options to the inner search input field', function () {
        var element = compileElement('<input ion-autocomplete type="text" readonly="readonly" class="ion-autocomplete" autocomplete="off" ng-model="model" ng-model-options="{debounce: 1000}"/>');

        // click on the element
        element.triggerHandler('click');
        scope.$digest();

        // show the search container externally
        expect(getSearchInputElement().controller('ngModel').$options.debounce).toBe(1000);
    });

    it('must remove the search container if the scope is destroyed', function () {
        var element = compileElement('<input ion-autocomplete type="text" readonly="readonly" class="ion-autocomplete" autocomplete="off" ng-model="model" />');

        // click on the element
        element.triggerHandler('click');
        scope.$digest();

        // check that the search container element is in the dom
        expect(getSearchContainerElement().length).toBe(1);

        // destroy the scope
        scope.$destroy();

        // check that the search container element is not anymore in the dom
        expect(getSearchContainerElement().length).toBe(0);
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
     * Gets the angular element for the autocomplete placer holder icon
     * @returns {*} the search placeholder icon element
     */
    function getPlaceholderIconElement() {
        return angular.element(document[0].querySelector('i.placeholder-icon'))
    }

    /**
     * Gets the angular element for the autocomplete search input field
     * @returns {*} the search input element
     */
    function getSearchInputElement() {
        return angular.element(document[0].querySelector('input.ion-autocomplete-search'))
    }

    /**
     * Gets the angular element for the autocomplete cancel button
     * @returns {*} the cancel button
     */
    function getCancelButtonElement() {
        return angular.element(document[0].querySelector('button'))
    }

});
