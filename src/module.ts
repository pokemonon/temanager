import { isArray, sureArray } from '@pokemonon/knife'
import type { ItemOrArray } from '@pokemonon/knife/types'
import type { Component, ComponentConstructorOptions } from './component'
import { Component as BaseComponent } from './component'

type ComponentConstructor = typeof Component

interface ComponentConverComponentMap {
  /**
   * conver component to map
   */
  (type: 'component', component: Component): Record<string, any>
  /**
   * conver map to component constructor options
   */
  (type: 'map', map: Record<string, any>): ComponentConstructorOptions
}

export interface ModuleConstructorOptions {
  name?: string
  Component?: typeof Component
  // componentMaps?: Module['componentMaps']
  /**
   * intercept the opts of component constructor options
   */
  resolveComponentOptions?: Module['resolveComponentOptions']
  // /**
  //  * resolve the relationship of component and map
  //  *
  //  * ??? not work with the ComponentConverComponentMap type
  //  */
  // converComponentMap?: (type: 'component' | 'map', info: Record<string, any>) => any
}
export class Module {
  name?: string
  Component!: ComponentConstructor
  resolveComponentOptions!: (opts: Partial<ComponentConstructorOptions>) => Partial<ComponentConstructorOptions>

  // /**
  //  * the relations between map and component constructor options
  //  * !!! optimize
  //  */
  // converComponentMap!: ComponentConverComponentMap

  /**
   * component name to component instance
   */
  componentsMap: Map<string, Component> = new Map()

  /**
   * ??? how to design the DSL: transform between json and componentConstructorOptions
   * !!! put the DSL login in outer layer currently
   */
  // componentMaps!: any[]

  constructor(opts: ModuleConstructorOptions = {}) {
    const {
      name,
      Component = BaseComponent,
      resolveComponentOptions = opts => opts as any,
      // converComponentMap = ((type, i) => {
      //   if (type === 'component') {
      //     return {
      //       name: i.name,
      //     }
      //   } else if (type === 'map') {
      //     return {
      //       name: i.name,
      //     }
      //   }
      // }) as any,
    } = opts
    this.name = name
    this.Component = Component
    this.resolveComponentOptions = resolveComponentOptions
    // this.converComponentMap = converComponentMap

    this.init()
  }

  init() {
    // this.render()
  }

  getComponent(name: string): Component
  getComponent(name: string[]): Component[]
  getComponent(name: ItemOrArray<string>) {
    if (isArray(name)) {
      return name.map(i => this.componentsMap.get(i))
    }
    return this.componentsMap.get(name)
  }

  getAllComponents() {
    return [...this.componentsMap.values()]
  }

  /**
   * 添加组件实例
   * @param opts
   * @returns
   */
  public addComponent(opts: Partial<ComponentConstructorOptions>) {
    opts = this.resolveComponentOptions(opts)
    const componentName = opts.name
    if (!componentName)
      throw new Error('miss params: name')

    if (this.componentsMap.has(componentName)) {
      console.error(`${componentName} has exist!`)
      return this.componentsMap.get(componentName)!
    }
    const component = new this.Component(opts as ComponentConstructorOptions)
    component.renderRelatedFileList()

    this.componentsMap.set(componentName, component)

    return component
  }

  public addAndRenderComponent(opts: Partial<ComponentConstructorOptions>) {
    const component = this.addComponent(opts)
    component?.render()
    return component
  }

  /**
   * remove specified components
   * @param name
   */
  public removeComponent(name: string): Component
  public removeComponent(name: string[]): Component[]
  public removeComponent(name: ItemOrArray<string>) {
    const removedComponents: Component[] = []
    const componentNames = sureArray(name)
    for (const componentName of componentNames) {
      const component = this.componentsMap.get(componentName)
      if (component) {
        this.componentsMap.delete(componentName)
        component.remove()
        component.renderRelatedFileList()
        removedComponents.push(component)
      }
    }
    return isArray(name) ? removedComponents : removedComponents[0]
  }

  /**
   * remove all component
   */
  removeAllComponent() {
    const allComponents = [...this.componentsMap.values()]
    allComponents.forEach((i) => {
      i.remove()
      i.renderRelatedFileList()
    })
    return allComponents
  }

  /**
   * migrate specified components
   * @param name
   */
  migrateComponent(name: ItemOrArray<string>) {
    const componentNames = sureArray(name)
    for (const componentName of componentNames) {
      const component = this.componentsMap.get(componentName)
      if (component) {
        component.migrate()
        component.renderRelatedFileList()
      }
    }
  }

  /**
   * migrate all components
   */
  migrateAllComponents() {
    [...this.componentsMap.values()].forEach((i) => {
      i.migrate()
      i.renderRelatedFileList()
    })
  }
}

