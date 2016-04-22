'use strict';

describe('ion-autocomplete multiple select', function () {

    var htmlFileName = 'ion-autocomplete.multiple-select.e2e.html';

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

    it('must note hide the search input field if a item in the list is clicked and the item must be selected', function () {
        browser.get(htmlFileName);

        element(by.css('input.ion-autocomplete')).click().then(function () {
            expect($('input.ion-autocomplete-search').isDisplayed()).toBeTruthy();

            element(by.css('input.ion-autocomplete-search')).sendKeys("test");

            var itemList = element.all(by.css('[ng-repeat="item in viewModel.searchItems"]'));
            expectCollectionRepeatCount(itemList, 3);
            itemList.get(0).click().then(function () {
                expect($('input.ion-autocomplete-search').isDisplayed()).toBeTruthy();
                expect($('input.ion-autocomplete-test-model').isDisplayed()).toBeTruthy();
                expect($('input.ion-autocomplete-test-model').getAttribute('value')).toEqual('test1');

                var selectedItemList = element.all(by.repeater('selectedItem in viewModel.selectedItems'));
                expect(selectedItemList.count()).toEqual(1);
                expect(selectedItemList.get(0).getText()).toEqual('view: test1');
            })

        });
    });

    it('must not be able to add an item twice to the selected items', function () {
        browser.get(htmlFileName);

        element(by.css('input.ion-autocomplete')).click().then(function () {
            expect($('input.ion-autocomplete-search').isDisplayed()).toBeTruthy();

            element(by.css('input.ion-autocomplete-search')).sendKeys("test");

            var itemList = element.all(by.css('[ng-repeat="item in viewModel.searchItems"]'));
            expectCollectionRepeatCount(itemList, 3);
            itemList.get(0).click().then(function () {
                var selectedItemList = element.all(by.repeater('selectedItem in viewModel.selectedItems'));
                expect(selectedItemList.count()).toEqual(1);
                expect(selectedItemList.get(0).getText()).toEqual('view: test1');
                expect($('input.ion-autocomplete-test-model').getAttribute('value')).toEqual('test1');

                element(by.css('input.ion-autocomplete-search')).sendKeys("test").then(function () {
                    var itemList = element.all(by.css('[ng-repeat="item in viewModel.searchItems"]'));

                    // get the fourth element as this one is the one that is shown in the collection repeat
                    itemList.get(0).click().then(function () {
                        var selectedItemList = element.all(by.repeater('selectedItem in viewModel.selectedItems'));
                        expect(selectedItemList.count()).toEqual(1);
                        expect(selectedItemList.get(0).getText()).toEqual('view: test1');
                        expect($('input.ion-autocomplete-test-model').getAttribute('value')).toEqual('test1');
                    });
                });
            })

        });
    });

    it('must be able to delete an item if the delete button is clicked along with callbacks in both directions', function () {
        browser.get(htmlFileName);

        expect($('input.ion-autocomplete-clicked-model').evaluate('clickedValueModel')).toEqual('');
        expect($('input.ion-autocomplete-removed-model').evaluate('removedValueModel')).toEqual('');

        element(by.css('input.ion-autocomplete')).click().then(function () {
            expect($('input.ion-autocomplete-search').isDisplayed()).toBeTruthy();

            element(by.css('input.ion-autocomplete-search')).sendKeys("test");

            // select first item
            var itemList = element.all(by.css('[ng-repeat="item in viewModel.searchItems"]'));
            expectCollectionRepeatCount(itemList, 3);
            itemList.get(0).click().then(function () {
                var selectedItemList = element.all(by.repeater('selectedItem in viewModel.selectedItems'));
                expect(selectedItemList.count()).toEqual(1);
                expect(selectedItemList.get(0).getText()).toEqual('view: test1');
                expect($('input.ion-autocomplete-test-model').getAttribute('value')).toEqual('test1');
                expect($('input.ion-autocomplete-removed-model').evaluate('removedValueModel')).toEqual('');
                element(by.css('input.ion-autocomplete-clicked-model')).evaluate('clickedValueModel').then(function (clickedModelValue) {
                    expect(clickedModelValue.item.name).toEqual('test1');
                    expect(clickedModelValue.selectedItems.length).toEqual(1);
                    expect(clickedModelValue.selectedItems[0].name).toEqual('test1');
                });

                // select second item
                element(by.css('input.ion-autocomplete-search')).sendKeys("test");
                var itemList = element.all(by.css('[ng-repeat="item in viewModel.searchItems"]'));

                // get the fifth element as this one is the one that is shown in the collection repeat
                itemList.get(1).click().then(function () {
                    var selectedItemList = element.all(by.repeater('selectedItem in viewModel.selectedItems'));
                    expect(selectedItemList.count()).toEqual(2);
                    expect(selectedItemList.get(0).getText()).toEqual('view: test1');
                    expect(selectedItemList.get(1).getText()).toEqual('view: test2');
                    expect($('input.ion-autocomplete-test-model').getAttribute('value')).toEqual('test1,test2');
                    expect($('input.ion-autocomplete-removed-model').evaluate('removedValueModel')).toEqual('');
                    element(by.css('input.ion-autocomplete-clicked-model')).evaluate('clickedValueModel').then(function (clickedModelValue) {
                        expect(clickedModelValue.item.name).toEqual('test2');
                        expect(clickedModelValue.selectedItems.length).toEqual(2);
                        expect(clickedModelValue.selectedItems[0].name).toEqual('test1');
                        expect(clickedModelValue.selectedItems[1].name).toEqual('test2');
                    });

                    // select third item
                    element(by.css('input.ion-autocomplete-search')).sendKeys("test");
                    var itemList = element.all(by.css('[ng-repeat="item in viewModel.searchItems"]'));

                    // get the eighth element as this one is the one that is shown in the collection repeat
                    itemList.get(2).click().then(function () {
                        var selectedItemList = element.all(by.repeater('selectedItem in viewModel.selectedItems'));
                        expect(selectedItemList.count()).toEqual(3);
                        expect(selectedItemList.get(0).getText()).toEqual('view: test1');
                        expect(selectedItemList.get(1).getText()).toEqual('view: test2');
                        expect(selectedItemList.get(2).getText()).toEqual('view: test3');
                        expect($('input.ion-autocomplete-test-model').getAttribute('value')).toEqual('test1,test2,test3');
                        expect($('input.ion-autocomplete-removed-model').evaluate('removedValueModel')).toEqual('');
                        element(by.css('input.ion-autocomplete-clicked-model')).evaluate('clickedValueModel').then(function (clickedModelValue) {
                            expect(clickedModelValue.item.name).toEqual('test3');
                            expect(clickedModelValue.selectedItems.length).toEqual(3);
                            expect(clickedModelValue.selectedItems[0].name).toEqual('test1');
                            expect(clickedModelValue.selectedItems[1].name).toEqual('test2');
                            expect(clickedModelValue.selectedItems[2].name).toEqual('test3');
                        });

                        // delete the item from the selected items
                        selectedItemList.get(1).element(by.css('[ng-click="viewModel.removeItem($index)"]')).click().then(function () {
                            var selectedItemList = element.all(by.repeater('selectedItem in viewModel.selectedItems'));
                            expect(selectedItemList.count()).toEqual(2);
                            expect(selectedItemList.get(0).getText()).toEqual('view: test1');
                            expect(selectedItemList.get(1).getText()).toEqual('view: test3');
                            expect($('input.ion-autocomplete-test-model').getAttribute('value')).toEqual('test1,test3');
                        });

                        element(by.css('input.ion-autocomplete-clicked-model')).evaluate('clickedValueModel').then(function (clickedModelValue) {
                            //  Showing result of final clicked callback
                            expect(clickedModelValue.item.name).toEqual('test3');
                            expect(clickedModelValue.selectedItems.length).toEqual(3);
                            expect(clickedModelValue.selectedItems[0].name).toEqual('test1');
                            expect(clickedModelValue.selectedItems[1].name).toEqual('test2');
                            expect(clickedModelValue.selectedItems[2].name).toEqual('test3');
                        });
                        element(by.css('input.ion-autocomplete-removed-model')).evaluate('removedValueModel').then(function (removedValueModel) {
                            //  Showing result of final removed callback
                            expect(removedValueModel.item.name).toEqual('test2');
                            expect(removedValueModel.selectedItems.length).toEqual(2);
                            expect(removedValueModel.selectedItems[0].name).toEqual('test1');
                            expect(removedValueModel.selectedItems[1].name).toEqual('test3');
                        });
                    });

                });
            })

        });
    });

    it('must call the items clicked method if an item is clicked', function () {
        browser.get(htmlFileName);

        expect($('input.ion-autocomplete-clicked-model').evaluate('clickedValueModel')).toEqual('');
        expect($('input.ion-autocomplete-removed-model').evaluate('removedValueModel')).toEqual('');

        element(by.css('input.ion-autocomplete')).click().then(function () {
            expect($('input.ion-autocomplete-search').isDisplayed()).toBeTruthy();

            element(by.css('input.ion-autocomplete-search')).sendKeys("test");

            var itemList = element.all(by.css('[ng-repeat="item in viewModel.searchItems"]'));
            expectCollectionRepeatCount(itemList, 3);
            itemList.get(0).click().then(function () {
                expect($('input.ion-autocomplete-search').isDisplayed()).toBeTruthy();
                expect($('input.ion-autocomplete-test-model').isDisplayed()).toBeTruthy();
                expect($('input.ion-autocomplete-test-model').getAttribute('value')).toEqual('test1');

                // select second item
                element(by.css('input.ion-autocomplete-search')).sendKeys("test");
                var itemList = element.all(by.css('[ng-repeat="item in viewModel.searchItems"]'));

                // get the fifth element as this one is the one that is shown in the collection repeat
                itemList.get(1).click().then(function () {
                    var selectedItemList = element.all(by.repeater('selectedItem in viewModel.selectedItems'));
                    expect(selectedItemList.count()).toEqual(2);
                    expect(selectedItemList.get(0).getText()).toEqual('view: test1');
                    expect(selectedItemList.get(1).getText()).toEqual('view: test2');
                    expect($('input.ion-autocomplete-test-model').getAttribute('value')).toEqual('test1,test2');

                    // expect the callback value
                    element(by.css('input.ion-autocomplete-clicked-model')).evaluate('clickedValueModel').then(function (clickedModelValue) {
                        expect(clickedModelValue.item.name).toEqual('test2');
                        expect(clickedModelValue.selectedItems.length).toEqual(2);
                        expect(clickedModelValue.selectedItems[0].name).toEqual('test1');
                        expect(clickedModelValue.selectedItems[1].name).toEqual('test2');
                    });
                    expect($('input.ion-autocomplete-removed-model').evaluate('removedValueModel')).toEqual('');

                });

            })

        });
    });

    it('must not be able to select more items as the max selected items attribute allows', function () {
        browser.get(htmlFileName);

        element(by.css('input.ion-autocomplete')).click().then(function () {
            expect($('input.ion-autocomplete-search').isDisplayed()).toBeTruthy();

            element(by.css('input.ion-autocomplete-search')).sendKeys("test");

            // select the first item
            var itemList = element.all(by.css('[ng-repeat="item in viewModel.searchItems"]'));
            expectCollectionRepeatCount(itemList, 3);
            itemList.get(0).click().then(function () {
                expect($('input.ion-autocomplete-test-model').getAttribute('value')).toEqual('test1');

                // select the second item
                element(by.css('input.ion-autocomplete-search')).sendKeys("test");
                var itemList = element.all(by.css('[ng-repeat="item in viewModel.searchItems"]'));
                itemList.get(1).click().then(function () {
                    expect($('input.ion-autocomplete-test-model').getAttribute('value')).toEqual('test1,test2');

                    // select the third item
                    element(by.css('input.ion-autocomplete-search')).sendKeys("test");
                    var itemList = element.all(by.css('[ng-repeat="item in viewModel.searchItems"]'));
                    itemList.get(2).click().then(function () {
                        expect($('input.ion-autocomplete-test-model').getAttribute('value')).toEqual('test1,test2,test3');

                        // try to select the fourth item
                        element(by.css('input.ion-autocomplete-search')).sendKeys("test1");
                        var itemList = element.all(by.css('[ng-repeat="item in viewModel.searchItems"]'));
                        itemList.get(0).click().then(function () {
                            expect($('input.ion-autocomplete-test-model').getAttribute('value')).toEqual('test1,test2,test3');
                        });
                    });
                });
            });
        });
    });

    function expectCollectionRepeatCount(items, count) {
        for (var i = 0; i < count; i++) {
            expect(items.get(i).getText().isDisplayed()).toBeTruthy();
        }
        //expect(items.get(count).getText().isDisplayed()).toBeFalsy();
    }

});