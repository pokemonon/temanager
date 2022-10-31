import {
  describe,
  expect,
  it,
} from 'vitest'
import {
  Module,
} from '@pokemonon/temanager'

describe('demo', () => {
  it('DSL', () => {
    const map = [
      {
        type: 'components',
        list: [
          {
            type: 'base',
            list: [
              {
                name: 'image',
              },
            ],
          },
          {
            type: 'form',
            list: [
              {
                name: 'button',
              },
            ],
          },
        ],
      },
      {
        type: 'icons',
        list: [
          {
            name: 'circle',
          },
        ],
      },
    ]

    const module = new Module()
    const path2parent = new Map()

    for (const group of map) {
      path2parent.set(group.type, group)
      for (const groupItem of group.list) {
        if ('list' in groupItem) {
          path2parent.set(`${group.type}.${groupItem.type}`, groupItem)
          for (const item of groupItem.list) {
            module.addComponent({
              name: `${group.type}.${groupItem.type}.${item.name}`,
              extraProps: {
                info: item,
                parent: groupItem,
                paths: [group, groupItem],
              },
            })
          }
        } else {
          module.addComponent({
            name: `${group.type}.${groupItem.name}`,
            extraProps: {
              info: groupItem,
              parent: group,
              paths: [group],
            },
          })
        }
      }
    }

    /**
     * add component and update map
     */
    const icons = path2parent.get('icons')
    const rectIconInfo = {
      name: 'rect',
    }
    module.addComponent({
      name: 'icons.rect',
      extraProps: {
        info: rectIconInfo,
        parent: icons,
        paths: [icons],
      },
    })
    icons.list.push(rectIconInfo)

    /**
     * remove component and update map
     */
    const component = module.removeComponent('components.base.image')
    const parent = component.extraProps.parent
    const idx = parent.list.findIndex(i => component.extraProps.info === i)
    parent.list.splice(idx, 1)

    expect(map).toEqual([
      {
        type: 'components',
        list: [
          {
            type: 'base',
            list: [],
          },
          {
            type: 'form',
            list: [
              {
                name: 'button',
              },
            ],
          },
        ],
      },
      {
        type: 'icons',
        list: [
          {
            name: 'circle',
          },
          {
            name: 'rect',
          },
        ],
      },
    ])
  })
})

