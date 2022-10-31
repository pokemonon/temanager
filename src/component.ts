import path from 'path'
import fs from 'fs-extra'
import ejs from 'ejs'
import { writeFile } from '@pokemonon/knife/node'
import globby from 'globby'
import { isDef, isFunction, merge } from '@pokemonon/knife'

/**
 * dotfile will be ignore when npm publish
 * replace '.' by '_' from the first chart（and '_' should replace by '__' at the beginning of front）
 * @example _eslintrc.js -> .eslintrc.js
 * @example __test -> _test
 * @example ____test -> ___test
 */
function dealPathForDotfile(p) {
  return p.split(path.sep).map((p) => {
    if (p[0] === '_' && p[1] !== '_')
      return `.${p.slice(1)}`

    if (p[0] === '_' && p[1] === '_')
      return p.slice(1)

    return p
  }).join(path.sep)
}

interface ComponentRenderBaseInfo {
  /**
   * if force replace file when has existed
   */
  replace?: boolean
  renderData?: Record<string, any> | (() => Record<string, any>)
}
export interface ComponentRenderFileInfo extends ComponentRenderBaseInfo {
  /**
   * 渲染路径
   */
  file: string
  /**
   * 模板绝对路径
   */
  template?: string
  /**
   * 模板内容（优先级高于template）
   */
  templateContent?: string
  /**
   * migrate oldFile to file
   */
  oldFile?: string
}
export interface ComponentRenderDirInfo extends ComponentRenderBaseInfo {
  /**
   * 文件夹输出路径
   */
  dir: string
  /**
   * 渲染整个文件文件夹
   */
  templateDir: string
  /**
   * migrate oldDir to dir
   */
  oldDir?: string
}

export type ComponentRenderItemInfo = ComponentRenderFileInfo | ComponentRenderDirInfo
export interface ComponentConstructorOptions {
  /**
   * component name
   */
  name: string
  /**
   * extra props for developer
   */
  extraProps?: Component['extraProps']
  /**
   * the data for ejs rendering
   */
  renderData?: Component['globalRenderData']
  renderList?: ComponentRenderItemInfo[]
  relatedRenderList?: ComponentRenderItemInfo[]
}

interface ComponentFileInfo extends ComponentRenderFileInfo {
  /**
   * if is empty directory
   */
  isDirectory: boolean
  /**
   * whether should remove
   */
  remove?: boolean
}

export class Component {
  name!: string
  extraProps!: Record<string, any>
  fileList: ComponentFileInfo[] = []
  relatedRenderList: ComponentFileInfo[] = []
  globalRenderData: Record<string, any> | (() => Record<string, any>)

  // todo validate params
  constructor(opts: ComponentConstructorOptions) {
    const {
      name,
      extraProps = {},
      renderList = [],
      relatedRenderList = [],
      renderData = {},
    } = opts
    this.name = name
    this.extraProps = extraProps
    this.globalRenderData = renderData

    this.fileList = this.resolveFileList(renderList)
    this.relatedRenderList = this.resolveFileList(relatedRenderList)
  }

  /**
   * resolve all render file infos
   * @param renderList
   * @param renderData
   * @returns
   */
  resolveFileList(renderList: ComponentRenderItemInfo[]) {
    const res: ComponentFileInfo[] = []
    for (const item of renderList) {
      if ('templateDir' in item) {
        const files = this.resolveFiles(item.templateDir)
        for (const file of files) {
          const filePath = path.resolve(item.dir, dealPathForDotfile(file))
          const oldFilePath = item.oldDir && path.resolve(item.oldDir, dealPathForDotfile(file))
          const template = path.resolve(item.templateDir, file)

          res.push({
            ...item,
            isDirectory: fs.statSync(template).isDirectory(),
            file: filePath,
            oldFile: oldFilePath,
            template,
          })
        }
        continue
      }
      res.push({
        isDirectory: false,
        ...item,
      })
    }
    return res
  }

  /**
   * resolve all files and all emtry dirs
   * @param dir
   * @returns
   */
  resolveFiles(dir: string) {
    const files = globby.sync(['**/*', '!(.git)'], {
      cwd: dir,
      gitignore: true,
      dot: true,
      onlyFiles: false,
    })
    return files
  }

  renderFile(fileItem: ComponentFileInfo, data = {}) {
    const {
      isDirectory,
      file,
      template,
      renderData = {},
      replace,
    } = fileItem

    if (isDirectory) {
      fs.ensureDirSync(file)
      return
    }

    let result = ''
    const mergedRenderData = merge(
      { name: this.name },
      isFunction(this.globalRenderData) ? this.globalRenderData() : this.globalRenderData,
      isFunction(renderData) ? renderData() : renderData,
      data,
    )

    // ??? ejs.renderFile not support sync
    const templateContent = isDef(fileItem.templateContent) ? fileItem.templateContent : fs.readFileSync(template!, 'utf8')
    result = ejs.render(templateContent, mergedRenderData)

    if (!fs.existsSync(file) || replace) {
      writeFile(file, result)
    }
  }

  /**
   * can manually update related files after render and remove component
   * @param data
   */
  public renderRelatedFileList(data = {}) {
    for (const fileItem of this.relatedRenderList) {
      this.renderFile(fileItem, data)
    }
  }

  /**
   * write component files
   * @param data
   */
  public render(data = {}) {
    for (const fileItem of this.fileList) {
      this.renderFile(fileItem, data)
    }
  }

  /**
   * remove component files
   */
  public remove() {
    for (const fileItem of this.fileList) {
      const { file } = fileItem
      fs.removeSync(file)
    }
  }

  /**
   * migrate oldFile to file
   */
  public migrate() {
    for (const fileItem of this.fileList) {
      const {
        file,
        oldFile,
      } = fileItem
      if (!oldFile) {
        console.error(`this oldFile doesn't exist: ${oldFile}`)
        continue
      }
      fs.moveSync(oldFile, file)
    }
  }
}

