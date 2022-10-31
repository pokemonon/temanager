import path from 'path'
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest'
import type { ComponentRenderItemInfo } from '@pokemonon/temanager'
import {
  Component,
  Module,
} from '@pokemonon/temanager'
import fs from 'fs-extra'

describe('module', () => {
  let tempDir = ''
  const resolveFromTempDir = (...p: string[]) => path.resolve(tempDir, ...p)
  const resolveFromBaseFixture = (...p: string[]) => path.resolve(__dirname, 'fixtures/base', ...p)

  function createModule() {
    return new Module({
      name: 'base',
      resolveComponentOptions(data) {
        const { name, extraProps } = data
        const { type } = extraProps || {}

        let renderList: ComponentRenderItemInfo[] = []
        if (type === 'component') {
          renderList = [
            {
              dir: resolveFromTempDir(name!),
              templateDir: resolveFromBaseFixture('tpls/component'),
            },
          ]
        } else if (type === 'style') {
          renderList = [
            {
              dir: resolveFromTempDir(name!),
              templateDir: resolveFromBaseFixture('tpls/style'),
            },
          ]
        } else {
          throw new Error('pls choose a type')
        }
        return {
          ...data,
          renderList,
        }
      },
    })
  }

  beforeEach(() => {
    tempDir = path.resolve(__dirname, 'tempDir')
  })
  afterEach(() => {
    fs.removeSync(tempDir)
  })

  it('add component', () => {
    const module = createModule()

    module.addComponent({
      name: 'component-input',
      extraProps: {
        type: 'component',
      },
    })

    module.addComponent({
      name: 'style-input',
      extraProps: {
        type: 'style',
      },
    })

    expect(module.getAllComponents()).toEqual([
      new Component({
        name: 'component-input',
        extraProps: {
          type: 'component',
        },
        renderList: [
          {
            dir: resolveFromTempDir('component-input'),
            templateDir: resolveFromBaseFixture('tpls/component'),
          },
        ],
      }),
      new Component({
        name: 'style-input',
        extraProps: {
          type: 'style',
        },
        renderList: [
          {
            dir: resolveFromTempDir('style-input'),
            templateDir: resolveFromBaseFixture('tpls/style'),
          },
        ],
      }),
    ])
  })

  it('add and remove component', () => {
    const module = createModule()

    const component = module.addAndRenderComponent({
      name: 'component-input',
      extraProps: {
        type: 'component',
      },
    })

    for (const fileItem of component.fileList) {
      expect(fs.existsSync(fileItem.file)).toBe(true)
    }

    component.remove()
    for (const fileItem of component.fileList) {
      expect(fs.existsSync(fileItem.file)).toBe(false)
    }
  })
})

