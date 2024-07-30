interface BodyScrollOptions {
  reserveScrollbarGutter?: boolean
  /** @deprecated use reserveScrollbarGutter instead */
  reserveScrollBarGap?: boolean
  allowTouchMove?: (el: EventTarget) => boolean
}

interface HtmlStyleType {
  height: string
  overflow: string
}

type BodyStyleType = HtmlStyleType & {
  position: string
  top: string
  left: string
  width: string
}

type HandleScrollEvent = TouchEvent

interface Lock {
  targetElement: HTMLElement
  options: BodyScrollOptions
}

/**
 * Determines the type of scroll lock required for the current device.
 * @returns {'overflow' | 'fixed'} The type of scroll lock required.
 *
 * Note: From iOS 16 onwards, using 'overflow: hidden' is possible and is a less complex solution.
 */
const getScrollLockType = (): 'overflow' | 'fixed' => {
  if (typeof window === 'undefined' || !window.navigator) {
    return 'overflow'
  }

  const isIosDevice = /iP(ad|hone|od)/.test(window.navigator.platform) && window.navigator.maxTouchPoints > 1
  if (!isIosDevice) {
    return 'overflow'
  }

  const match = window.navigator.userAgent.match(/Version\/(\d+\.\d+)/)
  return match && parseInt(match[1]) >= 16 ? 'overflow' : 'fixed'
}

const isPositionFixedRequired = getScrollLockType() === 'fixed'

// Feature detect passive events
let hasPassiveEvents = false
if (typeof window !== 'undefined') {
  const passiveTestOptions: AddEventListenerOptions = {
    get passive() {
      hasPassiveEvents = true
      return undefined
    }
  }

  window.addEventListener('__BSL_TEST_PASSIVE__', () => ({}), passiveTestOptions)
  window.removeEventListener('__BSL_TEST_PASSIVE__', () => ({}), passiveTestOptions)
}

let locks: Array<Lock> = []
const locksIndex = new Map<HTMLElement, number>()

let documentListenerAdded = false
let initialClientY = -1
let htmlStyle: HtmlStyleType | undefined
let bodyStyle: BodyStyleType | undefined
let previousOverflowSetting: string | undefined
let previousScrollbarGutter: string | boolean | undefined

/**
 * Determines if the element should allow touchmove events.
 * @param {EventTarget} el - The event target element.
 * @returns {boolean} True if the element should allow touchmove events, false otherwise.
 */
const allowTouchMove = (el: EventTarget): boolean => {
  return locks.some((lock) => lock.options.allowTouchMove?.(el))
}

/**
 * Prevents the default behavior for touch events if necessary.
 * @param {HandleScrollEvent} rawEvent - The raw touch event.
 * @returns {boolean} True if default behavior should not be prevented, false otherwise.
 */
const preventDefault = (rawEvent: HandleScrollEvent): boolean => {
  const event = rawEvent || window.event

  if (allowTouchMove(event.target as Element)) {
    return true
  }
  if (event.touches.length > 1) {
    return true
  }

  if (event.preventDefault) {
    event.preventDefault()
  }
  return false
}

/**
 * Sets overflow to hidden and optionally reserves scrollbar gap.
 * @param {BodyScrollOptions} [options] - The options for setting overflow hidden.
 */
const setOverflowHidden = (options?: BodyScrollOptions): void => {
  const reserveScrollbarGutter = options?.reserveScrollbarGutter ?? options?.reserveScrollBarGap

  if (reserveScrollbarGutter && previousScrollbarGutter === undefined) {
    const scrollbarGutterPropertySupported = CSS.supports('scrollbar-gutter', 'stable')

    if (scrollbarGutterPropertySupported) {
      previousScrollbarGutter = true
      document.documentElement.style.scrollbarGutter = 'stable'
    } else {
      const scrollBarGap = window.innerWidth - document.documentElement.getBoundingClientRect().width

      if (scrollBarGap > 0) {
        const computedBodyPaddingRight = parseInt(window.getComputedStyle(document.body).getPropertyValue('padding-right'), 10)
        previousScrollbarGutter = document.body.style.paddingRight
        document.body.style.paddingRight = `${computedBodyPaddingRight + scrollBarGap}px`
      }
    }
  }

  if (previousOverflowSetting === undefined) {
    previousOverflowSetting = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
}

/**
 * Restores the previous overflow settings.
 */
const restoreOverflowSetting = (): void => {
  if (previousScrollbarGutter !== undefined) {
    const scrollbarGutterPropertySupported = CSS.supports('scrollbar-gutter', 'stable')

    if (scrollbarGutterPropertySupported) {
      document.documentElement.style.scrollbarGutter = ''
    } else {
      document.body.style.paddingRight = previousScrollbarGutter as string
    }

    previousScrollbarGutter = undefined
  }

  if (previousOverflowSetting !== undefined) {
    document.body.style.overflow = previousOverflowSetting
    previousOverflowSetting = undefined
  }
}

/**
 * Sets the body position to fixed and locks the scroll.
 */
const setPositionFixed = (): void => {
  window.requestAnimationFrame(() => {
    const $html = document.documentElement
    const $body = document.body

    if (bodyStyle === undefined) {
      htmlStyle = { ...$html.style }
      bodyStyle = { ...$body.style }

      const { scrollY, scrollX, innerHeight } = window

      $html.style.height = '100%'
      $html.style.overflow = 'hidden'
      $html.style.setProperty('--bsl-top', `${scrollY}px`)

      $body.style.position = 'fixed'
      $body.style.top = `${-scrollY}px`
      $body.style.left = `${-scrollX}px`
      $body.style.width = '100%'
      $body.style.height = 'auto'
      $body.style.overflow = 'hidden'

      setTimeout(() => {
        const bottomBarHeight = innerHeight - window.innerHeight
        if (bottomBarHeight && scrollY >= innerHeight) {
          $body.style.top = `${-(scrollY + bottomBarHeight)}px`
        }
      }, 0)
    }
  })
}

/**
 * Restores the previous body and html position settings.
 */
const restorePositionSetting = (): void => {
  if (bodyStyle !== undefined) {
    const $html = document.documentElement
    const $body = document.body

    const y = -parseInt($body.style.top, 10)
    const x = -parseInt($body.style.left, 10)

    $html.style.height = htmlStyle?.height ?? ''
    $html.style.overflow = htmlStyle?.overflow ?? ''
    $html.style.removeProperty('--bsl-top')

    $body.style.position = bodyStyle.position || ''
    $body.style.top = bodyStyle.top || ''
    $body.style.left = bodyStyle.left || ''
    $body.style.width = bodyStyle.width || ''
    $body.style.height = bodyStyle.height || ''
    $body.style.overflow = bodyStyle.overflow || ''

    window.scrollTo({ left: x, top: y, behavior: 'instant' })

    bodyStyle = undefined
  }
}

/**
 * Checks if the target element is totally scrolled.
 * @param {HTMLElement} targetElement - The target element.
 * @returns {boolean} True if the target element is totally scrolled, false otherwise.
 */
const isTargetElementTotallyScrolled = (targetElement: HTMLElement): boolean => {
  return targetElement ? targetElement.scrollHeight - targetElement.scrollTop <= targetElement.clientHeight : false
}

/**
 * Handles the scroll event for the target element.
 * @param {HandleScrollEvent} event - The scroll event.
 * @param {HTMLElement} targetElement - The target element.
 * @returns {boolean} True if the event should not be prevented, false otherwise.
 */
const handleScroll = (event: HandleScrollEvent, targetElement: HTMLElement): boolean => {
  const clientY = event.targetTouches[0].clientY - initialClientY

  if (allowTouchMove(event.target!)) {
    return false
  }

  if (targetElement && targetElement.scrollTop === 0 && clientY > 0) {
    return preventDefault(event)
  }

  if (isTargetElementTotallyScrolled(targetElement) && clientY < 0) {
    return preventDefault(event)
  }

  event.stopPropagation()
  return true
}

/**
 * Disables body scroll for the target element.
 * @param {HTMLElement} targetElement - The target element.
 * @param {BodyScrollOptions} [options] - The options for disabling body scroll.
 */
export const disableBodyScroll = (targetElement: HTMLElement, options?: BodyScrollOptions): void => {
  if (!targetElement) {
    console.error('disableBodyScroll unsuccessful - targetElement must be provided when calling disableBodyScroll.')
    return
  }

  locksIndex.set(targetElement, (locksIndex.get(targetElement) ?? 0) + 1)

  if (locks.some((lock) => lock.targetElement === targetElement)) {
    return
  }

  const lock = { targetElement, options: options ?? {} }
  locks = [...locks, lock]

  if (isPositionFixedRequired) {
    setPositionFixed()
  } else {
    setOverflowHidden(options)
  }

  if (isPositionFixedRequired) {
    targetElement.ontouchstart = (event: HandleScrollEvent) => {
      if (event.targetTouches.length === 1) {
        initialClientY = event.targetTouches[0].clientY
      }
    }
    targetElement.ontouchmove = (event: HandleScrollEvent) => {
      if (event.targetTouches.length === 1) {
        handleScroll(event, targetElement)
      }
    }

    if (!documentListenerAdded) {
      document.addEventListener('touchmove', preventDefault, hasPassiveEvents ? { passive: false } : undefined)
      documentListenerAdded = true
    }
  }
}

/**
 * Clears all body scroll locks.
 */
export const clearAllBodyScrollLocks = (): void => {
  if (isPositionFixedRequired) {
    locks.forEach((lock) => {
      lock.targetElement.ontouchstart = null
      lock.targetElement.ontouchmove = null
    })

    if (documentListenerAdded) {
      document.removeEventListener('touchmove', preventDefault)
      documentListenerAdded = false
    }

    initialClientY = -1
  }

  if (isPositionFixedRequired) {
    restorePositionSetting()
  } else {
    restoreOverflowSetting()
  }

  locks = []
  locksIndex.clear()
}

/**
 * Enables body scroll for the target element.
 * @param {HTMLElement} targetElement - The target element.
 */
export const enableBodyScroll = (targetElement: HTMLElement): void => {
  if (!targetElement) {
    console.error('enableBodyScroll unsuccessful - targetElement must be provided when calling enableBodyScroll.')
    return
  }

  locksIndex.set(targetElement, (locksIndex.get(targetElement) ?? 0) - 1)

  if (locksIndex.get(targetElement) === 0) {
    locks = locks.filter((lock) => lock.targetElement !== targetElement)
    locksIndex.delete(targetElement)
  }

  if (isPositionFixedRequired) {
    targetElement.ontouchstart = null
    targetElement.ontouchmove = null

    if (documentListenerAdded && locks.length === 0) {
      document.removeEventListener('touchmove', preventDefault)
      documentListenerAdded = false
    }
  }

  if (locks.length === 0) {
    if (isPositionFixedRequired) {
      restorePositionSetting()
    } else {
      restoreOverflowSetting()
    }
  }
}

/**
 * Toggles body scroll lock for the target element based on the value parameter in options.
 * @param {HTMLElement} targetElement - The target element.
 * @param {BodyScrollOptions & { toggleValue?: boolean }} [options] - The options for toggling body scroll lock, including the toggleValue parameter.
 */
export const toggleBodyScrollLock = (targetElement: HTMLElement, options?: BodyScrollOptions & { toggleValue?: boolean }): void => {
  const { toggleValue, ...bodyScrollOptions } = options ?? {}

  if (toggleValue === undefined) {
    if (locks.some((lock) => lock.targetElement === targetElement)) {
      enableBodyScroll(targetElement)
    } else {
      disableBodyScroll(targetElement, bodyScrollOptions)
    }
  } else if (toggleValue) {
    disableBodyScroll(targetElement, bodyScrollOptions)
  } else {
    enableBodyScroll(targetElement)
  }
}
