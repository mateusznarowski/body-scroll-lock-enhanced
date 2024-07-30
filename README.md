# body-scroll-lock-enhanced

Enhanced version of [body-scroll-lock](https://github.com/willmcpo/body-scroll-lock) package, main changes:

- fixes [body-scroll-lock v4.0.0-beta.0 bug](https://github.com/willmcpo/body-scroll-lock/issues/271),
- prevents unnecessary scrolling back to section on `enableBodyScroll` when property `scroll-behavior` is set to `smooth`,
- for browsers that support `scrollbar-gutter` set it instead of `padding-right` to the body element

---

<img src="https://raw.githubusercontent.com/willmcpo/body-scroll-lock/master/images/logo.png" alt="Body scroll lock...just works with everything ;-)" />

## Why BSL?

Enables body scroll locking (for iOS Mobile and Tablet, Android, desktop Safari/Chrome/Firefox) without breaking scrolling of a target element (e.g. modal/lightbox/flyouts/nav-menus).

_Features_:

- disables body scroll WITHOUT disabling scroll of a target element
- works on iOS mobile/tablet
- works on Android
- works on Safari desktop
- works on Chrome/Firefox
- works with vanilla JS and frameworks such as React / Vue / Angular
- supports nested target elements (e.g. a modal that appears on top of a flyout)
- can reserve scrollbar width
- `-webkit-overflow-scrolling: touch` still works

_Aren't the alternative approaches sufficient?_

- the approach `document.body.ontouchmove = (e) => { e.preventDefault(); return false; };` locks the body scroll, but ALSO locks the scroll of a target element (eg. modal).
- the approach `overflow: hidden` on the body or html elements doesn't work for all browsers
- the `position: fixed` approach causes the body scroll to reset
- some approaches break inertia/momentum/rubber-band scrolling on iOS

_LIGHT Package Size:_

[![minzip size](https://badgen.net/bundlephobia/minzip/body-scroll-lock-enhanced?color=orange)](https://badgen.net/bundlephobia/minzip/body-scroll-lock-enhanced?color=orange)

## Install

### pnpm

```bash
pnpm add body-scroll-lock-enhanced
```

### yarn

```bash
yarn add body-scroll-lock-enhanced
```

### npm

```bash
npm install body-scroll-lock-enhanced
```

## Usage examples

### JS

```js
// 1a. Import the functions (for CJS)
const bodyScrollLock = require('body-scroll-lock-enhanced');
const disableBodyScroll = bodyScrollLock.disableBodyScroll;
const enableBodyScroll = bodyScrollLock.enableBodyScroll;

// 1b. Import the functions (for ESM)
import { disableBodyScroll, enableBodyScroll } from 'body-scroll-lock-enhanced';

// 2. Get a target element that you want to persist scrolling for (such as a modal/lightbox/flyout/nav).
// Specifically, the target element is the one we would like to allow scroll on (NOT a parent of that element).
// This is also the element to apply the CSS '-webkit-overflow-scrolling: touch;' if desired.
const targetElement = document.querySelector('#someElementId');

// 3. ...in some event handler after showing the target element...disable body scroll
disableBodyScroll(targetElement);

// 4. ...in some event handler after hiding the target element...
enableBodyScroll(targetElement);
```

### React

```js
import { useEffect, useRef } from 'react';

// 1. Import the functions
import { disableBodyScroll, enableBodyScroll, clearAllBodyScrollLocks } from 'body-scroll-lock-enhanced';

const MyComponent = () => {
  // 2. Get a target element that you want to persist scrolling for (such as a modal/lightbox/flyout/nav).
  // Specifically, the target element is the one we would like to allow scroll on (NOT a parent of that element).
  // This is also the element to apply the CSS '-webkit-overflow-scrolling: touch;' if desired.
  const targetElement = useRef(null);

  const showTargetElement = () => {
    // ... some logic to show target element

    // 3. Disable body scroll
    disableBodyScroll(targetElement.current);
  };

  const hideTargetElement = () => {
    // ... some logic to hide target element

    // 4. Re-enable body scroll
    enableBodyScroll(targetElement.current);
  };

  useEffect(() => {
    // 5. Useful if we have called disableBodyScroll for multiple target elements,
    // and we just want a kill-switch to undo all that.
    // OR useful for if the `hideTargetElement()` function got circumvented eg. visitor
    // clicks a link which takes him/her to a different page within the app.
    return () => {
      clearAllBodyScrollLocks();
    };
  }, []);

  return (
    <div>
      <div ref={targetElement}>
        {/* target element content */}
      </div>
      <button onClick={showTargetElement}>Show</button>
      <button onClick={hideTargetElement}>Hide</button>
    </div>
  );
};
```

### Vue

```js
import { onUnmounted, ref } from 'vue';

// 1. Import the functions
import { disableBodyScroll, enableBodyScroll, clearAllBodyScrollLocks } from 'body-scroll-lock-enhanced';

// 2. Get a target element that you want to persist scrolling for (such as a modal/lightbox/flyout/nav).
// Specifically, the target element is the one we would like to allow scroll on (NOT a parent of that element).
// This is also the element to apply the CSS '-webkit-overflow-scrolling: touch;' if desired.
const targetElement = ref(null)

const showTargetElement = () => {
  // ... some logic to show target element

  // 3. Disable body scroll
  disableBodyScroll(targetElement.value);
};

const hideTargetElement = () => {
  // ... some logic to hide target element

  // 4. Re-enable body scroll
  enableBodyScroll(targetElement.value);
};

onUnmounted(() => {
  // 5. Useful if we have called disableBodyScroll for multiple target elements,
  // and we just want a kill-switch to undo all that.
  // OR useful for if the `hideTargetElement()` function got circumvented eg. visitor
  // clicks a link which takes him/her to a different page within the app.
  clearAllBodyScrollLocks();
});
```

### Angular

```js
import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';

// 1. Import the functions
import { disableBodyScroll, enableBodyScroll, clearAllBodyScrollLocks } from 'body-scroll-lock-enhanced';

@Component({
  selector: 'app-my-component',
  template: `
    <div #targetElement>
      <!-- target element content -->
    </div>
    <button (click)="showTargetElement()">Show</button>
    <button (click)="hideTargetElement()">Hide</button>
  `,
})
export class MyComponent implements OnDestroy {
  @ViewChild('targetElement', { static: true }) targetElement: ElementRef;

  showTargetElement() {
    // ... some logic to show target element

    // 3. Disable body scroll
    disableBodyScroll(this.targetElement.nativeElement);
  }

  hideTargetElement() {
    // ... some logic to hide target element

    // 4. Re-enable body scroll
    enableBodyScroll(this.targetElement.nativeElement);
  }

  ngOnDestroy() {
    // 5. Useful if we have called disableBodyScroll for multiple target elements,
    // and we just want a kill-switch to undo all that.
    // OR useful for if the `hideTargetElement()` function got circumvented eg. visitor
    // clicks a link which takes him/her to a different page within the app.
    clearAllBodyScrollLocks();
  }
}
```

## Functions

```ts
disableBodyScroll(targetElement: HTMLElement, options?: BodyScrollOptions): void
// Disables body scroll for the target element.

enableBodyScroll(targetElement: HTMLElement): void
// Enables body scroll for the target element.

clearAllBodyScrollLocks(): void
// Clears all body scroll locks.

toggleBodyScrollLock(targetElement: HTMLElement, options?: BodyScrollOptions & { toggleValue?: boolean }): void
// Toggles body scroll lock for the target element based on the value parameter in options (value is optional).
```

## Options

### <s>reserveScrollBarGap</s> reserveScrollbarGutter

**optional, default:** false

If the overflow property of the body is set to hidden, the body widens by the width of the scrollbar. This produces an
unpleasant flickering effect, especially on websites with centered content. If the `reserveScrollbarGutter` option is set,
this gap is filled by `scrollbar-gutter: stable` on the html element (or `padding-right` on the body element, if browser does not support this option). If `disableBodyScroll` is called for the last target element,
or `clearAllBodyScrollLocks` is called, the `scrollbar-gutter` (`padding-right`) is automatically reset to the previous value.

```js
import { disableBodyScroll } from 'body-scroll-lock-enhanced';

disableBodyScroll(targetElement, { reserveScrollbarGutter: true });
```

### toggleValue

**optional (only available in toggleBodyScrollLock), default:** undefined

The `toggleValue` option is a boolean parameter used in the `toggleBodyScrollLock` function. This parameter determines whether to enable or disable body scroll based on its value.

- If `toggleValue` is `true`, the `toggleBodyScrollLock` function will disable body scroll for the specified target element.
- If `toggleValue` is `false`, the `toggleBodyScrollLock` function will enable body scroll for the specified target element.
- If `toggleValue` is `undefined`, the `toggleBodyScrollLock` function will toggle the current state of body scroll for the specified target element. This means it will disable body scroll if it is currently enabled, and enable body scroll if it is currently disabled.

This option provides a convenient way to manage the body scroll lock state with a single function call.

```js
import { toggleBodyScrollLock } from 'body-scroll-lock-enhanced';

toggleBodyScrollLock(targetElement, { toggleValue: isTargetElementVisible });
```

### allowTouchMove

**optional, default:** undefined

To disable scrolling on iOS, `disableBodyScroll` prevents `touchmove` events.
However, there are cases where you have called `disableBodyScroll` on an
element, but its children still require `touchmove` events to function.

See below for 2 use cases:

#### Simple

```js
disableBodyScroll(container, {
  allowTouchMove: el => el.tagName === 'TEXTAREA'
});
```

#### More Complex

JavaScript:

```js
disableBodyScroll(container, {
  allowTouchMove: (el) => {
    while (el && el !== document.body) {
      if (el.getAttribute('body-scroll-lock-ignore') !== null) {
        return true;
      }

      el = el.parentElement;
    }
  }
});
```

HTML:

```html
<div id="container">
  <div id="scrolling-map" body-scroll-lock-ignore>
    ...
  </div>
</div>
```

## References

https://medium.com/jsdownunder/locking-body-scroll-for-all-devices-22def9615177
https://stackoverflow.com/questions/41594997/ios-10-safari-prevent-scrolling-behind-a-fixed-overlay-and-maintain-scroll-posi

## License

This project is licensed under the MIT License - see the LICENSE file for details.
