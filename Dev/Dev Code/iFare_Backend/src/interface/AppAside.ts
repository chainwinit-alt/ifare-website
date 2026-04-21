export interface AsideMenu extends MenuItem {
    subList?: Array<MenuItem>
}

interface MenuItem {
    indexKey: string,
    title: string,
    url?: string | UrlInfo
}

interface UrlInfo {
    name: string
}