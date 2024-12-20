import Path from '@/main/utils/Path'
import {EnumSoftwareType} from "@/shared/utils/enum";
import GetPath from "@/shared/utils/GetPath";
import DirUtil from "@/main/utils/DirUtil";
import FileUtil from "@/main/utils/FileUtil";
import GetAppPath from '@/main/utils/GetAppPath'

export default class Software {
    static #list;

    static async DirExists() {
        return await DirUtil.Exists(GetPath.getSoftwareDir());
    }

    /**
     * 获取软件列表
     * @returns {Promise<SoftwareItem[]>}
     */
    static async getList() {
        if (Software.#list && Software.#list.length > 0) {
            return Software.#list
        }
        await this.initList()
        return Software.#list
    }

    static async initList() {
        const softDir = Path.Join(GetAppPath.getCoreDir(), '/config/software')
        const softConfigPath = Path.Join(softDir, 'software.json')
        const softIconDir = 'file://' + Path.Join(softDir, '/icon')

        let list
        try {
            list = JSON.parse(await FileUtil.ReadAll(softConfigPath))
            list = await Promise.all(list.map(async item => {
                const Icon = Path.Join(softIconDir, item.Icon)
                return { ...item, Icon }
            }))
        } catch {
            throw new Error(`${softConfigPath} 配置文件错误！`)
        }

        //自定义software配置
        const customSoftDir = Path.Join(GetAppPath.getUserCoreDir(), '/custom/software')
        const customSoftConfigPath = Path.Join(customSoftDir, 'software.json')
        const customSoftIconDir = 'file://' + Path.Join(customSoftDir, '/icon')

        let customList
        try {
            if (await FileUtil.Exists(customSoftConfigPath)) {
                customList = JSON.parse(await FileUtil.ReadAll(customSoftConfigPath))
                customList = await Promise.all(customList.map(async item => {
                    const Icon = Path.Join(customSoftIconDir, item.Icon)
                    return { ...item, Icon }
                }))
            } else {
                customList = []
            }
        } catch {
            throw new Error(`${customSoftConfigPath} 配置文件错误！`)
        }

        Software.#list = list.concat(customList)
    }

    static async findItem(name) {
        return (await Software.getList()).find((item) => item.Name === name)
    }

    /**
     * 判断软件是否安装
     * @param item {SoftwareItem}
     * @returns {boolean}
     */
    static async IsInstalled(item) {
        let path = Software.getPath(item);
        return await DirUtil.Exists(path);
    }

    /**
     * 获取软件所在的目录
     * @param item {SoftwareItem}
     * @returns {string}
     */
    static getPath(item) {
        let typePath = Software.getTypePath(item.Type);
        return Path.Join(typePath, item.DirName);
    }

    /**
     * 获取软件配置文件所在的目录
     * @param item {SoftwareItem}
     * @returns {string}
     */
    static getConfPath(item) {
        if (item.ConfPath == null) {
            throw new Error(`${item.Name} Conf Path 没有配置！`);
        }
        let softPath = Software.getPath(item);
        return Path.Join(softPath, item.ConfPath);
    }

    /**
     * 获取软件服务配置文件所在的目录
     * @param item {SoftwareItem}
     * @returns {string}
     */
    static getServerConfPath(item) {
        if (item.ServerConfPath == null) {
            throw new Error(`${item.Name} Server Conf Path 没有配置！`);
        }
        let softPath = Software.getPath(item);
        return Path.Join(softPath, item.ServerConfPath);
    }

    /**
     * 获取软件服务进程绝对路径
     * @param item {SoftwareItem}
     * @returns {string}
     */
    static getServerProcessPath(item) {
        if (item.ServerProcessPath == null) {
            throw new Error(`${item.Name} Server Process Path 没有配置！`);
        }
        let workPath = Software.getPath(item); //服务目录
        return Path.Join(workPath, item.ServerProcessPath);  //服务的进程目录
    }

    /**
     * 根据软件类型，获取软件的类型目录
     * @param type {SoftwareItem.Type}
     * @returns {string}
     */
    static getTypePath(type) {
        type = EnumSoftwareType[type];
        switch (type) {
            case EnumSoftwareType.PHP:
                return GetPath.getPhpTypeDir();
            case EnumSoftwareType.Server:
                return GetPath.getServerTypeDir();
            case EnumSoftwareType.Tool:
                return GetPath.getToolTypeDir();
            default:
                return '';
        }
    }

    static getIconPath() {
        let corePath = GetAppPath.getCoreDir();
        let softPath = Path.Join(corePath, '/config/software');
        return Path.Join(softPath, '/icon');
    }

}
