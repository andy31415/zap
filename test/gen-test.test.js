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
 *
 *
 * @jest-environment node
 */

const path = require('path')
const genEngine = require('../src-electron/generator/generation-engine.js')
const env = require('../src-electron/util/env.js')
const dbApi = require('../src-electron/db/db-api.js')
const zclLoader = require('../src-electron/zcl/zcl-loader.js')
const importJs = require('../src-electron/importexport/import.js')
const testUtil = require('./test-util.js')
const queryPackage = require('../src-electron/db/query-package.js')

let db
const templateCount = 1
const genTimeout = 3000
const testFile = path.join(__dirname, 'resource/three-endpoint-device.zap')
let sessionId
let templateContext
let zclContext

beforeAll(() => {
  let file = env.sqliteTestFile('testgen')
  return dbApi
    .initDatabaseAndLoadSchema(file, env.schemaFile(), env.zapVersion())
    .then((d) => {
      db = d
    })
}, 5000)

afterAll(() => {
  return dbApi.closeDatabase(db)
})

test(
  'Basic test template parsing and generation',
  () =>
    genEngine
      .loadTemplates(db, testUtil.testTemplate.unittest)
      .then((context) => {
        expect(context.crc).not.toBeNull()
        expect(context.templateData).not.toBeNull()
        expect(context.templateData.name).toEqual('Unit test templates')
        expect(context.templateData.version).toEqual('unit-test')
        expect(context.templateData.templates.length).toEqual(templateCount)
        expect(context.packageId).not.toBeNull()
        templateContext = context
      }),
  3000
)

test(
  'Load ZCL stuff',
  () =>
    zclLoader.loadZcl(db, env.builtinSilabsZclMetafile).then((context) => {
      zclContext = context
    }),
  5000
)

test('File import and zcl package insertion', async () => {
  let importResult = await importJs.importDataFromFile(db, testFile)
  sessionId = importResult.sessionId
  expect(sessionId).not.toBeNull()
  await queryPackage.insertSessionPackage(db, sessionId, zclContext.packageId)
})

test(
  'Test dotdot generation',
  () =>
    genEngine
      .generate(
        db,
        sessionId,
        templateContext.packageId,
        {},
        {
          disableDeprecationWarnings: true,
        }
      )
      .then((genResult) => {
        expect(genResult).not.toBeNull()
        expect(genResult.partial).toBeFalsy()
        expect(genResult.content).not.toBeNull()

        let epc = genResult.content['test-fail.out']
        expect(epc).not.toBeNull()
        expect(genResult.hasErrors).toBeTruthy()
        let err = genResult.errors['test-fail.out']
        expect(
          err.message.includes('this is where the failure lies')
        ).toBeTruthy()
        expect(err.message.includes('line: 3, column: 0')).toBeTruthy()
        expect(err.message.includes('test-fail.zapt')).toBeTruthy()
      }),
  genTimeout
)
