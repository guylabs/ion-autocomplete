'use strict';

describe('ion-autocomplete single select', function () {

    var htmlFileName = 'ion-autocomplete.single-select.e2e.html';

    it('must not show the search input field by default', function () {
        browser.get(htmlFileName);
        expect($('input.ion-autocomplete-search').isDisplayed()).toBeFalsy();
    });

    it('must show the search input field if the input field is clicked', function () {
        browser.get(htmlFileName);
        element(by.css('input.ion-autocomplete')).click().then(function () {
            expect($('input.ion-autocomplete-search').isDisplayed()).toBeTruthy();
        });
    });

    it('must hide the search input field if the cancel button is pressed', function () {
        browser.get(htmlFileName);

        element(by.css('input.ion-autocomplete')).click().then(function () {
            expect($('input.ion-autocomplete-search').isDisplayed()).toBeTruthy();

            element(by.css('button.ion-autocomplete-cancel')).click().then(function () {
                expect($('input.ion-autocomplete-search').isDisplayed()).toBeFalsy();
            });

        });
    });

    it('must show the list of found items if something is entered in the search', function () {
        browser.get(htmlFileName);

        element(by.css('input.ion-autocomplete')).click().then(function () {
            expect($('input.ion-autocomplete-search').isDisplayed()).toBeTruthy();

            element(by.css('input.ion-autocomplete-search')).sendKeys("test");

            var itemList = element.all(by.css('[ng-repeat="item in viewModel.searchItems"]'));
            expectCollectionRepeatCount(itemList, 3);
            expect(itemList.get(0).getText()).toEqual('view: test1');
            expect(itemList.get(1).getText()).toEqual('view: test2');
            expect(itemList.get(2).getText()).toEqual('view: test3');

        });
    });

    it('must show the prepopulated list of search items if this is set externally', function () {
        browser.get(htmlFileName);

        element(by.css('input.ion-autocomplete')).click().then(function () {
            expect($('input.ion-autocomplete-search').isDisplayed()).toBeTruthy();

            element(by.css('input.ion-autocomplete-search')).sendKeys("test");

            var itemList = element.all(by.css('[ng-repeat="item in viewModel.searchItems"]'));
            expectCollectionRepeatCount(itemList, 3);
            expect(itemList.get(0).getText()).toEqual('view: test1');
            expect(itemList.get(1).getText()).toEqual('view: test2');
            expect(itemList.get(2).getText()).toEqual('view: test3');

        });
    });

    it('must hide the search input field if a item in the list is clicked', function () {
        browser.get(htmlFileName);

        element(by.css('input.ion-autocomplete')).click().then(function () {
            expect($('input.ion-autocomplete-search').isDisplayed()).toBeTruthy();

            element(by.css('input.ion-autocomplete-search')).sendKeys("test");

            var itemList = element.all(by.css('[ng-repeat="item in viewModel.searchItems"]'));
            expectCollectionRepeatCount(itemList, 3);
            itemList.get(0).click().then(function () {
                expect($('input.ion-autocomplete-search').isDisplayed()).toBeFalsy();
                expect($('input.ion-autocomplete-test-model').isDisplayed()).toBeTruthy();
                expect($('input.ion-autocomplete-test-model').getAttribute('value')).toEqual('test1');
            })

        });
    });

    it('must call the items clicked method if an item is clicked', function () {
        browser.get(htmlFileName);

        expect($('input.ion-autocomplete-callback-model').evaluate('callbackValueModel')).toEqual('');

        element(by.css('input.ion-autocomplete')).click().then(function () {
            expect($('input.ion-autocomplete-search').isDisplayed()).toBeTruthy();

            element(by.css('input.ion-autocomplete-search')).sendKeys("test");

            var itemList = element.all(by.css('[ng-repeat="item in viewModel.searchItems"]'));
            expectCollectionRepeatCount(itemList, 3);
            itemList.get(0).click().then(function () {
                expect($('input.ion-autocomplete-search').isDisplayed()).toBeFalsy();
                expect($('input.ion-autocomplete-test-model').isDisplayed()).toBeTruthy();
                expect($('input.ion-autocomplete-test-model').getAttribute('value')).toEqual('test1');

                // expect the callback value
                element(by.css('input.ion-autocomplete-callback-model')).evaluate('callbackValueModel').then(function (callbackModelValue) {
                    expect(callbackModelValue.item.name).toEqual('test1');
                    expect(callbackModelValue.selectedItems).toEqual(callbackModelValue.item);
                    expect(callbackModelValue.componentId).toEqual('comp1');
                });
            })

        });
    });

    it('must overwrite the item if another item is selected', function () {
        browser.get(htmlFileName);

        expect($('input.ion-autocomplete-callback-model').evaluate('callbackValueModel')).toEqual('');

        element(by.css('input.ion-autocomplete')).click().then(function () {
            expect($('input.ion-autocomplete-search').isDisplayed()).toBeTruthy();

            element(by.css('input.ion-autocomplete-search')).sendKeys("test");

            var itemList = element.all(by.css('[ng-repeat="item in viewModel.searchItems"]'));
            expectCollectionRepeatCount(itemList, 3);
            itemList.get(0).click().then(function () {
                expect($('input.ion-autocomplete-search').isDisplayed()).toBeFalsy();
                expect($('input.ion-autocomplete-test-model').isDisplayed()).toBeTruthy();
                expect($('input.ion-autocomplete-test-model').getAttribute('value')).toEqual('test1');

                element(by.css('input.ion-autocomplete')).click().then(function () {
                    expect($('input.ion-autocomplete-search').isDisplayed()).toBeTruthy();
                    element(by.css('input.ion-autocomplete-search')).sendKeys("test");
                    var itemList = element.all(by.css('[ng-repeat="item in viewModel.searchItems"]'));
                    itemList.get(2).click().then(function () {
                        expect($('input.ion-autocomplete-search').isDisplayed()).toBeFalsy();
                        expect($('input.ion-autocomplete-test-model').isDisplayed()).toBeTruthy();
                        expect($('input.ion-autocomplete-test-model').getAttribute('value')).toEqual('test3');
                    })
                });
            })

        });
    });

    it('must call the done button clicked method if the done button is clicked', function () {
        browser.get(htmlFileName);

        expect($('input.ion-autocomplete-callback-model').evaluate('callbackValueModel')).toEqual('');

        element(by.css('input.ion-autocomplete')).click().then(function () {
            expect($('input.ion-autocomplete-search').isDisplayed()).toBeTruthy();

            element(by.css('input.ion-autocomplete-search')).sendKeys("test");

            var itemList = element.all(by.css('[ng-repeat="item in viewModel.searchItems"]'));
            expectCollectionRepeatCount(itemList, 3);
            itemList.get(0).click().then(function () {
                expect($('input.ion-autocomplete-search').isDisplayed()).toBeFalsy();
                expect($('input.ion-autocomplete-test-model').isDisplayed()).toBeTruthy();
                expect($('input.ion-autocomplete-test-model').getAttribute('value')).toEqual('test1');


                element(by.css('input.ion-autocomplete')).click().then(function () {
                    // click the done button
                    element(by.css('button.ion-autocomplete-cancel')).click().then(function () {
                        expect($('input.ion-autocomplete-search').isDisplayed()).toBeFalsy();

                        // expect the callback value
                        element(by.css('input.ion-autocomplete-done-callback-model')).evaluate('doneButtonCallbackValueModel').then(function (callbackModelValue) {
                            expect(callbackModelValue.selectedItems.name).toEqual("test1");
                            expect(callbackModelValue.componentId).toEqual('comp1');
                        });
                    });

                });
            })

        });
    });

    function expectCollectionRepeatCount(items, count) {
        for (var i = 0; i < count; i++) {
            expect(items.get(i).getText().isDisplayed()).toBeTruthy();
        }
        //expect(items.get(count).getText().isDisplayed()).toBeFalsy();
    }

});