ion-autocomplete
================
[![Build Status](https://travis-ci.org/guylabs/ion-autocomplete.svg?branch=master)](https://travis-ci.org/guylabs/ion-autocomplete)
[![Coverage Status](https://img.shields.io/coveralls/guylabs/ion-autocomplete.svg)](https://coveralls.io/r/guylabs/ion-autocomplete)

> Configurable Ionic directive for an autocomplete dropdown.

#Table of contents

- [Demo](#demo)
- [Introduction](#introduction)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
    - [Configurable options](#configurable-options)
        - [The `items-method`](#the-items-method)
        - [The `items-method-value-key`](#the-items-method-value-key)
        - [The `item-value-key`](#the-item-value-key)
        - [The `item-view-value-key`](#the-item-view-value-key)
        - [The `multiple-select`](#the-multiple-select)
        - [The `items-clicked-method`](#the-items-clicked-method)
        - [Placeholder](#placeholder)
        - [Cancel button label](#cancel-button-label)
        - [Select items label](#select-items-label)
        - [Selected items label](#selected-items-label)
        - [Template url](#template-url)
    - [Using expressions in value keys](#using-expressions-in-value-keys)
- [Release notes](#release-notes)
- [Acknowledgements](#acknowledgements)
- [License](#license)

# Demo

![Animated demo](https://github.com/guylabs/ion-autocomplete/raw/master/demo.gif)

# Introduction

For one of my private projects I needed an autocomplete component in Ionic. I searched a lot and found some plain Angular autocompletes, but these had too much other dependencies and mostly didn't look that good within Ionic. Then one day I stumbled upon the [ion-google-place](https://github.com/israelidanny/ion-google-place) project which was exactly what I was looking for, except that it was just working with the Google Places API. So I forked the project and made it configurable such that you can add the service you need. The differences between the ion-google-place project and the ion-autocomplete are listed in the features.

# Features

The ion-autocomplete component has the following features:
- Multiple selection support
- Configure a callback when an item is clicked
- Configurable service which provides the items to list
- Configure what is stored in the model and what is seen in the list
- Configure all labels used in the component
- Configure the template used to show the autocomplete component

# Installation

1. Use bower to install the new module:
```bash
bower install ion-autocomplete --save
```
2. Import the `ion-autocomplete` javascript and css file into your HTML file:
```html
<script src="bower_components/ion-autocomplete/dist/ion-autocomplete.js"></script>
<link href="bower_components/ion-autocomplete/dist/ion-autocomplete.css" rel="stylesheet">
```
3. Add `ion-autocomplete` as a dependency on your Ionic app:
```javascript
angular.module('myApp', [
  'ionic',
  'ion-autocomplete'
]);
```

# Usage

To use the `ion-autocomplete` directive in single select mode you need to add the following snippet to your template:
```html
// usage with the element restriction
<ion-autocomplete ng-model="model" />

//usage with the attribute restriction
<input ion-autocomplete type="text" readonly="readonly" class="ion-autocomplete" autocomplete="off" />
```

If you want to use it in multiple select mode you need to add the following snippet to your template: 
```html
// usage with the element restriction
<ion-autocomplete ng-model="model" multiple-select="true" />

//usage with the attribute restriction
<input ion-autocomplete type="text" readonly="readonly" class="ion-autocomplete" autocomplete="off" multiple-select="true" />
```

Check out the next chapter on how to configure the directive.

## Configurable options

### The `items-method`

You are able to pass in a callback method which gets called when the user changes the value of the search input field. This is
normally a call to the back end which retrieves the items for the specified query. Here is a small sample which will
return a static item of the query:

Define the callback in your scope:
```javascript
$scope.callbackMethod = function (query) {
    return [query];
}
```

And set the items method on the directive:
```html
<ion-autocomplete ng-model="model" items-method="callbackMethod(query)" />
```

You are also able to return a promise from this callback method. For example:
```javascript
$scope.callbackMethod = function (query) {
    return $http.get(endpoint);
}
```

Note that the parameter for the `callbackMethod needs to be named `query`. Otherwise the callback will not get called properly.

### The `items-method-value-key`

You are able to set the `items-method-value-key` attribute which maps to a value of the returned data of the `items-method`. If for
example your callback method returns the following object:
```json
{
    "items" : [ {
        "name" : "item1"
    },{
        "name" : "item2"
    },
        ...
    ]
}
```
Then when you do not specify the `items-method-value-key` there will be no list displayed when you search for items in
the search input field. You need to set the `items-method-value-key` to `items` such that the items are shown. If you right
away return an array of items then you do not need to set the `items-method-value-key`.

### The `item-value-key`

You are able to set the `item-value-key` attribute which maps to a value of the returned object from the `items-method`. The value
is then saved in the defined `ng-model`. Here an example:

The items method returns the following object:
```javascript
[
    {
        "id": "1",
        "name": "Item 1",
        ...
    }
    ...
]
```

And now you set the following `item-value-key`:
```html
<ion-autocomplete ng-model="model" item-value-key="id" />
```

Now when the user selects the `Item 1` from the list, then the value of the objects `id` is stored in the `ng-model`. If
no `item-value-key` is passed into the directive, the whole item object will be stored in the `ng-model`.

### The `item-view-value-key`

You are able to set the `item-view-value-key` attribute which maps to a value of the returned object from the `items-method`. The
value is then showed in both input fields. Here an example:

The `items-method` returns the following object:
```javascript
[
    {
        "id": "1",
        "name": "Item 1",
        ...
    }
    ...
]
```

And now you set the following `item-view-value-key`:
```html
<ion-autocomplete ng-model="model" item-view-value-key="name" />
```

Now when the user selects the `Item 1` from the list, then the value of the objects `name` is showed in both input fields. If
no `item-view-value-key` is passed into the directive, the whole item object will be showed in both input fields.

### The `multiple-select`

You are able to set the `multiple-select` attribute to `true` to enable the multiple select feature. Here an example:
```html
<ion-autocomplete ng-model="model" multiple-select="true" />
```

Then the user is able to select multiple items out of the returned items and also delete them again. The given `ng-model` is an 
array if multiple items are selected.

### The `items-clicked-method`

You are able to pass a function to the `items-clicked-method` attribute to be notified when an item is clicked. The name of the 
parameter of the function must be `callback`. Here is an example:

Define the callback in your scope:
```javascript
$scope.callbackMethod = function (callback) {
    // print out the selected item
    console.log(callback.item); 
    
    // print out the selected items if the multiple select flag is set to true and multiple elements are selected
    console.log(callback.selectedItems); 
}
```

And pass in the callback method in the directive:
```html
<ion-autocomplete ng-model="model" items-clicked-method="callbackMethod(callback)" />
```

Then you get a callback object with the clicked/selected item and the selected items if you have multiple selected items (see [The `multiple-select`](#the-multiple-select)).

### Placeholder

You are also able to set the placeholder on the input field and on the search input field if you add the `placeholder`
attribute to the directive:
```html
<ion-autocomplete ng-model="model" placeholder="Enter the query to search for ..." />`
```

### Cancel button label

You are also able to set the cancel button label (defaults to `Cancel`) if you add the `cancel-label` attribute to the directive:
```html
<ion-autocomplete ng-model="model" cancel-label="Go back" />`
```

### Select items label

You are also able to set the select items label (defaults to `Select an item...`) if you add the `select-items-label` attribute to the directive:
```html
<ion-autocomplete ng-model="model" select-items-label="Select your items..." />`
```

### Selected items label

You are also able to set the selected items label (defaults to `Selected items:`) if you add the `selected-items-label` attribute to the directive:
```html
<ion-autocomplete ng-model="model" selected-items-label="Selected:" />`
```

### Template url

You are also able to set an own template for the autocomplete component (defaults to `''`) if you add the `template-url` attribute to the directive:
```html
<ion-autocomplete ng-model="model" template-url="templates/template.html" />`
```

This way you are able to override the default template (the `searchContainerTemplate` variable [here](https://github.com/guylabs/ion-autocomplete/blob/master/src/ion-autocomplete.js#L75)) 
and use your own template. The component will use the default template if the `template-url` is not defined.

You are able to use all the configurable attributes as expressions in your template. I would advise to use the default template as base template
and then add your custom additions to it.

> Please also take care when you change how the items are shown or what method is called if an item is clicked, 
> because changing this could make the component unusable.

The template itself will be loaded with the `$ionicTemplateLoader` and this will also use the Angular `$templateCache`.

## Using expressions in value keys

All value keys are parsed with the Angular `$parse` service such that you are able to use expressions like in the following
example:

```javascript
[
    {
        "id": "1",
        "name": "Item 1",
        "child": {
            "name": "Child Item 1",
        }
        ...
    }
    ...
]
```

This would be the JSON model returned by the `items-method` and in the next snippet we define that we want to show the
name attribute of the child object:

```html
<ion-autocomplete ng-model="model" item-view-value-key="child.name" />
```

# Release notes

Check them here: [Release notes](https://github.com/guylabs/ion-autocomplete/blob/master/RELEASENOTES.md)

# Acknowledgements

When I first searched for an Ionic autocomplete component I just found the project from Danny. So please have a look at
his [ion-google-place](https://github.com/israelidanny/ion-google-place) project as this project here is a fork of it.
At this point I want to thank him for his nice work.

# License

This Ionic autocomplete directive is available under the MIT license.

(c) Danny Povolotski

(c) Modifications by Guy Brand
