/**
 *
 *    Copyright (c) 2020 Silicon Labs
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

const templateUtil = require('./template-util.js')
const queryPackage = require('../db/query-package.js')

/**
 * This module contains the API for templating. For more detailed instructions, read {@tutorial template-tutorial}
 *
 * @module Templating API: toplevel utility helpers
 */

/**
 * Produces the top-of-the-file header for a C file.
 *
 * @returns The header content
 */
function zap_header() {
  return `// This file is generated by ZCL Advanced Platform generator. Please don't edit manually.`
}

/**
 * Simple helper that produces an approved size of identation.
 *
 * @returns whitespace that is the identation.
 */
function ident(cnt) {
  if (Number.isInteger(cnt)) {
    return '  '.repeat(cnt)
  } else {
    return '  '
  }
}

function new_line(cnt) {
  if (Number.isInteger(cnt)) {
    return '\n'.repeat(cnt)
  } else {
    return '\n'
  }
}

function backslash() {
  return '\\'
}

/**
 * Block helper that iterates over the package options of a given category.
 *
 * @param {*} category
 * @param {*} options
 */
async function template_options(options) {
  return templateUtil
    .ensureTemplatePackageId(this)
    .then((packageId) =>
      queryPackage.selectAllOptionsValues(
        this.global.db,
        packageId,
        options.hash.category,
      ),
    )
    .then((ens) => templateUtil.collectBlocks(ens, options, this))
}

/**
 * Inside an iterator, this helper allows you to specify the content that will be output only
 * during the first element.
 *
 * @param {*} options
 * @returns content, if it's the first element inside an operator, empty otherwise.
 */
function first(options) {
  if (this.index != null && this.count != null && this.index == 0) {
    return options.fn(this)
  }
}

/**
 * Inside an iterator, this helper allows you to specify the content that will be output only
 * if the element is not the first element.
 *
 * @param {*} options
 * @returns content, if it's the first element inside an operator, empty otherwise.
 */
function not_first(options) {
  if (this.index != null && this.count != null && this.index != 0) {
    return options.fn(this)
  }
}

/**
 * Inside an iterator, this helper allows you to specify the content that will be output only
 * during the last element.
 *
 * @param {*} options
 * @returns content, if it's the last element inside an operator, empty otherwise.
 */
function last(options) {
  if (
    this.index != null &&
    this.count != null &&
    this.index == this.count - 1
  ) {
    return options.fn(this)
  }
}

/**
 * Inside an iterator. the block is output only if this is NOT the last item.
 * Useful for wrapping commas in the list of arguments and such.
 *
 * @param {*} optionms
 * @returns content, if it's not the last element inside a block, empty otherwise.
 */
function not_last(options) {
  if (
    this.index != null &&
    this.count != null &&
    this.index != this.count - 1
  ) {
    return options.fn(this)
  }
}

/**
 * Inside an iterator, this helper allows you to specify the content that will be output only
 * during the non-first and no-last element.
 *
 * @param {*} options
 * @returns content, if it's the middle element inside an operator, empty otherwise.
 */
function middle(options) {
  if (
    this.index != null &&
    this.count != null &&
    this.index != 0 &&
    this.index != this.count - 1
  ) {
    return options.fn(this)
  }
}

/**
 * This fetches a promise which returns template options if provided
 *
 * @param {*} options
 * @param {*} key
 */
async function template_option_with_code(options, key) {
  return templateUtil
    .ensureTemplatePackageId(this)
    .then((packageId) =>
      queryPackage.selectSpecificOptionValue(
        this.global.db,
        packageId,
        options,
        key,
      ),
    )
}

/**
 * Forced fail halper.
 *
 * @param {*} options
 */
function fail(options) {
  let message = options.hash.message
  if (message == null) {
    message = 'Template failure.'
  }
  throw new Error(message)
}

/**
 * This returns a boolean if the 2 strings are same
 *
 * @param {*} string_a
 * @param {*} string_b
 */
function isEqual(string_a, string_b) {
  return string_a.trim() === string_b.trim()
}

/**
 * This returns a boolean based on the 2 strings being equal or not given that both
 * @param {*} string_a
 * @param {*} string_b
 */
function is_lowercase_equal(string_a, string_b) {
  let str1 = string_a.toLowerCase().replace(/"/g, '').trim()
  let str2 = string_b.toLowerCase().replace(/"/g, '').trim()
  return 0 == str1.localeCompare(str2)
}

function toggle(condition, trueResult, falseResult) {
  return condition ? trueResult : falseResult
}

/**
 * Remove leading and trailing spaces from a string
 *
 * @param {*} str
 * @returns A string with no leading and trailing spaces
 */
function trim_string(str) {
  if (str == null) return null
  return str.trim()
}

/**
 * Split the string based on spaces and return the last word
 * @param {*} str
 */
function asLastWord(str) {
  let strings = str.trim().split(' ')
  if (strings.length > 0) {
    return strings[strings.length - 1]
  }
  return str.trim()
}

/**
 * Iteration block.
 */
function iterate(options) {
  let hash = options.hash
  let ret = ''
  for (let i = 0; i < hash.count; i++) {
    let newContext = {
      global: this.global,
      parent: this,
      index: i,
      count: hash.count,
    }
    ret = ret.concat(options.fn(newContext))
  }
  return ret
}

function addToAccumulator(accumulator, value) {
  if (!('accumulators' in this.global)) {
    this.global.accumulators = {}
  }
  if (!(accumulator in this.global.accumulators)) {
    this.global.accumulators[accumulator] = {
      value: [],
      sum: [],
      currentSum: 0,
    }
  }
  this.global.accumulators[accumulator].value.push(value)
  let lastSum = this.global.accumulators[accumulator].currentSum
  let newSum
  if (value != null) {
    newSum = lastSum + value
  } else {
    newSum = lastSum
  }
  this.global.accumulators[accumulator].sum.push(newSum)
  this.global.accumulators[accumulator].currentSum = newSum
}

function iterateAccumulator(options) {
  let hash = options.hash
  if (!('accumulators' in this.global)) {
    return ''
  }
  let accumulator = this.global.accumulators[hash.accumulator]
  let ret = ''
  if (accumulator != null) {
    for (let i = 0; i < accumulator.value.length; i++) {
      let newContext = {
        global: this.global,
        parent: this,
        index: i,
        count: accumulator.value.length,
        sum: accumulator.sum[i],
        value: accumulator.value[i],
      }
      ret = ret.concat(options.fn(newContext))
    }
  }
  return ret
}

function waitForSynchronousPromise(pollInterval, promise, resolve, reject) {
  if (promise.isResolved()) {
    resolve()
  } else if (promise.isRejected()) {
    reject()
  } else {
    setTimeout(
      () => waitForSynchronousPromise(pollInterval, promise, resolve, reject),
      pollInterval,
    )
  }
}

async function promiseToResolveAllPreviousPromises(globalPromises) {
  if (globalPromises.length > 0) {
    let promises = []
    globalPromises.forEach((promise) => {
      promises.push(
        new Promise((resolve, reject) => {
          waitForSynchronousPromise(100, promise, resolve, reject)
        }),
      )
    })
    await Promise.all(promises)
  }
}

async function after(options) {
  await promiseToResolveAllPreviousPromises(this.global.promises)
  let newContext = {
    global: this.global,
    parent: this,
  }
  return options.fn(newContext)
}

/**
 * Given: A list of strings
 * Returns a concatenated string with spaces between each string
 */
function concatenate() {
  return Array.prototype.slice.call(arguments, 0, -1).join(' ')
}

/**
 *
 * @param numA
 * @param numB
 * @returns true if both numbers are equal else returns false
 */
function is_num_equal(numA, numB) {
  return numA == numB
}

/**
 *
 * @param value
 * @returns true or false based on whether the value is undefined or not
 */
function is_defined(value) {
  return !(value == null || value == undefined || value == '')
}

/**
 *
 * @param mainString
 * @param replaceString
 * @param replaceWithString
 * @returns A string replaced with another string in the mainString
 */
function replace_string(mainString, replaceString, replaceWithString) {
  return mainString.replace(replaceString, replaceWithString)
}

/**
 *
 * @param str
 * @param prefixStr
 * @returns A resultant string with all string values prefixed with prefixStr
 */
function add_prefix_to_all_strings(str, prefixStr) {
  // Remove hex values from the string
  let hexValueMatch = str.match(/[0x|x][0-9|A-F]+/g)
  let hexValues = hexValueMatch ? hexValueMatch.map(String) : []
  let strWithoutHexValues = str
  for (let h of hexValues) {
    let re = new RegExp(h, 'g')
    strWithoutHexValues = strWithoutHexValues.replace(re, '')
  }
  //Getting unique strings
  let strs = strWithoutHexValues
    .match(/[A-Za-z]+/g)
    .map(String)
    .filter((v, i, a) => a.indexOf(v) === i)
  let res = str

  for (let s of strs) {
    // Creating an exception for  hex values and not applying this there
    if (!(s.startsWith('x') || s.startsWith('0x'))) {
      let re = new RegExp(s, 'g')
      res = res.replace(re, prefixStr + s)
    }
  }
  return res
}

/**
 *
 * @returns A number which is result of multiplying all the arguments given
 */
function multiply() {
  let nums = Array.prototype.slice.call(arguments, 0, -1)
  return nums.reduce((prev, next) => prev * next, 1)
}

/**
 *
 * @param {*} val
 * @returns true if a string has an underscore in it
 */
function is_string_underscored(val) {
  return val && typeof val === 'string' ? val.includes('_') : false
}

/**
 *
 * @param {*} val
 * @returns val in uppercase
 */
function as_uppercase(val) {
  return val ? val.toUpperCase() : ''
}

const dep = templateUtil.deprecatedHelper

// WARNING! WARNING! WARNING! WARNING! WARNING! WARNING!
//
// Note: these exports are public API. Templates that might have been created in the past and are
// available in the wild might depend on these names.
// If you rename the functions, you need to still maintain old exports list.
exports.zap_header = zap_header
exports.indent = ident
exports.ident = dep(ident, { to: 'indent' })
exports.template_options = template_options
exports.last = last
exports.not_last = not_last
exports.first = first
exports.not_first = not_first
exports.middle = middle
exports.template_option_with_code = template_option_with_code
exports.is_equal = isEqual
exports.isEqual = dep(isEqual, { to: 'is_equal' })
exports.trim_string = trim_string
exports.as_last_word = asLastWord
exports.asLastWord = dep(asLastWord, { to: 'as_last_word' })
exports.iterate = iterate
exports.add_to_accumulator = addToAccumulator
exports.addToAccumulator = dep(addToAccumulator, { to: 'add_to_accumulator' })
exports.iterate_accumulator = iterateAccumulator
exports.iterateAccumulator = dep(iterateAccumulator, {
  to: 'iterate_accumulator',
})
exports.after = after
exports.toggle = toggle
exports.concatenate = concatenate
exports.is_lowercase_equal = is_lowercase_equal
exports.new_line = new_line
exports.backslash = backslash
exports.is_num_equal = is_num_equal
exports.is_defined = is_defined
exports.fail = fail
exports.replace_string = replace_string
exports.add_prefix_to_all_strings = add_prefix_to_all_strings
exports.multiply = multiply
exports.is_string_underscored = is_string_underscored
exports.as_uppercase = as_uppercase
